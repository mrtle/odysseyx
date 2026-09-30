/**
 * The practice API routes, exercised in demo mode (no network).
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { EvaluationSchema } from "@/lib/ai/schemas";
import { getScenario } from "@/content/scenarios";
import { demoEvaluate } from "@/lib/demo/practice";
import { POST as chat } from "./chat/route";
import { POST as evaluate } from "./evaluate/route";

const ai = vi.hoisted(() => ({ streamText: vi.fn(), generateStructured: vi.fn() }));

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, streamText: ai.streamText, generateStructured: ai.generateStructured };
});

const scenario = getScenario("elevator-pitch")!;
const previousMode = process.env.ODYSSEUSX_MODE;

beforeAll(() => {
  process.env.ODYSSEUSX_MODE = "demo";
});
afterAll(() => {
  if (previousMode === undefined) delete process.env.ODYSSEUSX_MODE;
  else process.env.ODYSSEUSX_MODE = previousMode;
});

function post(body: unknown): Request {
  return new Request("http://localhost/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const opening = { role: "persona", content: scenario.openingLine } as const;
const pitch = { role: "user", content: "It's about a deaf drummer who loses his hearing aid the night before the audition of his life." } as const;

describe("POST /api/coach/chat", () => {
  it("streams the persona's reply as plain text with the mode header", async () => {
    const res = await chat(post({ scenarioId: scenario.id, messages: [opening, pitch] }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-odysseusx-mode")).toBe("demo");
    const text = await res.text();
    expect(text.length).toBeGreaterThan(10);
    expect(text).toMatch(/\?$/);
  });

  it("404s for an unknown scenario", async () => {
    const res = await chat(post({ scenarioId: "nope", messages: [opening, pitch] }));
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty("error");
  });

  it("400s when the last message isn't from the learner", async () => {
    const res = await chat(post({ scenarioId: scenario.id, messages: [opening] }));
    expect(res.status).toBe(400);
  });

  it("400s on an invalid body", async () => {
    expect((await chat(post("not json"))).status).toBe(400);
    expect((await chat(post({ scenarioId: scenario.id, messages: [{ role: "narrator", content: "hi" }] }))).status).toBe(400);
  });
});

describe("POST /api/coach/evaluate", () => {
  it("returns a valid evaluation and the mode", async () => {
    const res = await evaluate(post({ scenarioId: scenario.id, messages: [opening, pitch] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { evaluation: unknown; mode: string };
    expect(body.mode).toBe("demo");
    const evaluation = EvaluationSchema.parse(body.evaluation);
    expect(evaluation.skillScores.map((s) => s.skill)).toEqual(scenario.skills);
  });

  it("requires at least one learner line", async () => {
    const res = await evaluate(post({ scenarioId: scenario.id, messages: [opening] }));
    expect(res.status).toBe(400);
  });

  it("404s for an unknown scenario", async () => {
    const res = await evaluate(post({ scenarioId: "nope", messages: [opening, pitch] }));
    expect(res.status).toBe(404);
  });
});

describe("live mode", () => {
  beforeAll(() => {
    process.env.ODYSSEUSX_MODE = "live";
  });
  afterAll(() => {
    process.env.ODYSSEUSX_MODE = "demo";
  });
  afterEach(() => {
    ai.streamText.mockReset();
    ai.generateStructured.mockReset();
  });

  it("chat passes the request's abort signal and sends pacing as a trailing system message", async () => {
    ai.streamText.mockResolvedValue(new ReadableStream({ start: (c) => c.close() }));
    const req = post({ scenarioId: scenario.id, messages: [opening, pitch] });
    const res = await chat(req);
    expect(res.status).toBe(200);
    expect(ai.streamText).toHaveBeenCalledOnce();
    const opts = ai.streamText.mock.calls[0][0];
    expect(opts.signal).toBe(req.signal);
    const last = opts.messages[opts.messages.length - 1];
    expect(last.role).toBe("system");
    expect(last.content).toMatch(/<director_note>Learner turn 1 of about/);
  });

  it("evaluate passes the request's abort signal", async () => {
    ai.generateStructured.mockResolvedValue(demoEvaluate(scenario, [opening, pitch]));
    const req = post({ scenarioId: scenario.id, messages: [opening, pitch] });
    const res = await evaluate(req);
    expect(res.status).toBe(200);
    expect(ai.generateStructured.mock.calls[0][0].signal).toBe(req.signal);
  });
});
