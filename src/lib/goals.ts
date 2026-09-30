/**
 * Learner goals and experience levels: the labels and copy shown in
 * onboarding, plus the skills each goal leans on (used to steer
 * recommendations toward what matters for that kind of storyteller).
 *
 * Pure data — safe for server and client.
 */
import { EXPERIENCE_LEVELS, GOAL_IDS, type ExperienceLevel, type GoalId } from "@/lib/constants";
import type { SkillId } from "@/lib/skills";

/** lucide-react icon names (kebab-case) — mapped to components in the UI. */
export type GoalIconName = "clapperboard" | "pen-line" | "video" | "rocket" | "mic" | "feather";

export interface GoalDefinition {
  id: GoalId;
  label: string;
  /** One line, second person, shown on the goal card. */
  description: string;
  icon: GoalIconName;
  /** The skills this kind of storyteller needs most, most important first. */
  preferredSkills: SkillId[];
}

export const GOALS: Record<GoalId, GoalDefinition> = {
  filmmaker: {
    id: "filmmaker",
    label: "Filmmaker",
    description: "Direct shorts and features that say it in pictures, not paragraphs.",
    icon: "clapperboard",
    preferredSkills: ["visual", "structure", "pacing"],
  },
  screenwriter: {
    id: "screenwriter",
    label: "Screenwriter",
    description: "Write scripts with airtight structure, living characters and dialogue that crackles.",
    icon: "pen-line",
    preferredSkills: ["structure", "character", "dialogue"],
  },
  creator: {
    id: "creator",
    label: "Video creator",
    description: "Hook viewers in three seconds and keep them to the last frame.",
    icon: "video",
    preferredSkills: ["hook", "pacing", "delivery"],
  },
  founder: {
    id: "founder",
    label: "Founder",
    description: "Tell the origin story that makes investors, hires and customers lean in.",
    icon: "rocket",
    preferredSkills: ["delivery", "hook", "conflict"],
  },
  speaker: {
    id: "speaker",
    label: "Speaker",
    description: "Hold a room — keynotes, toasts and talks that people retell afterwards.",
    icon: "mic",
    preferredSkills: ["delivery", "hook", "structure"],
  },
  writer: {
    id: "writer",
    label: "Writer",
    description: "Fiction and personal essays with characters and images that stay with readers.",
    icon: "feather",
    preferredSkills: ["character", "dialogue", "visual"],
  },
};

export const GOAL_LIST: GoalDefinition[] = GOAL_IDS.map((id) => GOALS[id]);

export function isGoalId(value: unknown): value is GoalId {
  return typeof value === "string" && (GOAL_IDS as readonly string[]).includes(value);
}

/** Preferred skills for a goal, tolerating a missing or stale profile value. */
export function preferredSkillsFor(goal: string | null | undefined): SkillId[] {
  return isGoalId(goal) ? GOALS[goal].preferredSkills : [];
}

export interface ExperienceDefinition {
  id: ExperienceLevel;
  label: string;
  description: string;
}

export const EXPERIENCES: Record<ExperienceLevel, ExperienceDefinition> = {
  beginner: {
    id: "beginner",
    label: "Setting out",
    description: "New to story craft. You want the fundamentals, explained plainly.",
  },
  intermediate: {
    id: "intermediate",
    label: "Finding my sea legs",
    description: "You've made or written a few things and want sharper tools and honest notes.",
  },
  advanced: {
    id: "advanced",
    label: "Seasoned voyager",
    description: "You work at a professional level. Skip the basics and hold you to industry standard.",
  },
};

export const EXPERIENCE_LIST: ExperienceDefinition[] = EXPERIENCE_LEVELS.map((id) => EXPERIENCES[id]);

export function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return typeof value === "string" && (EXPERIENCE_LEVELS as readonly string[]).includes(value);
}
