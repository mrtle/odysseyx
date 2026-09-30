/**
 * The pure progress logic behind XP, ranks, streaks, the skill profile and
 * "what next" recommendations.
 */
import { describe, expect, it } from "vitest";
import type { Evaluation, LoglineAnalysis, ShotPlan, StoryAnalysis } from "@/lib/ai/schemas";
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
  TrackId,
} from "@/lib/types";
import {
  LOGLINE_SKILL_MAP,
  RANKS,
  XP_REWARDS,
  collectSkillObservations,
  computeSkillProfile,
  computeStreak,
  lessonKey,
  lessonXp,
  practiceXp,
  rankForXp,
  recommendNext,
  sessionActivityAt,
  sortSessionsByActivity,
  toDateKey,
  type ProgressSnapshot,
  type SkillStat,
} from "./progress";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DAY = 86_400_000;
const NOW = new Date("2026-09-30T12:00:00.000Z");
const daysAgo = (n: number, from: Date = NOW) => new Date(from.getTime() - n * DAY).toISOString();

/** Local-calendar date key `n` days before `from` (DST-safe: steps by calendar day). */
function keyDaysBefore(from: Date, n: number): string {
  return toDateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() - n, 12));
}

function evaluation(scores: Partial<Record<SkillId, number>>, overall = 70): Evaluation {
  return {
    overall,
    headline: "h",
    summary: "s",
    skillScores: Object.entries(scores).map(([skill, score]) => ({ skill: skill as SkillId, score: score!, comment: "" })),
    strengths: [],
    improvements: [],
    bestMoment: "",
    nextStep: { title: "t", description: "d" },
  };
}

function session(id: string, opts: Partial<PracticeSession> = {}): PracticeSession {
  return { id, scenarioId: "studio-pitch", startedAt: daysAgo(1), messages: [], ...opts };
}

function loglineEntry(createdAt: string, components: LoglineAnalysis["components"]): LabEntry {
  return {
    id: `l-${createdAt}`,
    tool: "logline",
    createdAt,
    title: "Logline",
    input: "x",
    mode: "demo",
    result: { overall: 60, verdict: "v", genreRead: "g", components, rewrites: [], questions: [] },
  };
}

function storyEntry(createdAt: string, scores: Partial<Record<SkillId, number>>): LabEntry {
  const result: StoryAnalysis = {
    overall: 60,
    headline: "h",
    summary: "s",
    framework: "three-act",
    beats: [],
    skillScores: Object.entries(scores).map(([skill, score]) => ({ skill: skill as SkillId, score: score!, comment: "" })),
    strengths: [],
    improvements: [],
    lineNotes: [],
    revisionPlan: [],
  };
  return {
    id: `s-${createdAt}`,
    tool: "story",
    createdAt,
    title: "Story",
    input: "x",
    framework: "three-act",
    mode: "live",
    result,
  };
}

function shotsEntry(createdAt: string): LabEntry {
  const result: ShotPlan = {
    sceneSummary: "s",
    emotionalIntent: "e",
    visualConcept: "v",
    shots: [],
    coverageNotes: [],
    feedbackOnUserShots: [],
  };
  return { id: `p-${createdAt}`, tool: "shots", createdAt, title: "Shots", input: "x", mode: "demo", result };
}

const emptySnapshot: ProgressSnapshot = { sessions: [], labEntries: [], lessonProgress: {}, daily: {} };

function obs(skill: SkillId, score: number, at: string, source: SkillObservation["source"] = "practice"): SkillObservation {
  return { skill, score, at, source };
}

function lesson(trackId: TrackId, id: string, skills: SkillId[]): Lesson {
  return {
    id,
    trackId,
    title: id,
    summary: "",
    minutes: 10,
    level: "beginner",
    skills,
    blocks: [],
    keyTakeaways: [],
    quiz: [],
    exercise: { prompt: "", tips: [] },
  };
}

function track(id: TrackId, lessons: Lesson[]): Track {
  return { id, title: id, subtitle: "", description: "", icon: "compass", accent: "", skills: [], lessons };
}

