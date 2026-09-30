/**
 * Store fixtures for the Home / Progress render tests (not used by the app).
 */
import { SCENARIOS } from "@/content/scenarios";
import { dailyPromptFor, type DailyEntryWithMode } from "@/lib/daily";
import { toDateKey } from "@/lib/progress";
import { initialData, useAppStore, type AppData } from "@/lib/store";
import type { Evaluation, LabEntry, PracticeSession, Track } from "@/lib/types";
import { buildCatalog, type Catalog } from "./catalog";

export const FIXTURE_TRACKS: Track[] = [
  {
    id: "foundations",
    title: "Story Foundations",
    subtitle: "What makes a story a story",
    description: "",
    icon: "compass",
    accent: "from-bronze-300 to-bronze-600",
    skills: ["hook"],
    lessons: [
      {
        id: "four-elements",
        trackId: "foundations",
        title: "The Four Elements",
        summary: "Desire, obstacle, stakes, change.",
        minutes: 12,
        level: "beginner",
        skills: ["hook", "conflict"],
        blocks: [{ type: "text", body: "SECRET LESSON BODY" }],
        keyTakeaways: [],
        quiz: [],
        exercise: { prompt: "", tips: [] },
      },
      {
        id: "shot-sizes",
        trackId: "foundations",
        title: "Shot Sizes",
        summary: "Wide, medium, close.",
        minutes: 10,
        level: "beginner",
        skills: ["visual"],
        blocks: [],
        keyTakeaways: [],
        quiz: [],
        exercise: { prompt: "", tips: [] },
      },
    ],
  },
  {
    id: "visual",
    title: "Visual Storytelling",
    subtitle: "The camera as narrator",
    description: "",
    icon: "camera",
    accent: "from-sky-300 to-sky-600",
    skills: ["visual"],
    lessons: [],
  },
];

export const fixtureCatalog: Catalog = buildCatalog(FIXTURE_TRACKS, SCENARIOS);

function daysAgoKey(n: number): string {
  const now = new Date();
  return toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12));
}

const evaluation: Evaluation = {
  overall: 74,
  headline: "Strong hook",
  summary: "s",
  skillScores: [
    { skill: "hook", score: 82, comment: "" },
    { skill: "delivery", score: 64, comment: "" },
  ],
  strengths: [],
  improvements: [],
  bestMoment: "",
  nextStep: { title: "t", description: "d" },
};

export const fixtureSession: PracticeSession = {
  id: "sess-1",
  scenarioId: "studio-pitch",
  startedAt: new Date(Date.now() - 3_600_000).toISOString(),
  endedAt: new Date(Date.now() - 3_000_000).toISOString(),
  messages: [
    { id: "m1", role: "persona", content: "What's the movie?", at: new Date().toISOString() },
    { id: "m2", role: "user", content: "A lighthouse keeper going blind…", at: new Date().toISOString() },
  ],
  evaluation,
  mode: "demo",
};

export const fixtureLabEntry: LabEntry = {
  id: "lab-1",
  tool: "logline",
  createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  title: "Lighthouse logline",
  input: "A lighthouse keeper…",
  mode: "demo",
  result: {
    overall: 68,
    verdict: "v",
    genreRead: "g",
    components: [
      { key: "protagonist", score: 7, note: "" },
      { key: "stakes", score: 5, note: "" },
    ],
    rewrites: [],
    questions: [],
  },
};

export function fixtureState(overrides: Partial<AppData> = {}): AppData {
  return {
    ...initialData,
    profile: {
      name: "Penelope Ithaca",
      goal: "filmmaker",
      experience: "intermediate",
      project: "A short film about my grandmother",
      createdAt: "2026-09-01T10:00:00.000Z",
    },
    xp: 1020,
    xpLog: [
      { at: fixtureSession.endedAt!, amount: 104, reason: "Practice: studio-pitch" },
      { at: fixtureLabEntry.createdAt, amount: 40, reason: "Story Lab: logline" },
      { at: new Date(Date.now() - 86_400_000).toISOString(), amount: 75, reason: "Lesson: four-elements" },
    ],
    activityDates: [daysAgoKey(2), daysAgoKey(1), daysAgoKey(0)],
    sessions: [fixtureSession],
    labEntries: [fixtureLabEntry],
    lessonProgress: {
      "foundations/four-elements": {
        trackId: "foundations",
        lessonId: "four-elements",
        completedAt: new Date().toISOString(),
        quizScore: 1,
      },
    },
    ...overrides,
  };
}

/** Today's daily entry, already reviewed by the demo coach. */
export function todaysDailyEntry(): DailyEntryWithMode {
  const prompt = dailyPromptFor(new Date());
  return {
    promptId: prompt.id,
    date: toDateKey(new Date()),
    response: "The kettle clicks off. Nobody pours.",
    feedback: {
      score: 71,
      praise: "“Nobody pours.” lands like a door closing.",
      nudge: "Name the object sooner.",
      tryThis: "Write it as a shot.",
      skill: prompt.skill,
    },
    mode: "demo",
  };
}

/**
 * Make store reads during server rendering see `state`. Zustand's server
 * snapshot reads the store's internal initial-state object, so that object is
 * updated in place (and restored by `resetFixtureState`).
 */
export function useFixtureState(state: AppData): void {
  Object.assign(useAppStore.getInitialState(), state);
  useAppStore.setState(state);
}

export function resetFixtureState(): void {
  Object.assign(useAppStore.getInitialState(), initialData);
  useAppStore.setState({ ...initialData });
}
