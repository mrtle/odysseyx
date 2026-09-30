import { describe, expect, it } from "vitest";
import type { Lesson, LessonProgress, QuizQuestion, Track, TrackId } from "@/lib/types";
import {
  countCompleted,
  describeCompletion,
  formatMinutes,
  formatPercent,
  isCorrectAnswer,
  lessonHref,
  lessonNeighbors,
  plainText,
  pluralize,
  quizVerdict,
  scoreQuiz,
  selectContinueLesson,
  slugify,
  summarizeCurriculum,
  trackStats,
  type LessonRef,
  type ProgressMap,
} from "./learn-helpers";

function lesson(trackId: TrackId, id: string, overrides: Partial<Lesson> = {}): Lesson {
  return {
    id,
    trackId,
    title: `Lesson ${id}`,
    summary: "A summary.",
    minutes: 10,
    level: "beginner",
    skills: ["hook"],
    blocks: [],
    keyTakeaways: [],
    quiz: [],
    exercise: { prompt: "Do it.", tips: [] },
    ...overrides,
  };
}

function track(id: TrackId, lessons: Lesson[]): Track {
  return {
    id,
    title: `Track ${id}`,
    subtitle: "Sub",
    description: "Desc",
    icon: "compass",
    accent: "from-bronze-300 to-bronze-600",
    skills: ["hook"],
    lessons,
  };
}

function done(ref: LessonRef, completedAt: string, quizScore = 1): [string, LessonProgress] {
  return [`${ref.trackId}/${ref.id}`, { trackId: ref.trackId, lessonId: ref.id, completedAt, quizScore }];
}

const Q = (answerIndex: number, id = `q${answerIndex}`): QuizQuestion => ({
  id,
  prompt: "Which?",
  options: ["a", "b", "c", "d"],
  answerIndex,
  explanation: "Because.",
});

const refs: LessonRef[] = [
  { trackId: "foundations", id: "a" },
  { trackId: "foundations", id: "b" },
  { trackId: "structure", id: "c" },
  { trackId: "structure", id: "d" },
];

describe("summarizeCurriculum", () => {
  it("flattens tracks in order with 1-based numbers per track", () => {
    const tracks = [
      track("foundations", [lesson("foundations", "a"), lesson("foundations", "b", { quiz: [Q(0), Q(1, "x")] })]),
      track("structure", []),
      track("character", [lesson("character", "c", { minutes: 7 })]),
    ];
    const summaries = summarizeCurriculum(tracks);
    expect(summaries.map((s) => [s.trackId, s.id, s.number])).toEqual([
      ["foundations", "a", 1],
      ["foundations", "b", 2],
      ["character", "c", 1],
    ]);
    expect(summaries[1].quizCount).toBe(2);
    expect(summaries[2].trackTitle).toBe("Track character");
    expect(summaries[2].minutes).toBe(7);
  });

  it("handles an empty curriculum", () => {
    expect(summarizeCurriculum([track("foundations", [])])).toEqual([]);
  });
});

describe("lessonHref", () => {
  it("builds the lesson route", () => {
    expect(lessonHref({ trackId: "visual", id: "shot-sizes" })).toBe("/learn/visual/shot-sizes");
  });
});

