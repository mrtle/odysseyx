"use client";

/**
 * The user's progress, persisted to localStorage. Everything lives in the
 * browser — there are no accounts yet.
 *
 * Hydration: the store is created with `skipHydration` and rehydrated by
 * <StoreHydrator /> after mount, so server and first client render always
 * match. Gate store-dependent UI on `useHasHydrated()`.
 */
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ChatMessage,
  CoachMode,
  DailyEntry,
  Evaluation,
  LabEntry,
  LessonProgress,
  PracticeSession,
  Profile,
  TrackId,
  XpEvent,
} from "@/lib/types";
import { XP_REWARDS, lessonKey, lessonXp, practiceXp, toDateKey } from "@/lib/progress";
import { uid } from "@/lib/utils";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewLabEntry = DistributiveOmit<LabEntry, "id" | "createdAt">;

export interface Settings {
  /** Read persona replies aloud in practice drills. */
  autoSpeak: boolean;
}

export interface AppData {
  profile: Profile | null;
  lessonProgress: Record<string, LessonProgress>;
  /** Newest first. */
  sessions: PracticeSession[];
  /** Newest first. */
  labEntries: LabEntry[];
  /** Keyed by YYYY-MM-DD. */
  daily: Record<string, DailyEntry>;
  xp: number;
  /** Newest first. */
  xpLog: XpEvent[];
  /** Sorted unique YYYY-MM-DD dates with any activity. */
  activityDates: string[];
  settings: Settings;
}

export interface AppActions {
  setProfile(profile: Omit<Profile, "createdAt">): void;
  /** Returns XP gained (0 when re-completing a lesson without improving). */
  completeLesson(trackId: TrackId, lessonId: string, quizScore: number): number;
  /** Creates a session seeded with the persona's opening line; returns its id. */
  startSession(scenarioId: string, openingLine: string): string;
  addMessage(sessionId: string, message: Pick<ChatMessage, "role" | "content">): ChatMessage;
  /** Returns XP gained. */
  finishSession(sessionId: string, evaluation: Evaluation, mode: CoachMode): number;
  deleteSession(sessionId: string): void;
  addLabEntry(entry: NewLabEntry): LabEntry;
  deleteLabEntry(entryId: string): void;
  /** Returns XP gained (only the first submission of a day earns XP). */
  saveDaily(entry: DailyEntry): number;
  updateSettings(settings: Partial<Settings>): void;
  resetProgress(): void;
}

export type AppState = AppData & AppActions;

const MAX_SESSIONS = 100;
const MAX_LAB_ENTRIES = 100;
const MAX_XP_LOG = 200;

export const initialData: AppData = {
  profile: null,
  lessonProgress: {},
  sessions: [],
  labEntries: [],
  daily: {},
  xp: 0,
  xpLog: [],
  activityDates: [],
  settings: { autoSpeak: false },
};

function withXp(state: AppData, amount: number, reason: string): Pick<AppData, "xp" | "xpLog" | "activityDates"> {
  const now = new Date();
  const today = toDateKey(now);
  const activityDates = state.activityDates.includes(today)
    ? state.activityDates
    : [...state.activityDates, today].sort();
  if (amount <= 0) return { xp: state.xp, xpLog: state.xpLog, activityDates };
  return {
    xp: state.xp + amount,
    xpLog: [{ at: now.toISOString(), amount, reason }, ...state.xpLog].slice(0, MAX_XP_LOG),
    activityDates,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      setProfile(profile) {
        const existing = get().profile;
        set({ profile: { ...profile, createdAt: existing?.createdAt ?? new Date().toISOString() } });
      },

      completeLesson(trackId, lessonId, quizScore) {
        const key = lessonKey(trackId, lessonId);
        const state = get();
        const previous = state.lessonProgress[key];
        const score = Math.max(0, Math.min(1, quizScore));
        let gained = 0;
        if (!previous) gained = lessonXp(score);
        else if (previous.quizScore < 1 && score >= 1) gained = XP_REWARDS.quizPerfectBonus;
        set({
          lessonProgress: {
            ...state.lessonProgress,
            [key]: {
              trackId,
              lessonId,
              completedAt: new Date().toISOString(),
              quizScore: Math.max(score, previous?.quizScore ?? 0),
            },
          },
          ...withXp(state, gained, `Lesson: ${lessonId}`),
        });
        return gained;
      },

      startSession(scenarioId, openingLine) {
        const now = new Date().toISOString();
        const session: PracticeSession = {
          id: uid(),
          scenarioId,
          startedAt: now,
          messages: [{ id: uid(), role: "persona", content: openingLine, at: now }],
        };
        set((s) => ({ sessions: [session, ...s.sessions].slice(0, MAX_SESSIONS) }));
        return session.id;
      },

      addMessage(sessionId, message) {
        const full: ChatMessage = { id: uid(), at: new Date().toISOString(), ...message };
        set((s) => ({
          sessions: s.sessions.map((session) =>
            session.id === sessionId ? { ...session, messages: [...session.messages, full] } : session,
          ),
        }));
        return full;
      },

      finishSession(sessionId, evaluation, mode) {
        const state = get();
        const session = state.sessions.find((s) => s.id === sessionId);
        if (!session) return 0;
        const gained = session.evaluation ? 0 : practiceXp(evaluation.overall);
        set({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, evaluation, mode, endedAt: new Date().toISOString() } : s,
          ),
          ...withXp(state, gained, `Practice: ${session.scenarioId}`),
        });
        return gained;
      },

      deleteSession(sessionId) {
        set((s) => ({ sessions: s.sessions.filter((session) => session.id !== sessionId) }));
      },

      addLabEntry(entry) {
        const full = { ...entry, id: uid(), createdAt: new Date().toISOString() } as LabEntry;
        const state = get();
        set({
          labEntries: [full, ...state.labEntries].slice(0, MAX_LAB_ENTRIES),
          ...withXp(state, XP_REWARDS.labAnalysis, `Story Lab: ${entry.tool}`),
        });
        return full;
      },

      deleteLabEntry(entryId) {
        set((s) => ({ labEntries: s.labEntries.filter((e) => e.id !== entryId) }));
      },

      saveDaily(entry) {
        const state = get();
        const gained = state.daily[entry.date] ? 0 : XP_REWARDS.daily;
        set({ daily: { ...state.daily, [entry.date]: entry }, ...withXp(state, gained, "Daily challenge") });
        return gained;
      },

      updateSettings(settings) {
        set((s) => ({ settings: { ...s.settings, ...settings } }));
      },

      resetProgress() {
        set({ ...initialData });
      },
    }),
    {
      name: "odysseusx-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state): AppData => ({
        profile: state.profile,
        lessonProgress: state.lessonProgress,
        sessions: state.sessions,
        labEntries: state.labEntries,
        daily: state.daily,
        xp: state.xp,
        xpLog: state.xpLog,
        activityDates: state.activityDates,
        settings: state.settings,
      }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<AppData>) }),
    },
  ),
);

function subscribeHydration(onChange: () => void): () => void {
  const unsubFinish = useAppStore.persist.onFinishHydration(onChange);
  const unsubStart = useAppStore.persist.onHydrate(onChange);
  return () => {
    unsubFinish();
    unsubStart();
  };
}

/** False on the server and until localStorage has been read on the client. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useAppStore.persist.hasHydrated(),
    () => false,
  );
}
