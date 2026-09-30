import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Clock, Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkillChip } from "@/components/ui/skill-chip";
import { AccentGlow, AccentTile } from "@/components/learn/accent-tile";
import { formatMinutes, pluralize, toLessonSummary, trackStats } from "@/components/learn/learn-helpers";
import { Breadcrumbs } from "@/components/learn/lesson-sections";
import { TrackHeaderProgress } from "@/components/learn/progress-islands";
import { VoyageMap } from "@/components/learn/voyage-map";
import { TRACKS, getTrack } from "@/content/tracks";

export function generateStaticParams() {
  return TRACKS.map((track) => ({ trackId: track.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[trackId]">): Promise<Metadata> {
  const { trackId } = await params;
  const track = getTrack(trackId);
  if (!track) return { title: "Track not found" };
  return { title: track.title, description: `${track.subtitle}. ${track.description}` };
}

export default async function TrackPage({ params }: PageProps<"/learn/[trackId]">) {
  const { trackId } = await params;
  const track = getTrack(trackId);
  if (!track) notFound();

  const index = TRACKS.findIndex((t) => t.id === track.id);
  const nextTrack = TRACKS[index + 1];
  const stats = trackStats(track);
  const lessons = track.lessons.map((lesson) => toLessonSummary(lesson, track));

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: "Learn", href: "/learn" }, { label: track.title }]} />

      <header className="relative isolate mb-10 overflow-hidden rounded-3xl border border-sea-700/80 bg-sea-900/60 p-6 shadow-2xl shadow-black/30 sm:p-8">
        <AccentGlow accent={track.accent} className="-top-32 -right-24 size-96 opacity-25" />
        <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${track.accent}`} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <AccentTile icon={track.icon} accent={track.accent} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">
              Track {String(index + 1).padStart(2, "0")} · {track.subtitle}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance text-sea-100 sm:text-4xl">
              {track.title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-sea-300">{track.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-sea-300">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="size-4 text-sea-400" aria-hidden />
                {stats.lessons > 0 ? pluralize(stats.lessons, "lesson") : "Lessons coming soon"}
              </span>
              {stats.minutes > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-sea-400" aria-hidden />
                  {formatMinutes(stats.minutes)}
                </span>
              ) : null}
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="sr-only">Skills trained:</span>
                {track.skills.map((skill) => (
                  <SkillChip key={skill} skill={skill} />
                ))}
              </span>
            </div>
          </div>
        </div>
        {lessons.length > 0 ? (
          <div className="mt-7 border-t border-sea-700/70 pt-6">
            <TrackHeaderProgress lessons={lessons} title={track.title} />
          </div>
        ) : null}
      </header>

      <div className="mx-auto max-w-3xl">
        {lessons.length > 0 ? (
          <section aria-labelledby="route-heading">
            <div className="mb-6">
              <h2 id="route-heading" className="font-display text-2xl font-semibold text-sea-100">
                The route
              </h2>
              <p className="mt-1 text-sm text-sea-300">
                {pluralize(lessons.length, "stop")} on this leg of the voyage. Each ends with a quiz and an exercise.
              </p>
            </div>
            <VoyageMap lessons={lessons} trackTitle={track.title} />
          </section>
        ) : (
          <EmptyState
            icon={<Compass className="size-10" aria-hidden />}
            title="This leg of the voyage is still being charted"
            description={`Lessons for ${track.title} are on their way. In the meantime, explore another track or rehearse in Practice.`}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink href="/learn" variant="secondary">
                  All tracks
                </ButtonLink>
                <ButtonLink href="/practice">Go to Practice</ButtonLink>
              </div>
            }
          />
        )}

        {nextTrack ? (
          <Link
            href={`/learn/${nextTrack.id}`}
            className="group mt-10 flex items-center gap-4 rounded-2xl border border-sea-700/80 bg-sea-900/40 p-4 transition-all hover:border-sea-500 hover:bg-sea-900/70 sm:p-5"
          >
            <AccentTile icon={nextTrack.icon} accent={nextTrack.accent} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-sea-300">Next track</span>
              <span className="block truncate font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">
                {nextTrack.title}
              </span>
              <span className="block truncate text-sm text-sea-300">{nextTrack.subtitle}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-sea-500 transition-transform group-hover:translate-x-0.5 group-hover:text-bronze-300" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
