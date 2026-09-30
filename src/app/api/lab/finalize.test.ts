import { describe, expect, it } from "vitest";
import type { LoglineAnalysis, ShotPlan, StoryAnalysis } from "@/lib/ai/schemas";
import { FRAMEWORKS } from "@/lib/frameworks";
import { finalizeLogline, finalizeShotPlan, finalizeStory } from "./finalize";

describe("finalizeLogline", () => {
  it("clamps scores, orders components canonically and fills gaps", () => {
    const raw: LoglineAnalysis = {
      overall: 140,
      verdict: "v",
      genreRead: "g",
      components: [
        { key: "stakes", score: 12, note: "s" },
        { key: "protagonist", score: -3, note: "p" },
      ],
      rewrites: [1, 2, 3, 4].map((i) => ({ angle: `a${i}`, logline: `l${i}` })),
      questions: ["q1", "", "q2", "q3", "q4", "q5"],
    };
    const out = finalizeLogline(raw);
    expect(out.overall).toBe(100);
    expect(out.components.map((c) => c.key)).toEqual(["protagonist", "goal", "obstacle", "stakes", "hook", "specificity"]);
    expect(out.components[0].score).toBe(0);
    expect(out.components[3].score).toBe(10);
    expect(out.components[1].score).toBe(0);
    expect(out.rewrites).toHaveLength(3);
    expect(out.questions).toEqual(["q1", "q2", "q3", "q4"]);
  });
});

describe("finalizeStory", () => {
  const base: Omit<StoryAnalysis, "beats"> = {
    overall: 71.6,
    headline: "h",
    summary: "s",
    framework: "three-act",
    skillScores: [
      { skill: "structure", score: 120, comment: "" },
      { skill: "structure", score: 10, comment: "dupe" },
    ],
    strengths: [],
    improvements: [],
    lineNotes: [],
    revisionPlan: ["a", " ", "b"],
  };

  it("lines beats up with the framework and marks absent ones missing", () => {
    const out = finalizeStory(
      {
        ...base,
        beats: [
          { beat: "climax", status: "strong", evidence: "e", suggestion: "x" },
          { beat: "Setup", status: "present", evidence: "e", suggestion: "x" },
        ],
      },
      "three-act",
    );
    expect(out.beats.map((b) => b.beat)).toEqual(FRAMEWORKS["three-act"].beats.map((b) => b.name));
    expect(out.beats[0].status).toBe("present");
    expect(out.beats.find((b) => b.beat === "Climax")?.status).toBe("strong");
    expect(out.beats.find((b) => b.beat === "Midpoint")?.status).toBe("missing");
    expect(out.overall).toBe(72);
    expect(out.skillScores).toEqual([{ skill: "structure", score: 100, comment: "" }]);
    expect(out.revisionPlan).toEqual(["a", "b"]);
  });

  it("maps repeated beat names one-to-one and forces the requested framework", () => {
    const names = FRAMEWORKS["story-spine"].beats.map((b) => b.name);
    const out = finalizeStory(
      { ...base, framework: "three-act", beats: names.map((beat, i) => ({ beat, status: "present", evidence: `e${i}`, suggestion: "" })) },
      "story-spine",
    );
    expect(out.framework).toBe("story-spine");
    expect(out.beats.map((b) => b.evidence)).toEqual(names.map((_, i) => `e${i}`));
  });

  it("keeps the model's order when it paraphrased every beat name", () => {
    const out = finalizeStory(
      { ...base, beats: ["Intro", "Twist", "More", "Change"].map((beat) => ({ beat, status: "weak", evidence: beat, suggestion: "" })) },
      "kishotenketsu",
    );
    expect(out.beats.map((b) => b.evidence)).toEqual(["Intro", "Twist", "More", "Change"]);
  });
});

describe("finalizeShotPlan", () => {
  it("renumbers shots sequentially", () => {
    const shot = { number: 9, size: "wide", framing: "establishing", angle: "eye-level", movement: "static", lens: "24mm", subject: "s", action: "a", purpose: "p", sound: "" } as const;
    const plan: ShotPlan = { sceneSummary: "", emotionalIntent: "", visualConcept: "", shots: [shot, shot, shot], coverageNotes: [], feedbackOnUserShots: [] };
    expect(finalizeShotPlan(plan).shots.map((s) => s.number)).toEqual([1, 2, 3]);
  });
});
