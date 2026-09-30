/**
 * The persisted store: blocked/full/corrupt storage, cross-tab sync and
 * Story Lab XP rules. Runs in node with a fake `window.localStorage`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LoglineAnalysis } from "@/lib/types";
import {
  LAB_XP_DAILY_LIMIT,
  STORAGE_KEY,
  handleStorageEvent,
  hasHydrated,
  initialData,
  setBackingStorageForTests,
  useAppStore,
  useStorageHealth,
  type NewLabEntry,
} from "./store";

class FakeStorage {
  map = new Map<string, string>();
  failWrites: "quota" | null = null;
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrites === "quota") throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

let storage: FakeStorage;

async function hydrateWith(raw?: string) {
  if (raw !== undefined) storage.map.set(STORAGE_KEY, raw);
  await useAppStore.persist.rehydrate();
}

function stored(): { state: Record<string, unknown>; version: number } {
  return JSON.parse(storage.map.get(STORAGE_KEY) ?? "null");
}

const analysis: LoglineAnalysis = {
  overall: 70,
  verdict: "v",
  genreRead: "g",
  components: [{ key: "hook", score: 7, note: "" }],
  rewrites: [],
  questions: [],
};

function logline(input: string): NewLabEntry {
  return { tool: "logline", title: input.slice(0, 20), input, result: analysis, mode: "demo" };
}

beforeEach(async () => {
  storage = new FakeStorage();
  vi.stubGlobal("window", { localStorage: storage });
  setBackingStorageForTests(null);
  useStorageHealth.setState({ status: "ok", backupKey: null, restoreFailed: false });
  await hydrateWith();
  useAppStore.getState().resetProgress();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Story Lab entries", () => {
  it("replaces an identical resubmission, moves it to the top and awards no XP", () => {
    const { addLabEntry } = useAppStore.getState();
    const first = addLabEntry(logline("A sommelier must  win back her palate."));
    const other = addLabEntry(logline("A lighthouse keeper hides a stowaway."));
    const repeat = addLabEntry(logline("  A sommelier must win back her palate.\n"));

    expect(first).toMatchObject({ xpGained: 40, replaced: false });
    expect(other.xpGained).toBe(40);
    expect(repeat).toMatchObject({ xpGained: 0, replaced: true, id: first.id });
    const { labEntries, xp, xpLog } = useAppStore.getState();
    expect(labEntries.map((e) => e.id)).toEqual([first.id, other.id]);
    expect(xp).toBe(80);
    expect(xpLog).toHaveLength(2);
  });

  it("treats the same story under another framework as a new analysis", () => {
    const { addLabEntry } = useAppStore.getState();
    const base = { tool: "story" as const, title: "t", input: "x".repeat(100), mode: "demo" as const, result: {} as never };
    addLabEntry({ ...base, framework: "three-act" });
    const second = addLabEntry({ ...base, framework: "story-spine" });
    expect(second.replaced).toBe(false);
    expect(useAppStore.getState().labEntries).toHaveLength(2);
  });

  it(`caps Story Lab XP at ${LAB_XP_DAILY_LIMIT} analyses a day`, () => {
    const { addLabEntry } = useAppStore.getState();
    const gains = Array.from({ length: LAB_XP_DAILY_LIMIT + 2 }, (_, i) => addLabEntry(logline(`Logline number ${i}`)).xpGained);
    expect(gains.filter((g) => g > 0)).toHaveLength(LAB_XP_DAILY_LIMIT);
    expect(useAppStore.getState().labEntries).toHaveLength(LAB_XP_DAILY_LIMIT + 2);
  });
});

describe("storage failures", () => {
  it("keeps working in memory when the browser blocks storage", async () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new DOMException("Access is denied", "SecurityError");
      },
    });
    setBackingStorageForTests(null);
    await hydrateWith();
    expect(hasHydrated()).toBe(true);
    expect(useStorageHealth.getState().status).toBe("unavailable");
    expect(useAppStore.getState().completeLesson("foundations", "what-makes-a-story", 1)).toBe(75);
  });

  it("doesn't throw out of actions when the quota is full, and flags it", () => {
    const { startSession, addMessage } = useAppStore.getState();
    const id = startSession("studio-pitch", "Hello.");
    storage.failWrites = "quota";
    expect(() => addMessage(id, { role: "user", content: "My pitch" })).not.toThrow();
    expect(useAppStore.getState().sessions[0].messages).toHaveLength(2);
    expect(useStorageHealth.getState().status).toBe("quota");
    storage.failWrites = null;
    addMessage(id, { role: "user", content: "again" });
    expect(useStorageHealth.getState().status).toBe("ok");
  });

  it("finishes hydrating on corrupt JSON and keeps a copy of it", async () => {
    await hydrateWith("{not json");
    expect(hasHydrated()).toBe(true);
    expect(useAppStore.getState().profile).toBeNull();
    const { backupKey } = useStorageHealth.getState();
    expect(backupKey).toBeTruthy();
    expect(storage.map.get(backupKey!)).toBe("{not json");
  });

  it("drops invalid fields and records instead of crashing", async () => {
    await hydrateWith(
      JSON.stringify({
        version: 1,
        state: {
          profile: { name: "Ana", goal: "astronaut", experience: "advanced", createdAt: "2026-01-01T00:00:00.000Z" },
          sessions: null,
          settings: null,
          xp: "lots",
          labEntries: [{ id: "x", tool: "logline" }, { id: "ok", tool: "logline", createdAt: "2026-01-01", title: "t", input: "i", result: analysis, mode: "live" }],
          activityDates: ["2026-01-02", "garbage", "2026-01-01", "2026-01-02"],
          daily: { "2026-01-01": { promptId: "p", date: "2026-01-01", response: "r", feedback: { score: "?" } } },
        },
      }),
    );
    const state = useAppStore.getState();
    expect(state.profile).toMatchObject({ name: "Ana", goal: "writer", experience: "advanced" });
    expect(state.sessions).toEqual([]);
    expect(state.settings).toEqual(initialData.settings);
    expect(state.xp).toBe(0);
    expect(state.labEntries.map((e) => e.id)).toEqual(["ok"]);
    expect(state.activityDates).toEqual(["2026-01-01", "2026-01-02"]);
    expect(state.daily["2026-01-01"].feedback).toBeUndefined();
  });

  it("fills missing lists in older stored results instead of dropping them", async () => {
    await hydrateWith(
      JSON.stringify({
        version: 1,
        state: {
          sessions: [
            {
              id: "s1",
              scenarioId: "studio-pitch",
              startedAt: "2026-01-01T10:00:00Z",
              messages: [{ id: "m", role: "persona", content: "Hi", at: "2026-01-01T10:00:00Z" }, { id: "bad" }],
              evaluation: { overall: 70, headline: "h", skillScores: [{ skill: "hook", score: 70, comment: "" }, { skill: 3 }] },
            },
          ],
          labEntries: [{ id: "l1", tool: "logline", createdAt: "x", title: "t", input: "i", result: { overall: 60, components: [] } }],
        },
      }),
    );
    const [session] = useAppStore.getState().sessions;
    expect(session.messages).toHaveLength(1);
    expect(session.evaluation).toMatchObject({ overall: 70, strengths: [], improvements: [], summary: "", nextStep: { title: "", description: "" } });
    expect(session.evaluation?.skillScores).toHaveLength(1);
    const [entry] = useAppStore.getState().labEntries;
    expect(entry.tool === "logline" && entry.result.rewrites).toEqual([]);
  });

  it("migrates an older version instead of wiping it", async () => {
    await hydrateWith(JSON.stringify({ version: 0, state: { profile: { name: "Ana", goal: "founder", experience: "beginner", createdAt: "x" }, xp: 120 } }));
    expect(useAppStore.getState().profile?.name).toBe("Ana");
    expect(useAppStore.getState().xp).toBe(120);
    expect(stored().version).toBe(1);
  });
});

describe("cross-tab sync", () => {
  /** Simulate another tab: take what's stored, change it, write it back. */
  function otherTabWrites(change: (state: Record<string, unknown>) => void) {
    const value = stored();
    change(value.state);
    const raw = JSON.stringify(value);
    storage.map.set(STORAGE_KEY, raw);
    return raw;
  }

  it("re-reads storage before an action so another tab's work isn't overwritten", () => {
    useAppStore.getState().addLabEntry(logline("Tab A analysed this logline."));
    // Tab B, opened earlier, completed a lesson and saved.
    otherTabWrites((state) => {
      state.xp = (state.xp as number) + 50;
      state.lessonProgress = {
        "foundations/what-makes-a-story": { trackId: "foundations", lessonId: "what-makes-a-story", completedAt: "2026-09-30", quizScore: 1 },
      };
    });
    // Tab A acts again without having seen a storage event.
    useAppStore.getState().updateSettings({ autoSpeak: true });
    const state = stored().state as { labEntries: unknown[]; lessonProgress: Record<string, unknown>; xp: number; settings: { autoSpeak: boolean } };
    expect(state.labEntries).toHaveLength(1);
    expect(Object.keys(state.lessonProgress)).toEqual(["foundations/what-makes-a-story"]);
    expect(state.xp).toBe(90);
    expect(state.settings.autoSpeak).toBe(true);
  });

  it("rehydrates on a storage event for our key", () => {
    const raw = otherTabWrites((state) => {
      state.xp = 999;
    });
    handleStorageEvent({ key: "something-else", newValue: "x" });
    expect(useAppStore.getState().xp).toBe(0);
    handleStorageEvent({ key: STORAGE_KEY, newValue: raw });
    expect(useAppStore.getState().xp).toBe(999);
  });
});
