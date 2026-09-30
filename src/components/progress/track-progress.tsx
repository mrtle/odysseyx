import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Catalog } from "@/components/home/catalog";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TrackIconGlyph } from "@/components/ui/track-icon";
import type { LessonProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionCard } from "./section-card";

/** Lessons completed per track, each linking into the track. */
export function TrackProgress({
  catalog,
  lessonProgress,
  className,
}: {
  catalog: Catalog;
  lessonProgress: Record<string, LessonProgress>;
  className?: string;
}) {
  const rows = catalog.tracks.map((track) => {
    const total = track.lessons.length;
    const done = track.lessons.filter((l) => lessonProgress[`${l.trackId}/${l.id}`]).length;
    return { track, total, done };
  });
  const total = rows.reduce((n, r) => n + r.total, 0);
  const done = rows.reduce((n, r) => n + r.done, 0);

  return (
    <SectionCard
      id="tracks-heading"
      title="Lessons"
      description={
        total > 0 ? `${done} of ${total} lessons complete across ${rows.length} tracks.` : "The curriculum is being charted."
      }
      action={
        <Link href="/learn" className="text-sm font-medium text-bronze-300 hover:text-bronze-200">
          All tracks
        </Link>
      }
      className={className}
    >
      <ul className="grid gap-x-8 gap-y-1 md:grid-cols-2">
        {rows.map(({ track, total: trackTotal, done: trackDone }) => {
          const complete = trackTotal > 0 && trackDone === trackTotal;
          return (
            <li key={track.id}>
              <Link
                href={`/learn/${track.id}`}
                className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-sea-800/50"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sea-950",
                    track.accent,
                  )}
                >
                  <TrackIconGlyph icon={track.icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-sea-100 group-hover:text-bronze-200">{track.title}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        complete ? "font-semibold text-emerald-300" : "text-sea-400",
                      )}
                    >
                      {trackTotal > 0 ? `${trackDone}/${trackTotal}` : "Soon"}
                    </span>
                  </span>
                  <ProgressBar
                    value={trackTotal > 0 ? trackDone / trackTotal : 0}
                    className="mt-1.5 h-1.5"
                    barClassName={complete ? "from-emerald-500 to-emerald-300" : undefined}
                    label={`${track.title}: ${trackDone} of ${trackTotal} lessons complete`}
                  />
                </span>
                <ChevronRight className="size-4 shrink-0 text-sea-600 group-hover:text-bronze-300" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
