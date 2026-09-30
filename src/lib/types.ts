/**
 * Core domain types for OdysseusX content (tracks, lessons, scenarios) and
 * user progress. AI output shapes live in `@/lib/ai/schemas` and are
 * re-exported here for convenience.
 */
import type { SkillId } from "@/lib/skills";
import type { FrameworkId } from "@/lib/frameworks";
import type {
  Evaluation,
  ExperienceLevel,
  GoalId,
  LoglineAnalysis,
  MicroFeedback,
  ShotPlan,
  StoryAnalysis,
} from "@/lib/ai/schemas";

export type {
  Evaluation,
  ExperienceLevel,
  GoalId,
  LoglineAnalysis,
  MicroFeedback,
  ShotPlan,
  SkillScore,
  StoryAnalysis,
} from "@/lib/ai/schemas";
export type { SkillId } from "@/lib/skills";
export type { FrameworkId } from "@/lib/frameworks";

/** Whether an AI response came from Claude ("live") or the offline coach ("demo"). */
export type CoachMode = "live" | "demo";

// ---------------------------------------------------------------------------
// Learn: tracks and lessons
// ---------------------------------------------------------------------------

export const TRACK_IDS = [
  "foundations",
  "structure",
  "character",
  "scene-dialogue",
  "visual",
  "editing-sound",
  "pitch-delivery",
] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export type LabToolId = "logline" | "story" | "shots";

/**
 * Lesson body blocks. Text fields support a tiny inline markup rendered by
 * `<RichText>`: **bold**, *italic* and `code`. No HTML.
 */
export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "text"; body: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; tone: "tip" | "warning" | "insight"; title?: string; body: string }
  | { type: "example"; title: string; source?: string; body: string }
  | { type: "quote"; text: string; attribution: string }
  | { type: "compare"; weakLabel?: string; weak: string; strongLabel?: string; strong: string; note?: string }
  | { type: "beats"; title?: string; frameworkId?: FrameworkId; beats: { name: string; description: string }[] }
  | { type: "exercise-inline"; prompt: string; placeholder?: string };

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface LessonExercise {
  prompt: string;
  tips: string[];
  /** Deep link into a practice drill that trains this lesson. */
  practiceScenarioId?: string;
  /** Deep link into a Story Lab tool. */
  labTool?: LabToolId;
}

export interface Lesson {
  /** kebab-case, unique within its track */
  id: string;
  trackId: TrackId;
  title: string;
  summary: string;
  minutes: number;
  level: ExperienceLevel;
  skills: SkillId[];
  blocks: LessonBlock[];
  keyTakeaways: string[];
  quiz: QuizQuestion[];
  exercise: LessonExercise;
}

export type TrackIcon =
  | "compass"
  | "map"
  | "users"
  | "message-square"
  | "camera"
  | "scissors"
  | "mic";

export interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  description: string;
  icon: TrackIcon;
  /** Tailwind gradient classes for the track's accent, e.g. "from-amber-400 to-orange-600". */
  accent: string;
  skills: SkillId[];
  lessons: Lesson[];
}

// ---------------------------------------------------------------------------
// Practice: AI roleplay scenarios
// ---------------------------------------------------------------------------

export type ScenarioCategory = "pitch" | "oral" | "directing" | "writers-room" | "craft";

export interface Persona {
  name: string;
  role: string;
  /** Short public bio shown to the user. */
  bio: string;
  /** Emoji or 1–2 letter monogram for the avatar. */
  avatar: string;
  /** Speech synthesis hints for voice mode. */
  voice?: { pitch: number; rate: number };
}

export interface RubricCriterion {
  skill: SkillId;
  label: string;
  description: string;
}

export interface Scenario {
  /** kebab-case, unique */
  id: string;
  title: string;
  category: ScenarioCategory;
  tagline: string;
  description: string;
  difficulty: 1 | 2 | 3;
  minutes: number;
  skills: SkillId[];
  persona: Persona;
  /** Who the user plays, second person: "You're a first-time director…" */
  userRole: string;
  /** What success looks like, shown before the drill starts. */
  objective: string;
  /** The persona's opening message. */
  openingLine: string;
  /**
   * Hidden direction for the AI persona: personality, hidden concerns,
   * questions to ask, how to react to strong/weak moves, when to wrap up.
   */
  personaBrief: string;
  rubric: RubricCriterion[];
  /** Suggested number of user turns before wrapping up. */
  suggestedTurns: number;
  tips: string[];
}

// ---------------------------------------------------------------------------
// Daily challenge
// ---------------------------------------------------------------------------

export interface DailyPrompt {
  id: string;
  title: string;
  prompt: string;
  constraint: string;
  skill: SkillId;
}

// ---------------------------------------------------------------------------
// User progress (persisted in the browser)
// ---------------------------------------------------------------------------

export interface Profile {
  name: string;
  goal: GoalId;
  experience: ExperienceLevel;
  /** Free-text: what the user is working on (a film, a pitch, a talk…). */
  project?: string;
  createdAt: string;
}

export interface LessonProgress {
  trackId: TrackId;
  lessonId: string;
  completedAt: string;
  /** Fraction of quiz questions answered correctly, 0–1. */
  quizScore: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "persona";
  content: string;
  at: string;
}

export interface PracticeSession {
  id: string;
  scenarioId: string;
  startedAt: string;
  endedAt?: string;
  messages: ChatMessage[];
  evaluation?: Evaluation;
  mode?: CoachMode;
}

export type LabEntry =
  | { id: string; tool: "logline"; createdAt: string; title: string; input: string; result: LoglineAnalysis; mode: CoachMode }
  | { id: string; tool: "story"; createdAt: string; title: string; input: string; framework: FrameworkId; result: StoryAnalysis; mode: CoachMode }
  | { id: string; tool: "shots"; createdAt: string; title: string; input: string; result: ShotPlan; mode: CoachMode };

export interface DailyEntry {
  promptId: string;
  /** YYYY-MM-DD local date */
  date: string;
  response: string;
  feedback?: MicroFeedback;
  mode?: CoachMode;
}

export interface XpEvent {
  at: string;
  amount: number;
  reason: string;
}

/** A single skill observation used to compute the skill profile. */
export interface SkillObservation {
  skill: SkillId;
  score: number;
  at: string;
  source: "practice" | "lab" | "quiz" | "daily";
}

