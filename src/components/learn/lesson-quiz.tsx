"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react";
import {
  ArrowRight,
  Award,
  Check,
  CircleCheck,
  CircleX,
  ListChecks,
  NotebookPen,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RichText } from "@/components/ui/rich-text";
import { ScoreRing } from "@/components/ui/score-ring";
import { lessonKey, rankForXp } from "@/lib/progress";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { QuizQuestion, TrackId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { describeCompletion, formatPercent, isCorrectAnswer, pluralize, quizVerdict, scoreQuiz } from "./learn-helpers";

const LETTERS = "ABCDEFGHIJ";

export interface NextLessonLink {
  href: string;
  title: string;
  /** Set when the next lesson starts a different track. */
  trackTitle?: string;
}

export interface LessonQuizProps {
  trackId: TrackId;
  lessonId: string;
  questions: QuizQuestion[];
  trackHref: string;
  trackTitle: string;
  next?: NextLessonLink;
  hasExercise: boolean;
}

type Phase =
  | { kind: "quiz" }
  | { kind: "summary" }
  | { kind: "done"; gained: number; score: number; previousScore?: number; xpBefore: number };

/**
 * The end-of-lesson quiz: one question at a time with immediate feedback,
 * a scored summary, then "Complete lesson" with the XP and rank earned.
 * Lessons without a quiz go straight to completion.
 */
export function LessonQuiz({ trackId, lessonId, questions, trackHref, trackTitle, next, hasExercise }: LessonQuizProps) {
  const baseId = useId();
  const hasQuiz = questions.length > 0;
  const hydrated = useHasHydrated();
  const previous = useAppStore((s) => s.lessonProgress[lessonKey(trackId, lessonId)]);
  const completeLesson = useAppStore((s) => s.completeLesson);

  const [phase, setPhase] = useState<Phase>(hasQuiz ? { kind: "quiz" } : { kind: "summary" });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [selected, setSelected] = useState<number | null>(null);

  // Move focus to the new heading after each step, but never on first render.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [focusTick, setFocusTick] = useState(0);
  useEffect(() => {
    if (focusTick > 0) headingRef.current?.focus();
  }, [focusTick]);
  const refocus = () => setFocusTick((t) => t + 1);

  const score = scoreQuiz(questions, answers);

  function retake() {
    setAnswers(questions.map(() => null));
    setSelected(null);
    setIndex(0);
    setPhase(hasQuiz ? { kind: "quiz" } : { kind: "summary" });
    refocus();
  }

  function complete() {
    const state = useAppStore.getState();
    const before = state.lessonProgress[lessonKey(trackId, lessonId)];
    const xpBefore = state.xp;
    const finalScore = hasQuiz ? score.fraction : 1;
    const gained = completeLesson(trackId, lessonId, finalScore);
    setPhase({ kind: "done", gained, score: finalScore, previousScore: before?.quizScore, xpBefore });
    refocus();
  }

  return (
    <section aria-labelledby={`${baseId}-title`} className="scroll-mt-24" id="quiz">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-bronze-500/15 text-bronze-300">
          <ListChecks className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-bronze-400 uppercase">
            {hasQuiz ? `Quiz · ${pluralize(questions.length, "question")}` : "Finish the lesson"}
          </p>
          <h2 id={`${baseId}-title`} className="font-display text-2xl font-semibold text-sea-100">
            Check your bearings
          </h2>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-sea-700/80 bg-sea-900/60 shadow-xl shadow-black/20">
        {phase.kind === "quiz" ? (
          <QuestionStep
            key={index}
            baseId={baseId}
            question={questions[index]}
            index={index}
            questions={questions}
            answers={answers}
            selected={selected}
            headingRef={headingRef}
            onSelect={(i) => {
              if (answers[index] === null) setSelected(i);
            }}
            onCheck={() => {
              if (selected === null) return;
              setAnswers((prev) => prev.map((a, i) => (i === index ? selected : a)));
            }}
            onNext={() => {
              if (index < questions.length - 1) {
                setIndex(index + 1);
                setSelected(null);
              } else {
                setPhase({ kind: "summary" });
              }
              refocus();
            }}
          />
        ) : phase.kind === "summary" ? (
          <SummaryStep
            hasQuiz={hasQuiz}
            questions={questions}
            answers={answers}
            correct={score.correct}
            fraction={score.fraction}
            previousScore={hydrated ? previous?.quizScore : undefined}
            canComplete={hydrated}
            headingRef={headingRef}
            onComplete={complete}
            onRetake={retake}
          />
        ) : (
          <DoneStep
            outcome={phase}
            hasQuiz={hasQuiz}
            headingRef={headingRef}
            trackHref={trackHref}
            trackTitle={trackTitle}
            next={next}
            hasExercise={hasExercise}
            onRetake={retake}
          />
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Question
// ---------------------------------------------------------------------------

function QuestionStep({
  baseId,
  question,
  index,
  questions,
  answers,
  selected,
  headingRef,
  onSelect,
  onCheck,
  onNext,
}: {
  baseId: string;
  question: QuizQuestion;
  index: number;
  questions: QuizQuestion[];
  answers: (number | null)[];
  selected: number | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSelect: (option: number) => void;
  onCheck: () => void;
  onNext: () => void;
}) {
  const answer = answers[index];
  const checked = answer !== null;
  const correct = checked && isCorrectAnswer(question, answer);
  const isLast = index === questions.length - 1;
  const promptId = `${baseId}-q${index}`;
  const feedbackId = `${baseId}-q${index}-feedback`;

  // Checking disables the options, so hand focus to the Next button rather than losing it.
  const submitRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (checked) submitRef.current?.focus();
  }, [checked]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (checked) onNext();
    else onCheck();
  }

  return (
    <form onSubmit={submit} className="animate-fade-in p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-sea-300">
          Question <span className="text-sea-100 tabular-nums">{index + 1}</span> of{" "}
          <span className="tabular-nums">{questions.length}</span>
        </p>
        <ol className="flex gap-1.5" aria-hidden>
          {questions.map((q, i) => {
            const a = answers[i];
            return (
              <li
                key={q.id}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-colors sm:w-8",
                  a !== null
                    ? isCorrectAnswer(q, a)
                      ? "bg-emerald-400"
                      : "bg-wine-400"
                    : i === index
                      ? "bg-bronze-400"
                      : "bg-sea-700",
                )}
              />
            );
          })}
        </ol>
      </div>

      <h3
        ref={headingRef}
        id={promptId}
        tabIndex={-1}
        className="font-display text-xl leading-snug font-semibold text-balance text-sea-100 focus:outline-none sm:text-[1.4rem]"
      >
        <span className="sr-only">
          Question {index + 1} of {questions.length}:{" "}
        </span>
        <RichText text={question.prompt} />
      </h3>

      <div role="radiogroup" aria-labelledby={promptId} aria-describedby={checked ? feedbackId : undefined} className="mt-5 space-y-2.5">
        {question.options.map((option, i) => {
          const isSelected = checked ? answer === i : selected === i;
          const isAnswer = i === question.answerIndex;
          const state = !checked
            ? isSelected
              ? "selected"
              : "idle"
            : isAnswer
              ? "correct"
              : isSelected
                ? "wrong"
                : "muted";
          return (
            <label
              key={i}
              className={cn(
                "group flex items-start gap-3 rounded-xl border px-4 py-3 text-[0.98rem] leading-6 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze-400/70",
                state === "idle" && "cursor-pointer border-sea-700 bg-sea-900/50 text-sea-200 hover:border-sea-500 hover:bg-sea-800/60",
                state === "selected" && "cursor-pointer border-bronze-400/70 bg-bronze-500/10 text-sea-100",
                state === "correct" && "border-emerald-400/60 bg-emerald-500/10 text-sea-100",
                state === "wrong" && "border-wine-400/60 bg-wine-600/15 text-sea-100",
                state === "muted" && "border-sea-800 bg-sea-900/30 text-sea-300",
              )}
            >
              <input
                type="radio"
                name={`${baseId}-q${index}-options`}
                value={i}
                checked={isSelected}
                disabled={checked}
                onChange={() => onSelect(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onCheck();
                  }
                }}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "mt-px flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors",
                  state === "idle" && "border-sea-500 text-sea-300 group-hover:border-sea-400",
                  state === "selected" && "border-bronze-400 bg-bronze-400 text-sea-950",
                  state === "correct" && "border-emerald-400 bg-emerald-400 text-sea-950",
                  state === "wrong" && "border-wine-400 bg-wine-400 text-sea-950",
                  state === "muted" && "border-sea-700 text-sea-400",
                )}
              >
                {state === "correct" ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : state === "wrong" ? (
                  <X className="size-3.5" strokeWidth={3} />
                ) : (
                  LETTERS[i] ?? i + 1
                )}
              </span>
              <span className="min-w-0 flex-1">
                <RichText text={option} />
                {state === "correct" ? <span className="sr-only"> (correct answer)</span> : null}
                {state === "wrong" ? <span className="sr-only"> (your answer, incorrect)</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      <div aria-live="polite" id={feedbackId}>
        {checked ? (
          <div
            className={cn(
              "mt-5 animate-rise rounded-xl border p-4",
              correct ? "border-emerald-500/35 bg-emerald-500/[0.07]" : "border-wine-500/40 bg-wine-600/10",
            )}
          >
            <p className={cn("flex items-center gap-2 font-semibold", correct ? "text-emerald-300" : "text-rose-300")}>
              {correct ? <CircleCheck className="size-4.5" aria-hidden /> : <CircleX className="size-4.5" aria-hidden />}
              {correct ? "Correct." : "Not quite."}
            </p>
            {!correct && question.options[question.answerIndex] !== undefined ? (
              <p className="mt-1.5 text-sm leading-6 text-sea-100">
                <span className="font-semibold text-emerald-300">Answer:</span>{" "}
                <RichText text={question.options[question.answerIndex]} />
              </p>
            ) : null}
            <p className="mt-1.5 text-sm leading-6 text-sea-200">
              <RichText text={question.explanation} />
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="hidden text-xs text-sea-300 sm:block">
          {checked ? "Press Enter to continue." : "Arrow keys choose an answer; Enter checks it."}
        </p>
        <Button ref={submitRef} type="submit" disabled={!checked && selected === null} className="sm:min-w-40">
          {!checked ? "Check answer" : isLast ? "See your score" : "Next question"}
          {checked ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function SummaryStep({
  hasQuiz,
  questions,
  answers,
  correct,
  fraction,
  previousScore,
  canComplete,
  headingRef,
  onComplete,
  onRetake,
}: {
  hasQuiz: boolean;
  questions: QuizQuestion[];
  answers: (number | null)[];
  correct: number;
  fraction: number;
  previousScore?: number;
  canComplete: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onComplete: () => void;
  onRetake: () => void;
}) {
  if (!hasQuiz) {
    return (
      <div className="animate-fade-in p-5 sm:p-7">
        <h3 ref={headingRef} tabIndex={-1} className="font-display text-xl font-semibold text-sea-100 focus:outline-none">
          No quiz on this stop
        </h3>
        <p className="mt-2 max-w-xl text-sea-300">
          When you&apos;ve read it through{" "}
          {previousScore !== undefined ? "again" : "and tried the exercise"}, mark the lesson complete to log it on your voyage.
        </p>
        {previousScore !== undefined ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-300">
            <Check className="size-4" aria-hidden /> You&apos;ve already completed this lesson.
          </p>
        ) : null}
        <div className="mt-5">
          <Button onClick={onComplete} disabled={!canComplete} icon={<Award className="size-4" aria-hidden />}>
            Complete lesson
          </Button>
        </div>
      </div>
    );
  }

  const verdict = quizVerdict(fraction);
  return (
    <div className="animate-fade-in p-5 sm:p-7">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
        <ScoreRing score={fraction * 100} size={112} label="Score" />
        <div className="min-w-0">
          <Badge tone={verdict.tone}>
            {correct} of {questions.length} correct
          </Badge>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 font-display text-2xl font-semibold text-sea-100 focus:outline-none"
          >
            {verdict.title}
          </h3>
          <p className="mt-1 max-w-lg text-sea-300">{verdict.message}</p>
        </div>
      </div>

      <details className="group mt-6 rounded-xl border border-sea-700/80 bg-sea-950/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sea-200 hover:text-sea-100 [&::-webkit-details-marker]:hidden">
          Review your answers
          <ArrowRight className="size-4 text-sea-400 transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <ol className="space-y-3 border-t border-sea-800 px-4 py-4">
          {questions.map((q, i) => {
            const ok = isCorrectAnswer(q, answers[i]);
            const given = answers[i];
            return (
              <li key={q.id} className="flex gap-3 text-sm">
                {ok ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                ) : (
                  <CircleX className="mt-0.5 size-4 shrink-0 text-rose-300" aria-hidden />
                )}
                <span className="sr-only">{ok ? "Correct:" : "Incorrect:"}</span>
                <div className="min-w-0">
                  <p className="text-sea-100">
                    <RichText text={q.prompt} />
                  </p>
                  {!ok ? (
                    <p className="mt-1 text-sea-300">
                      {given !== null && given !== undefined ? (
                        <>
                          You chose <RichText text={q.options[given] ?? ""} />.{" "}
                        </>
                      ) : null}
                      Answer: <span className="text-emerald-300"><RichText text={q.options[q.answerIndex] ?? ""} /></span>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </details>

      {previousScore !== undefined ? (
        <p className="mt-4 text-sm text-sea-300">
          You completed this lesson before with a best score of {formatPercent(previousScore)}. Completing again keeps your best.
        </p>
      ) : fraction < 0.6 ? (
        <p className="mt-4 text-sm text-sea-300">
          You can complete the lesson now, or retake the quiz first — only your best score is kept.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button onClick={onComplete} disabled={!canComplete} size="lg" icon={<Award className="size-4" aria-hidden />}>
          Complete lesson
        </Button>
        <Button onClick={onRetake} variant="secondary" size="lg" icon={<RotateCcw className="size-4" aria-hidden />}>
          Retake quiz
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Done: XP and rank
// ---------------------------------------------------------------------------

function DoneStep({
  outcome,
  hasQuiz,
  headingRef,
  trackHref,
  trackTitle,
  next,
  hasExercise,
  onRetake,
}: {
  outcome: Extract<Phase, { kind: "done" }>;
  hasQuiz: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  trackHref: string;
  trackTitle: string;
  next?: NextLessonLink;
  hasExercise: boolean;
  onRetake: () => void;
}) {
  const xp = useAppStore((s) => s.xp);
  const rank = rankForXp(xp);
  const rankedUp = rank.rank.level > rankForXp(outcome.xpBefore).rank.level;
  const copy = describeCompletion({ ...outcome, hasQuiz });
  const earned = outcome.gained > 0;

  return (
    <div className="relative isolate animate-fade-in overflow-hidden p-5 text-center sm:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-72 -translate-x-1/2 rounded-full bg-bronze-500/15 blur-3xl"
      />
      <div className="relative mx-auto flex size-20 animate-rise items-center justify-center rounded-full bg-gradient-to-b from-bronze-300 to-bronze-600 text-sea-950 shadow-xl shadow-bronze-900/40 ring-4 ring-bronze-500/20">
        <Award className="size-10" aria-hidden />
        <Sparkles className="absolute -top-1 -right-2 size-5 text-bronze-200" aria-hidden />
      </div>
      <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Lesson complete</p>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          "mt-1 font-display font-bold focus:outline-none",
          earned ? "text-4xl text-bronze-300 sm:text-5xl" : "text-2xl text-sea-100",
        )}
      >
        {copy.headline}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sea-300">{copy.detail}</p>

      <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-sea-700/80 bg-sea-950/40 p-4 text-left">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bronze-500/20 font-display text-lg font-bold text-bronze-300">
            {rank.rank.level}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sea-300">Your rank</p>
            <p className="font-display text-lg leading-tight font-semibold text-sea-100">{rank.rank.title}</p>
          </div>
          {rankedUp ? (
            <Badge tone="bronze">
              <TrendingUp className="size-3" aria-hidden /> Rank up!
            </Badge>
          ) : null}
        </div>
        <ProgressBar value={rank.progress} className="mt-3" label={`Progress to ${rank.next?.title ?? "the final rank"}`} />
        <p className="mt-2 text-xs text-sea-300">
          <span className="tabular-nums">{rank.xp}</span> XP ·{" "}
          {rank.next ? (
            <>
              <span className="tabular-nums">{rank.next.minXp - rank.xp}</span> XP to {rank.next.title}
            </>
          ) : (
            "the highest rank on the voyage"
          )}
        </p>
      </div>

      <div className="mt-7 flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {next ? (
          <ButtonLink href={next.href} size="lg" className="sm:max-w-full" title={next.title}>
            <span className="min-w-0 truncate">{next.trackTitle ? `Next track: ${next.trackTitle}` : `Next: ${next.title}`}</span>
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink href="/learn" size="lg">
            Back to the curriculum
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        )}
        {hasExercise ? (
          <ButtonLink href="#exercise" variant="secondary" size="lg" icon={<NotebookPen className="size-4" aria-hidden />}>
            Try the exercise
          </ButtonLink>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
        <ButtonLink href={trackHref} variant="ghost" size="sm">
          Back to {trackTitle}
        </ButtonLink>
        <Button variant="ghost" size="sm" onClick={onRetake} icon={<RotateCcw className="size-3.5" aria-hidden />}>
          {hasQuiz ? "Retake quiz" : "Start over"}
        </Button>
      </div>
    </div>
  );
}
