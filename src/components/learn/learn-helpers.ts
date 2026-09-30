/**
 * Pure helpers for the Learn experience: lesson summaries for client islands,
 * "continue your voyage" selection, quiz scoring and completion copy.
 * No React and no storage, so everything here is unit-tested.
 */
import type { SkillId } from "@/lib/skills";
import type {
  ExperienceLevel,
  LabToolId,
  Lesson,
  LessonProgress,
  QuizQuestion,
  Track,
  TrackId,
} from "@/lib/types";
import type { BadgeTone } from "@/components/ui/badge";
import { lessonKey } from "@/lib/progress";

// ---------------------------------------------------------------------------
// Lesson summaries (serialisable, sent to client components instead of full lessons)
// ---------------------------------------------------------------------------

export interface LessonRef {
  trackId: TrackId;
  id: string;
}

export interface LessonSummary extends LessonRef {
  title: string;
  summary: string;
  minutes: number;
  level: ExperienceLevel;
  skills: SkillId[];
  trackTitle: string;
  /** 1-based position within its track. */
  number: number;
  quizCount: number;
}

export function lessonHref(ref: LessonRef): string {
  return `/learn/${ref.trackId}/${ref.id}`;
}

export function toLessonSummary(lesson: Lesson, track: Pick<Track, "title" | "lessons">): LessonSummary {
  const index = track.lessons.findIndex((l) => l.id === lesson.id);
  return {
    trackId: lesson.trackId,
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    minutes: lesson.minutes,
    level: lesson.level,
    skills: lesson.skills,
    trackTitle: track.title,
    number: index >= 0 ? index + 1 : 1,
    quizCount: lesson.quiz.length,
  };
}

