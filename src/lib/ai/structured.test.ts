import { describe, expect, it } from "vitest";
import { CAMERA_ANGLES, CAMERA_MOVEMENTS, SHOT_FRAMINGS, SHOT_SIZES } from "@/lib/film";
import {
  EvaluationSchema,
  LoglineAnalysisSchema,
  MicroFeedbackSchema,
  ShotPlanSchema,
  StoryAnalysisSchema,
} from "./schemas";
import { jsonCandidates, matchEnum, outputJsonSchema, parseStructured } from "./structured";

type Node = Record<string, unknown>;

function walk(node: unknown, visit: (n: Node) => void) {
  if (Array.isArray(node)) return node.forEach((n) => walk(n, visit));
  if (!node || typeof node !== "object") return;
  visit(node as Node);
  for (const value of Object.values(node as Node)) walk(value, visit);
}

describe("outputJsonSchema", () => {
  const schemas = { EvaluationSchema, LoglineAnalysisSchema, StoryAnalysisSchema, ShotPlanSchema, MicroFeedbackSchema };

  it.each(Object.entries(schemas))("%s keeps enums and is strict", (_name, schema) => {
    const json = outputJsonSchema(schema);
    expect(json.$schema).toBeUndefined();
    let enums = 0;
    walk(json, (n) => {
      if (Array.isArray(n.enum)) enums++;
      if (typeof n.description === "string") expect(n.description).not.toContain("enum");
      if (n.type === "object") {
        expect(n.additionalProperties).toBe(false);
        expect(n.required).toEqual(Object.keys(n.properties as Node));
      }
    });
    expect(enums).toBeGreaterThan(0);
  });

  it("puts the shot vocabulary in real enum keywords", () => {
    const shot = (outputJsonSchema(ShotPlanSchema) as { properties: { shots: { items: { properties: Record<string, Node> } } } })
      .properties.shots.items.properties;
    expect(shot.size.enum).toEqual([...SHOT_SIZES]);
    expect(shot.framing.enum).toEqual([...SHOT_FRAMINGS]);
    expect(shot.angle.enum).toEqual([...CAMERA_ANGLES]);
    expect(shot.movement.enum).toEqual([...CAMERA_MOVEMENTS]);
  });
});

describe("matchEnum", () => {
  it("maps near-misses onto canonical ids", () => {
    expect(matchEnum("Medium Close-Up", SHOT_SIZES)).toBe("medium-close-up");
    expect(matchEnum("medium closeup", SHOT_SIZES)).toBe("medium-close-up");
    expect(matchEnum("wide shot", SHOT_SIZES)).toBe("wide");
    expect(matchEnum("extreme-wide-shot", SHOT_SIZES)).toBe("extreme-wide");
    expect(matchEnum("bird's-eye", CAMERA_ANGLES)).toBe("birds-eye");
    expect(matchEnum("Birdseye", CAMERA_ANGLES)).toBe("birds-eye");
    expect(matchEnum("low angle", CAMERA_ANGLES)).toBe("low");
    expect(matchEnum("dutch-tilt", CAMERA_ANGLES)).toBe("dutch");
    expect(matchEnum("hand-held", CAMERA_MOVEMENTS)).toBe("handheld");
    expect(matchEnum("slow push-in", CAMERA_MOVEMENTS)).toBe("push-in");
    expect(matchEnum("Hooks", ["hook", "structure"])).toBe("hook");
  });

  it("uses aliases, including ones that would otherwise match by suffix", () => {
    expect(matchEnum("MCU", SHOT_SIZES, { mcu: "medium-close-up" })).toBe("medium-close-up");
    expect(matchEnum("not present", ["strong", "present", "weak", "missing"], { "not present": "missing" })).toBe("missing");
  });

  it("returns null for unrelated values", () => {
    expect(matchEnum("cinematic", SHOT_SIZES)).toBeNull();
    expect(matchEnum("", SHOT_SIZES)).toBeNull();
  });
});

describe("parseStructured", () => {
  it("uses the field fallback for an unknown beat status and fills null strings", () => {
    const story = {
      overall: "64",
      headline: "h",
      summary: null,
      framework: "Three Act",
      beats: [
        { beat: "Setup", status: "Partial", evidence: "", suggestion: "" },
        { beat: "Climax", status: "sort of there", evidence: "", suggestion: "" },
      ],
      skillScores: [],
      strengths: [],
      improvements: [],
      lineNotes: [],
      revisionPlan: null,
    };
    const result = parseStructured(StoryAnalysisSchema, story);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.overall).toBe(64);
    expect(result.data.summary).toBe("");
    expect(result.data.framework).toBe("three-act");
    expect(result.data.beats.map((b) => b.status)).toEqual(["weak", "present"]);
    expect(result.data.revisionPlan).toEqual([]);
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("drops logline components with an unknown key and keeps the rest", () => {
    const result = parseStructured(LoglineAnalysisSchema, {
      overall: 70,
      verdict: "v",
      genreRead: "g",
      components: [
        { key: "Protagonist", score: 7, note: "" },
        { key: "vibes", score: 3, note: "" },
        { key: "irony", score: 6, note: "" },
      ],
      rewrites: [],
      questions: [],
    });
    expect(result.ok && result.data.components.map((c) => c.key)).toEqual(["protagonist", "hook"]);
  });

  it("still rejects output with a missing or wrongly typed required field", () => {
    expect(parseStructured(MicroFeedbackSchema, { praise: "p", nudge: "n", tryThis: "t", skill: "hook" }).ok).toBe(false);
    expect(parseStructured(MicroFeedbackSchema, { score: "high", praise: "p", nudge: "n", tryThis: "t", skill: "hook" }).ok).toBe(false);
  });
});

describe("jsonCandidates", () => {
  it("joins text across a fallback boundary first, then tries the continuation alone", () => {
    const content = [
      { type: "thinking" },
      { type: "text", text: '{"a":' },
      { type: "fallback" },
      { type: "text", text: "1}" },
    ];
    expect(jsonCandidates(content)[0]).toBe('{"a":1}');
    expect(jsonCandidates(content)).toContain("1}");
  });
});
