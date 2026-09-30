/**
 * Zod schemas for everything the coach returns and every API request body.
 *
 * The output schemas double as Claude structured-output formats (see
 * `generateStructured` in ./client.ts and `outputJsonSchema` in
 * ./structured.ts), so keep them to features structured outputs support:
 * every field required, no numeric min/max (clamp in code with
 * `normalize*` helpers instead), enums for closed sets. Output enums carry
 * repair hints (`repairable`) so a near-miss or off-vocabulary value from
 * the model is mapped, defaulted or dropped instead of failing the result.
 */
import { z } from "zod";
import { enumRepairs, type EnumRepair } from "@/lib/ai/structured";
import { SKILL_IDS } from "@/lib/skills";
import { FRAMEWORK_IDS } from "@/lib/frameworks";
import { CAMERA_ANGLES, CAMERA_MOVEMENTS, SHOT_FRAMINGS, SHOT_SIZES } from "@/lib/film";
import {
  BEAT_STATUSES,
  EXPERIENCE_LEVELS,
  GOAL_IDS,
  LOGLINE_COMPONENTS,
  STORY_FORMATS,
} from "@/lib/constants";

// Re-exported for server code; client code should import these from
// "@/lib/constants" to avoid bundling zod.
export {
  BEAT_STATUSES,
  EXPERIENCE_LEVELS,
  GOAL_IDS,
  LOGLINE_COMPONENTS,
  STORY_FORMATS,
} from "@/lib/constants";
export type {
  BeatStatus,
  ExperienceLevel,
  GoalId,
  LoglineComponent,
  StoryFormat,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

/** Register repair hints on an output enum (see ./structured.ts). */
function repairable<T extends z.ZodEnum>(schema: T, hints: EnumRepair): T {
  enumRepairs.add(schema as z.ZodEnum, hints);
  return schema;
}

/** Skill ids in model output. No fallback: a score for an unknown skill is dropped. */
const SkillIdSchema = repairable(z.enum(SKILL_IDS), {
  aliases: {
    opening: "hook",
    characterization: "character",
    characterisation: "character",
    tension: "conflict",
    stakes: "conflict",
    opposition: "conflict",
    dialog: "dialogue",
    imagery: "visual",
    pace: "pacing",
    rhythm: "pacing",
    timing: "pacing",
    plot: "structure",
    voice: "delivery",
    presence: "delivery",
    performance: "delivery",
    presentation: "delivery",
  },
});

export const SkillScoreSchema = z.object({
  skill: SkillIdSchema,
  /** 0–100 */
  score: z.number(),
  comment: z.string(),
});
export type SkillScore = z.infer<typeof SkillScoreSchema>;

export const ImprovementSchema = z.object({
  title: z.string(),
  detail: z.string(),
  /** A concrete rewrite or line the user could have said. Empty string if none. */
  example: z.string(),
});
export type Improvement = z.infer<typeof ImprovementSchema>;

// ---------------------------------------------------------------------------
// Practice drill evaluation (roleplay scorecard)
// ---------------------------------------------------------------------------

export const EvaluationSchema = z.object({
  /** 0–100 */
  overall: z.number(),
  /** One-line verdict, e.g. "Strong hook, but the stakes stayed abstract." */
  headline: z.string(),
  summary: z.string(),
  skillScores: z.array(SkillScoreSchema),
  strengths: z.array(z.string()),
  improvements: z.array(ImprovementSchema),
  /** The user's single best line or moment, quoted. Empty string if none. */
  bestMoment: z.string(),
  nextStep: z.object({ title: z.string(), description: z.string() }),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

// ---------------------------------------------------------------------------
// Story Lab: logline doctor
// ---------------------------------------------------------------------------

export const LoglineAnalysisSchema = z.object({
  /** 0–100 */
  overall: z.number(),
  verdict: z.string(),
  /** How the logline reads: implied genre, tone and audience. */
  genreRead: z.string(),
  components: z.array(
    z.object({
      key: repairable(z.enum(LOGLINE_COMPONENTS), {
        aliases: {
          hero: "protagonist",
          character: "protagonist",
          objective: "goal",
          want: "goal",
          desire: "goal",
          antagonist: "obstacle",
          antagonism: "obstacle",
          conflict: "obstacle",
          opposition: "obstacle",
          consequence: "stakes",
          consequences: "stakes",
          irony: "hook",
          concept: "hook",
          premise: "hook",
          specific: "specificity",
          detail: "specificity",
          details: "specificity",
        },
      }),
      /** 0–10 */
      score: z.number(),
      note: z.string(),
    }),
  ),
  rewrites: z.array(z.object({ angle: z.string(), logline: z.string() })),
  questions: z.array(z.string()),
});
export type LoglineAnalysis = z.infer<typeof LoglineAnalysisSchema>;

// ---------------------------------------------------------------------------
// Story Lab: story / scene / treatment analysis
// ---------------------------------------------------------------------------

export const StoryAnalysisSchema = z.object({
  /** 0–100 */
  overall: z.number(),
  headline: z.string(),
  summary: z.string(),
  framework: z.enum(FRAMEWORK_IDS),
  beats: z.array(
    z.object({
      beat: z.string(),
      status: repairable(z.enum(BEAT_STATUSES), {
        fallback: "present",
        aliases: {
          solid: "strong",
          excellent: "strong",
          adequate: "present",
          ok: "present",
          okay: "present",
          implied: "present",
          partial: "weak",
          "partially present": "weak",
          underdeveloped: "weak",
          thin: "weak",
          absent: "missing",
          none: "missing",
          "not present": "missing",
        },
      }),
      evidence: z.string(),
      suggestion: z.string(),
    }),
  ),
  skillScores: z.array(SkillScoreSchema),
  strengths: z.array(z.string()),
  improvements: z.array(ImprovementSchema),
  lineNotes: z.array(z.object({ quote: z.string(), note: z.string() })),
  revisionPlan: z.array(z.string()),
});
export type StoryAnalysis = z.infer<typeof StoryAnalysisSchema>;

// ---------------------------------------------------------------------------
// Story Lab: shot planner
// ---------------------------------------------------------------------------

export const ShotSchema = z.object({
  number: z.number(),
  size: repairable(z.enum(SHOT_SIZES), {
    fallback: "medium",
    aliases: {
      ews: "extreme-wide",
      els: "extreme-wide",
      "extreme long": "extreme-wide",
      ws: "wide",
      ls: "wide",
      long: "wide",
      fs: "full",
      "full body": "full",
      mws: "medium-wide",
      mls: "medium-wide",
      "medium long": "medium-wide",
      cowboy: "medium-wide",
      american: "medium-wide",
      ms: "medium",
      mid: "medium",
      mcu: "medium-close-up",
      cu: "close-up",
      ecu: "extreme-close-up",
      xcu: "extreme-close-up",
      detail: "extreme-close-up",
      macro: "extreme-close-up",
    },
  }),
  framing: repairable(z.enum(SHOT_FRAMINGS), {
    fallback: "single",
    aliases: {
      ots: "over-the-shoulder",
      "point of view": "pov",
      "2 shot": "two-shot",
      "three shot": "group",
      cutaway: "insert",
      master: "establishing",
    },
  }),
  angle: repairable(z.enum(CAMERA_ANGLES), {
    fallback: "eye-level",
    aliases: {
      "bird eye": "birds-eye",
      aerial: "birds-eye",
      "worm eye": "worms-eye",
      canted: "dutch",
      tilted: "dutch",
      oblique: "dutch",
      "top down": "overhead",
      "top shot": "overhead",
      neutral: "eye-level",
      "shoulder level": "eye-level",
    },
  }),
  movement: repairable(z.enum(CAMERA_MOVEMENTS), {
    fallback: "static",
    aliases: {
      "dolly in": "push-in",
      push: "push-in",
      "dolly out": "pull-out",
      "pull back": "pull-out",
      dolly: "tracking",
      truck: "tracking",
      track: "tracking",
      follow: "tracking",
      jib: "crane",
      boom: "crane",
      gimbal: "steadicam",
      locked: "static",
      "locked off": "static",
      fixed: "static",
      still: "static",
      none: "static",
    },
  }),
  /** e.g. "35mm", "85mm portrait", "wide 18mm". */
  lens: z.string(),
  subject: z.string(),
  action: z.string(),
  /** Why this shot exists — the storytelling job it does. */
  purpose: z.string(),
  /** Sound idea for the shot. Empty string if none. */
  sound: z.string(),
});
export type Shot = z.infer<typeof ShotSchema>;

export const ShotPlanSchema = z.object({
  sceneSummary: z.string(),
  emotionalIntent: z.string(),
  visualConcept: z.string(),
  shots: z.array(ShotSchema),
  coverageNotes: z.array(z.string()),
  /** Notes on the user's own shot ideas; empty array when they gave none. */
  feedbackOnUserShots: z.array(z.object({ shot: z.string(), note: z.string() })),
});
export type ShotPlan = z.infer<typeof ShotPlanSchema>;

// ---------------------------------------------------------------------------
// Daily challenge micro-feedback
// ---------------------------------------------------------------------------

export const MicroFeedbackSchema = z.object({
  /** 0–100 */
  score: z.number(),
  praise: z.string(),
  nudge: z.string(),
  tryThis: z.string(),
  skill: SkillIdSchema,
});
export type MicroFeedback = z.infer<typeof MicroFeedbackSchema>;

// ---------------------------------------------------------------------------
// Request bodies (validated in route handlers)
// ---------------------------------------------------------------------------

/** The slice of the user's profile sent to the server to personalise coaching. */
export const CoachProfileSchema = z.object({
  name: z.string().max(80),
  goal: z.enum(GOAL_IDS),
  experience: z.enum(EXPERIENCE_LEVELS),
});
export type CoachProfile = z.infer<typeof CoachProfileSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "persona"]),
  content: z.string().max(8000),
});
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;

