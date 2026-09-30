"use client";

/**
 * The user's progress, persisted to localStorage. Everything lives in the
 * browser — there are no accounts yet.
 *
 * Hydration: the store is created with `skipHydration` and rehydrated by
 * <StoreHydrator /> after mount, so server and first client render always
 * match. Gate store-dependent UI on `useHasHydrated()`.
 *
 * Robustness:
 *  - Storage that is blocked or throws falls back to memory, so the app
 *    still renders (progress then lasts for the tab); a full quota never
 *    throws out of an action. Both show up in `useStorageHealth`.
 *  - Stored data is validated on the way in (./persisted-state.ts); corrupt
 *    JSON is backed up under a separate key instead of being overwritten.
 *  - Tabs stay in sync: every action first re-reads storage if another tab
 *    wrote since, and <StoreHydrator /> rehydrates on `storage` events, so
 *    two open tabs never silently overwrite each other.
 */
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
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
import { LAB_XP_DAILY_LIMIT, XP_REWARDS, lessonKey, lessonXp, practiceXp, toDateKey } from "@/lib/progress";
import { sanitizePersisted } from "@/lib/persisted-state";
import { uid } from "@/lib/utils";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type NewLabEntry = DistributiveOmit<LabEntry, "id" | "createdAt">;

/** What `addLabEntry` returns: the saved entry plus what the save earned. */
export type SavedLabEntry = LabEntry & {
  /** XP awarded for this analysis (0 for a repeat of an existing entry or past the daily cap). */
  xpGained: number;
  /** True when an identical earlier submission was replaced rather than a new entry added. */
  replaced: boolean;
};

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
  /**
   * Saves an analysis. Re-submitting the same tool + input (whitespace-normalised;
   * plus the framework for Story Doctor) replaces the earlier entry, moves it to
   * the top and earns no XP. Lab XP is capped at LAB_XP_DAILY_LIMIT analyses a day.
   */
  addLabEntry(entry: NewLabEntry): SavedLabEntry;
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
export { LAB_XP_DAILY_LIMIT } from "@/lib/progress";
const LAB_XP_REASON = "Story Lab: ";

export const STORAGE_KEY = "odysseusx-v1";

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

/** Identity of a lab submission for de-duplication. */
export function labEntryKey(entry: NewLabEntry | LabEntry): string {
  const input = entry.input.replace(/\s+/g, " ").trim();
  return entry.tool === "story" ? `story|${entry.framework}|${input}` : `${entry.tool}|${input}`;
}

function labXpEventsToday(xpLog: XpEvent[], now: Date): number {
  const today = toDateKey(now);
  return xpLog.filter((e) => e.reason.startsWith(LAB_XP_REASON) && toDateKey(new Date(e.at)) === today).length;
}

// ---------------------------------------------------------------------------
// Storage: safe localStorage access with an in-memory fallback
// ---------------------------------------------------------------------------

export type StorageStatus = "ok" | "unavailable" | "quota" | "error";

export interface StorageHealth {
  /** "unavailable": the browser blocks storage (memory only); "quota"/"error": the last save failed. */
  status: StorageStatus;
  /** Set when unreadable saved data was found; the raw value is kept under this key. */
  backupKey: string | null;
  /** Restoring saved progress threw; the app carries on with what it has so pages don't wait forever. */
  restoreFailed: boolean;
}

/** Storage health, for banners. Not persisted. */
export const useStorageHealth = create<StorageHealth>(() => ({ status: "ok", backupKey: null, restoreFailed: false }));

interface RawStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function memoryStorage(): RawStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

let backing: RawStorage | null = null;

/** localStorage if the browser lets us read it, else memory. Resolved lazily (never on the server). */
function rawStorage(): RawStorage {
  if (backing) return backing;
  try {
    const ls = window.localStorage;
    ls.getItem(STORAGE_KEY); // throws when storage is blocked
    backing = ls;
  } catch {
    backing = memoryStorage();
    if (typeof window !== "undefined") useStorageHealth.setState({ status: "unavailable" });
  }
  return backing;
}

/** Test hook: swap the backing storage (pass null to re-detect). */
export function setBackingStorageForTests(storage: RawStorage | null): void {
  backing = storage;
  lastRaw = undefined;
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22 || err.code === 1014)
  );
}

/** The raw value we last read or wrote, to detect writes from other tabs. `undefined` = never read. */
let lastRaw: string | null | undefined;

