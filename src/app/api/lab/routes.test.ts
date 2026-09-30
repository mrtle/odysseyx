/**
 * The Story Lab routes end to end in demo mode (no API key): request
 * validation, response shape and schema validity.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LoglineAnalysisSchema, ShotPlanSchema, StoryAnalysisSchema } from "@/lib/ai/schemas";
import { POST as loglinePOST } from "./logline/route";
import { POST as shotsPOST } from "./shots/route";
import { POST as storyPOST } from "./story/route";

const previous = process.env.ODYSSEUSX_MODE;
beforeAll(() => {
  process.env.ODYSSEUSX_MODE = "demo";
});
afterAll(() => {
  if (previous === undefined) delete process.env.ODYSSEUSX_MODE;
  else process.env.ODYSSEUSX_MODE = previous;
});

function post(body: unknown): Request {
  return new Request("http://localhost/api/lab", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/lab/logline", () => {
  it("returns a demo analysis", async () => {
    const res = await loglinePOST(post({ logline: "A shy librarian must win a trivia tournament to save her library.", genre: "Comedy" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { analysis: unknown; mode: string };
    expect(json.mode).toBe("demo");
    expect(LoglineAnalysisSchema.parse(json.analysis).rewrites).toHaveLength(3);
  });

  it("rejects a too-short logline and malformed JSON", async () => {
    expect((await loglinePOST(post({ logline: "short" }))).status).toBe(400);
    expect((await loglinePOST(post("{not json"))).status).toBe(400);
  });
});

describe("POST /api/lab/story", () => {
  it("returns a demo analysis for the requested framework", async () => {
    const text =
      "Every morning Ana opened the bakery at five. One day a letter arrived: the building was sold. She decided to fight the sale. She tried the council, the bank, the newspaper. Finally she stood up at the town meeting and told the truth. Now the bakery belongs to all of us.";
    const res = await storyPOST(post({ text, framework: "story-spine", format: "personal-story" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { analysis: unknown; mode: string };
    const analysis = StoryAnalysisSchema.parse(json.analysis);
    expect(analysis.framework).toBe("story-spine");
    expect(analysis.beats).toHaveLength(7);
  });

  it("rejects an unknown framework", async () => {
    const res = await storyPOST(post({ text: "x".repeat(100), framework: "five-act", format: "scene" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/lab/shots", () => {
  it("returns a demo plan", async () => {
    const res = await shotsPOST(post({ scene: "INT. DINER - NIGHT\n\nJune sits alone. She stares at her phone. It buzzes.", intent: "Tender" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { plan: unknown; mode: string };
    expect(ShotPlanSchema.parse(json.plan).shots.length).toBeGreaterThanOrEqual(6);
  });

  it("rejects a missing scene", async () => {
    expect((await shotsPOST(post({ intent: "Tense" }))).status).toBe(400);
  });
});
