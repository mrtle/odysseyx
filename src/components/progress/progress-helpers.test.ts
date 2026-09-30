import { describe, expect, it } from "vitest";
import { fixtureCatalog, fixtureState } from "@/components/home/test-fixtures";
import { labEntryScore, labEntrySummary } from "@/components/home/lab-tools";
import { toDateKey, type SkillStat } from "@/lib/progress";
import type { LabEntry } from "@/lib/types";
import {
  buildExport,
  buildHeatmap,
  describeXpReason,
  exportFileName,
  heatLevel,
  pickAppData,
  trendInfo,
  xpByDay,
} from "./progress-helpers";

const key = (y: number, m: number, d: number) => toDateKey(new Date(y, m - 1, d, 12));

describe("buildHeatmap", () => {
  const today = new Date(2026, 8, 30, 15, 0); // Wednesday 30 Sep 2026

  it("lays out 12 Monday-first weeks ending with the current week", () => {
    const heatmap = buildHeatmap([], [], today, 12);
    expect(heatmap.weeks).toHaveLength(12);
    for (const week of heatmap.weeks) {
      expect(week).toHaveLength(7);
      expect(week[0].date.getDay()).toBe(1); // Monday
    }
    const last = heatmap.weeks[11];
    expect(last.find((d) => d.isToday)?.key).toBe("2026-09-30");
    // Thursday to Sunday of this week are in the future.
    expect(last.map((d) => d.future)).toEqual([false, false, false, true, true, true, true]);
    expect(heatmap.totalDays).toBe(11 * 7 + 3);
  });

  it("produces consecutive calendar days across DST and month changes", () => {
    const heatmap = buildHeatmap([], [], new Date(2026, 10, 4, 9), 12); // spans the Oct/Nov DST switch in many zones
    const keys = heatmap.weeks.flat().map((d) => d.key);
    expect(new Set(keys).size).toBe(84);
    for (let i = 1; i < keys.length; i++) {
      const prev = new Date(`${keys[i - 1]}T12:00:00`);
      const next = new Date(`${keys[i]}T12:00:00`);
      expect(Math.round((next.getTime() - prev.getTime()) / 86_400_000)).toBe(1);
    }
  });

  it("marks active days and grades intensity by XP", () => {
    const heatmap = buildHeatmap(
      [key(2026, 9, 28), key(2026, 9, 29), key(2026, 9, 30)],
      [
        { at: new Date(2026, 8, 29, 10).toISOString(), amount: 60, reason: "Practice: studio-pitch" },
        { at: new Date(2026, 8, 29, 18).toISOString(), amount: 75, reason: "Lesson: four-elements" },
        { at: new Date(2026, 8, 30, 9).toISOString(), amount: 30, reason: "Daily challenge" },
      ],
      today,
    );
    const days = new Map(heatmap.weeks.flat().map((d) => [d.key, d]));
    expect(days.get("2026-09-28")).toMatchObject({ active: true, xp: 0, level: 1 });
    expect(days.get("2026-09-29")).toMatchObject({ active: true, xp: 135, level: 3 });
    expect(days.get("2026-09-30")).toMatchObject({ active: true, xp: 30, level: 1 });
    expect(days.get("2026-09-27")).toMatchObject({ active: false, level: 0 });
    expect(heatmap.activeDays).toBe(3);
  });

  it("ignores activity outside the window and in the future", () => {
    const heatmap = buildHeatmap([key(2026, 1, 1), key(2026, 10, 2)], [], today);
    expect(heatmap.activeDays).toBe(0);
  });

  it("labels each month once, at the column where it starts", () => {
    const heatmap = buildHeatmap([], [], today);
    const labels = heatmap.months.map((m) => m.label);
    expect(labels).toEqual(expect.arrayContaining(["Aug", "Sep"]));
    expect(new Set(labels).size).toBe(labels.length);
    const columns = heatmap.months.map((m) => m.column);
    expect([...columns].sort((a, b) => a - b)).toEqual(columns);
  });

  it("grades levels from XP", () => {
    expect(heatLevel(false, 0)).toBe(0);
    expect(heatLevel(true, 0)).toBe(1);
    expect(heatLevel(true, 49)).toBe(1);
    expect(heatLevel(true, 50)).toBe(2);
    expect(heatLevel(true, 100)).toBe(3);
    expect(heatLevel(true, 180)).toBe(4);
    expect(heatLevel(false, 40)).toBe(1);
  });

  it("totals XP per local day, skipping bad timestamps", () => {
    const totals = xpByDay([
      { at: new Date(2026, 8, 30, 1).toISOString(), amount: 10, reason: "x" },
      { at: new Date(2026, 8, 30, 23).toISOString(), amount: 15, reason: "x" },
      { at: "not a date", amount: 99, reason: "x" },
    ]);
    expect(totals.get("2026-09-30")).toBe(25);
    expect(totals.size).toBe(1);
  });
});

