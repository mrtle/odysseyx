"use client";

import { Anchor, ArrowRight, Clock, FlaskConical, Swords } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { TrackIcon, TrackId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AccentGlow, AccentTile } from "./accent-tile";
import { formatMinutes, lessonHref, pluralize, selectContinueLesson, type LessonSummary } from "./learn-helpers";

export interface TrackLook {
  accent: string;
  icon: TrackIcon;
}

function Waves({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-bronze-400/10", className)}
    >
      <path d="M0 40 Q75 20 150 40 T300 40 T450 40 T600 40 V60 H0 Z" fill="currentColor" />
      <path d="M0 48 Q75 30 150 48 T300 48 T450 48 T600 48" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const SHELL =
  "relative isolate overflow-hidden rounded-3xl border border-bronze-500/25 bg-gradient-to-br from-sea-850 via-sea-900 to-sea-950 p-6 shadow-2xl shadow-black/40 sm:p-8";

/**
 * "Continue your voyage": the next lesson to take across the whole
 * curriculum, or a first-lesson call to action for newcomers.
 */
export function ContinueBanner({ lessons, looks }: { lessons: LessonSummary[]; looks: Record<TrackId, TrackLook> }) {
  const hydrated = useHasHydrated();
  const progress = useAppStore((s) => s.lessonProgress);

  if (!hydrated) return <Skeleton className="h-[300px] rounded-3xl md:h-[196px]" />;

  const selection = selectContinueLesson(lessons, progress);

  if (selection.kind === "empty") {
    return (
      <section aria-labelledby="continue-heading" className={SHELL}>
        <Waves />
        <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Charts in progress</p>
        <h2 id="continue-heading" className="mt-2 font-display text-2xl font-semibold text-sea-100">
          The lessons are still being charted
        </h2>
        <p className="mt-2 max-w-xl text-sea-300">
          While the curriculum is drawn up, you can rehearse a pitch with an AI persona or put a logline through the Story Lab.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink href="/practice" icon={<Swords className="size-4" aria-hidden />}>
            Rehearse in Practice
          </ButtonLink>
          <ButtonLink href="/lab" variant="secondary" icon={<FlaskConical className="size-4" aria-hidden />}>
            Open Story Lab
          </ButtonLink>
        </div>
      </section>
    );
  }

  if (selection.kind === "complete") {
    return (
      <section aria-labelledby="continue-heading" className={SHELL}>
        <AccentGlow accent="from-emerald-300 to-emerald-600" className="-top-24 -right-16 size-72" />
        <Waves />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <Anchor className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-emerald-300 uppercase">Voyage complete</p>
            <h2 id="continue-heading" className="mt-1.5 font-display text-2xl font-semibold text-sea-100">
              Home to Ithaca — all {pluralize(selection.total, "lesson")} finished
            </h2>
            <p className="mt-2 max-w-xl text-sea-300">
              The map is yours. Keep the craft sharp under pressure in Practice, or revisit any lesson below.
            </p>
          </div>
          <ButtonLink href="/practice" className="w-full sm:w-auto" icon={<Swords className="size-4" aria-hidden />}>
            Go to Practice
          </ButtonLink>
        </div>
      </section>
    );
  }

  const { lesson, completed, total } = selection;
  const look = looks[lesson.trackId];
  const starting = selection.kind === "start";

  return (
    <section aria-labelledby="continue-heading" className={SHELL}>
      {look ? <AccentGlow accent={look.accent} className="-top-28 -right-20 size-80" /> : null}
      <Waves />
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          {look ? <AccentTile icon={look.icon} accent={look.accent} size="md" className="mt-1 hidden sm:flex" /> : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">
              {starting ? "Begin your voyage" : "Continue your voyage"}
            </p>
            <h2 id="continue-heading" className="mt-1.5 font-display text-2xl leading-tight font-semibold text-balance text-sea-100 sm:text-[1.7rem]">
              {lesson.title}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-sea-300">
              <span>{lesson.trackTitle}</span>
              <span aria-hidden className="text-sea-500">
                ·
              </span>
              <span>Lesson {lesson.number}</span>
              <span aria-hidden className="text-sea-500">
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                {formatMinutes(lesson.minutes)}
              </span>
            </p>
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-sea-300">{lesson.summary}</p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 md:w-60">
          <ButtonLink href={lessonHref(lesson)} size="lg" className="w-full">
            {starting ? "Start lesson" : "Resume the voyage"}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-sea-300">
              <span>{starting ? `${pluralize(total, "lesson")} ahead` : `${completed} of ${total} lessons`}</span>
              <span className="tabular-nums">{Math.round((completed / total) * 100)}%</span>
            </div>
            <ProgressBar value={completed / total} label={`Curriculum progress: ${completed} of ${total} lessons complete`} />
          </div>
        </div>
      </div>
    </section>
  );
}
