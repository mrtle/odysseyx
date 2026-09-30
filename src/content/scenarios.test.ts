/**
 * Practice scenarios: the fixed catalogue other features deep-link into.
 */
import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "./scenarios";
import { SKILL_IDS } from "@/lib/skills";

const EXPECTED = {
  "studio-pitch": { category: "pitch", difficulty: 2, skills: ["hook", "structure", "conflict", "delivery"] },
  "elevator-pitch": { category: "pitch", difficulty: 1, skills: ["hook", "delivery"] },
  "logline-gauntlet": { category: "pitch", difficulty: 1, skills: ["hook", "conflict"] },
  "campfire-story": { category: "oral", difficulty: 1, skills: ["hook", "structure", "character", "delivery"] },
  "founder-story": { category: "pitch", difficulty: 2, skills: ["hook", "character", "conflict", "delivery"] },
  "festival-qa": { category: "oral", difficulty: 2, skills: ["delivery", "visual", "character"] },
  "actor-motivation": { category: "directing", difficulty: 2, skills: ["character", "dialogue", "delivery"] },
  "dp-shot-planning": { category: "directing", difficulty: 3, skills: ["visual", "pacing"] },
  "writers-room-break": { category: "writers-room", difficulty: 3, skills: ["structure", "conflict", "character"] },
  "subtext-sparring": { category: "craft", difficulty: 2, skills: ["dialogue", "character", "conflict"] },
} as const;

describe("SCENARIOS", () => {
  it("contains exactly the fixed scenario ids, each once", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s matches its brief and is complete", (id, s) => {
    const expected = EXPECTED[id as keyof typeof EXPECTED];
    expect(s.category).toBe(expected.category);
    expect(s.difficulty).toBe(expected.difficulty);
    expect(s.skills).toEqual(expected.skills);

    for (const [field, value] of Object.entries({
      title: s.title,
      tagline: s.tagline,
      description: s.description,
      userRole: s.userRole,
      objective: s.objective,
      openingLine: s.openingLine,
      personaBrief: s.personaBrief,
      name: s.persona.name,
      role: s.persona.role,
      bio: s.persona.bio,
      avatar: s.persona.avatar,
    })) {
      expect(value.trim(), `${id}.${field}`).not.toBe("");
    }
    for (const skill of s.skills) expect(SKILL_IDS).toContain(skill);

    expect(s.rubric.length).toBeGreaterThanOrEqual(3);
    expect(s.rubric.length).toBeLessThanOrEqual(4);
    for (const r of s.rubric) {
      expect(s.skills).toContain(r.skill);
      expect(r.label.trim()).not.toBe("");
      expect(r.description.trim()).not.toBe("");
    }
    // Every scenario skill is actually assessed by the rubric.
    for (const skill of s.skills) expect(s.rubric.map((r) => r.skill), `${id} rubric misses ${skill}`).toContain(skill);

    expect(s.suggestedTurns).toBeGreaterThanOrEqual(4);
    expect(s.suggestedTurns).toBeLessThanOrEqual(8);
    expect(s.minutes).toBeGreaterThan(0);
    expect(s.tips.length).toBeGreaterThanOrEqual(3);
    expect(s.tips.length).toBeLessThanOrEqual(4);

    expect(s.persona.voice).toBeDefined();
    expect(s.persona.voice!.pitch).toBeGreaterThanOrEqual(0.8);
    expect(s.persona.voice!.pitch).toBeLessThanOrEqual(1.2);
    expect(s.persona.voice!.rate).toBeGreaterThanOrEqual(0.9);
    expect(s.persona.voice!.rate).toBeLessThanOrEqual(1.1);

    // The brief tells the persona how to wrap up.
    expect(s.personaBrief).toMatch(/Wrap-up:/);
  });

  it("gives every persona a distinct name and avatar", () => {
    expect(new Set(SCENARIOS.map((s) => s.persona.name)).size).toBe(SCENARIOS.length);
    expect(new Set(SCENARIOS.map((s) => s.persona.avatar)).size).toBe(SCENARIOS.length);
  });

  it("getScenario finds by id", () => {
    expect(getScenario("studio-pitch")?.persona.name).toBe("Renata Vale");
    expect(getScenario("nope")).toBeUndefined();
  });
});
