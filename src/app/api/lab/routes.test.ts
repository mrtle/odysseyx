/**
 * The Story Lab routes end to end in demo mode (no API key): request
 * validation, response shape and schema validity.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { LoglineAnalysisSchema, ShotPlanSchema, StoryAnalysisSchema } from "@/lib/ai/schemas";
import { demoLogline, demoShots, demoStory } from "@/lib/demo/lab";
import { DEMO_ENGLISH_ONLY } from "@/lib/demo/language";
import { resetRateLimits } from "@/lib/request";
import { POST as loglinePOST } from "./logline/route";
import { POST as shotsPOST } from "./shots/route";
import { POST as storyPOST } from "./story/route";

const ai = vi.hoisted(() => ({ generateStructured: vi.fn() }));

vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, generateStructured: ai.generateStructured };
});

const previous = process.env.ODYSSEUSX_MODE;
afterEach(() => resetRateLimits());
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

const SPANISH_LOGLINE =
  "Cuando una capitana de ferry deshonrada descubre que su tripulación trafica refugiados, debe elegir entre su carrera y la verdad.";
const JAPANESE_STORY =
  "雨の夜、年老いた漁師は港で古い手紙を見つけた。それは四十年前に亡くなった妻からのものだった。彼は震える手で封を切った。中には一枚の写真と、短い言葉が書かれていた。「海の向こうで待っている」。彼は小さな船を出すことに決めた。";
const FRENCH_SCENE =
  "INT. CUISINE - NUIT. Marie est assise seule à la table. Elle regarde son téléphone qui vibre. Elle ne répond pas. Son mari entre dans la pièce et pose les clés sur la table sans un mot.";

describe("demo coach language guard", () => {
  const unsupported = async (res: Response) => {
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: DEMO_ENGLISH_ONLY, code: "unsupported_language" });
  };

  it("explains, rather than scores, a Spanish logline", async () => {
    await unsupported(await loglinePOST(post({ logline: SPANISH_LOGLINE })));
  });

  it("explains, rather than scores, a Japanese story", async () => {
    await unsupported(await storyPOST(post({ text: JAPANESE_STORY, framework: "three-act", format: "short-film" })));
  });

  it("explains, rather than plans, a French scene", async () => {
    await unsupported(await shotsPOST(post({ scene: FRENCH_SCENE, intent: "Tension silencieuse entre les deux." })));
  });

  it("still analyses English that uses foreign names", async () => {
    const res = await loglinePOST(
      post({ logline: "Rafael de la Vega, a disgraced matador, must win back the love of Ana del Río before the Feria de San Juan ends." }),
    );
    expect(res.status).toBe(200);
  });

  it("is off in live mode", async () => {
    process.env.ODYSSEUSX_MODE = "live";
    try {
      ai.generateStructured.mockResolvedValueOnce(demoLogline({ logline: "A shy librarian must win a trivia tournament to save her library." }));
      expect((await loglinePOST(post({ logline: SPANISH_LOGLINE }))).status).toBe(200);
      ai.generateStructured.mockResolvedValueOnce(
        demoStory({ text: "Every morning Ana opened the bakery at five. One day a letter arrived and everything changed for her.", framework: "three-act", format: "short-film" }),
      );
      expect((await storyPOST(post({ text: JAPANESE_STORY, framework: "three-act", format: "short-film" }))).status).toBe(200);
      ai.generateStructured.mockResolvedValueOnce(demoShots({ scene: "INT. DINER - NIGHT. June sits alone. She stares at her phone. It buzzes." }));
      expect((await shotsPOST(post({ scene: FRENCH_SCENE }))).status).toBe(200);
    } finally {
      process.env.ODYSSEUSX_MODE = "demo";
      ai.generateStructured.mockReset();
    }
  });
});
