"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import { Check, CircleDashed, Hourglass, PenLine, RotateCcw, Send, Target, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { Skeleton, ThinkingDots } from "@/components/ui/loading";
import { SkillChip } from "@/components/ui/skill-chip";
import { getDailyPrompt, type DailyChallenge as DailyChallengePrompt } from "@/content/daily-prompts";
import { ApiError, postJson, toCoachProfile } from "@/lib/api";
import {
  checkConstraints,
  countWords,
  dailyEntryMode,
  dailyPromptFor,
  formatCountdown,
  msUntilNextDay,
  type ConstraintCheck,
  type DailyEntryWithMode,
} from "@/lib/daily";
import { XP_REWARDS, toDateKey } from "@/lib/progress";
import { useAppStore } from "@/lib/store";
import type { CoachMode, MicroFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNow } from "./hooks";
import { MicroFeedbackView } from "./micro-feedback";

const MIN_CHARS = 10;
const MAX_CHARS = 4000;
const DRAFT_KEY = "odysseusx-daily-draft";

interface Draft {
  date: string;
  promptId: string;
  text: string;
}

function readDraft(date: string, promptId: string): string {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return "";
    const draft = JSON.parse(raw) as Partial<Draft>;
    return draft.date === date && draft.promptId === promptId && typeof draft.text === "string" ? draft.text : "";
  } catch {
    return "";
  }
}

function writeDraft(draft: Draft | null): void {
  try {
    if (!draft || !draft.text.trim()) window.localStorage.removeItem(DRAFT_KEY);
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable (private mode, blocked) — drafts just won't survive a reload.
  }
}

/**
 * Today's micro-story challenge. Re-keys itself at local midnight so a new
 * prompt appears without a reload.
 */
export function DailyChallenge({ className }: { className?: string }) {
  const now = useNow(30_000);
  const todayKey = toDateKey(now);
  return <DailyChallengeDay key={todayKey} todayKey={todayKey} prompt={dailyPromptFor(now)} className={className} />;
}