describe("selectContinueLesson", () => {
  it("returns empty for no lessons", () => {
    expect(selectContinueLesson([], {})).toEqual({ kind: "empty" });
  });

  it("starts at the first lesson with no progress", () => {
    const result = selectContinueLesson(refs, {});
    expect(result).toEqual({ kind: "start", lesson: refs[0], completed: 0, total: 4 });
  });

  it("continues after the most recently completed lesson, not the earliest gap", () => {
    const progress: ProgressMap = Object.fromEntries([
      done(refs[0], "2026-09-01T10:00:00Z"),
      done(refs[2], "2026-09-05T10:00:00Z"),
    ]);
    const result = selectContinueLesson(refs, progress);
    expect(result.kind).toBe("continue");
    if (result.kind === "continue") {
      expect(result.lesson).toBe(refs[3]);
      expect(result.completed).toBe(2);
      expect(result.total).toBe(4);
    }
  });

  it("wraps around to earlier gaps when the latest lesson is last", () => {
    const progress: ProgressMap = Object.fromEntries([
      done(refs[0], "2026-09-01T10:00:00Z"),
      done(refs[3], "2026-09-05T10:00:00Z"),
    ]);
    const result = selectContinueLesson(refs, progress);
    expect(result.kind === "continue" && result.lesson).toBe(refs[1]);
  });

  it("skips over already-completed lessons after the latest one", () => {
    const progress: ProgressMap = Object.fromEntries([
      done(refs[1], "2026-09-01T10:00:00Z"),
      done(refs[2], "2026-09-02T10:00:00Z"),
      done(refs[0], "2026-09-03T10:00:00Z"),
    ]);
    const result = selectContinueLesson(refs, progress);
    expect(result.kind === "continue" && result.lesson).toBe(refs[3]);
  });

  it("reports completion when every lesson is done", () => {
    const progress: ProgressMap = Object.fromEntries(refs.map((r, i) => done(r, `2026-09-0${i + 1}T10:00:00Z`)));
    expect(selectContinueLesson(refs, progress)).toEqual({ kind: "complete", completed: 4, total: 4 });
  });

  it("ignores progress for lessons that are no longer in the curriculum", () => {
    const progress: ProgressMap = Object.fromEntries([done({ trackId: "visual", id: "removed" }, "2026-09-09T10:00:00Z")]);
    expect(selectContinueLesson(refs, progress).kind).toBe("start");
  });

  it("tolerates malformed completion dates", () => {
    const progress: ProgressMap = Object.fromEntries([done(refs[1], "not a date")]);
    const result = selectContinueLesson(refs, progress);
    expect(result.kind === "continue" && result.lesson).toBe(refs[2]);
  });
});

describe("countCompleted", () => {
  it("counts only lessons in the list", () => {
    const progress: ProgressMap = Object.fromEntries([
      done(refs[0], "2026-09-01T10:00:00Z"),
      done({ trackId: "visual", id: "elsewhere" }, "2026-09-01T10:00:00Z"),
    ]);
    expect(countCompleted(refs, progress)).toBe(1);
  });
});

describe("lessonNeighbors", () => {
  it("finds previous and next across track boundaries", () => {
    const result = lessonNeighbors(refs, "structure", "c");
    expect(result).toEqual({ index: 2, previous: refs[1], next: refs[3] });
  });

  it("has no previous for the first lesson and no next for the last", () => {
    expect(lessonNeighbors(refs, "foundations", "a").previous).toBeUndefined();
    expect(lessonNeighbors(refs, "structure", "d").next).toBeUndefined();
  });

  it("returns index -1 for unknown lessons", () => {
    expect(lessonNeighbors(refs, "structure", "zzz")).toEqual({ index: -1 });
  });

  it("matches on track as well as lesson id", () => {
    expect(lessonNeighbors(refs, "character", "a").index).toBe(-1);
  });
});

describe("scoreQuiz", () => {
  const questions = [Q(0, "one"), Q(2, "two"), Q(1, "three"), Q(3, "four")];

  it("scores correct answers", () => {
    expect(scoreQuiz(questions, [0, 2, 1, 3])).toEqual({ correct: 4, total: 4, fraction: 1 });
    expect(scoreQuiz(questions, [0, 1, 1, 0])).toEqual({ correct: 2, total: 4, fraction: 0.5 });
  });

  it("treats unanswered questions as incorrect", () => {
    expect(scoreQuiz(questions, [0, null])).toEqual({ correct: 1, total: 4, fraction: 0.25 });
  });

  it("scores an empty quiz as perfect", () => {
    expect(scoreQuiz([], [])).toEqual({ correct: 0, total: 0, fraction: 1 });
  });

  it("isCorrectAnswer rejects null and mismatches", () => {
    expect(isCorrectAnswer(Q(1), 1)).toBe(true);
    expect(isCorrectAnswer(Q(1), 0)).toBe(false);
    expect(isCorrectAnswer(Q(0), null)).toBe(false);
    expect(isCorrectAnswer(Q(0), undefined)).toBe(false);
  });
});

