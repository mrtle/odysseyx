/**
 * A slim, serialisable view of the curriculum and practice catalogue for
 * client islands on Home and Progress.
 *
 * Server pages build it (`buildCatalog`) so the browser never downloads full
 * lesson bodies or the personas' hidden direction; the client adapts it back
 * into the shapes `recommendNext` expects (`recommendFromCatalog`).
 */
import { recommendNext, type SkillStat } from "@/lib/progress";
import type { SkillId } from "@/lib/skills";
import type { ExperienceLevel, Lesson, LessonProgress, Scenario, ScenarioCategory, Track, TrackIcon, TrackId } from "@/lib/types";

export interface CatalogLesson {
  id: string;
  trackId: TrackId;
  title: string;
  summary: string;
  minutes: number;
  level: ExperienceLevel;
  skills: SkillId[];
}

export interface CatalogTrack {
  id: TrackId;
  title: string;
  subtitle: string;
  icon: TrackIcon;
  accent: string;
  lessons: CatalogLesson[];
}

export interface CatalogScenario {
  id: string;
  title: string;
  tagline: string;
  category: ScenarioCategory;
  difficulty: 1 | 2 | 3;
  minutes: number;
  skills: SkillId[];
  persona: { name: string; role: string; avatar: string };
}

export interface Catalog {
  tracks: CatalogTrack[];
  scenarios: CatalogScenario[];
  /** "trackId/lessonId" → the lesson's skills, for quiz observations. */
  lessonSkills: Record<string, SkillId[]>;
}

export function buildCatalog(tracks: Track[], scenarios: Scenario[]): Catalog {
  const catalogTracks = tracks.map<CatalogTrack>((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle,
    icon: t.icon,
    accent: t.accent,
    lessons: t.lessons.map((l) => ({
      id: l.id,
      trackId: l.trackId,
      title: l.title,
      summary: l.summary,
      minutes: l.minutes,
      level: l.level,
      skills: l.skills,
    })),
  }));
  return {
    tracks: catalogTracks,
    scenarios: scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      tagline: s.tagline,
      category: s.category,
      difficulty: s.difficulty,
      minutes: s.minutes,
      skills: s.skills,
      persona: { name: s.persona.name, role: s.persona.role, avatar: s.persona.avatar },
    })),
    lessonSkills: Object.fromEntries(catalogTracks.flatMap((t) => t.lessons.map((l) => [`${l.trackId}/${l.id}`, l.skills]))),
  };
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function findScenario(catalog: Catalog, id: string): CatalogScenario | undefined {
  return catalog.scenarios.find((s) => s.id === id);
}

export function findLesson(catalog: Catalog, lessonId: string, trackId?: string): CatalogLesson | undefined {
  for (const track of catalog.tracks) {
    if (trackId && track.id !== trackId) continue;
    const lesson = track.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return undefined;
}

export function findTrack(catalog: Catalog, trackId: string): CatalogTrack | undefined {
  return catalog.tracks.find((t) => t.id === trackId);
}

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------

function toLesson(l: CatalogLesson): Lesson {
  return { ...l, blocks: [], keyTakeaways: [], quiz: [], exercise: { prompt: "", tips: [] } };
}

function toTrack(t: CatalogTrack): Track {
  return { ...t, description: "", skills: [], lessons: t.lessons.map(toLesson) };
}

function toScenario(s: CatalogScenario): Scenario {
  return {
    ...s,
    description: "",
    persona: { ...s.persona, bio: "" },
    userRole: "",
    objective: "",
    openingLine: "",
    personaBrief: "",
    rubric: [],
    suggestedTurns: 0,
    tips: [],
  };
}

export interface CatalogRecommendation {
  focusSkill: SkillId;
  reason: string;
  lesson: CatalogLesson | null;
  track: CatalogTrack | null;
  scenario: CatalogScenario | null;
}

/** `recommendNext` over the slim catalogue, mapped back to catalogue items. */
export function recommendFromCatalog(
  profile: Record<SkillId, SkillStat>,
  catalog: Catalog,
  lessonProgress: Record<string, LessonProgress>,
  preferredSkills: SkillId[] = [],
): CatalogRecommendation {
  // `recommendNext` scans preferred skills in SKILL_IDS order; pass only the
  // highest-priority unmeasured one so the goal's own ordering wins.
  const topPreferred = preferredSkills.find((skill) => profile[skill]?.score === null);
  const rec = recommendNext(
    profile,
    catalog.tracks.map(toTrack),
    catalog.scenarios.map(toScenario),
    lessonProgress,
    topPreferred ? [topPreferred] : preferredSkills,
  );
  const lesson = rec.lesson ? (findLesson(catalog, rec.lesson.id, rec.lesson.trackId) ?? null) : null;
  return {
    focusSkill: rec.focusSkill,
    reason: rec.reason,
    lesson,
    track: lesson ? (findTrack(catalog, lesson.trackId) ?? null) : null,
    scenario: rec.scenario ? (findScenario(catalog, rec.scenario.id) ?? null) : null,
  };
}