function scenario(id: string, skills: SkillId[], difficulty: 1 | 2 | 3): Scenario {
  return {
    id,
    title: id,
    category: "pitch",
    tagline: "",
    description: "",
    difficulty,
    minutes: 5,
    skills,
    persona: { name: "P", role: "R", bio: "", avatar: "P" },
    userRole: "",
    objective: "",
    openingLine: "",
    personaBrief: "",
    rubric: [],
    suggestedTurns: 5,
    tips: [],
  };
}

/** A full profile with every skill measured at `base`, overridden per skill. */
function measuredProfile(base: number, overrides: Partial<Record<SkillId, number | null>> = {}): Record<SkillId, SkillStat> {
  return Object.fromEntries(
    SKILL_IDS.map((skill) => {
      const score = skill in overrides ? overrides[skill]! : base;
      return [skill, { skill, score, samples: score === null ? 0 : 3, trend: 0 }];
    }),
  ) as Record<SkillId, SkillStat>;
}

const TRACKS: Track[] = [
  track("foundations", [lesson("foundations", "four-elements", ["hook", "conflict"]), lesson("foundations", "hooks", ["hook"])]),
  track("visual", [lesson("visual", "shot-sizes", ["visual"]), lesson("visual", "light", ["visual", "pacing"])]),
  track("pitch-delivery", [lesson("pitch-delivery", "elevator", ["delivery", "hook"])]),
];

const SCENARIOS: Scenario[] = [
  scenario("studio-pitch", ["hook", "structure", "conflict", "delivery"], 2),
  scenario("elevator-pitch", ["hook", "delivery"], 1),
  scenario("dp-shot-planning", ["visual", "pacing"], 3),
];

const done = (trackId: TrackId, lessonId: string, quizScore = 1): [string, LessonProgress] => [
  lessonKey(trackId, lessonId),
  { trackId, lessonId, completedAt: daysAgo(2), quizScore },
];

// ---------------------------------------------------------------------------
// XP and ranks
// ---------------------------------------------------------------------------

describe("RANKS", () => {
  it("climbs from Deckhand at 0 XP to Odysseus, strictly increasing", () => {
    expect(RANKS[0]).toMatchObject({ level: 1, title: "Deckhand", minXp: 0 });
    expect(RANKS[RANKS.length - 1].title).toBe("Odysseus");
    RANKS.forEach((rank, i) => {
      expect(rank.level).toBe(i + 1);
      if (i > 0) expect(rank.minXp).toBeGreaterThan(RANKS[i - 1].minXp);
    });
  });
});

describe("rankForXp", () => {
  it("starts at Deckhand with no progress", () => {
    expect(rankForXp(0)).toEqual({ rank: RANKS[0], next: RANKS[1], xp: 0, xpIntoRank: 0, xpForNext: 150, progress: 0 });
  });

  it("promotes exactly at each rank's threshold", () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(rankForXp(RANKS[i].minXp - 1).rank.level, `just below ${RANKS[i].title}`).toBe(i);
      expect(rankForXp(RANKS[i].minXp).rank.level, `at ${RANKS[i].title}`).toBe(i + 1);
    }
  });

  it("reports XP into the rank and progress toward the next", () => {
    const r = rankForXp(275); // Oarsman: 150 → 400
    expect(r.rank.title).toBe("Oarsman");
    expect(r.next?.title).toBe("Helmsman");
    expect(r.xpIntoRank).toBe(125);
    expect(r.xpForNext).toBe(250);
    expect(r.progress).toBeCloseTo(0.5);
  });

  it("caps at the max rank with full progress and no next rank", () => {
    const max = RANKS[RANKS.length - 1];
    for (const xp of [max.minXp, max.minXp + 1, 1_000_000]) {
      const r = rankForXp(xp);
      expect(r.rank).toBe(max);
      expect(r.next).toBeNull();
      expect(r.xpForNext).toBe(0);
      expect(r.progress).toBe(1);
      expect(r.xpIntoRank).toBe(xp - max.minXp);
    }
  });

  it("sanitises negative, fractional and non-finite XP", () => {
    expect(rankForXp(-50)).toMatchObject({ xp: 0, rank: RANKS[0] });
    expect(rankForXp(149.9)).toMatchObject({ xp: 149, rank: RANKS[0] });
    expect(rankForXp(Number.NaN)).toMatchObject({ xp: 0, rank: RANKS[0] });
    expect(rankForXp(Number.POSITIVE_INFINITY)).toMatchObject({ xp: 0, rank: RANKS[0] });
  });
});

