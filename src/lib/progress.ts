/**
 * Pure progress logic: XP and ranks, streaks, the skill profile and "what
 * should I do next" recommendations. No React, no storage — easy to test.
 */
import { SKILL_IDS, type SkillId } from "@/lib/skills";
import type {
  DailyEntry,
  LabEntry,
  Lesson,
  LessonProgress,
  PracticeSession,
  Scenario,
  SkillObservation,
  Track,
} from "@/lib/types";
import type { LoglineComponent } from "@/lib/ai/schemas";

// ---------------------------------------------------------------------------
// XP and ranks
// ---------------------------------------------------------------------------

export const XP_REWARDS = {
  lessonComplete: 50,
  quizPerfectBonus: 25,
  practiceBase: 60,
  /** Added on top of practiceBase: overall score × this factor. */
  practiceScoreFactor: 0.6,
  labAnalysis: 40,
  daily: 30,
} as const;

export interface Rank {
  level: number;
  title: string;
  minXp: number;
}

/** The voyage from deckhand to Odysseus. */
export const RANKS: Rank[] = [
  { level: 1, title: "Deckhand", minXp: 0 },
  { level: 2, title: "Oarsman", minXp: 150 },
  { level: 3, title: "Helmsman", minXp: 400 },
  { level: 4, title: "Navigator", minXp: 800 },
  { level: 5, title: "Captain", minXp: 1400 },
  { level: 6, title: "Bard", minXp: 2200 },
  { level: 7, title: "Epic Poet", minXp: 3300 },
  { level: 8, title: "Odysseus", minXp: 4800 },
];

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  xp: number;
  /** XP earned inside the current rank. */
  xpIntoRank: number;
  /** XP needed to go from this rank to the next (0 at max rank). */
  xpForNext: number;
  /** 0–1 progress toward the next rank (1 at max rank). */
  progress: number;
}

export function rankForXp(xp: number): RankProgress {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (safeXp >= RANKS[i].minXp) index = i;
  }
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const xpIntoRank = safeXp - rank.minXp;
  const xpForNext = next ? next.minXp - rank.minXp : 0;
  return {
    rank,
    next,
    xp: safeXp,
    xpIntoRank,
    xpForNext,
    progress: next ? Math.min(1, xpIntoRank / xpForNext) : 1,
  };
}

export function practiceXp(overall: number): number {
  const clamped = Math.max(0, Math.min(100, overall));
  return Math.round(XP_REWARDS.practiceBase + clamped * XP_REWARDS.practiceScoreFactor);
}

export function lessonXp(quizScore: number): number {
  return XP_REWARDS.lessonComplete + (quizScore >= 1 ? XP_REWARDS.quizPerfectBonus : 0);
}

// ---------------------------------------------------------------------------
// Dates and streaks
// ---------------------------------------------------------------------------

/** Local-time calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateKeyToUtcDay(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export interface StreakInfo {
  current: number;
  longest: number;
  activeToday: boolean;
}

/**
 * The current streak counts consecutive active days ending today — or
 * yesterday, so a streak isn't "lost" before the user has had a chance to
 * practise today.
 */
export function computeStreak(activityDates: string[], today: Date = new Date()): StreakInfo {
  const days = Array.from(new Set(activityDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))))
    .map(dateKeyToUtcDay)
    .sort((a, b) => a - b);
  if (days.length === 0) return { current: 0, longest: 0, activeToday: false };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayDay = dateKeyToUtcDay(toDateKey(today));
  const last = days[days.length - 1];
  const activeToday = last === todayDay;
  let current = 0;
  if (last === todayDay || last === todayDay - 1) {
    current = 1;
    for (let i = days.length - 1; i > 0 && days[i] === days[i - 1] + 1; i--) current++;
  }
  return { current, longest, activeToday };
}

// ---------------------------------------------------------------------------
// Skill profile
// ---------------------------------------------------------------------------

/** How logline components feed the skill profile. */
export const LOGLINE_SKILL_MAP: Record<LoglineComponent, SkillId> = {
  protagonist: "character",
  goal: "character",
  obstacle: "conflict",
  stakes: "conflict",
  hook: "hook",
  specificity: "hook",
};

export interface ProgressSnapshot {
  sessions: PracticeSession[];
  labEntries: LabEntry[];
  lessonProgress: Record<string, LessonProgress>;
  daily: Record<string, DailyEntry>;
}

/**
 * Flatten everything the user has done into per-skill observations (0–100).
 * `lessonSkills` maps "trackId/lessonId" to the lesson's skills so quiz
 * results can count toward them.
 */