function readRaw(): string | null {
  try {
    return rawStorage().getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const persistStorage: PersistStorage<AppData> = {
  getItem(name) {
    const raw = name === STORAGE_KEY ? readRaw() : null;
    lastRaw = raw;
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) throw new Error("not an object");
      return parsed as StorageValue<AppData>;
    } catch {
      // Keep a copy of the unreadable value so the next save can't destroy it.
      const backupKey = `${STORAGE_KEY}:unreadable-${Date.now()}`;
      try {
        rawStorage().setItem(backupKey, raw);
        useStorageHealth.setState({ backupKey });
      } catch {
        // Nowhere to put it; carry on with fresh progress.
      }
      console.error("[odysseusx] saved progress was unreadable; starting fresh (a copy was kept if possible)");
      return null;
    }
  },
  setItem(name, value) {
    const raw = JSON.stringify(value);
    try {
      rawStorage().setItem(name, raw);
      lastRaw = raw;
      if (useStorageHealth.getState().status !== "ok" && useStorageHealth.getState().status !== "unavailable") {
        useStorageHealth.setState({ status: "ok" });
      }
    } catch (err) {
      // Never throw out of a store action: the in-memory state is already updated.
      useStorageHealth.setState({ status: isQuotaError(err) ? "quota" : "error" });
    }
  },
  removeItem(name) {
    try {
      rawStorage().removeItem(name);
    } catch {
      // ignore
    }
  },
};

/** Before changing anything, pick up what another tab saved since we last read or wrote. */
function syncFromOtherTabs(): void {
  if (typeof window === "undefined" || lastRaw === undefined) return;
  if (readRaw() !== lastRaw) void useAppStore.persist.rehydrate();
}

/** Re-read storage after a `storage` event, unless it's our own last write. */
export function handleStorageEvent(event: Pick<StorageEvent, "key" | "newValue">): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  if (event.key === STORAGE_KEY && event.newValue === lastRaw) return;
  void useAppStore.persist.rehydrate();
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      setProfile(profile) {
        syncFromOtherTabs();
        const existing = get().profile;
        set({ profile: { ...profile, createdAt: existing?.createdAt ?? new Date().toISOString() } });
      },

      completeLesson(trackId, lessonId, quizScore) {
        syncFromOtherTabs();
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
        syncFromOtherTabs();
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
        syncFromOtherTabs();
        const full: ChatMessage = { id: uid(), at: new Date().toISOString(), ...message };
        set((s) => ({
          sessions: s.sessions.map((session) =>
            session.id === sessionId ? { ...session, messages: [...session.messages, full] } : session,
          ),
        }));
        return full;
      },

      finishSession(sessionId, evaluation, mode) {
        syncFromOtherTabs();
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
        syncFromOtherTabs();
        set((s) => ({ sessions: s.sessions.filter((session) => session.id !== sessionId) }));
      },

      addLabEntry(entry) {
        syncFromOtherTabs();
        const state = get();
        const now = new Date();
        const key = labEntryKey(entry);
        const existing = state.labEntries.find((e) => labEntryKey(e) === key);
        const full = { ...entry, id: existing?.id ?? uid(), createdAt: now.toISOString() } as LabEntry;
        const gained = existing || labXpEventsToday(state.xpLog, now) >= LAB_XP_DAILY_LIMIT ? 0 : XP_REWARDS.labAnalysis;
        set({
          labEntries: [full, ...state.labEntries.filter((e) => e !== existing)].slice(0, MAX_LAB_ENTRIES),
          ...withXp(state, gained, `${LAB_XP_REASON}${entry.tool}`),
        });
        return { ...full, xpGained: gained, replaced: Boolean(existing) };
      },

      deleteLabEntry(entryId) {
        syncFromOtherTabs();
        set((s) => ({ labEntries: s.labEntries.filter((e) => e.id !== entryId) }));
      },

      saveDaily(entry) {
        syncFromOtherTabs();
        const state = get();
        const gained = state.daily[entry.date] ? 0 : XP_REWARDS.daily;
        set({ daily: { ...state.daily, [entry.date]: entry }, ...withXp(state, gained, "Daily challenge") });
        return gained;
      },

      updateSettings(settings) {
        syncFromOtherTabs();
        set((s) => ({ settings: { ...s.settings, ...settings } }));
      },

      resetProgress() {
        syncFromOtherTabs();
        set({ ...initialData });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: persistStorage,
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
      // Validate on the way in: bad fields keep the current value, bad records are dropped.
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
      // Future versions: transform older shapes here. Until then, keep whatever validates
      // rather than discarding the user's progress.
      migrate: (persisted) => sanitizePersisted(persisted) as AppData,
      onRehydrateStorage: () => (_state, error) => {
        if (!error) return;
        console.error("[odysseusx] couldn't restore saved progress", error);
        useStorageHealth.setState({ restoreFailed: true });
      },
    },
  ),
);

function subscribeHydration(onChange: () => void): () => void {
  const unsubFinish = useAppStore.persist.onFinishHydration(onChange);
  const unsubStart = useAppStore.persist.onHydrate(onChange);
  const unsubHealth = useStorageHealth.subscribe(onChange);
  return () => {
    unsubFinish();
    unsubStart();
    unsubHealth();
  };
}

/** True once saved progress has been read (or reading it failed and we carried on). */
export function hasHydrated(): boolean {
  return useAppStore.persist.hasHydrated() || useStorageHealth.getState().restoreFailed;
}

/** False on the server and until localStorage has been read on the client. */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, hasHydrated, () => false);
}