export const CoachChatRequestSchema = z.object({
  scenarioId: z.string().max(100),
  messages: z.array(ChatMessageSchema).max(80),
  profile: CoachProfileSchema.optional(),
});
export type CoachChatRequest = z.infer<typeof CoachChatRequestSchema>;

export const CoachEvaluateRequestSchema = CoachChatRequestSchema;
export type CoachEvaluateRequest = CoachChatRequest;

export const LoglineRequestSchema = z.object({
  logline: z.string().trim().min(10).max(1200),
  genre: z.string().max(80).optional(),
  profile: CoachProfileSchema.optional(),
});
export type LoglineRequest = z.infer<typeof LoglineRequestSchema>;

export const StoryRequestSchema = z.object({
  title: z.string().max(200).optional(),
  text: z.string().trim().min(80).max(30000),
  framework: z.enum(FRAMEWORK_IDS),
  format: z.enum(STORY_FORMATS),
  profile: CoachProfileSchema.optional(),
});
export type StoryRequest = z.infer<typeof StoryRequestSchema>;

export const ShotsRequestSchema = z.object({
  scene: z.string().trim().min(40).max(12000),
  intent: z.string().max(1000).optional(),
  userShots: z.string().max(4000).optional(),
  profile: CoachProfileSchema.optional(),
});
export type ShotsRequest = z.infer<typeof ShotsRequestSchema>;

