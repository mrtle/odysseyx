import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ContinueBanner, type TrackLook } from "@/components/learn/continue-banner";
import { formatMinutes, pluralize, summarizeCurriculum } from "@/components/learn/learn-helpers";
import { TrackCard } from "@/components/learn/track-card";
import { ALL_LESSONS, TRACKS } from "@/content/tracks";
import type { TrackId } from "@/lib/types";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "The OdysseusX curriculum: seven tracks of story craft, from desire and stakes to structure, character, dialogue, cinematography, editing and the pitch room.",
};

export default function LearnPage() {
  const lessons = summarizeCurriculum(TRACKS);
  const looks = Object.fromEntries(TRACKS.map((t) => [t.id, { accent: t.accent, icon: t.icon }])) as Record<TrackId, TrackLook>;
  const totalMinutes = ALL_LESSONS.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Learn"
        title="Chart your course"
        description={
          ALL_LESSONS.length > 0
            ? `Seven tracks of story craft — ${pluralize(ALL_LESSONS.length, "lesson")}, about ${formatMinutes(totalMinutes)} of reading, each ending in a quiz and an exercise that sends you into Practice or the Story Lab.`
            : "Seven tracks of story craft, from the four elements every story needs to the pitch room. Each lesson ends in a quiz and an exercise."
        }
      />

      <ContinueBanner lessons={lessons} looks={looks} />

      <section aria-labelledby="tracks-heading" className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 id="tracks-heading" className="font-display text-2xl font-semibold text-sea-100">
              The tracks
            </h2>
            <p className="mt-1 text-sm text-sea-300">Take them in order, or sail straight to the craft you need today.</p>
          </div>
        </div>
        <ul role="list" className="grid gap-4 md:grid-cols-2">
          {TRACKS.map((track, i) => (
            <li key={track.id} className="animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
              <TrackCard track={track} index={i} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
