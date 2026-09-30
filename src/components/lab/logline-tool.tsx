"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { Shuffle, Stethoscope } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import type { LoglineAnalysis, LoglineRequest } from "@/lib/ai/schemas";
import { toCoachProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { CoachMode } from "@/lib/types";
import { cn, wordCount } from "@/lib/utils";
import { AnalysisProgress } from "./analysis-progress";
import { INPUT_LABELS, composeLabInput, extraValue, parseLabInput } from "./lab-input";
import { GENRE_SUGGESTIONS, LOGLINE_COMPONENT_META, LOGLINE_IDEAL_WORDS, deriveTitle } from "./lab-meta";
import { FieldMeta, RequestError, SavedNotice } from "./lab-ui";
import { LoglineResult } from "./logline-result";
import { CRAFT_TIPS, SAMPLE_LOGLINES, type SampleLogline } from "./samples";
import { useEntryPrefill, useLabRequest } from "./use-lab-request";
import { useRevealOnChange } from "./use-reveal";

interface LoglineResponse {
  analysis: LoglineAnalysis;
  mode: CoachMode;
}

const MAX_CHARS = 1200;

const QUALITY_TONE: Record<SampleLogline["quality"], BadgeTone> = { weak: "wine", promising: "bronze", strong: "success" };
const QUALITY_LABEL: Record<SampleLogline["quality"], string> = { weak: "Weak example", promising: "Promising example", strong: "Strong example" };

function lengthHint(words: number): { text: string; tone: string } {
  const { min, max } = LOGLINE_IDEAL_WORDS;
  if (words === 0) return { text: `Most strong loglines run ${min}–${max} words, in one sentence.`, tone: "text-sea-300" };
  if (words < 12) return { text: `Keep going — most strong loglines run ${min}–${max} words.`, tone: "text-sea-300" };
  if (words < min) return { text: `A little lean. There's room for a flaw, an obstacle or a deadline (aim for ${min}–${max}).`, tone: "text-amber-200" };
  if (words <= max) return { text: "In the sweet spot for length.", tone: "text-emerald-300" };
  if (words <= 60) return { text: `Running long — try to land it in ${max} words or fewer.`, tone: "text-amber-200" };
  return { text: "That's closer to a synopsis. Cut to who, wants what, against what, or else.", tone: "text-rose-300" };
}

function LengthMeter({ words }: { words: number }) {
  const scaleMax = 60;
  const { min, max } = LOGLINE_IDEAL_WORDS;
  const inRange = words >= min && words <= max;
  return (
    <div aria-hidden className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sea-800">
      <span className="absolute inset-y-0 bg-emerald-400/20" style={{ left: `${(min / scaleMax) * 100}%`, width: `${((max - min) / scaleMax) * 100}%` }} />
      <span
        className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-300", inRange ? "bg-emerald-400" : "bg-bronze-400")}
        style={{ width: `${(Math.min(words, scaleMax) / scaleMax) * 100}%` }}
      />
    </div>
  );
}

/** Logline Doctor: form, loading state and results. Pre-fills from a saved entry for "Run again". */
export function LoglineTool({ fromEntryId }: { fromEntryId?: string }) {
  const { ready, entry } = useEntryPrefill("logline", fromEntryId);
  if (!ready) return <Skeleton className="h-80 rounded-2xl" />;
  const parts = entry ? parseLabInput(entry.input) : null;
  return (
    <LoglineWorkbench
      key={entry?.id ?? "new"}
      initialLogline={parts?.main ?? ""}
      initialGenre={(parts && extraValue(parts, INPUT_LABELS.genre)) ?? ""}
    />
  );
}

function LoglineWorkbench({ initialLogline, initialGenre }: { initialLogline: string; initialGenre: string }) {
  const id = useId();
  const [logline, setLogline] = useState(initialLogline);
  const [genre, setGenre] = useState(initialGenre);
  const [example, setExample] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<(LoglineResponse & { entryId: string; logline: string }) | null>(null);
  const request = useLabRequest<LoglineRequest, LoglineResponse>("/api/lab/logline");
  const addLabEntry = useAppStore((s) => s.addLabEntry);
  const headingRef = useRevealOnChange<HTMLHeadingElement>(result?.entryId);

  const trimmed = logline.trim();
  const words = wordCount(logline);
  const hint = lengthHint(words);
  const tooShort = trimmed.length < 10;
  const invalid = showValidation && tooShort;

  async function submit() {
    if (request.pending) return;
    if (tooShort) {
      setShowValidation(true);
      return;
    }
    const cleanGenre = genre.trim();
    const data = await request.run({
      logline: trimmed,
      genre: cleanGenre || undefined,
      profile: toCoachProfile(useAppStore.getState().profile),
    });
    if (!data) return;
    const saved = addLabEntry({
      tool: "logline",
      title: deriveTitle(trimmed),
      input: composeLabInput(trimmed, [{ label: INPUT_LABELS.genre, value: cleanGenre }]),
      result: data.analysis,
      mode: data.mode,
    });
    setResult({ ...data, entryId: saved.id, logline: trimmed });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submit();
    }
  }

  function loadExample() {
    const next = example === null ? 0 : (example + 1) % SAMPLE_LOGLINES.length;
    setExample(next);
    setLogline(SAMPLE_LOGLINES[next].logline);
    setGenre(SAMPLE_LOGLINES[next].genre);
    setShowValidation(false);
  }

  const sample = example !== null ? SAMPLE_LOGLINES[example] : null;
  const sampleActive = sample !== null && sample.logline === logline;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <form onSubmit={onSubmit} noValidate aria-label="Logline Doctor">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`${id}-logline`} className="label mb-0">
                Your logline
              </label>
              <Button variant="ghost" size="sm" onClick={loadExample} icon={<Shuffle className="size-4" aria-hidden />}>
                {example === null ? "Try an example" : "Another example"}
              </Button>
            </div>
            <textarea
              id={`${id}-logline`}
              value={logline}
              onChange={(e) => {
                setLogline(e.target.value);
                if (showValidation && e.target.value.trim().length >= 10) setShowValidation(false);
              }}
              onKeyDown={onKeyDown}
              rows={4}
              maxLength={MAX_CHARS}
              placeholder="When [something happens], a [specific, flawed protagonist] must [goal] before [what's at stake]."
              aria-describedby={`${id}-hint${invalid ? ` ${id}-error` : ""}`}
              aria-invalid={invalid || undefined}
              className={cn("field mt-2 resize-y font-display text-lg leading-relaxed", invalid && "border-wine-500/70")}
            />
            <LengthMeter words={words} />
            <FieldMeta id={`${id}-hint`} count={`${words} ${words === 1 ? "word" : "words"}`}>
              <span className={hint.tone}>{hint.text}</span>
            </FieldMeta>
            {invalid ? (
              <p id={`${id}-error`} className="mt-2 text-sm text-wine-400">
                Write at least a full phrase (10 characters or more) so there&apos;s something to diagnose.
              </p>
            ) : null}
            {sampleActive && sample ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sea-300">
                <Badge tone={QUALITY_TONE[sample.quality]}>{QUALITY_LABEL[sample.quality]}</Badge>
                {sample.note}
              </p>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div>
                <label htmlFor={`${id}-genre`} className="label">
                  Genre <span className="font-normal text-sea-400">(optional)</span>
                </label>
                <input
                  id={`${id}-genre`}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  list={`${id}-genres`}
                  maxLength={80}
                  placeholder="e.g. Thriller"
                  autoComplete="off"
                  className="field"
                />
                <datalist id={`${id}-genres`}>
                  {GENRE_SUGGESTIONS.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
              <Button type="submit" size="lg" loading={request.pending} icon={<Stethoscope className="size-5" aria-hidden />}>
                {request.pending ? "Diagnosing…" : "Diagnose logline"}
              </Button>
            </div>
            <p className="mt-3 hidden text-xs text-sea-400 sm:block">
              Press <kbd className="rounded border border-sea-600 bg-sea-800 px-1 font-sans">Ctrl</kbd> /{" "}
              <kbd className="rounded border border-sea-600 bg-sea-800 px-1 font-sans">⌘</kbd> +{" "}
              <kbd className="rounded border border-sea-600 bg-sea-800 px-1 font-sans">Enter</kbd> to diagnose.
            </p>
          </form>
        </Card>

        <aside aria-labelledby={`${id}-vitals`} className="rounded-2xl border border-sea-700/60 bg-sea-900/30 p-5">
          <h2 id={`${id}-vitals`} className="font-display text-base font-semibold text-sea-100">
            The six vital signs
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {Object.values(LOGLINE_COMPONENT_META).map((c) => (
              <li key={c.label}>
                <span className="font-medium text-bronze-200">{c.label}</span>
                <span className="block text-sea-300">{c.question}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-sea-700/70 pt-4 text-xs leading-relaxed text-sea-400">
            The classic shape: <em className="text-sea-300">When [inciting incident], a [flawed protagonist] must [goal] before [stakes].</em>
          </p>
        </aside>
      </div>

      <div className="mt-8 space-y-4">
        {request.pending ? (
          <AnalysisProgress
            title="The doctor is examining your logline"
            stages={["Reading the premise", "Checking the vital signs", "Drafting rewrites"]}
            tips={CRAFT_TIPS.logline}
            onCancel={request.cancel}
          />
        ) : request.error ? (
          <RequestError message={request.error} onRetry={() => void submit()} onDismiss={request.clearError} />
        ) : result ? (
          <>
            <SavedNotice entryId={result.entryId} />
            <LoglineResult analysis={result.analysis} mode={result.mode} logline={result.logline} headingRef={headingRef} />
          </>
        ) : null}
      </div>
    </>
  );
}