export function collectSkillObservations(
  snapshot: ProgressSnapshot,
  lessonSkills: Record<string, SkillId[]> = {},
): SkillObservation[] {
  const out: SkillObservation[] = [];

  for (const session of snapshot.sessions) {
    const evaluation = session.evaluation;
    if (!evaluation) continue;
    const at = session.endedAt ?? session.startedAt;
    for (const s of evaluation.skillScores) {
      out.push({ skill: s.skill, score: s.score, at, source: "practice" });
    }
  }

  for (const entry of snapshot.labEntries) {
    if (entry.tool === "story") {
      for (const s of entry.result.skillScores) {
        out.push({ skill: s.skill, score: s.score, at: entry.createdAt, source: "lab" });
      }
    } else if (entry.tool === "logline") {
      for (const c of entry.result.components) {
        out.push({ skill: LOGLINE_SKILL_MAP[c.key], score: c.score * 10, at: entry.createdAt, source: "lab" });
      }
    }
  }

  for (const [key, progress] of Object.entries(snapshot.lessonProgress)) {
    for (const skill of lessonSkills[key] ?? []) {
      out.push({ skill, score: Math.round(progress.quizScore * 100), at: progress.completedAt, source: "quiz" });
    }
  }

  for (const entry of Object.values(snapshot.daily)) {
    if (!entry.feedback) continue;
    out.push({ skill: entry.feedback.skill, score: entry.feedback.score, at: `${entry.date}T12:00:00`, source: "daily" });
  }

  return out;
}

export interface SkillStat {
  skill: SkillId;
  /** Recency-weighted average 0–100, or null with no observations. */
  score: number | null;
  samples: number;
  /** Mean of the latest 3 observations minus the mean of the 3 before them (0 when too few). */
  trend: number;
}

/** Source weights: live practice and lab analysis count more than quizzes. */
const SOURCE_WEIGHT: Record<SkillObservation["source"], number> = {
  practice: 1,
  lab: 1,
  daily: 0.6,
  quiz: 0.35,
};

const HALF_LIFE_DAYS = 21;

export function computeSkillProfile(
  observations: SkillObservation[],
  now: Date = new Date(),
): Record<SkillId, SkillStat> {
  const result = {} as Record<SkillId, SkillStat>;
  for (const skill of SKILL_IDS) {
    const obs = observations
      .filter((o) => o.skill === skill && Number.isFinite(o.score))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    if (obs.length === 0) {
      result[skill] = { skill, score: null, samples: 0, trend: 0 };
      continue;
    }
    let weighted = 0;
    let total = 0;
    for (const o of obs) {
      const ageDays = Math.max(0, (now.getTime() - new Date(o.at).getTime()) / 86_400_000);
      const w = SOURCE_WEIGHT[o.source] * Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
      weighted += Math.max(0, Math.min(100, o.score)) * w;
      total += w;
    }
    const mean = (xs: SkillObservation[]) => xs.reduce((sum, o) => sum + o.score, 0) / xs.length;
    const recent = obs.slice(-3);
    const before = obs.slice(-6, -3);
    result[skill] = {
      skill,
      score: total > 0 ? Math.round(weighted / total) : null,
      samples: obs.length,
      trend: before.length > 0 ? Math.round(mean(recent) - mean(before)) : 0,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export interface Recommendation {
  focusSkill: SkillId;
  reason: string;
  lesson: Lesson | null;
  scenario: Scenario | null;
}

/**
 * Pick the skill to work on next (lowest measured score; unmeasured skills
 * first so new users sample everything) and suggest the next unfinished
 * lesson and a drill that train it.
 */
export function recommendNext(
  profile: Record<SkillId, SkillStat>,
  tracks: Track[],
  scenarios: Scenario[],
  lessonProgress: Record<string, LessonProgress>,
  preferredSkills: SkillId[] = [],
): Recommendation {
  const stats = SKILL_IDS.map((id) => profile[id]);
  const unmeasured = stats.filter((s) => s.score === null);
  let focus: SkillStat;
  let reason: string;
  if (unmeasured.length > 0) {
    focus = unmeasured.find((s) => preferredSkills.includes(s.skill)) ?? unmeasured[0];
    reason = "You haven't been scored on this yet — let's get a baseline.";
  } else {
    focus = stats.reduce((lowest, s) => ((s.score ?? 0) < (lowest.score ?? 0) ? s : lowest));
    reason = `This is your lowest-scoring skill right now (${focus.score}/100).`;
  }

  const lessons = tracks.flatMap((t) => t.lessons);
  const lesson =
    lessons.find((l) => l.skills.includes(focus.skill) && !lessonProgress[`${l.trackId}/${l.id}`]) ??
    lessons.find((l) => !lessonProgress[`${l.trackId}/${l.id}`]) ??
    null;
  const scenario =
    scenarios
      .filter((s) => s.skills.includes(focus.skill))
      .sort((a, b) => a.difficulty - b.difficulty)[0] ?? null;

  return { focusSkill: focus.skill, reason, lesson, scenario };
}

export function lessonKey(trackId: string, lessonId: string): string {
  return `${trackId}/${lessonId}`;
}
