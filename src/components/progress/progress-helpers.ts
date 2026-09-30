/**
 * Pure helpers behind the Progress page: the activity heatmap grid, human
 * labels for XP events, skill trends, and the JSON export and import.
 */
import { findLesson, findScenario, type Catalog } from "@/components/home/catalog";
import { LAB_TOOL_LINKS } from "@/components/home/lab-tools";
import { REVISION_PROGRESS_PREFIX } from "@/components/lab/revision-checklist";
import { sanitizePersisted, type SanitizeReport } from "@/lib/persisted-state";
import { toDateKey, type SkillStat } from "@/lib/progress";
import { STORAGE_KEY, initialData, type AppData } from "@/lib/store";
import type { LabToolId, XpEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Activity heatmap
// ---------------------------------------------------------------------------

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatDay {
  key: string;
  date: Date;
  active: boolean;
  xp: number;
  level: HeatLevel;
  /** After today — rendered as an empty slot. */
  future: boolean;
  isToday: boolean;
}

export interface Heatmap {
  /** Columns of seven days, Monday first; the last column contains today. */
  weeks: HeatDay[][];
  /** Month labels keyed by the column where each month first appears. */
  months: { column: number; label: string }[];
  activeDays: number;
  /** Days in the window up to and including today. */
  totalDays: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function heatLevel(active: boolean, xp: number): HeatLevel {
  if (!active && xp <= 0) return 0;
  if (xp < 50) return 1;
  if (xp < 100) return 2;
  if (xp < 180) return 3;
  return 4;
}

/** XP earned per local calendar day. */
export function xpByDay(xpLog: XpEvent[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const event of xpLog) {
    const at = new Date(event.at);
    if (Number.isNaN(at.getTime())) continue;
    const key = toDateKey(at);
    totals.set(key, (totals.get(key) ?? 0) + Math.max(0, event.amount));
  }
  return totals;
}

export function buildHeatmap(activityDates: string[], xpLog: XpEvent[], today: Date = new Date(), weeks = 12): Heatmap {
  const activeSet = new Set(activityDates);
  const totals = xpByDay(xpLog);
  const todayKey = toDateKey(today);
  const mondayOffset = (today.getDay() + 6) % 7;
  const startDay = today.getDate() - mondayOffset - (weeks - 1) * 7;

  const columns: HeatDay[][] = [];
  const months: Heatmap["months"] = [];
  let activeDays = 0;
  let totalDays = 0;
  let passedToday = false;

  for (let w = 0; w < weeks; w++) {
    const column: HeatDay[] = [];
    for (let d = 0; d < 7; d++) {
      // Local-calendar arithmetic: the Date constructor normalises overflowing days (DST-safe).
      const date = new Date(today.getFullYear(), today.getMonth(), startDay + w * 7 + d, 12);
      const key = toDateKey(date);
      const future = passedToday;
      const xp = totals.get(key) ?? 0;
      const active = !future && (activeSet.has(key) || xp > 0);
      if (!future) totalDays++;
      if (active) activeDays++;
      column.push({ key, date, active, xp, level: future ? 0 : heatLevel(active, xp), future, isToday: key === todayKey });
      if (key === todayKey) passedToday = true;
    }
    const month = column[0].date.getMonth();
    const previous = columns[columns.length - 1]?.[0].date.getMonth();
    if (w === 0 || month !== previous) months.push({ column: w, label: MONTHS[month] });
    columns.push(column);
  }
  // Drop a leading month label that would collide with the next one.
  if (months.length > 1 && months[1].column - months[0].column < 2) months.shift();

  return { weeks: columns, months, activeDays, totalDays };
}

// ---------------------------------------------------------------------------
// XP log
// ---------------------------------------------------------------------------

export type XpKind = "lesson" | "practice" | "lab" | "daily" | "other";

export interface XpReason {
  kind: XpKind;
  label: string;
}

function humanize(id: string): string {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : id;
}

/** Turn a stored reason ("Lesson: four-elements") into a readable label. */
export function describeXpReason(reason: string, catalog: Catalog): XpReason {
  const [prefix, ...rest] = reason.split(": ");
  const value = rest.join(": ").trim();
  switch (prefix) {
    case "Lesson":
      return { kind: "lesson", label: findLesson(catalog, value)?.title ?? humanize(value) };
    case "Practice":
      return { kind: "practice", label: findScenario(catalog, value)?.title ?? humanize(value) };
    case "Story Lab":
      return { kind: "lab", label: LAB_TOOL_LINKS[value as LabToolId]?.name ?? "Story Lab" };
    case "Daily challenge":
      return { kind: "daily", label: "Daily challenge" };
    default:
      return { kind: "other", label: reason };
  }
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export interface TrendInfo {
  direction: "up" | "down" | "flat" | "none";
  label: string;
  /** Screen-reader phrasing. */
  description: string;
}

export function trendInfo(stat: SkillStat): TrendInfo {
  if (stat.samples < 4) return { direction: "none", label: "—", description: "Not enough scores for a trend yet" };
  if (stat.trend >= 3) return { direction: "up", label: `+${stat.trend}`, description: `Up ${stat.trend} points recently` };
  if (stat.trend <= -3)
    return { direction: "down", label: `−${Math.abs(stat.trend)}`, description: `Down ${Math.abs(stat.trend)} points recently` };
  return { direction: "flat", label: "Steady", description: "Holding steady" };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ProgressExport {
  app: "OdysseusX";
  format: 1;
  exportedAt: string;
  data: AppData;
}

/** Copy only the persisted data fields (never store actions). */
export function pickAppData(state: AppData): AppData {
  return {
    profile: state.profile,
    lessonProgress: state.lessonProgress,
    sessions: state.sessions,
    labEntries: state.labEntries,
    daily: state.daily,
    xp: state.xp,
    xpLog: state.xpLog,
    activityDates: state.activityDates,
    settings: state.settings,
  };
}

export function buildExport(state: AppData, now: Date = new Date()): ProgressExport {
  return { app: "OdysseusX", format: 1, exportedAt: now.toISOString(), data: pickAppData(state) };
}

export function exportFileName(now: Date = new Date()): string {
  return `odysseusx-progress-${toDateKey(now)}.json`;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/** Bigger than any real export (the store caps its lists), small enough to parse safely. */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export interface ProgressSummary {
  name: string | null;
  xp: number;
  lessons: number;
  drills: number;
  labEntries: number;
  dailies: number;
}

export type ProgressImport =
  | {
      ok: true;
      /** Complete, validated data, ready to replace the store's. */
      data: AppData;
      exportedAt: string | null;
      summary: ProgressSummary;
      /** Records in the file that failed validation and were left out. */
      skipped: number;
    }
  | { ok: false; error: string };

export function summarizeProgress(data: AppData): ProgressSummary {
  return {
    name: data.profile?.name ?? null,
    xp: data.xp,
    lessons: Object.keys(data.lessonProgress).length,
    drills: data.sessions.filter((s) => s.evaluation).length,
    labEntries: data.labEntries.length,
    dailies: Object.values(data.daily).filter((d) => d.feedback).length,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Parse and validate a file made by `buildExport`. Every record goes through
 * the same validation as saved progress, so nothing malformed reaches the store.
 */
export function parseProgressImport(text: string): ProgressImport {
  const notOurs = "That file isn't an OdysseusX progress export. Choose a file saved with “Export progress”.";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON, so it can't be an OdysseusX export." };
  }
  if (!isRecord(parsed) || parsed.app !== "OdysseusX" || !isRecord(parsed.data)) return { ok: false, error: notOurs };
  if (parsed.format !== 1) {
    return typeof parsed.format === "number" && parsed.format > 1
      ? { ok: false, error: "This export comes from a newer version of OdysseusX. Update the app, then try again." }
      : { ok: false, error: notOurs };
  }

  const raw = parsed.data;
  // The report counts every record and nested item left out (top-level entries, skill scores, beats, shots…).
  const report: SanitizeReport = { dropped: 0, repaired: 0 };
  const clean = sanitizePersisted(raw, report);
  if (Object.keys(clean).length === 0) return { ok: false, error: "That export doesn't contain any progress this app can read." };

  const data: AppData = { ...initialData, ...clean };
  const skipped = report.dropped;
  const exportedAt = typeof parsed.exportedAt === "string" && !Number.isNaN(Date.parse(parsed.exportedAt)) ? parsed.exportedAt : null;
  return { ok: true, data, exportedAt, summary: summarizeProgress(data), skipped };
}

// ---------------------------------------------------------------------------
// Browser storage beyond the store
// ---------------------------------------------------------------------------

/** Every OdysseusX key in localStorage uses this prefix (the store, drafts, per-entry checklists…). */
export const APP_STORAGE_PREFIX = "odysseusx-";
const LAB_PLAN_PREFIX = REVISION_PROGRESS_PREFIX;

/**
 * The app's localStorage keys to remove alongside the store. Everything with
 * the app prefix except the store itself — which the store re-initialises —
 * or, with `keepLabEntryIds`, only per-entry keys whose entry no longer exists.
 */
export function orphanedStorageKeys(keys: readonly string[], keepLabEntryIds?: ReadonlySet<string>): string[] {
  return keys.filter((key) => {
    if (!key.startsWith(APP_STORAGE_PREFIX) || key === STORAGE_KEY) return false;
    if (!keepLabEntryIds) return true;
    return key.startsWith(LAB_PLAN_PREFIX) && !keepLabEntryIds.has(key.slice(LAB_PLAN_PREFIX.length));
  });
}

/** Remove `orphanedStorageKeys` from this browser's localStorage. Never throws. */
export function removeOrphanedStorage(keepLabEntryIds?: ReadonlySet<string>): void {
  try {
    const storage = window.localStorage;
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((k): k is string => k !== null);
    for (const key of orphanedStorageKeys(keys, keepLabEntryIds)) storage.removeItem(key);
  } catch {
    // Storage blocked: there is nothing stored to clean up.
  }
}
