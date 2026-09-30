import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SkillChip } from "@/components/ui/skill-chip";
import { AccentGlow, AccentTile } from "@/components/learn/accent-tile";
import {
  LEVEL_LABEL,
  LEVEL_TONE,
  formatMinutes,
  lessonHref,
  lessonNeighbors,
  summarizeCurriculum,
} from "@/components/learn/learn-helpers";
import { LessonBlocks } from "@/components/learn/lesson-blocks";
import { LessonQuiz } from "@/components/learn/lesson-quiz";
import { Breadcrumbs, ExerciseCard, KeyTakeaways, LessonPager } from "@/components/learn/lesson-sections";
import { LessonStatusBadge } from "@/components/learn/progress-islands";
import { ALL_LESSONS, TRACKS, getLesson, getNextLesson, getTrack } from "@/content/tracks";

export function generateStaticParams() {
  return ALL_LESSONS.map((lesson) => ({ trackId: lesson.trackId, lessonId: lesson.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[trackId]/[lessonId]">): Promise<Metadata> {
  const { trackId, lessonId } = await params;
  const lesson = getLesson(trackId, lessonId);
  const track = getTrack(trackId);
  if (!lesson || !track) return { title: "Lesson not found" };
  return { title: `${lesson.title} · ${track.title}`, description: lesson.summary };
}

export default async function LessonPage({ params }: PageProps<"/learn/[trackId]/[lessonId]">) {
  const { trackId, lessonId } = await params;
  const track = getTrack(trackId);
  const lesson = track ? getLesson(track.id, lessonId) : undefined;
  if (!track || !lesson) notFound();

  const curriculum = summarizeCurriculum(TRACKS);
  const { previous } = lessonNeighbors(curriculum, track.id, lesson.id);
  const nextLesson = getNextLesson(track.id, lesson.id);
  const next = nextLesson ? curriculum.find((l) => l.trackId === nextLesson.trackId && l.id === nextLesson.id) : undefined;
  const number = track.lessons.findIndex((l) => l.id === lesson.id) + 1;
  const trackHref = `/learn/${track.id}`;
  const hasExercise = Boolean(lesson.exercise?.prompt);

  return (
    <div className="animate-fade-in">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Learn", href: "/learn" },
            { label: track.title, href: trackHref },
            { label: `Lesson ${number}` },
          ]}
        />

        <header className="relative isolate mb-10">
          <AccentGlow accent={track.accent} className="-top-24 -left-24 size-72 opacity-15" />
          <div className="mb-4 flex items-center gap-3">
            <AccentTile icon={track.icon} accent={track.accent} size="sm" />
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">
              {track.title} · Lesson {number} of {track.lessons.length}
            </p>
          </div>
          <h1 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance text-sea-100 sm:text-[2.6rem]">
            {lesson.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-sea-300">{lesson.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1.5 text-sm text-sea-300">
              <Clock className="size-4 text-sea-400" aria-hidden />
              {formatMinutes(lesson.minutes)} read
            </span>
            <Badge tone={LEVEL_TONE[lesson.level]}>{LEVEL_LABEL[lesson.level]}</Badge>
            <span className="sr-only">Skills trained:</span>
            {lesson.skills.map((skill) => (
              <SkillChip key={skill} skill={skill} />
            ))}
            <LessonStatusBadge trackId={track.id} lessonId={lesson.id} hasQuiz={lesson.quiz.length > 0} />
          </div>
          <div aria-hidden className={`mt-8 h-px bg-gradient-to-r ${track.accent} opacity-40`} />
        </header>

        <article aria-label={lesson.title}>
          <LessonBlocks key={`${track.id}/${lesson.id}`} blocks={lesson.blocks} />
        </article>

        <div className="mt-14 space-y-10">
          <KeyTakeaways items={lesson.keyTakeaways} />

          <LessonQuiz
            key={`${track.id}/${lesson.id}`}
            trackId={track.id}
            lessonId={lesson.id}
            questions={lesson.quiz}
            trackHref={trackHref}
            trackTitle={track.title}
            hasExercise={hasExercise}
            next={
              next
                ? {
                    href: lessonHref(next),
                    title: next.title,
                    trackTitle: next.trackId !== track.id ? next.trackTitle : undefined,
                  }
                : undefined
            }
          />

          {hasExercise ? <ExerciseCard exercise={lesson.exercise} /> : null}

          <div className="space-y-4 border-t border-sea-800 pt-8">
            <LessonPager previous={previous} next={next} currentTrackId={track.id} />
            <div className="flex justify-center">
              <ButtonLink href={trackHref} variant="ghost" size="sm" icon={<ArrowLeft className="size-4" aria-hidden />}>
                Back to {track.title}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