/** Every lesson in curriculum order, summarised. */
export function summarizeCurriculum(tracks: Track[]): LessonSummary[] {
  return tracks.flatMap((track) => track.lessons.map((lesson) => toLessonSummary(lesson, track)));
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export type ProgressMap = Record<string, LessonProgress>;

export function progressFor(progress: ProgressMap, ref: LessonRef): LessonProgress | undefined {
  return progress[lessonKey(ref.trackId, ref.id)];
}

export function isLessonComplete(progress: ProgressMap, ref: LessonRef): boolean {
  return progressFor(progress, ref) !== undefined;
}

export function countCompleted(lessons: LessonRef[], progress: ProgressMap): number {
  return lessons.reduce((n, l) => (isLessonComplete(progress, l) ? n + 1 : n), 0);
}

export type ContinueSelection<T extends LessonRef> =
  | { kind: "empty" }
  | { kind: "start"; lesson: T; completed: 0; total: number }
  | { kind: "continue"; lesson: T; completed: number; total: number }
  | { kind: "complete"; completed: number; total: number };

/**
 * Where the learner should pick up. Starts after the most recently completed
 * lesson (so finishing lesson 4 of a track points at lesson 5, not at a lesson
 * skipped earlier), then wraps around to the first gap. Progress for lessons
 * that no longer exist in the curriculum is ignored.
 */
export function selectContinueLesson<T extends LessonRef>(lessons: T[], progress: ProgressMap): ContinueSelection<T> {
  const total = lessons.length;
  if (total === 0) return { kind: "empty" };

  let lastIndex = -1;
  let lastTime = -Infinity;
  let completed = 0;
  lessons.forEach((lesson, i) => {
    const entry = progressFor(progress, lesson);
    if (!entry) return;
    completed++;
    const time = new Date(entry.completedAt).getTime();
    const safeTime = Number.isFinite(time) ? time : 0;
    if (safeTime >= lastTime) {
      lastTime = safeTime;
      lastIndex = i;
    }
  });

  if (completed === 0) return { kind: "start", lesson: lessons[0], completed: 0, total };
  if (completed >= total) return { kind: "complete", completed, total };

  for (let step = 1; step <= total; step++) {
    const candidate = lessons[(lastIndex + step) % total];
    if (!isLessonComplete(progress, candidate)) return { kind: "continue", lesson: candidate, completed, total };
  }
  return { kind: "complete", completed, total };
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface LessonNeighbors<T> {
  index: number;
  previous?: T;
  next?: T;
}

/** The lessons before and after this one in curriculum order (crossing track boundaries). */
export function lessonNeighbors<T extends LessonRef>(lessons: T[], trackId: string, lessonId: string): LessonNeighbors<T> {
  const index = lessons.findIndex((l) => l.trackId === trackId && l.id === lessonId);
  if (index < 0) return { index };
  return { index, previous: lessons[index - 1], next: lessons[index + 1] };
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

export interface QuizScore {
  correct: number;
  total: number;
  /** 0–1. A quiz with no questions scores 1. */
  fraction: number;
}

export function isCorrectAnswer(question: QuizQuestion, answer: number | null | undefined): boolean {
  return typeof answer === "number" && answer === question.answerIndex;
}

export function scoreQuiz(questions: QuizQuestion[], answers: ReadonlyArray<number | null | undefined>): QuizScore {
  const total = questions.length;
  const correct = questions.reduce((n, q, i) => (isCorrectAnswer(q, answers[i]) ? n + 1 : n), 0);
  return { correct, total, fraction: total === 0 ? 1 : correct / total };
}

export function formatPercent(fraction: number): string {
  const safe = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;
  return `${Math.round(safe * 100)}%`;
}

export interface QuizVerdict {
  title: string;
  message: string;
  tone: BadgeTone;
}

export function quizVerdict(fraction: number): QuizVerdict {
  if (fraction >= 1) {
    return {
      title: "Flawless navigation",
      message: "Every answer true to the chart. This craft is yours now — go and use it.",
      tone: "success",
    };
  }
  if (fraction >= 0.8) {
    return {
      title: "Strong heading",
      message: "You've got the shape of it. Skim the explanations for the one that slipped past you.",
      tone: "success",
    };
  }
  if (fraction >= 0.6) {
    return {
      title: "On course",
      message: "The core ideas landed. A quick reread of the lesson will close the remaining gaps.",
      tone: "bronze",
    };
  }
  return {
    title: "Choppy waters",
    message: "Every storyteller rereads the map. Revisit the lesson, then take the quiz again — your best score is kept.",
    tone: "wine",
  };
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

export interface CompletionOutcome {
  gained: number;
  /** Best quiz score before this attempt, if the lesson was already complete. */
  previousScore?: number;
  score: number;
  /** Whether the lesson has a quiz at all. */
  hasQuiz: boolean;
}

export interface CompletionCopy {
  headline: string;
  detail: string;
}

export function describeCompletion({ gained, previousScore, score, hasQuiz }: CompletionOutcome): CompletionCopy {
  const firstTime = previousScore === undefined;
  if (firstTime) {
    const perfect = hasQuiz && score >= 1;
    return {
      headline: gained > 0 ? `+${gained} XP` : "Lesson complete",
      detail: perfect
        ? "Lesson complete — and a perfect quiz, which earned you the bonus."
        : hasQuiz
          ? "Lesson complete. Score 100% on a retake to earn the perfect-quiz bonus."
          : "Lesson complete. Another stretch of the voyage charted.",
    };
  }
  if (gained > 0) {
    return {
      headline: `+${gained} XP`,
      detail: "Perfect-score bonus unlocked. That's mastery, not memory.",
    };
  }
  const best = Math.max(previousScore, score);
  if (score > previousScore) {
    return {
      headline: "No new XP this time",
      detail: `XP comes from the first completion and a perfect quiz, but your improvement counts: your best score is now ${formatPercent(best)}.`,
    };
  }
  return {
    headline: "No new XP this time",
    detail: `You'd already completed this lesson with ${score === previousScore ? "the same" : "a better"} score (${formatPercent(previousScore)}), so your best stands. Revisiting still sharpens the instinct.`,
  };
}

// ---------------------------------------------------------------------------
// Formatting and labels
// ---------------------------------------------------------------------------

export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(Number.isFinite(total) ? total : 0));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function trackStats(track: Pick<Track, "lessons">): { lessons: number; minutes: number } {
  return {
    lessons: track.lessons.length,
    minutes: track.lessons.reduce((sum, l) => sum + (Number.isFinite(l.minutes) ? l.minutes : 0), 0),
  };
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const LEVEL_TONE: Record<ExperienceLevel, BadgeTone> = {
  beginner: "aegean",
  intermediate: "bronze",
  advanced: "wine",
};

export const LAB_TOOL_COPY: Record<LabToolId, { label: string; description: string }> = {
  logline: {
    label: "Workshop a logline",
    description: "Get your logline scored on protagonist, goal, obstacle, stakes and hook.",
  },
  story: {
    label: "Analyse a story",
    description: "Map your draft onto a structure framework and see where the beats land.",
  },
  shots: {
    label: "Plan your shots",
    description: "Turn a scene into a shot list with sizes, angles and movement that serve the story.",
  },
};

/** Lesson inline markup (**bold**, *italic*, `code`) stripped to plain text, for aria labels. */
export function plainText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*\s][^*]*)\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/** URL-safe anchor id for a heading. */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[*`]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "section"
  );
}
