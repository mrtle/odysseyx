import { describe, expect, it } from "vitest";
import { EXPERIENCE_LEVELS, GOAL_IDS } from "@/lib/ai/schemas";
import { GOAL_LABELS } from "@/lib/ai/prompts/common";
import { isSkillId } from "@/lib/skills";
import { EXPERIENCES, EXPERIENCE_LIST, GOALS, GOAL_LIST, isExperienceLevel, isGoalId, preferredSkillsFor } from "./goals";

describe("GOALS", () => {
  it("defines every goal id, keyed by its own id", () => {
    expect(Object.keys(GOALS).sort()).toEqual([...GOAL_IDS].sort());
    for (const id of GOAL_IDS) expect(GOALS[id].id).toBe(id);
  });

  it("has a label, a one-line description and an icon for each goal", () => {
    for (const goal of GOAL_LIST) {
      expect(goal.label.trim().length).toBeGreaterThan(2);
      expect(goal.description.trim().length).toBeGreaterThan(20);
      expect(goal.description).not.toMatch(/\n/);
      expect(goal.icon).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it("gives every goal a distinct icon", () => {
    const icons = GOAL_LIST.map((g) => g.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("lists three distinct, valid preferred skills per goal", () => {
    for (const goal of GOAL_LIST) {
      expect(goal.preferredSkills).toHaveLength(3);
      expect(new Set(goal.preferredSkills).size).toBe(3);
      for (const skill of goal.preferredSkills) expect(isSkillId(skill)).toBe(true);
    }
  });

  it("maps each goal to the skills that kind of storyteller needs", () => {
    expect(GOALS.filmmaker.preferredSkills).toEqual(["visual", "structure", "pacing"]);
    expect(GOALS.screenwriter.preferredSkills).toEqual(["structure", "character", "dialogue"]);
    expect(GOALS.creator.preferredSkills).toEqual(["hook", "pacing", "delivery"]);
    expect(GOALS.founder.preferredSkills).toEqual(["delivery", "hook", "conflict"]);
    expect(GOALS.speaker.preferredSkills).toEqual(["delivery", "hook", "structure"]);
    expect(GOALS.writer.preferredSkills).toEqual(["character", "dialogue", "visual"]);
  });

  it("keeps GOAL_LIST in the canonical GOAL_IDS order", () => {
    expect(GOAL_LIST.map((g) => g.id)).toEqual([...GOAL_IDS]);
  });

  it("covers the same goals the coach prompts describe", () => {
    expect(Object.keys(GOAL_LABELS).sort()).toEqual(Object.keys(GOALS).sort());
  });
});

describe("goal helpers", () => {
  it("isGoalId accepts only known goals", () => {
    expect(isGoalId("filmmaker")).toBe(true);
    expect(isGoalId("astronaut")).toBe(false);
    expect(isGoalId(undefined)).toBe(false);
    expect(isGoalId(3)).toBe(false);
  });

  it("preferredSkillsFor tolerates missing or stale goals", () => {
    expect(preferredSkillsFor("founder")).toEqual(GOALS.founder.preferredSkills);
    expect(preferredSkillsFor(undefined)).toEqual([]);
    expect(preferredSkillsFor(null)).toEqual([]);
    expect(preferredSkillsFor("retired-goal")).toEqual([]);
  });
});

describe("EXPERIENCES", () => {
  it("defines every experience level in order", () => {
    expect(EXPERIENCE_LIST.map((e) => e.id)).toEqual([...EXPERIENCE_LEVELS]);
    for (const level of EXPERIENCE_LEVELS) {
      expect(EXPERIENCES[level].id).toBe(level);
      expect(EXPERIENCES[level].label.length).toBeGreaterThan(3);
      expect(EXPERIENCES[level].description.length).toBeGreaterThan(20);
    }
  });

  it("isExperienceLevel accepts only known levels", () => {
    expect(isExperienceLevel("advanced")).toBe(true);
    expect(isExperienceLevel("expert")).toBe(false);
    expect(isExperienceLevel(null)).toBe(false);
  });
});
