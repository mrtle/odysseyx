/**
 * generateStructured / streamText against a local mock of the Messages API
 * (real SDK, real SSE parsing): stop reasons, refusals, server-side
 * fallbacks, off-vocabulary enums, error mapping and stream notices.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { EvaluationSchema, ShotPlanSchema } from "./schemas";
import { splitNotice } from "./stream-protocol";

type Handler = (req: IncomingMessage, body: Record<string, unknown>, res: ServerResponse) => void;

let server: Server;
let handler: Handler = (_req, _body, res) => res.end();
let lastBody: Record<string, unknown> = {};

// Imported after the env is pointed at the mock server (the SDK client is created lazily).
let client: typeof import("./client");

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      lastBody = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      handler(req, lastBody, res);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
  process.env.ANTHROPIC_API_KEY = "test-key";
  client = await import("./client");
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

type Block = { type: "text"; text: string[] } | { type: "fallback" } | { type: "thinking" };

function sse(res: ServerResponse, events: [string, unknown][]) {
  res.writeHead(200, { "content-type": "text/event-stream" });
  for (const [event, data] of events) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  res.end();
}

function messageEvents(blocks: Block[], stopReason: string, opts: { errorAfter?: number } = {}): [string, unknown][] {
  const events: [string, unknown][] = [
    [
      "message_start",
      {
        type: "message_start",
        message: {
          id: "msg_1",
          type: "message",
          role: "assistant",
          model: "claude-opus-5-5",
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 0 },
        },
      },
    ],
  ];
  let deltas = 0;
  blocks.forEach((block, index) => {
    if (block.type === "text") {
      events.push(["content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } }]);
      for (const text of block.text) {
        if (opts.errorAfter !== undefined && deltas === opts.errorAfter) {
          events.push(["error", { type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]);
          return;
        }
        events.push(["content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text } }]);
        deltas++;
      }
    } else if (block.type === "thinking") {
      events.push([
        "content_block_start",
        { type: "content_block_start", index, content_block: { type: "thinking", thinking: "", signature: "" } },
      ]);
    } else {
      events.push([
        "content_block_start",
        {
          type: "content_block_start",
          index,
          content_block: {
            type: "fallback",
            from: { model: "claude-opus-5-5" },
            to: { model: "claude-opus-5" },
            trigger: { type: "refusal", category: null },
          },
        },
      ]);
    }
    events.push(["content_block_stop", { type: "content_block_stop", index }]);
  });
  if (opts.errorAfter !== undefined && deltas <= opts.errorAfter) {
    if (!events.some(([e]) => e === "error")) {
      events.push(["error", { type: "error", error: { type: "overloaded_error", message: "Overloaded" } }]);
    }
    return events;
  }
  events.push([
    "message_delta",
    { type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 5 } },
  ]);
  events.push(["message_stop", { type: "message_stop" }]);
  return events;
}

function jsonError(res: ServerResponse, status: number, type: string, message: string) {
  res.writeHead(status, { "content-type": "application/json", "request-id": "req_TEST123" });
  res.end(JSON.stringify({ type: "error", error: { type, message }, request_id: "req_TEST123" }));
}

const evaluation = {
  overall: 72,
  headline: "Strong hook",
  summary: "Good.",
  skillScores: [{ skill: "hook", score: 80, comment: "Grabby." }],
  strengths: ["Opening line"],
  improvements: [{ title: "Stakes", detail: "Name them.", example: "" }],
  bestMoment: "",
  nextStep: { title: "Try again", description: "Sharper stakes." },
};

function generateEvaluation() {
  return client.generateStructured({
    system: "sys",
    messages: [{ role: "user", content: "transcript" }],
    schema: EvaluationSchema,
  });
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

function chat() {
  return client.streamText({ system: "persona", messages: [{ role: "user", content: "Hi" }] });
}

// ---------------------------------------------------------------------------
// generateStructured
// ---------------------------------------------------------------------------

describe("generateStructured", () => {
  it("sends a JSON schema that keeps enums and has no parse function", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: [JSON.stringify(evaluation)] }], "end_turn"));
    await expect(generateEvaluation()).resolves.toEqual(evaluation);
    const format = (lastBody.output_config as { format: { type: string; schema: Record<string, unknown> } }).format;
    expect(format.type).toBe("json_schema");
    const skill = (
      format.schema as {
        properties: { skillScores: { items: { properties: { skill: { enum?: string[]; description?: string } } } } };
      }
    ).properties.skillScores.items.properties.skill;
    expect(skill.enum).toContain("hook");
    expect(skill.description ?? "").not.toContain("enum");
    expect(lastBody.max_tokens).toBe(64000);
  });

  it("returns the fallback model's answer after a mid-stream fallback", async () => {
    const json = JSON.stringify(evaluation);
    const cut = 30;
    handler = (_req, _body, res) =>
      sse(
        res,
        messageEvents(
          [
            { type: "thinking" },
            { type: "text", text: [json.slice(0, cut)] },
            { type: "fallback" },
            { type: "text", text: [json.slice(cut, 60), json.slice(60)] },
          ],
          "end_turn",
        ),
      );
    await expect(generateEvaluation()).resolves.toEqual(evaluation);
  });

  it("also accepts a fallback continuation that restarts the JSON", async () => {
    const json = JSON.stringify(evaluation);
    handler = (_req, _body, res) =>
      sse(res, messageEvents([{ type: "text", text: [json.slice(0, 25)] }, { type: "fallback" }, { type: "text", text: [json] }], "end_turn"));
    await expect(generateEvaluation()).resolves.toEqual(evaluation);
  });

  it("maps max_tokens to a 'cut short' bad_output error", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ['{"overall":72,"head'] }], "max_tokens"));
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 502, code: "bad_output", message: expect.stringContaining("cut short") });
  });

  it("maps a mid-stream refusal (partial JSON) to 422", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ['{"overall":72,'] }], "refusal"));
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 422, code: "refusal" });
  });

  it("maps a pre-output refusal to 422", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([], "refusal"));
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 422, code: "refusal" });
  });

  it("repairs off-vocabulary enum values instead of failing", async () => {
    const plan = {
      sceneSummary: "s",
      emotionalIntent: "e",
      visualConcept: "v",
      shots: [
        { number: 1, size: "Medium Close-Up", framing: "OTS", angle: "bird's-eye", movement: "slow push in", lens: "35mm", subject: "a", action: "b", purpose: "c", sound: "" },
        { number: 2, size: "cinematic", framing: "single", angle: "dutch-tilt", movement: "static", lens: "50mm", subject: "a", action: "b", purpose: "c", sound: "" },
      ],
      coverageNotes: [],
      feedbackOnUserShots: [],
    };
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: [JSON.stringify(plan)] }], "end_turn"));
    const result = await client.generateStructured({ system: "s", messages: [{ role: "user", content: "x" }], schema: ShotPlanSchema });
    expect(result.shots.map((s) => [s.size, s.framing, s.angle, s.movement])).toEqual([
      ["medium-close-up", "over-the-shoulder", "birds-eye", "push-in"],
      ["medium", "single", "dutch", "static"],
    ]);
  });

  it("drops a skill score for an unknown skill and keeps the rest", async () => {
    const withBadSkill = {
      ...evaluation,
      skillScores: [
        { skill: "Hook", score: 80, comment: "" },
        { skill: "charisma", score: 50, comment: "" },
      ],
    };
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: [JSON.stringify(withBadSkill)] }], "end_turn"));
    const result = await generateEvaluation();
    expect(result.skillScores).toEqual([{ skill: "hook", score: 80, comment: "" }]);
  });

  it("maps invalid JSON to 502 bad_output", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ["not json"] }], "end_turn"));
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 502, code: "bad_output" });
  });

  it("returns friendly messages for upstream 400/404/413 without raw bodies", async () => {
    handler = (_req, _body, res) => jsonError(res, 400, "invalid_request_error", "messages.0.content: text content blocks must be non-empty");
    const bad = await generateEvaluation().catch((e: unknown) => e);
    expect(bad).toMatchObject({ status: 400, code: "bad_request" });
    expect((bad as Error).message).not.toMatch(/req_TEST123|\{/);

    handler = (_req, _body, res) => jsonError(res, 404, "not_found_error", "model: nope");
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 500, code: "config" });

    handler = (_req, _body, res) => jsonError(res, 413, "request_too_large", "Request exceeds the maximum size");
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 413, code: "too_large" });
  });

  it("maps an SSE overloaded error to 'unavailable'", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ['{"a":', "1}"] }], "end_turn", { errorAfter: 1 }));
    await expect(generateEvaluation()).rejects.toMatchObject({ status: 503, code: "unavailable" });
  });

  it("maps an aborted request to a silent 'cancelled' error", async () => {
    handler = () => {
      // never respond
    };
    const controller = new AbortController();
    const pending = client.generateStructured({
      system: "s",
      messages: [{ role: "user", content: "x" }],
      schema: EvaluationSchema,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 20);
    await expect(pending).rejects.toMatchObject({ code: "cancelled" });
    expect(console.error).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// streamText
// ---------------------------------------------------------------------------

describe("streamText", () => {
  it("streams in-character text", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "thinking" }, { type: "text", text: ["Well, ", "go on."] }], "end_turn"));
    const text = await readAll(await chat());
    expect(splitNotice(text)).toEqual({ reply: "Well, go on.", notice: null });
  });

  it("turns a refusal before any text into a 422 instead of dialogue", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "thinking" }], "refusal"));
    await expect(chat()).rejects.toMatchObject({ status: 422, code: "refusal" });
  });

  it("turns an SSE error before any text into a 503", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ["never"] }], "end_turn", { errorAfter: 0 }));
    await expect(chat()).rejects.toMatchObject({ status: 503, code: "unavailable" });
  });

  it("ends with a notice (never plain dialogue) when an error follows text", async () => {
    handler = (_req, _body, res) =>
      sse(res, messageEvents([{ type: "text", text: ["Well, the thing is", " more"] }], "end_turn", { errorAfter: 1 }));
    const { reply, notice } = splitNotice(await readAll(await chat()));
    expect(reply).toBe("Well, the thing is");
    expect(notice).toMatch(/temporarily unavailable/);
  });

  it("ends with a refusal notice after partial text", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([{ type: "text", text: ["Let me tell you"] }], "refusal"));
    const { reply, notice } = splitNotice(await readAll(await chat()));
    expect(reply).toBe("Let me tell you");
    expect(notice).toMatch(/can't help/);
  });

  it("continues through a server-side fallback", async () => {
    handler = (_req, _body, res) =>
      sse(res, messageEvents([{ type: "text", text: ["First half, "] }, { type: "fallback" }, { type: "text", text: ["second half."] }], "end_turn"));
    expect(splitNotice(await readAll(await chat()))).toEqual({ reply: "First half, second half.", notice: null });
  });

  it("rejects an empty reply", async () => {
    handler = (_req, _body, res) => sse(res, messageEvents([], "end_turn"));
    await expect(chat()).rejects.toMatchObject({ code: "bad_output" });
  });
});
