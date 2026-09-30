/**
 * Pure helpers behind the Progress page: the activity heatmap grid, human
 * labels for XP events, skill trends and the JSON export.
 */
import { findLesson, findScenario, type Catalog } from "@/components/home/catalog";
import { LAB_TOOL_LINKS } from "@/components/home/lab-tools";
import { toDateKey, type SkillStat } from "@/lib/progress";
import type { AppData } from "@/lib/store";
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
