import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Crosshair, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SkillChip } from "@/components/ui/skill-chip";
import { TrackIconGlyph } from "@/components/ui/track-icon";
import { SKILLS } from "@/lib/skills";
import { cn } from "@/lib/utils";
import type { CatalogRecommendation } from "./catalog";

const CATEGORY_LABEL = {
  pitch: "Pitch room",
  oral: "On stage",
  directing: "On set",
  "writers-room": "Writers' room",
  craft: "Craft sparring",
} as const;

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} aria-hidden className={cn("h-1.5 w-3 rounded-full", i <= level ? "bg-bronze-400" : "bg-sea-700")} />
      ))}
    </span>
  );
}

/**
 * The day's recommended focus skill, with a lesson and a drill that train it.
 */
export function TodaysCourse({
  recommendation,
  lessonsCompleted,
  totalLessons,
  className,
}: {
  recommendation: CatalogRecommendation;
  lessonsCompleted: number;
  totalLessons: number;
  className?: string;
}) {
  const { focusSkill, reason, lesson, track, scenario } = recommendation;
  const skill = SKILLS[focusSkill];

  return (
    <section aria-labelledby="todays-course-heading" className={className}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="todays-course-heading" className="font-display text-2xl font-semibold text-sea-100">
            Today&apos;s course
          </h2>
          <p className="mt-1 text-sm text-sea-300">Set by your skill chart and your goal. One lesson, one drill.</p>
        </div>
      </div>

      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-bronze-500/10 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bronze-500/15 text-bronze-300"
            aria-hidden
          >
            <Crosshair className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Focus skill</p>
            <p className="font-display text-xl font-semibold text-sea-100">{skill.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-sea-300">
              {reason} <span className="text-sea-400">{skill.description}</span>
            </p>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-2">
          {lesson ? (
            <Link
              href={`/learn/${lesson.trackId}/${lesson.id}`}
              className="group flex flex-col rounded-xl border border-sea-700 bg-sea-950/40 p-4 transition-colors hover:border-bronze-500/50 hover:bg-sea-900"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-sea-400 uppercase">
                <BookOpen className="size-3.5 text-bronze-400" aria-hidden /> Lesson
                {track ? (
                  <span className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-sea-400 normal-case">
                    · <TrackIconGlyph icon={track.icon} className="size-3.5" /> {track.title}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">
                {lesson.title}
              </span>
              <span className="mt-1 line-clamp-2 text-sm text-sea-300">{lesson.summary}</span>
              <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-sea-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> {lesson.minutes} min
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-bronze-300">
                  Start lesson <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/learn"
              className="group flex flex-col justify-center rounded-xl border border-dashed border-sea-600 bg-sea-950/30 p-4 transition-colors hover:border-bronze-500/50"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-sea-400 uppercase">
                <BookOpen className="size-3.5 text-bronze-400" aria-hidden /> Lesson
              </span>
              <span className="mt-2 font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">
                {totalLessons > 0 && lessonsCompleted >= totalLessons
                  ? "Every lesson complete"
                  : "The curriculum is being charted"}
              </span>
              <span className="mt-1 text-sm text-sea-300">
                {totalLessons > 0 && lessonsCompleted >= totalLessons
                  ? "You've sailed the whole curriculum. Revisit a track, or drill the skill below."
                  : "New lessons are on the way. Browse the tracks in Learn."}
              </span>
            </Link>
          )}

          {scenario ? (
            <Link
              href={`/practice/${scenario.id}`}
              className="group flex flex-col rounded-xl border border-sea-700 bg-sea-950/40 p-4 transition-colors hover:border-bronze-500/50 hover:bg-sea-900"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-sea-400 uppercase">
                <Swords className="size-3.5 text-bronze-400" aria-hidden /> Drill
                <span className="font-medium normal-case">· {CATEGORY_LABEL[scenario.category]}</span>
              </span>
              <span className="mt-2 font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">
                {scenario.title}
              </span>
              <span className="mt-1 line-clamp-2 text-sm text-sea-300">{scenario.tagline}</span>
              <span className="mt-2 flex items-center gap-2 text-sm text-sea-300">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-sea-600 bg-sea-800 text-sm"
                >
                  {scenario.persona.avatar}
                </span>
                <span className="min-w-0 truncate">
                  <span className="font-medium text-sea-200">{scenario.persona.name}</span>
                  <span className="text-sea-400"> · {scenario.persona.role}</span>
                </span>
              </span>
              <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-sea-400">
                <span className="inline-flex items-center gap-3">
                  <Difficulty level={scenario.difficulty} />
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden /> {scenario.minutes} min
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-bronze-300">
                  Start drill <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/practice"
              className="group flex flex-col justify-center rounded-xl border border-dashed border-sea-600 bg-sea-950/30 p-4 transition-colors hover:border-bronze-500/50"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-sea-400 uppercase">
                <Swords className="size-3.5 text-bronze-400" aria-hidden /> Drill
              </span>
              <span className="mt-2 font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">
                Pick a room to rehearse
              </span>
              <span className="mt-1 text-sm text-sea-300">
                No drill targets <SkillChip skill={focusSkill} className="align-middle" /> directly yet — any scene in Practice
                will sharpen it.
              </span>
            </Link>
          )}
        </div>
      </Card>
    </section>
  );
}
