/**
 * Server-side helper: the first lesson that trains each skill, so the
 * scorecard can recommend one without shipping the whole curriculum to the
 * browser.
 */
import { ALL_LESSONS, getTrack } from "@/content/tracks";
import { SKILL_IDS, type SkillId } from "@/lib/skills";

export interface LessonPick {
  trackId: string;
  lessonId: string;
  trackTitle: string;
  title: string;
  summary: string;
  minutes: number;
}

export type LessonPicks = Partial<Record<SkillId, LessonPick>>;

export function lessonPicksBySkill(): LessonPicks {
  const picks: LessonPicks = {};
  for (const skill of SKILL_IDS) {
    const lesson = ALL_LESSONS.find((l) => l.skills.includes(skill));
    if (!lesson) continue;
    picks[skill] = {
      trackId: lesson.trackId,
      lessonId: lesson.id,
      trackTitle: getTrack(lesson.trackId)?.title ?? "",
      title: lesson.title,
      summary: lesson.summary,
      minutes: lesson.minutes,
    };
  }
  return picks;
}
