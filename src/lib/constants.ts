/**
 * Closed vocabularies shared by client and server. Kept free of zod so that
 * client bundles can import them without pulling in the schema library —
 * `@/lib/ai/schemas` builds its zod enums from these.
 */
export const GOAL_IDS = ["filmmaker", "screenwriter", "creator", "founder", "speaker", "writer"] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const STORY_FORMATS = [
  "personal-story",
  "short-film",
  "feature",
  "tv-episode",
  "scene",
  "pitch",
  "brand-story",
] as const;
export type StoryFormat = (typeof STORY_FORMATS)[number];

export const LOGLINE_COMPONENTS = ["protagonist", "goal", "obstacle", "stakes", "hook", "specificity"] as const;
export type LoglineComponent = (typeof LOGLINE_COMPONENTS)[number];

export const BEAT_STATUSES = ["strong", "present", "weak", "missing"] as const;
export type BeatStatus = (typeof BEAT_STATUSES)[number];
