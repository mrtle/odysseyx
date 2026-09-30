import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Compass, FlaskConical, Lightbulb, Swords } from "lucide-react";
import { RichText } from "@/components/ui/rich-text";
import { getScenario } from "@/content/scenarios";
import type { LessonExercise } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LAB_TOOL_COPY, lessonHref, type LessonSummary } from "./learn-helpers";

// ---------------------------------------------------------------------------
// Breadcrumbs
// ---------------------------------------------------------------------------

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-5", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-sea-300">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="truncate rounded transition-colors hover:text-bronze-300">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last ? "text-sea-200" : undefined)}>
                  {item.label}
                </span>
              )}
              {last ? null : <ChevronRight className="size-3.5 shrink-0 text-sea-600" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Key takeaways
// ---------------------------------------------------------------------------

export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="takeaways-title"
      className="relative overflow-hidden rounded-2xl border border-bronze-500/30 bg-gradient-to-br from-bronze-500/[0.08] via-sea-900/70 to-sea-900/60 p-5 shadow-xl shadow-black/20 sm:p-7"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-bronze-500/15 text-bronze-300">
          <Compass className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-bronze-400 uppercase">Log entry</p>
          <h2 id="takeaways-title" className="font-display text-2xl font-semibold text-sea-100">
            Key takeaways
          </h2>
        </div>
      </div>
      <ul role="list" className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[1.02rem] leading-7 text-sea-200">
            <span aria-hidden className="mt-[0.7rem] size-1.5 shrink-0 rotate-45 bg-bronze-400" />
            <span className="min-w-0">
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Exercise
// ---------------------------------------------------------------------------

export function ExerciseCard({ exercise }: { exercise: LessonExercise }) {
  const scenario = exercise.practiceScenarioId ? getScenario(exercise.practiceScenarioId) : undefined;
  const lab = exercise.labTool ? LAB_TOOL_COPY[exercise.labTool] : undefined;
  const hasLinks = Boolean(exercise.practiceScenarioId || exercise.labTool);

  return (
    <section
      id="exercise"
      aria-labelledby="exercise-title"
      className="scroll-mt-24 rounded-2xl border border-aegean-500/30 bg-gradient-to-br from-aegean-500/[0.07] via-sea-900/70 to-sea-900/60 p-5 shadow-xl shadow-black/20 sm:p-7"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-aegean-500/15 text-aegean-300">
          <Swords className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-aegean-300 uppercase">Exercise</p>
          <h2 id="exercise-title" className="font-display text-2xl font-semibold text-sea-100">
            Take it to sea
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        <RichText text={exercise.prompt} paragraphs className="text-[1.0625rem] leading-8 text-sea-100" />
      </div>

      {exercise.tips.length > 0 ? (
        <div className="mt-5 rounded-xl border border-sea-700/70 bg-sea-950/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-bronze-200">
            <Lightbulb className="size-4 text-bronze-300" aria-hidden />
            Tips for the crossing
          </p>
          <ul role="list" className="space-y-2">
            {exercise.tips.map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-6 text-sea-300">
                <span aria-hidden className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-bronze-400" />
                <span className="min-w-0">
                  <RichText text={tip} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasLinks ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {exercise.practiceScenarioId ? (
            <DeepLink
              href={`/practice/${exercise.practiceScenarioId}`}
              icon={<Swords className="size-5" aria-hidden />}
              eyebrow="Practice drill"
              title={scenario ? scenario.title : "Rehearse it live"}
              description={scenario ? scenario.tagline : "Try this with an AI roleplay partner and get scored feedback."}
              tone="bronze"
            />
          ) : null}
          {exercise.labTool && lab ? (
            <DeepLink
              href={`/lab/${exercise.labTool}`}
              icon={<FlaskConical className="size-5" aria-hidden />}
              eyebrow="Story Lab"
              title={lab.label}
              description={lab.description}
              tone="aegean"
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function DeepLink({
  href,
  icon,
  eyebrow,
  title,
  description,
  tone,
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone: "bronze" | "aegean";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border p-4 transition-all hover:-translate-y-px",
        tone === "bronze"
          ? "border-bronze-500/35 bg-bronze-500/[0.06] hover:border-bronze-400/70 hover:bg-bronze-500/10"
          : "border-aegean-500/35 bg-aegean-500/[0.06] hover:border-aegean-400/70 hover:bg-aegean-500/10",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone === "bronze" ? "bg-bronze-500/15 text-bronze-300" : "bg-aegean-500/15 text-aegean-300",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[11px] font-semibold tracking-[0.18em] uppercase", tone === "bronze" ? "text-bronze-400" : "text-aegean-300")}>
          {eyebrow}
        </span>
        <span className="mt-0.5 block font-semibold text-sea-100">{title}</span>
        <span className="mt-0.5 block text-sm leading-snug text-sea-300">{description}</span>
      </span>
      <ArrowRight className="mt-1 size-4 shrink-0 text-sea-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sea-200" aria-hidden />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Previous / next
// ---------------------------------------------------------------------------

export function LessonPager({
  previous,
  next,
  currentTrackId,
}: {
  previous?: LessonSummary;
  next?: LessonSummary;
  currentTrackId: string;
}) {
  if (!previous && !next) return null;
  return (
    // grid-cols-1 (not the implicit auto column) plus min-w-0 on each link lets long titles wrap
    // instead of widening the page on phones.
    <nav aria-label="Lesson navigation" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous ? (
        <PagerLink lesson={previous} direction="previous" crossTrack={previous.trackId !== currentTrackId} />
      ) : (
        <span className="hidden sm:block" />
      )}
      {next ? <PagerLink lesson={next} direction="next" crossTrack={next.trackId !== currentTrackId} /> : null}
    </nav>
  );
}

function PagerLink({ lesson, direction, crossTrack }: { lesson: LessonSummary; direction: "previous" | "next"; crossTrack: boolean }) {
  const isNext = direction === "next";
  return (
    <Link
      href={lessonHref(lesson)}
      rel={isNext ? "next" : "prev"}
      className={cn(
        "group flex min-w-0 items-center gap-3 rounded-2xl border border-sea-700/80 bg-sea-900/60 p-4 transition-all hover:border-sea-500 hover:bg-sea-900/80",
        isNext ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      {isNext ? (
        <ArrowRight className="size-5 shrink-0 text-sea-400 transition-transform group-hover:translate-x-0.5 group-hover:text-bronze-300" aria-hidden />
      ) : (
        <ArrowLeft className="size-5 shrink-0 text-sea-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-bronze-300" aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-sea-300">
          {isNext ? (crossTrack ? `Next track · ${lesson.trackTitle}` : "Next lesson") : crossTrack ? `Previous track · ${lesson.trackTitle}` : "Previous lesson"}
        </span>
        <span className="mt-0.5 line-clamp-2 font-display font-semibold break-words text-sea-100 group-hover:text-bronze-200">
          {lesson.title}
        </span>
      </span>
    </Link>
  );
}