describe("quizVerdict", () => {
  it("bands scores", () => {
    expect(quizVerdict(1).title).toBe("Flawless navigation");
    expect(quizVerdict(0.8).title).toBe("Strong heading");
    expect(quizVerdict(0.6).title).toBe("On course");
    expect(quizVerdict(0.59).title).toBe("Choppy waters");
    expect(quizVerdict(0).tone).toBe("wine");
  });
});

describe("describeCompletion", () => {
  it("celebrates a first completion with XP", () => {
    const copy = describeCompletion({ gained: 75, score: 1, hasQuiz: true });
    expect(copy.headline).toBe("+75 XP");
    expect(copy.detail).toMatch(/perfect quiz/);
  });

  it("nudges toward the perfect bonus on an imperfect first completion", () => {
    const copy = describeCompletion({ gained: 50, score: 0.6, hasQuiz: true });
    expect(copy.headline).toBe("+50 XP");
    expect(copy.detail).toMatch(/100%/);
  });

  it("does not mention a quiz for quiz-less lessons", () => {
    const copy = describeCompletion({ gained: 75, score: 1, hasQuiz: false });
    expect(copy.detail).not.toMatch(/quiz/i);
  });

  it("explains the perfect-score bonus on a retake", () => {
    const copy = describeCompletion({ gained: 25, previousScore: 0.8, score: 1, hasQuiz: true });
    expect(copy.headline).toBe("+25 XP");
    expect(copy.detail).toMatch(/bonus/i);
  });

  it("is kind when an equal score earns nothing", () => {
    const copy = describeCompletion({ gained: 0, previousScore: 0.8, score: 0.8, hasQuiz: true });
    expect(copy.headline).toBe("No new XP this time");
    expect(copy.detail).toMatch(/the same score \(80%\)/);
  });

  it("acknowledges a lower score without scolding", () => {
    const copy = describeCompletion({ gained: 0, previousScore: 1, score: 0.4, hasQuiz: true });
    expect(copy.detail).toMatch(/a better score \(100%\)/);
  });

  it("credits an improvement that doesn't earn XP", () => {
    const copy = describeCompletion({ gained: 0, previousScore: 0.4, score: 0.8, hasQuiz: true });
    expect(copy.headline).toBe("No new XP this time");
    expect(copy.detail).toMatch(/best score is now 80%/);
  });
});

describe("formatting", () => {
  it("formats minutes", () => {
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(45)).toBe("45 min");
    expect(formatMinutes(60)).toBe("1 hr");
    expect(formatMinutes(95)).toBe("1 hr 35 min");
    expect(formatMinutes(Number.NaN)).toBe("0 min");
  });

  it("formats percentages and clamps", () => {
    expect(formatPercent(0.666)).toBe("67%");
    expect(formatPercent(1.4)).toBe("100%");
    expect(formatPercent(-1)).toBe("0%");
    expect(formatPercent(Number.NaN)).toBe("0%");
  });

  it("pluralizes", () => {
    expect(pluralize(1, "lesson")).toBe("1 lesson");
    expect(pluralize(3, "lesson")).toBe("3 lessons");
    expect(pluralize(0, "story", "stories")).toBe("0 stories");
  });

  it("strips inline markup to plain text", () => {
    expect(plainText("The **big** *idea* in `code`")).toBe("The big idea in code");
    expect(plainText("2 * 3 = 6")).toBe("2 * 3 = 6");
  });

  it("slugifies headings", () => {
    expect(slugify("The **Inciting** Incident")).toBe("the-inciting-incident");
    expect(slugify("Kishōtenketsu — twist!")).toBe("kishotenketsu-twist");
    expect(slugify("???")).toBe("section");
  });

  it("sums track stats", () => {
    expect(trackStats(track("visual", [lesson("visual", "a", { minutes: 12 }), lesson("visual", "b", { minutes: 8 })]))).toEqual({
      lessons: 2,
      minutes: 20,
    });
    expect(trackStats(track("visual", []))).toEqual({ lessons: 0, minutes: 0 });
  });
});