describe("practiceXp / lessonXp", () => {
  it("pays a base plus a share of the overall score", () => {
    expect(practiceXp(0)).toBe(XP_REWARDS.practiceBase);
    expect(practiceXp(50)).toBe(90);
    expect(practiceXp(100)).toBe(120);
    expect(practiceXp(73)).toBe(Math.round(60 + 73 * 0.6));
  });

  it("clamps out-of-range scores", () => {
    expect(practiceXp(-20)).toBe(60);
    expect(practiceXp(250)).toBe(120);
  });

  // Robustness gap (reported as a foundation request): NaN slips through the
  // clamp, so a malformed evaluation would add NaN to the learner's XP total.
  it("treats a NaN score as 0", () => {
    expect(practiceXp(Number.NaN)).toBe(60);
  });

  it("adds the perfect-quiz bonus only for a perfect quiz", () => {
    expect(lessonXp(1)).toBe(XP_REWARDS.lessonComplete + XP_REWARDS.quizPerfectBonus);
    expect(lessonXp(0.99)).toBe(XP_REWARDS.lessonComplete);
    expect(lessonXp(0)).toBe(XP_REWARDS.lessonComplete);
  });
});

// ---------------------------------------------------------------------------
// Dates and streaks
// ---------------------------------------------------------------------------