describe("describeXpReason", () => {
  it("labels every kind of XP event", () => {
    expect(describeXpReason("Lesson: four-elements", fixtureCatalog)).toEqual({ kind: "lesson", label: "The Four Elements" });
    expect(describeXpReason("Practice: studio-pitch", fixtureCatalog)).toEqual({ kind: "practice", label: "The Studio Pitch" });
    expect(describeXpReason("Story Lab: shots", fixtureCatalog)).toEqual({ kind: "lab", label: "Shot Planner" });
    expect(describeXpReason("Daily challenge", fixtureCatalog)).toEqual({ kind: "daily", label: "Daily challenge" });
    expect(describeXpReason("Streak bonus", fixtureCatalog)).toEqual({ kind: "other", label: "Streak bonus" });
  });

  it("humanises ids it can't find", () => {
    expect(describeXpReason("Lesson: retired-lesson", fixtureCatalog).label).toBe("Retired lesson");
    expect(describeXpReason("Practice: old-drill", fixtureCatalog).label).toBe("Old drill");
    expect(describeXpReason("Story Lab: mystery", fixtureCatalog).label).toBe("Story Lab");
  });
});

describe("trendInfo", () => {
  const stat = (samples: number, trend: number): SkillStat => ({ skill: "hook", score: 60, samples, trend });

  it("needs four samples before calling a trend", () => {
    expect(trendInfo(stat(3, 20)).direction).toBe("none");
  });

  it("reads rising, falling and steady trends", () => {
    expect(trendInfo(stat(6, 12))).toMatchObject({ direction: "up", label: "+12" });
    expect(trendInfo(stat(6, -7))).toMatchObject({ direction: "down", label: "−7" });
    expect(trendInfo(stat(6, 2))).toMatchObject({ direction: "flat", label: "Steady" });
  });
});

describe("export", () => {
  it("includes only persisted data, never actions", () => {
    const state = { ...fixtureState(), completeLesson: () => 0 } as ReturnType<typeof fixtureState>;
    const data = pickAppData(state);
    expect(Object.keys(data).sort()).toEqual(
      ["activityDates", "daily", "labEntries", "lessonProgress", "profile", "sessions", "settings", "xp", "xpLog"].sort(),
    );
    const exported = buildExport(state, new Date("2026-09-30T08:00:00.000Z"));
    expect(exported).toMatchObject({ app: "OdysseusX", format: 1, exportedAt: "2026-09-30T08:00:00.000Z" });
    expect(JSON.parse(JSON.stringify(exported)).data.profile.name).toBe("Penelope Ithaca");
  });

  it("names the file by local date", () => {
    expect(exportFileName(new Date(2026, 8, 30, 23, 59))).toBe("odysseusx-progress-2026-09-30.json");
  });
});

describe("lab entry summaries", () => {
  it("scores loglines and stories, counts shots", () => {
    const shots: LabEntry = {
      id: "s",
      tool: "shots",
      createdAt: "2026-09-30T10:00:00.000Z",
      title: "Scene",
      input: "x",
      mode: "demo",
      result: { sceneSummary: "", emotionalIntent: "", visualConcept: "", shots: [], coverageNotes: [], feedbackOnUserShots: [] },
    };
    expect(labEntryScore(shots)).toBeNull();
    expect(labEntrySummary(shots)).toBe("0 shots");
    const logline = fixtureState().labEntries[0];
    expect(labEntryScore(logline)).toBe(68);
  });
});
