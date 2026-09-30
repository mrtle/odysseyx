import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock } from "lucide-react";
import { SkillChip } from "@/components/ui/skill-chip";
import type { Track } from "@/lib/types";
import { AccentGlow, AccentTile } from "./accent-tile";
import { formatMinutes, pluralize, trackStats } from "./learn-helpers";
import { TrackCardProgress } from "./progress-islands";

/** A curriculum track on /learn. The whole card is a link to the track page. */
export function TrackCard({ track, index }: { track: Track; index: number }) {
  const stats = trackStats(track);
  const headingId = `track-${track.id}-title`;
  return (
    <Link
      href={`/learn/${track.id}`}
      aria-labelledby={headingId}
      aria-describedby={`track-${track.id}-desc`}
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-sea-700/80 bg-sea-900/60 p-5 shadow-xl shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-sea-500 hover:bg-sea-900/80 hover:shadow-2xl focus-visible:border-bronze-400/60 sm:p-6"
    >
      <AccentGlow accent={track.accent} className="-top-16 -right-16 size-48 opacity-10 transition-opacity group-hover:opacity-25" />
      <div className="flex items-start gap-4">
        <AccentTile icon={track.icon} accent={track.accent} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-sea-300 uppercase">
            Track {String(index + 1).padStart(2, "0")}
          </p>
          <h3 id={headingId} className="mt-0.5 font-display text-xl leading-snug font-semibold text-sea-100">
            {track.title}
          </h3>
          <p className="text-sm text-bronze-300/90 italic">{track.subtitle}</p>
        </div>
        <ArrowUpRight
          className="size-5 shrink-0 text-sea-500 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bronze-300"
          aria-hidden
        />
      </div>

      <p id={`track-${track.id}-desc`} className="mt-4 text-sm leading-relaxed text-sea-300">
        {track.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-sea-300">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5 text-sea-400" aria-hidden />
          {stats.lessons > 0 ? pluralize(stats.lessons, "lesson") : "Coming soon"}
        </span>
        {stats.minutes > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-sea-400" aria-hidden />
            {formatMinutes(stats.minutes)}
          </span>
        ) : null}
        <span className="flex flex-wrap gap-1.5">
          {track.skills.map((skill) => (
            <SkillChip key={skill} skill={skill} />
          ))}
        </span>
      </div>

      <div className="mt-auto pt-5">
        <TrackCardProgress trackId={track.id} lessonIds={track.lessons.map((l) => l.id)} title={track.title} />
      </div>
    </Link>
  );
}