describe("toDateKey / lessonKey", () => {
  it("formats the local calendar date with zero padding", () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(toDateKey(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  it("joins track and lesson ids", () => {
    expect(lessonKey("foundations", "four-elements")).toBe("foundations/four-elements");
  });
});

describe("computeStreak", () => {
  const today = new Date(2026, 8, 30, 15, 0); // 30 Sep 2026, local
  const k = (n: number) => keyDaysBefore(today, n);

  it("is zero with no activity", () => {
    expect(computeStreak([], today)).toEqual({ current: 0, longest: 0, activeToday: false });
  });

  it("counts today alone as a one-day streak", () => {
    expect(computeStreak([k(0)], today)).toEqual({ current: 1, longest: 1, activeToday: true });
  });

  it("keeps a streak alive when the last activity was yesterday", () => {
    expect(computeStreak([k(1)], today)).toEqual({ current: 1, longest: 1, activeToday: false });
    expect(computeStreak([k(3), k(2), k(1)], today)).toEqual({ current: 3, longest: 3, activeToday: false });
  });

  it("breaks the current streak after a missed day, but remembers the longest", () => {
    expect(computeStreak([k(2)], today)).toEqual({ current: 0, longest: 1, activeToday: false });
    expect(computeStreak([k(9), k(8), k(7), k(6), k(5), k(2)], today)).toEqual({ current: 0, longest: 5, activeToday: false });
  });

  it("counts only the run that reaches today", () => {
    expect(computeStreak([k(6), k(5), k(4), k(3), k(1), k(0)], today)).toEqual({ current: 2, longest: 4, activeToday: true });
    expect(computeStreak([k(4), k(2), k(1), k(0)], today)).toEqual({ current: 3, longest: 3, activeToday: true });
  });

  it("ignores duplicates and input order", () => {
    expect(computeStreak([k(0), k(1), k(0), k(2), k(1)], today)).toEqual({ current: 3, longest: 3, activeToday: true });
    expect(computeStreak([k(0), k(2), k(1)], today)).toEqual(computeStreak([k(2), k(1), k(0)], today));
  });

  it("ignores malformed dates", () => {
    expect(computeStreak(["garbage", "2026-9-30", "", k(0)], today)).toEqual({ current: 1, longest: 1, activeToday: true });
    expect(computeStreak(["nope"], today)).toEqual({ current: 0, longest: 0, activeToday: false });
  });

  it("runs across month, year and leap-day boundaries", () => {
    expect(computeStreak(["2026-01-30", "2026-01-31", "2026-02-01"], new Date(2026, 1, 1, 9)).current).toBe(3);
    expect(computeStreak(["2025-12-30", "2025-12-31", "2026-01-01"], new Date(2026, 0, 1, 9)).current).toBe(3);
    expect(computeStreak(["2028-02-28", "2028-02-29", "2028-03-01"], new Date(2028, 2, 1, 9)).current).toBe(3);
    // 2026 is not a leap year: 28 Feb → 1 Mar is consecutive.
    expect(computeStreak(["2026-02-28", "2026-03-01"], new Date(2026, 2, 1, 9)).current).toBe(2);
    // …but in 2028 it skips the 29th.
    expect(computeStreak(["2028-02-28", "2028-03-01"], new Date(2028, 2, 1, 9)).current).toBe(1);
  });

  it("uses the local calendar day for 'today' regardless of the hour", () => {
    const dates = [k(1), k(0)];
    expect(computeStreak(dates, new Date(2026, 8, 30, 0, 1)).activeToday).toBe(true);
    expect(computeStreak(dates, new Date(2026, 8, 30, 23, 59)).activeToday).toBe(true);
    // The next morning, the streak is still alive but not yet extended.
    expect(computeStreak(dates, new Date(2026, 9, 1, 8, 0))).toEqual({ current: 2, longest: 2, activeToday: false });
  });
});

// ---------------------------------------------------------------------------
// Skill observations
// ---------------------------------------------------------------------------

describe("collectSkillObservations", () => {
  it("returns nothing for a fresh learner", () => {
    expect(collectSkillObservations(emptySnapshot)).toEqual([]);
  });

  it("reads practice scorecards, skipping unscored sessions", () => {
    const ended = daysAgo(1);
    const snapshot: ProgressSnapshot = {
      ...emptySnapshot,
      sessions: [
        session("a", { endedAt: ended, evaluation: evaluation({ hook: 80, delivery: 60 }) }),
        session("b"), // abandoned
      ],
    };
    expect(collectSkillObservations(snapshot)).toEqual([
      { skill: "hook", score: 80, at: ended, source: "practice" },
      { skill: "delivery", score: 60, at: ended, source: "practice" },
    ]);
  });

  it("falls back to the start time when a scored session has no end time", () => {
    const started = daysAgo(3);
    const snapshot = {
      ...emptySnapshot,
      sessions: [session("a", { startedAt: started, evaluation: evaluation({ pacing: 40 }) })],
    };
    expect(collectSkillObservations(snapshot)[0].at).toBe(started);
  });

  it("reads story analyses' skill scores", () => {
    const at = daysAgo(2);
    const snapshot = { ...emptySnapshot, labEntries: [storyEntry(at, { structure: 72, character: 55 })] };
    expect(collectSkillObservations(snapshot)).toEqual([
      { skill: "structure", score: 72, at, source: "lab" },
      { skill: "character", score: 55, at, source: "lab" },
    ]);
  });

  it("maps logline components onto skills, scaling 0–10 to 0–100", () => {
    const at = daysAgo(2);
    const components: LoglineAnalysis["components"] = [
      { key: "protagonist", score: 7, note: "" },
      { key: "goal", score: 6, note: "" },
      { key: "obstacle", score: 5, note: "" },
      { key: "stakes", score: 4, note: "" },
      { key: "hook", score: 9, note: "" },
      { key: "specificity", score: 8, note: "" },
    ];
    const result = collectSkillObservations({ ...emptySnapshot, labEntries: [loglineEntry(at, components)] });
    expect(result).toEqual(components.map((c) => ({ skill: LOGLINE_SKILL_MAP[c.key], score: c.score * 10, at, source: "lab" })));
    expect(result.map((o) => o.skill)).toEqual(["character", "character", "conflict", "conflict", "hook", "hook"]);
  });

  it("contributes nothing from shot plans", () => {
    expect(collectSkillObservations({ ...emptySnapshot, labEntries: [shotsEntry(daysAgo(1))] })).toEqual([]);
  });

  it("turns quiz scores into observations for the lesson's skills", () => {
    const [key, progress] = done("foundations", "four-elements", 0.667);
    const snapshot = { ...emptySnapshot, lessonProgress: { [key]: progress } };
    expect(collectSkillObservations(snapshot, { [key]: ["hook", "conflict"] })).toEqual([
      { skill: "hook", score: 67, at: progress.completedAt, source: "quiz" },
      { skill: "conflict", score: 67, at: progress.completedAt, source: "quiz" },
    ]);
    // Without the lesson → skills map, quizzes can't count toward anything.
    expect(collectSkillObservations(snapshot)).toEqual([]);
  });

  it("reads daily feedback at noon on its date, skipping entries without feedback", () => {
    const daily: Record<string, DailyEntry> = {
      "2026-09-29": {
        promptId: "six-word-story",
        date: "2026-09-29",
        response: "Baby shoes for sale, never worn.",
        feedback: { score: 77, praise: "", nudge: "", tryThis: "", skill: "hook" },
      },
      "2026-09-30": { promptId: "lost-key", date: "2026-09-30", response: "…" },
    };
    expect(collectSkillObservations({ ...emptySnapshot, daily })).toEqual([
      { skill: "hook", score: 77, at: "2026-09-29T12:00:00", source: "daily" },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Skill profile
// ---------------------------------------------------------------------------

describe("computeSkillProfile", () => {
  it("covers all eight skills, unmeasured ones as null", () => {
    const profile = computeSkillProfile([], NOW);
    expect(Object.keys(profile).sort()).toEqual([...SKILL_IDS].sort());
    for (const skill of SKILL_IDS) expect(profile[skill]).toEqual({ skill, score: null, samples: 0, trend: 0 });
  });

  it("uses a single observation as-is", () => {
    expect(computeSkillProfile([obs("hook", 64, daysAgo(0))], NOW).hook).toEqual({
      skill: "hook",
      score: 64,
      samples: 1,
      trend: 0,
    });
  });

  it("weights live practice and lab work above daily challenges and quizzes", () => {
    const at = daysAgo(0);
    // (80×1 + 20×0.35) / 1.35 = 64.4
    expect(computeSkillProfile([obs("hook", 80, at, "practice"), obs("hook", 20, at, "quiz")], NOW).hook.score).toBe(64);
    // (80×1 + 20×0.6) / 1.6 = 57.5 → 58
    expect(computeSkillProfile([obs("hook", 80, at, "lab"), obs("hook", 20, at, "daily")], NOW).hook.score).toBe(58);
  });

  it("halves an observation's weight every 21 days", () => {
    // (100×0.5 + 40×1) / 1.5 = 60
    const profile = computeSkillProfile([obs("visual", 100, daysAgo(21)), obs("visual", 40, daysAgo(0))], NOW);
    expect(profile.visual.score).toBe(60);
    // Much older work barely counts.
    const ancient = computeSkillProfile([obs("visual", 100, daysAgo(210)), obs("visual", 40, daysAgo(0))], NOW);
    expect(ancient.visual.score).toBe(40);
  });

  it("treats future-dated observations as brand new", () => {
    const profile = computeSkillProfile([obs("pacing", 90, daysAgo(-5)), obs("pacing", 30, daysAgo(0))], NOW);
    expect(profile.pacing.score).toBe(60);
  });

  it("clamps scores into 0–100 and ignores non-finite ones", () => {
    const at = daysAgo(0);
    expect(computeSkillProfile([obs("dialogue", 140, at), obs("dialogue", -20, at)], NOW).dialogue.score).toBe(50);
    const profile = computeSkillProfile([obs("dialogue", Number.NaN, at), obs("dialogue", 70, at)], NOW);
    expect(profile.dialogue).toMatchObject({ score: 70, samples: 1 });
  });

  it("measures trend as the latest three against the three before, by date not input order", () => {
    const scores = [40, 40, 40, 70, 70, 70];
    const observations = scores.map((score, i) => obs("structure", score, daysAgo(6 - i))).reverse();
    expect(computeSkillProfile(observations, NOW).structure.trend).toBe(30);

    const falling = [80, 80, 80, 50, 50, 50].map((score, i) => obs("structure", score, daysAgo(6 - i)));
    expect(computeSkillProfile(falling, NOW).structure.trend).toBe(-30);
  });

  it("compares against fewer than three earlier observations when that's all there is", () => {
    const four = [50, 60, 70, 80].map((score, i) => obs("character", score, daysAgo(4 - i)));
    expect(computeSkillProfile(four, NOW).character.trend).toBe(20); // mean(60,70,80) − 50
  });

  it("reports no trend with three or fewer observations", () => {
    const three = [20, 50, 90].map((score, i) => obs("conflict", score, daysAgo(3 - i)));
    expect(computeSkillProfile(three, NOW).conflict).toMatchObject({ samples: 3, trend: 0 });
  });

  it("keeps skills independent", () => {
    const profile = computeSkillProfile([obs("hook", 90, daysAgo(0)), obs("delivery", 30, daysAgo(0))], NOW);
    expect(profile.hook.score).toBe(90);
    expect(profile.delivery.score).toBe(30);
    expect(profile.visual.score).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

describe("recommendNext", () => {
  const allUnmeasured = computeSkillProfile([], NOW);

  it("starts a new learner on the first unmeasured skill to get a baseline", () => {
    const rec = recommendNext(allUnmeasured, TRACKS, SCENARIOS, {});
    expect(rec.focusSkill).toBe("hook");
    expect(rec.reason).toMatch(/baseline/);
    expect(rec.lesson?.id).toBe("four-elements");
    expect(rec.scenario?.id).toBe("elevator-pitch"); // easiest drill that trains hook
  });

  it("prefers an unmeasured skill the learner's goal cares about", () => {
    const rec = recommendNext(allUnmeasured, TRACKS, SCENARIOS, {}, ["visual"]);
    expect(rec.focusSkill).toBe("visual");
    expect(rec.lesson?.id).toBe("shot-sizes");
    expect(rec.scenario?.id).toBe("dp-shot-planning");

    const preferred: SkillId[] = ["pacing", "visual"];
    expect(preferred).toContain(recommendNext(allUnmeasured, TRACKS, SCENARIOS, {}, preferred).focusSkill);
  });

  // Reported as a foundation request: preferred skills are scanned in SKILL_IDS
  // order, so a goal's priority order is lost (a filmmaker's ["visual",
  // "structure", "pacing"] yields "structure"). Home works around it in
  // `recommendFromCatalog` by passing only the top-priority unmeasured skill.
  it("respects the priority order of preferred skills", () => {
    expect(recommendNext(allUnmeasured, TRACKS, SCENARIOS, {}, ["pacing", "visual"]).focusSkill).toBe("pacing");
  });

  it("falls back to the first unmeasured skill when every preferred skill is measured", () => {
    const profile = measuredProfile(60, { delivery: null, hook: 90, conflict: 10 });
    expect(recommendNext(profile, TRACKS, SCENARIOS, {}, ["hook", "conflict"]).focusSkill).toBe("delivery");
  });

  it("samples unmeasured skills before drilling a weak measured one", () => {
    const profile = measuredProfile(70, { conflict: 5, pacing: null });
    expect(recommendNext(profile, TRACKS, SCENARIOS, {}).focusSkill).toBe("pacing");
  });

  it("targets the lowest-scoring skill once everything is measured", () => {
    const profile = measuredProfile(70, { delivery: 42, visual: 55 });
    const rec = recommendNext(profile, TRACKS, SCENARIOS, {}, ["visual"]);
    expect(rec.focusSkill).toBe("delivery");
    expect(rec.reason).toBe("This is your lowest-scoring skill right now (42/100).");
    expect(rec.lesson?.id).toBe("elevator");
    expect(rec.scenario?.id).toBe("elevator-pitch");
  });

  it("breaks ties by skill order", () => {
    const profile = measuredProfile(70, { character: 30, dialogue: 30 });
    expect(recommendNext(profile, TRACKS, SCENARIOS, {}).focusSkill).toBe("character");
  });

  it("skips lessons already completed", () => {
    const progress = Object.fromEntries([done("foundations", "four-elements")]);
    expect(recommendNext(allUnmeasured, TRACKS, SCENARIOS, progress).lesson?.id).toBe("hooks");
  });

  it("falls back to any unfinished lesson when every lesson for the skill is done", () => {
    const progress = Object.fromEntries([
      done("foundations", "four-elements"),
      done("foundations", "hooks"),
      done("pitch-delivery", "elevator"),
    ]);
    const rec = recommendNext(allUnmeasured, TRACKS, SCENARIOS, progress);
    expect(rec.focusSkill).toBe("hook");
    expect(rec.lesson?.id).toBe("shot-sizes");
  });

  it("returns no lesson when the curriculum is finished or empty", () => {
    const everything = Object.fromEntries(TRACKS.flatMap((t) => t.lessons.map((l) => done(t.id, l.id))));
    expect(recommendNext(allUnmeasured, TRACKS, SCENARIOS, everything).lesson).toBeNull();
    expect(recommendNext(allUnmeasured, [], SCENARIOS, {}).lesson).toBeNull();
    expect(recommendNext(allUnmeasured, [track("structure", [])], SCENARIOS, {}).lesson).toBeNull();
  });

  it("returns no drill when none trains the focus skill", () => {
    const rec = recommendNext(measuredProfile(80, { dialogue: 20 }), TRACKS, SCENARIOS, {});
    expect(rec.focusSkill).toBe("dialogue");
    expect(rec.scenario).toBeNull();
    expect(recommendNext(allUnmeasured, TRACKS, [], {}).scenario).toBeNull();
  });

  it("does not reorder the caller's scenario list", () => {
    const list = [...SCENARIOS];
    recommendNext(allUnmeasured, TRACKS, list, {});
    expect(list.map((s) => s.id)).toEqual(SCENARIOS.map((s) => s.id));
  });

  it("works end to end from raw activity", () => {
    const ended = daysAgo(1);
    const snapshot: ProgressSnapshot = {
      ...emptySnapshot,
      sessions: [
        session("a", {
          endedAt: ended,
          evaluation: evaluation({
            hook: 80,
            structure: 75,
            character: 70,
            conflict: 72,
            dialogue: 66,
            visual: 30,
            pacing: 60,
            delivery: 78,
          }),
        }),
      ],
    };
    const profile = computeSkillProfile(collectSkillObservations(snapshot), NOW);
    const rec = recommendNext(profile, TRACKS, SCENARIOS, {});
    expect(rec.focusSkill).toBe("visual");
    expect(rec.reason).toContain("30/100");
    expect(rec.lesson?.id).toBe("shot-sizes");
  });
});

describe("session recency", () => {
  const base = { messages: [] as { id: string; role: "user" | "persona"; content: string; at: string }[] };
  const scored = { ...base, id: "a", startedAt: "2026-09-30T10:00:00Z", endedAt: "2026-09-30T10:20:00Z" };
  const unfinished = {
    id: "b",
    startedAt: "2026-09-30T10:05:00Z",
    messages: [{ id: "m", role: "user" as const, content: "hi", at: "2026-09-30T10:06:00Z" }],
  };
  const untouched = { ...base, id: "c", startedAt: "2026-09-30T10:10:00Z" };

  it("uses the score time, else the last message, else the start", () => {
    expect(sessionActivityAt(scored)).toBe("2026-09-30T10:20:00Z");
    expect(sessionActivityAt(unfinished)).toBe("2026-09-30T10:06:00Z");
    expect(sessionActivityAt(untouched)).toBe("2026-09-30T10:10:00Z");
  });

  it("puts the session just scored first", () => {
    expect(sortSessionsByActivity([untouched, unfinished, scored]).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });
});
