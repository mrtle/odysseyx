/**
 * The OdysseusX curriculum: seven tracks from story fundamentals to
 * cinematography, editing and the pitch room.
 */
import type { Lesson, Track, TrackId } from "@/lib/types";
import type { SkillId } from "@/lib/skills";
import { foundationsLessons } from "./lessons/foundations";
import { structureLessons } from "./lessons/structure";
import { characterLessons } from "./lessons/character";
import { sceneDialogueLessons } from "./lessons/scene-dialogue";
import { visualLessons } from "./lessons/visual";
import { editingSoundLessons } from "./lessons/editing-sound";
import { pitchDeliveryLessons } from "./lessons/pitch-delivery";

export const TRACKS: Track[] = [
  {
    id: "foundations",
    title: "Story Foundations",
    subtitle: "What makes a story a story",
    description:
      "Desire, obstacle, stakes and change — the four elements every story needs, plus how to hook an audience in the first few seconds.",
    icon: "compass",
    accent: "from-bronze-300 to-bronze-600",
    skills: ["hook", "conflict", "character"],
    lessons: foundationsLessons,
  },
  {
    id: "structure",
    title: "Structure & Plot",
    subtitle: "Charting the voyage",
    description:
      "Three acts, the Hero's Journey, Save the Cat, the Story Circle and Kishōtenketsu — the maps storytellers use, and when to use which.",
    icon: "map",
    accent: "from-aegean-300 to-aegean-500",
    skills: ["structure", "pacing"],
    lessons: structureLessons,
  },
  {
    id: "character",
    title: "Character",
    subtitle: "Want, need, wound, change",
    description:
      "Build protagonists who drive the story with their choices, antagonists worth fearing, and arcs that land emotionally.",
    icon: "users",
    accent: "from-wine-400 to-wine-600",
    skills: ["character", "conflict"],
    lessons: characterLessons,
  },
  {
    id: "scene-dialogue",
    title: "Scenes & Dialogue",
    subtitle: "Where story actually happens",
    description:
      "Scene goals, turning points, entering late and leaving early — and dialogue that crackles with subtext instead of exposition.",
    icon: "message-square",
    accent: "from-violet-300 to-violet-600",
    skills: ["dialogue", "pacing", "conflict"],
    lessons: sceneDialogueLessons,
  },
  {
    id: "visual",
    title: "Visual Storytelling",
    subtitle: "The camera as narrator",
    description:
      "Shot sizes, angles, composition, camera movement, lenses, light and colour — the grammar of cinema and the emotions each choice creates.",
    icon: "camera",
    accent: "from-sky-300 to-sky-600",
    skills: ["visual"],
    lessons: visualLessons,
  },
  {
    id: "editing-sound",
    title: "Editing & Sound",
    subtitle: "Story is rewritten in the cut",
    description:
      "The Kuleshov effect, continuity and match cuts, rhythm and pacing, J and L cuts, sound design and score — how meaning is made between shots.",
    icon: "scissors",
    accent: "from-emerald-300 to-emerald-600",
    skills: ["pacing", "visual"],
    lessons: editingSoundLessons,
  },
  {
    id: "pitch-delivery",
    title: "Pitch & Delivery",
    subtitle: "Telling it out loud",
    description:
      "Loglines, the elevator pitch, the pitch meeting, and oral storytelling — voice, pauses and presence when the story leaves the page.",
    icon: "mic",
    accent: "from-orange-300 to-orange-600",
    skills: ["delivery", "hook"],
    lessons: pitchDeliveryLessons,
  },
];

export function getTrack(trackId: string): Track | undefined {
  return TRACKS.find((t) => t.id === trackId);
}

export function getLesson(trackId: string, lessonId: string): Lesson | undefined {
  return getTrack(trackId)?.lessons.find((l) => l.id === lessonId);
}

export const ALL_LESSONS: Lesson[] = TRACKS.flatMap((t) => t.lessons);

/** "trackId/lessonId" → the lesson's skills, for the skill profile. */
export const LESSON_SKILLS: Record<string, SkillId[]> = Object.fromEntries(
  ALL_LESSONS.map((l) => [`${l.trackId}/${l.id}`, l.skills]),
);

/** The lesson after this one (continuing into the next track), if any. */
export function getNextLesson(trackId: TrackId, lessonId: string): Lesson | undefined {
  const index = ALL_LESSONS.findIndex((l) => l.trackId === trackId && l.id === lessonId);
  return index >= 0 ? ALL_LESSONS[index + 1] : undefined;
}
