"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, CircleCheck, Compass, FileText, Quote, RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillBars } from "@/components/ui/skill-bars";
import { SKILLS } from "@/lib/skills";
import type { CoachMode, Evaluation } from "@/lib/types";
import type { LessonPicks } from "./lesson-picks";
import type { PublicScenario } from "./public-scenario";

const VERDICT: { min: number; label: string; tone: "success" | "aegean" | "bronze" | "wine" }[] = [
  { min: 85, label: "Professional", tone: "success" },
  { min: 70, label: "Strong", tone: "aegean" },
  { min: 50, label: "Finding your feet", tone: "bronze" },
  { min: 0, label: "Early days", tone: "wine" },
];

export interface ScorecardProps {
  scenario: PublicScenario;
  evaluation: Evaluation;
  mode?: CoachMode;
  /** XP this scoring earned; shown when positive. */
  xpGained?: number;
  lessonPicks: LessonPicks;
  /** Restart the drill in place; otherwise "Try again" links to the briefing. */
  onTryAgain?: () => void;
  transcriptHref: string;
  /** Move focus to the headline when the scorecard appears. */
  autoFocus?: boolean;
}

export function Scorecard({ scenario, evaluation, mode, xpGained, lessonPicks, onTryAgain, transcriptHref, autoFocus = false }: ScorecardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) headingRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const verdict = VERDICT.find((v) => evaluation.overall >= v.min) ?? VERDICT[VERDICT.length - 1];
  const weakest = evaluation.skillScores.reduce<Evaluation["skillScores"][number] | null>(
    (low, s) => (!low || s.score < low.score ? s : low),
    null,
  );
  const lesson = weakest ? lessonPicks[weakest.skill] : undefined;
  const bestMoment = evaluation.bestMoment.trim().replace(/^["“]+|["”]+$/g, "");

  return (
    <section aria-labelledby="scorecard-heading" className="animate-rise space-y-6">
      {/* Verdict */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-bronze-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={evaluation.overall} size={128} stroke={10} label="Overall" className="self-center sm:self-auto" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Scorecard · {scenario.title}</p>
            <h2
              id="scorecard-heading"
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 font-display text-2xl leading-tight font-semibold text-sea-100 outline-none sm:text-3xl"
            >
              {evaluation.headline}
            </h2>
            <p className="mt-3 leading-relaxed text-sea-300">{evaluation.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={verdict.tone}>{verdict.label}</Badge>
              {xpGained && xpGained > 0 ? (
                <Badge tone="bronze">
                  <Sparkles className="size-3" aria-hidden />+{xpGained} XP
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <DemoNotice mode={mode} className="relative mt-6" />
      </Card>

      {/* Skills, best moment, next step */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle>Skill breakdown</CardTitle>
          <SkillBars scores={evaluation.skillScores} className="mt-5" />
        </Card>
        <div className="space-y-6 lg:col-span-2">
          {bestMoment ? (
            <Card className="border-bronze-500/25">
              <p className="text-xs font-semibold tracking-wider text-bronze-400 uppercase">Your best moment</p>
              <figure className="mt-3">
                <Quote className="size-6 text-bronze-500/60" aria-hidden />
                <blockquote className="mt-2 font-display text-xl leading-snug text-bronze-100 italic">&ldquo;{bestMoment}&rdquo;</blockquote>
              </figure>
            </Card>
          ) : null}
          <Card>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-aegean-300 uppercase">
              <Compass className="size-3.5" aria-hidden />
              Next heading
            </p>
            <p className="mt-2 font-display text-lg font-semibold text-sea-100">{evaluation.nextStep.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-sea-300">{evaluation.nextStep.description}</p>
          </Card>
        </div>
      </div>

      {/* Strengths and improvements */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardTitle>What worked</CardTitle>
          <ul className="mt-4 space-y-3">
            {evaluation.strengths.map((strength) => (
              <li key={strength} className="flex gap-3 text-sm leading-relaxed text-sea-200">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-3">
          <CardTitle>What to sharpen</CardTitle>
          <ol className="mt-4 space-y-5">
            {evaluation.improvements.map((item, i) => (
              <li key={`${item.title}-${i}`} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sea-800 font-display text-xs font-bold text-bronze-300"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sea-100">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-sea-300">{item.detail}</p>
                  {item.example.trim() ? (
                    <p className="mt-2.5 rounded-xl border-l-2 border-bronze-400 bg-bronze-500/10 px-3.5 py-2.5 text-sm leading-relaxed text-sea-100">
                      <span className="font-semibold text-bronze-300">Try saying: </span>
                      &ldquo;{item.example.trim().replace(/^["“]+|["”]+$/g, "")}&rdquo;
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Recommended lesson for the weakest skill */}
      {weakest && lesson ? (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-aegean-500/15 text-aegean-300" aria-hidden>
            <BookOpen className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wider text-sea-400 uppercase">
              Shore up {SKILLS[weakest.skill].name.toLowerCase()} · {weakest.score}/100
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-sea-100">{lesson.title}</p>
            <p className="mt-0.5 text-sm text-sea-300">
              {lesson.trackTitle ? `${lesson.trackTitle} · ` : ""}
              {lesson.minutes} min lesson
            </p>
          </div>
          <ButtonLink href={`/learn/${lesson.trackId}/${lesson.lessonId}`} variant="secondary">
            Open lesson
          </ButtonLink>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        {onTryAgain ? (
          <Button onClick={onTryAgain} icon={<RotateCcw className="size-4" aria-hidden />}>
            Try again
          </Button>
        ) : (
          <ButtonLink href={`/practice/${scenario.id}`} icon={<RotateCcw className="size-4" aria-hidden />}>
            Try again
          </ButtonLink>
        )}
        <ButtonLink href={transcriptHref} variant="secondary" icon={<FileText className="size-4" aria-hidden />}>
          Review transcript
        </ButtonLink>
        <ButtonLink href="/practice" variant="ghost" icon={<ArrowLeft className="size-4" aria-hidden />}>
          Back to Practice
        </ButtonLink>
      </div>
    </section>
  );
}
