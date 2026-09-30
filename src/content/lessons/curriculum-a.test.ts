/**
 * Regression checks for the first four tracks (Foundations, Structure,
 * Character, Scenes & Dialogue): exercise prose must name the drill and Story
 * Lab tool the lesson actually links to, and quiz keys must not be guessable
 * from option length in either direction.
 */
import { describe, expect, it } from "vitest";
import { foundationsLessons } from "./foundations";
import { structureLessons } from "./structure";
import { characterLessons } from "./character";
import { sceneDialogueLessons } from "./scene-dialogue";
import { getScenario } from "@/content/scenarios";
import type { LabToolId, Lesson } from "@/lib/types";

const TRACKS: [string, Lesson[]][] = [
  ["foundations", foundationsLessons],
  ["structure", structureLessons],
  ["character", characterLessons],
  ["scene-dialogue", sceneDialogueLessons],
];
const LESSONS = TRACKS.flatMap(([, lessons]) => lessons);

/** "The Elevator" and "What's My Motivation?" both match "Elevator" / "What's My Motivation". */
function normaliseTitle(title: string): string {
  return title.replace(/^The\s+/, "").replace(/[?!.]+$/, "").trim();
}

/** Capitalised names directly before the word "drill", e.g. "in the Break the Episode drill". */
function drillNames(text: string): string[] {
  return [...text.matchAll(/((?:[A-Z][\w'’]*\s+(?:(?:the|of)\s+)?)*[A-Z][\w'’]*)\s+drill\b/g)].map((m) => m[1]);
}

const LAB_TOOL_NAMES: Record<string, LabToolId> = {
  "Logline Doctor": "logline",
  "Story Doctor": "story",
  "Story Lab": "story",
  "Shot Planner": "shots",
};

describe.each(LESSONS.map((l) => [`${l.trackId}/${l.id}`, l] as const))("exercise %s", (_key, lesson) => {
  const text = [lesson.exercise.prompt, ...lesson.exercise.tips].join("\n");

  it("names only the drill it links to, by its real title", () => {
    const names = drillNames(text);
    if (names.length === 0) return;
    const scenario = lesson.exercise.practiceScenarioId
      ? getScenario(lesson.exercise.practiceScenarioId)
      : undefined;
    expect(scenario, "exercise names a drill but links to none").toBeDefined();
    for (const name of names) expect(normaliseTitle(name)).toBe(normaliseTitle(scenario!.title));
  });

  it("names Story Lab tools by their real names, and links to the tool it names", () => {
    const mentions = text.match(/\b(?:Logline|Story|Shot) (?:Doctor|Lab|Planner)\b/g) ?? [];
    for (const name of mentions) {
      expect(Object.keys(LAB_TOOL_NAMES), `unknown tool name "${name}"`).toContain(name);
      expect(lesson.exercise.labTool, `names the ${name} but links elsewhere`).toBe(LAB_TOOL_NAMES[name]);
    }
  });
});

describe.each(TRACKS)("%s quiz keys", (_id, lessons) => {
  const questions = lessons.flatMap((l) => l.quiz);
  const share = (pick: (lengths: number[]) => number) =>
    questions.filter((q) => {
      const lengths = q.options.map((o) => o.length);
      return lengths[q.answerIndex] === pick(lengths);
    }).length / questions.length;

  it("aren't reliably the longest option", () => {
    expect(share((l) => Math.max(...l))).toBeLessThanOrEqual(0.35);
  });

  it("aren't reliably the shortest option either", () => {
    expect(share((l) => Math.min(...l))).toBeLessThanOrEqual(0.35);
  });

  it("use every answer position", () => {
    const positions = new Set(questions.map((q) => q.answerIndex));
    expect(positions.size).toBe(4);
  });
});
