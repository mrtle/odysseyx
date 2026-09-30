/**
 * Integrity checks for the curriculum, scenarios and daily prompts. These
 * catch broken deep links, bad quiz answers and duplicate ids before they
 * reach a learner.
 */
import { describe, expect, it } from "vitest";
import { ALL_LESSONS, TRACKS } from "@/content/tracks";
import { SCENARIOS } from "@/content/scenarios";
import { DAILY_PROMPTS } from "@/content/daily-prompts";
import { SKILL_IDS } from "@/lib/skills";
import { FRAMEWORK_IDS } from "@/lib/frameworks";
import { EXPERIENCE_LEVELS } from "@/lib/ai/schemas";
import { TRACK_IDS, type LessonBlock } from "@/lib/types";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LAB_TOOLS = ["logline", "story", "shots"];

/** Inline markup allowed in lesson text: **bold**, *italic*, `code`. No HTML. */
function assertCleanText(text: string, where: string) {
  expect(text.trim().length, `${where} is empty`).toBeGreaterThan(0);
  expect(/<\/?[a-z][^>]*>/i.test(text), `${where} contains HTML`).toBe(false);
  expect((text.match(/\*\*/g)?.length ?? 0) % 2, `${where} has unbalanced **`).toBe(0);
}

function blockTexts(block: LessonBlock): string[] {
  switch (block.type) {
    case "heading":
      return [block.text];
    case "text":
      return [block.body];
    case "list":
      return block.items;
    case "callout":
      return [block.body, ...(block.title ? [block.title] : [])];
    case "example":
      return [block.title, block.body];
    case "quote":
      return [block.text, block.attribution];
    case "compare":
      return [block.weak, block.strong, ...(block.note ? [block.note] : [])];
    case "beats":
      return block.beats.flatMap((b) => [b.name, b.description]);
    case "exercise-inline":
      return [block.prompt];
  }
}

describe("tracks", () => {
  it("has one track per TrackId, in order", () => {
    expect(TRACKS.map((t) => t.id)).toEqual([...TRACK_IDS]);
  });

  it.each(TRACKS.map((t) => [t.id, t] as const))("%s has lessons", (_id, track) => {
    expect(track.lessons.length).toBeGreaterThanOrEqual(4);
  });
});

describe.each(ALL_LESSONS.map((l) => [`${l.trackId}/${l.id}`, l] as const))("lesson %s", (key, lesson) => {
  it("has a valid id, track and metadata", () => {
    expect(lesson.id).toMatch(KEBAB);
    const track = TRACKS.find((t) => t.id === lesson.trackId);
    expect(track, "trackId must exist").toBeDefined();
    expect(track!.lessons).toContain(lesson);
    expect(EXPERIENCE_LEVELS).toContain(lesson.level);
    expect(lesson.minutes).toBeGreaterThanOrEqual(2);
    expect(lesson.minutes).toBeLessThanOrEqual(20);
    expect(lesson.skills.length).toBeGreaterThan(0);
    for (const s of lesson.skills) expect(SKILL_IDS).toContain(s);
    assertCleanText(lesson.title, `${key} title`);
    assertCleanText(lesson.summary, `${key} summary`);
  });

  it("has well-formed blocks", () => {
    expect(lesson.blocks.length).toBeGreaterThanOrEqual(5);
    lesson.blocks.forEach((block, i) => {
      for (const text of blockTexts(block)) assertCleanText(text, `${key} block ${i} (${block.type})`);
      if (block.type === "beats") {
        expect(block.beats.length).toBeGreaterThan(0);
        if (block.frameworkId) expect(FRAMEWORK_IDS).toContain(block.frameworkId);
      }
      if (block.type === "list") expect(block.items.length).toBeGreaterThan(0);
    });
  });

  it("has key takeaways", () => {
    expect(lesson.keyTakeaways.length).toBeGreaterThanOrEqual(2);
    lesson.keyTakeaways.forEach((t, i) => assertCleanText(t, `${key} takeaway ${i}`));
  });

  it("has a valid quiz", () => {
    expect(lesson.quiz.length).toBeGreaterThanOrEqual(2);
    const ids = new Set<string>();
    for (const q of lesson.quiz) {
      expect(ids.has(q.id), `duplicate quiz id ${q.id}`).toBe(false);
      ids.add(q.id);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size, `${key} ${q.id} has duplicate options`).toBe(q.options.length);
      expect(Number.isInteger(q.answerIndex)).toBe(true);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.options.length);
      assertCleanText(q.prompt, `${key} ${q.id} prompt`);
      assertCleanText(q.explanation, `${key} ${q.id} explanation`);
    }
  });

  it("has an exercise with valid deep links", () => {
    assertCleanText(lesson.exercise.prompt, `${key} exercise`);
    if (lesson.exercise.practiceScenarioId) {
      expect(SCENARIOS.map((s) => s.id), `${key} links to unknown scenario`).toContain(
        lesson.exercise.practiceScenarioId,
      );
    }
    if (lesson.exercise.labTool) expect(LAB_TOOLS).toContain(lesson.exercise.labTool);
  });
});

describe("lesson ids", () => {
  it("are unique within each track", () => {
    for (const track of TRACKS) {
      const ids = track.lessons.map((l) => l.id);
      expect(new Set(ids).size, `duplicate lesson id in ${track.id}`).toBe(ids.length);
    }
  });

  it.each(TRACKS.map((t) => [t.id, t] as const))(
    "%s quizzes can't be gamed by always picking the longest option",
    (_id, track) => {
      const questions = track.lessons.flatMap((l) => l.quiz);
      const longest = questions.filter((q) => {
        const lengths = q.options.map((o) => o.length);
        return lengths[q.answerIndex] === Math.max(...lengths);
      }).length;
      // With 4 options, chance is 25%; allow some slack but never a reliable tell.
      expect(longest / questions.length).toBeLessThanOrEqual(0.4);
    },
  );

  it("vary the correct quiz answer position across the curriculum", () => {
    const positions = new Set(ALL_LESSONS.flatMap((l) => l.quiz.map((q) => q.answerIndex)));
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });
});

describe("scenarios", () => {
  it("have unique kebab-case ids", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(ids.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(KEBAB);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s is complete", (_id, s) => {
    for (const field of [s.title, s.tagline, s.description, s.userRole, s.objective, s.openingLine, s.personaBrief]) {
      expect(field.trim().length).toBeGreaterThan(0);
    }
    expect(s.persona.name.trim()).not.toBe("");
    expect(s.skills.length).toBeGreaterThan(0);
    for (const skill of s.skills) expect(SKILL_IDS).toContain(skill);
    expect(s.rubric.length).toBeGreaterThanOrEqual(2);
    for (const r of s.rubric) expect(s.skills).toContain(r.skill);
    expect([1, 2, 3]).toContain(s.difficulty);
    expect(s.suggestedTurns).toBeGreaterThanOrEqual(2);
  });
});

describe("daily prompts", () => {
  it("have unique ids and valid skills", () => {
    expect(DAILY_PROMPTS.length).toBeGreaterThanOrEqual(30);
    const ids = DAILY_PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of DAILY_PROMPTS) {
      expect(SKILL_IDS).toContain(p.skill);
      expect(p.prompt.trim()).not.toBe("");
      expect(p.title.trim()).not.toBe("");
    }
  });
});