function DailyChallengeDay({
  todayKey,
  prompt,
  className,
}: {
  todayKey: string;
  prompt: DailyChallengePrompt;
  className?: string;
}) {
  const entry = useAppStore((s) => s.daily[todayKey]);
  const profile = useAppStore((s) => s.profile);
  const saveDaily = useAppStore((s) => s.saveDaily);

  // If today's entry was written against a different prompt (content changed), keep showing that one.
  const activePrompt = (entry && getDailyPrompt(entry.promptId)) || prompt;
  const done = Boolean(entry?.feedback);

  const [revising, setRevising] = useState(false);
  const [text, setText] = useState(() => readDraft(todayKey, prompt.id));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<{ xp: number; mode: CoachMode } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (justSaved) resultRef.current?.focus();
  }, [justSaved]);

  function updateText(value: string) {
    setText(value);
    if (!revising) writeDraft({ date: todayKey, promptId: activePrompt.id, text: value });
  }

  async function submit() {
    const response = text.trim();
    if (response.length < MIN_CHARS || pending) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPending(true);
    setError(null);
    try {
      const result = await postJson<{ feedback: MicroFeedback; mode: CoachMode }>(
        "/api/daily",
        { promptId: activePrompt.id, response, profile: toCoachProfile(profile) },
        controller.signal,
      );
      // DailyEntry has no `mode` yet; it's stored alongside so the demo notice survives a reload.
      const saved: DailyEntryWithMode = {
        promptId: activePrompt.id,
        date: todayKey,
        response,
        feedback: result.feedback,
        mode: result.mode,
      };
      const xp = saveDaily(saved);
      writeDraft(null);
      setRevising(false);
      setJustSaved({ xp, mode: result.mode });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      if (abortRef.current === controller) setPending(false);
    }
  }

  function startRevision() {
    setText(entry?.response ?? "");
    setError(null);
    setJustSaved(null);
    setRevising(true);
  }

  const headingId = `daily-${todayKey}-title`;
  const constraintId = `daily-${todayKey}-constraint`;

  return (
    <section aria-labelledby={headingId} className={className}>
      <Card className="relative overflow-hidden p-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-aegean-500/10 to-transparent"
        />
        <div className="relative p-5 sm:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-[0.2em] text-aegean-300 uppercase">Daily challenge</span>
              <SkillChip skill={activePrompt.skill} />
            </div>
            {done && !revising ? (
              <Badge tone="success">
                <Check className="size-3" aria-hidden /> Logged today
              </Badge>
            ) : entry ? (
              // Only the day's first submission earns XP (see saveDaily), so a revision doesn't promise any.
              <Badge tone="neutral">Revision · no extra XP</Badge>
            ) : (
              <Badge tone="aegean">+{XP_REWARDS.daily} XP</Badge>
            )}
          </header>

          <h2 id={headingId} className="mt-3 font-display text-2xl font-semibold text-sea-100">
            <span className="sr-only">Daily challenge: </span>
            {activePrompt.title}
          </h2>
          <p className="mt-2 text-base leading-relaxed text-sea-200">{activePrompt.prompt}</p>
          <p
            id={constraintId}
            className="mt-3 flex items-start gap-2 rounded-xl border border-sea-700 bg-sea-950/40 px-3.5 py-2.5 text-sm text-sea-300"
          >
            <Target className="mt-0.5 size-4 shrink-0 text-bronze-400" aria-hidden />
            <span>
              <span className="sr-only">Constraint: </span>
              {activePrompt.constraint}
            </span>
          </p>

          {done && !revising && entry?.feedback ? (
            <CompletedView
              response={entry.response}
              feedback={entry.feedback}
              mode={justSaved?.mode ?? dailyEntryMode(entry)}
              xpGained={justSaved?.xp}
              headingRef={resultRef}
              onRevise={startRevision}
            />
          ) : (
            <Editor
              prompt={activePrompt}
              constraintId={constraintId}
              text={text}
              onChange={updateText}
              onSubmit={submit}
              pending={pending}
              error={error}
              revising={revising}
              onCancelRevision={() => {
                abortRef.current?.abort();
                setPending(false);
                setError(null);
                setRevising(false);
              }}
            />
          )}
        </div>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function Editor({
  prompt,
  constraintId,
  text,
  onChange,
  onSubmit,
  pending,
  error,
  revising,
  onCancelRevision,
}: {
  prompt: DailyChallengePrompt;
  constraintId: string;
  text: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error: string | null;
  revising: boolean;
  onCancelRevision: () => void;
}) {
  const id = useId();
  const checks = checkConstraints(prompt.rule, text);
  const words = countWords(text);
  const tooShort = text.trim().length < MIN_CHARS;
  const hasText = text.trim().length > 0;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5" aria-busy={pending}>
      <label htmlFor={`${id}-response`} className="label">
        {revising ? "Your revision" : "Your response"}
      </label>
      <textarea
        id={`${id}-response`}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={6}
        maxLength={MAX_CHARS}
        disabled={pending}
        aria-describedby={`${constraintId} ${id}-meta`}
        placeholder="Write fast. Revise once. Hit submit before you talk yourself out of it."
        className="field min-h-36 resize-y leading-relaxed disabled:opacity-70"
      />

      <div id={`${id}-meta`} className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-sea-400 tabular-nums">
          {words} {words === 1 ? "word" : "words"}
        </span>
        {checks.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Constraint checks">
            {checks.map((check) => (
              <ConstraintPill key={check.id} check={check} active={hasText} />
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <Alert tone="error" title="The coach couldn't read that" className="mt-4">
          <p>{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            icon={<RotateCcw className="size-3.5" aria-hidden />}
            onClick={onSubmit}
          >
            Try again
          </Button>
        </Alert>
      ) : null}

      {pending ? (
        <div className="mt-4 space-y-2" role="status" aria-live="polite">
          <p className="flex items-center gap-2 text-sm text-sea-300">
            <ThinkingDots label="The coach is reading" /> The coach is reading your piece…
          </p>
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="hidden text-xs text-sea-400 sm:block">
          <kbd className="rounded border border-sea-600 bg-sea-800 px-1 font-sans text-[11px]">⌘/Ctrl</kbd> +{" "}
          <kbd className="rounded border border-sea-600 bg-sea-800 px-1 font-sans text-[11px]">Enter</kbd> to submit
        </p>
        <div className="ml-auto flex gap-2">
          {revising ? (
            <Button variant="ghost" onClick={onCancelRevision}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={pending} disabled={tooShort} icon={<Send className="size-4" aria-hidden />}>
            {pending ? "Reading…" : revising ? "Resubmit" : "Get feedback"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ConstraintPill({ check, active }: { check: ConstraintCheck; active: boolean }) {
  const Icon = check.met ? Check : active ? X : CircleDashed;
  return (
    <li
      title={check.detail}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        check.met
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : active
            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
            : "border-sea-600 bg-sea-800/60 text-sea-300",
      )}
    >
      <Icon className="size-3" aria-hidden />
      <span>
        {check.label}
        <span className="opacity-75"> · {check.detail}</span>
        <span className="sr-only">{check.met ? " (met)" : " (not met yet)"}</span>
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Completed
// ---------------------------------------------------------------------------

function CompletedView({
  response,
  feedback,
  mode,
  xpGained,
  headingRef,
  onRevise,
}: {
  response: string;
  feedback: MicroFeedback;
  mode: CoachMode | undefined;
  xpGained: number | undefined;
  headingRef: Ref<HTMLHeadingElement>;
  onRevise: () => void;
}) {
  return (
    <div className="mt-5 animate-fade-in space-y-5">
      <div>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="flex items-center gap-2 text-sm font-semibold text-sea-200 focus:outline-none"
        >
          <PenLine className="size-4 text-sea-400" aria-hidden /> Today&apos;s entry
          {xpGained !== undefined ? (
            <Badge tone={xpGained > 0 ? "bronze" : "neutral"} className="ml-1">
              {xpGained > 0 ? `+${xpGained} XP` : "Revision saved"}
            </Badge>
          ) : null}
        </h3>
        <blockquote className="mt-2 border-l-2 border-bronze-500/60 pl-4 text-sm leading-relaxed whitespace-pre-wrap text-sea-200">
          {response}
        </blockquote>
      </div>

      <div className="rounded-xl border border-sea-700 bg-sea-950/40 p-4" aria-live="polite">
        <MicroFeedbackView feedback={feedback} />
      </div>
      <DemoNotice mode={mode} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sea-800 pt-4">
        <NextChallengeCountdown />
        <Button variant="secondary" size="sm" icon={<RotateCcw className="size-3.5" aria-hidden />} onClick={onRevise}>
          Take another pass
        </Button>
      </div>
    </div>
  );
}

function NextChallengeCountdown() {
  const now = useNow(1000);
  return (
    <p className="flex items-center gap-2 text-sm text-sea-300">
      <Hourglass className="size-4 text-bronze-400" aria-hidden />
      <span>
        Come back tomorrow — next challenge in{" "}
        <span className="font-semibold text-sea-100 tabular-nums">{formatCountdown(msUntilNextDay(now))}</span>
      </span>
    </p>
  );
}
