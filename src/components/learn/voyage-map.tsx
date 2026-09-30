"use client";

import Link from "next/link";
import { Anchor, Check, ChevronRight, Clock, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkillChip } from "@/components/ui/skill-chip";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LEVEL_LABEL,
  LEVEL_TONE,
  countCompleted,
  formatMinutes,
  formatPercent,
  lessonHref,
  pluralize,
  progressFor,
  selectContinueLesson,
  type LessonSummary,
} from "./learn-helpers";

type StopState = "done" | "next" | "open";

/**
 * A track's lessons as a voyage map: a vertical route with numbered stops.
 * Renders neutrally until progress has hydrated, then marks completed stops
 * and the next one to take.
 */
export function VoyageMap({ lessons, trackTitle }: { lessons: LessonSummary[]; trackTitle: string }) {
  const hydrated = useHasHydrated();
  const progress = useAppStore((s) => s.lessonProgress);
  const selection = hydrated ? selectContinueLesson(lessons, progress) : null;
  const nextId = selection && (selection.kind === "start" || selection.kind === "continue") ? selection.lesson.id : null;
  const allDone = hydrated && lessons.length > 0 && countCompleted(lessons, progress) === lessons.length;

  return (
    <nav aria-label={`${trackTitle} lessons`}>
      <ol role="list" className="relative">
        {lessons.map((lesson) => {
          const entry = hydrated ? progressFor(progress, lesson) : undefined;
          const state: StopState = entry ? "done" : lesson.id === nextId ? "next" : "open";
          return (
            <li key={lesson.id} className="relative flex gap-4 pb-5 sm:gap-6">
              {/* Route line: from this stop down to the next one (or the harbour). */}
              <span
                aria-hidden
                className={cn(
                  "absolute top-12 -bottom-1 left-[21px] w-0.5 rounded-full sm:left-[23px]",
                  entry ? "bg-gradient-to-b from-bronze-400 to-bronze-500/60" : "bg-[repeating-linear-gradient(to_bottom,var(--color-sea-600)_0_6px,transparent_6px_12px)]",
                )}
              />
              <StopMarker number={lesson.number} state={state} />
              <Link
                href={lessonHref(lesson)}
                aria-current={state === "next" ? "step" : undefined}
                className={cn(
                  "group mt-1 min-w-0 flex-1 rounded-2xl border p-4 transition-all duration-150 hover:-translate-y-px sm:p-5",
                  state === "next"
                    ? "border-bronze-500/45 bg-gradient-to-br from-bronze-500/[0.09] to-sea-900/60 shadow-lg shadow-bronze-900/10 hover:border-bronze-400/70"
                    : "border-sea-700/80 bg-sea-900/60 hover:border-sea-500 hover:bg-sea-900/80",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {state === "next" ? (
                      <p className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-bronze-300 uppercase">Next stop</p>
                    ) : null}
                    <h3 className="font-display text-lg leading-snug font-semibold text-sea-100 group-hover:text-bronze-200">
                      <span className="sr-only">Lesson {lesson.number}: </span>
                      {lesson.title}
                    </h3>
                  </div>
                  <ChevronRight
                    className="mt-1 size-5 shrink-0 text-sea-500 transition-transform group-hover:translate-x-0.5 group-hover:text-bronze-300"
                    aria-hidden
                  />
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-sea-300">{lesson.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-sea-300">
                    <Clock className="size-3.5 text-sea-400" aria-hidden />
                    {formatMinutes(lesson.minutes)}
                  </span>
                  <Badge tone={LEVEL_TONE[lesson.level]}>{LEVEL_LABEL[lesson.level]}</Badge>
                  {lesson.skills.map((skill) => (
                    <SkillChip key={skill} skill={skill} />
                  ))}
                  {entry ? (
                    <Badge tone="success" className="ml-auto">
                      <Check className="size-3" aria-hidden />
                      {lesson.quizCount > 0 ? `Quiz ${formatPercent(entry.quizScore)}` : "Completed"}
                    </Badge>
                  ) : lesson.quizCount > 0 ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs text-sea-300">
                      <ListChecks className="size-3.5" aria-hidden />
                      {pluralize(lesson.quizCount, "question")}
                    </span>
                  ) : null}
                </div>
                {entry ? <span className="sr-only">Completed.</span> : null}
              </Link>
            </li>
          );
        })}
        <li className="relative flex items-center gap-4 sm:gap-6">
          <span
            aria-hidden
            className={cn(
              "relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border-2 sm:size-12",
              allDone
                ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-300"
                : "border-dashed border-sea-600 bg-sea-900 text-sea-500",
            )}
          >
            <Anchor className="size-5" />
          </span>
          <p className={cn("text-sm", allDone ? "font-semibold text-emerald-300" : "text-sea-300")}>
            {allDone ? `Harbour reached — ${trackTitle} complete.` : `Harbour: finish all ${pluralize(lessons.length, "lesson")} to complete the track.`}
          </p>
        </li>
      </ol>
    </nav>
  );
}

function StopMarker({ number, state }: { number: number; state: StopState }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 mt-1 flex size-11 shrink-0 items-center justify-center rounded-full border-2 font-display text-base font-bold transition-colors sm:size-12 sm:text-lg",
        state === "done" && "border-bronze-400 bg-gradient-to-b from-bronze-400 to-bronze-600 text-sea-950",
        state === "next" && "border-bronze-400 bg-sea-900 text-bronze-300 shadow-[0_0_0_6px_rgb(212_154_58/0.12)]",
        state === "open" && "border-sea-600 bg-sea-900 text-sea-300",
      )}
    >
      {state === "done" ? <Check className="size-5" strokeWidth={3} /> : number}
    </span>
  );
}
