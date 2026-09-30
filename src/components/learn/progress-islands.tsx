"use client";

/**
 * Small client islands that read lesson progress from the persisted store.
 * Each renders a neutral placeholder until the store has hydrated, so server
 * and first client render always match.
 */
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { ProgressBar } from "@/components/ui/progress-bar";
import { lessonKey } from "@/lib/progress";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { TrackId } from "@/lib/types";
import { countCompleted, formatPercent, lessonHref, selectContinueLesson, type LessonRef, type LessonSummary } from "./learn-helpers";

/** "3 of 8 complete" + bar, for a track card on /learn. */
export function TrackCardProgress({ trackId, lessonIds, title }: { trackId: TrackId; lessonIds: string[]; title: string }) {
  const hydrated = useHasHydrated();
  const progress = useAppStore((s) => s.lessonProgress);
  const total = lessonIds.length;

  if (total === 0) {
    return <p className="text-xs text-sea-300">Lessons are still being charted for this track.</p>;
  }
  if (!hydrated) {
    return (
      <div className="space-y-2" aria-hidden>
        <Skeleton className="h-3 w-28 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  const refs: LessonRef[] = lessonIds.map((id) => ({ trackId, id }));
  const completed = countCompleted(refs, progress);
  const done = completed === total;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={done ? "font-semibold text-emerald-300" : "text-sea-300"}>
          {done ? (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5" aria-hidden /> Track complete
            </span>
          ) : completed === 0 ? (
            "Not started"
          ) : (
            `${completed} of ${total} complete`
          )}
        </span>
        <span className="font-medium text-sea-300 tabular-nums">{formatPercent(completed / total)}</span>
      </div>
      <ProgressBar
        value={completed / total}
        label={`${title}: ${completed} of ${total} lessons complete`}
        barClassName={done ? "from-emerald-500 to-emerald-300" : undefined}
      />
    </div>
  );
}

/** Progress summary + "continue" call to action at the top of a track page. */
export function TrackHeaderProgress({ lessons, title }: { lessons: LessonSummary[]; title: string }) {
  const hydrated = useHasHydrated();
  const progress = useAppStore((s) => s.lessonProgress);
  const total = lessons.length;

  if (total === 0) return null;
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center" aria-hidden>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
    );
  }

  const selection = selectContinueLesson(lessons, progress);
  const completed = countCompleted(lessons, progress);
  const fraction = completed / total;

  const cta =
    selection.kind === "start"
      ? { href: lessonHref(selection.lesson), label: "Start the first lesson", review: false }
      : selection.kind === "continue"
        ? { href: lessonHref(selection.lesson), label: `Continue with lesson ${selection.lesson.number}`, review: false }
        : selection.kind === "complete"
          ? { href: lessonHref(lessons[0]), label: "Review from the start", review: true }
          : null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-sea-100">
            {completed === total ? "Every stop visited" : `${completed} of ${total} lessons complete`}
          </span>
          <span className="text-sea-300 tabular-nums">{formatPercent(fraction)}</span>
        </div>
        <ProgressBar
          value={fraction}
          label={`${title}: ${completed} of ${total} lessons complete`}
          barClassName={completed === total ? "from-emerald-500 to-emerald-300" : undefined}
        />
      </div>
      {cta ? (
        <ButtonLink
          href={cta.href}
          variant={cta.review ? "secondary" : "primary"}
          className="w-full sm:w-auto"
          icon={cta.review ? <RotateCcw className="size-4" aria-hidden /> : undefined}
        >
          {cta.label}
          {cta.review ? null : <ArrowRight className="size-4" aria-hidden />}
        </ButtonLink>
      ) : null}
    </div>
  );
}

/** "Completed · best quiz 80%" badge in a lesson header. */
export function LessonStatusBadge({ trackId, lessonId, hasQuiz }: { trackId: TrackId; lessonId: string; hasQuiz: boolean }) {
  const hydrated = useHasHydrated();
  const entry = useAppStore((s) => s.lessonProgress[lessonKey(trackId, lessonId)]);
  if (!hydrated || !entry) return null;
  return (
    <Badge tone="success">
      <Check className="size-3" aria-hidden />
      Completed{hasQuiz ? ` · best ${formatPercent(entry.quizScore)}` : ""}
    </Badge>
  );
}