export const DailyFeedbackRequestSchema = z.object({
  promptId: z.string().max(100),
  response: z.string().trim().min(10).max(4000),
  profile: CoachProfileSchema.optional(),
});
export type DailyFeedbackRequest = z.infer<typeof DailyFeedbackRequestSchema>;

// ---------------------------------------------------------------------------
// Normalisation — clamp model output into the ranges the UI expects.
// ---------------------------------------------------------------------------

export function clampScore(value: number, max = 100): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(max, Math.max(0, value)));
}

function normalizeSkillScores(scores: SkillScore[]): SkillScore[] {
  const seen = new Set<string>();
  return scores
    .filter((s) => (seen.has(s.skill) ? false : (seen.add(s.skill), true)))
    .map((s) => ({ ...s, score: clampScore(s.score) }));
}

export function normalizeEvaluation(e: Evaluation): Evaluation {
  return { ...e, overall: clampScore(e.overall), skillScores: normalizeSkillScores(e.skillScores) };
}

export function normalizeLogline(a: LoglineAnalysis): LoglineAnalysis {
  return {
    ...a,
    overall: clampScore(a.overall),
    components: a.components.map((c) => ({ ...c, score: clampScore(c.score, 10) })),
  };
}

export function normalizeStory(a: StoryAnalysis): StoryAnalysis {
  return { ...a, overall: clampScore(a.overall), skillScores: normalizeSkillScores(a.skillScores) };
}

export function normalizeShotPlan(p: ShotPlan): ShotPlan {
  return { ...p, shots: p.shots.map((s, i) => ({ ...s, number: i + 1 })) };
}

export function normalizeMicro(f: MicroFeedback): MicroFeedback {
  return { ...f, score: clampScore(f.score) };
}
