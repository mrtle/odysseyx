"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import type { StoryAnalysis, StoryRequest } from "@/lib/ai/schemas";
import { STORY_FORMATS, type StoryFormat } from "@/lib/constants";
import { toCoachProfile } from "@/lib/api";
import { FRAMEWORKS, FRAMEWORK_LIST, isFrameworkId, type FrameworkId } from "@/lib/frameworks";
import { labEntryKey, useAppStore } from "@/lib/store";
import type { CoachMode } from "@/lib/types";
import { cn, wordCount } from "@/lib/utils";
import { AnalysisProgress } from "./analysis-progress";
import { INPUT_LABELS, composeLabInput, extraValue, parseLabInput } from "./lab-input";
import { STORY_FORMAT_OPTIONS, deriveTitle } from "./lab-meta";
import { FieldMeta, RequestError, SavedNotice } from "./lab-ui";
import { CRAFT_TIPS, SAMPLE_STORIES } from "./samples";
import { forgetRevisionProgress } from "./revision-checklist";
import { StoryResult } from "./story-result";
import { useEntryPrefill, useLabRequest } from "./use-lab-request";
import { useRevealOnChange } from "./use-reveal";

interface StoryResponse {
  analysis: StoryAnalysis;
  mode: CoachMode;
}

const MIN_CHARS = 80;
const MAX_CHARS = 30000;

function formatFromLabel(label: string | undefined): StoryFormat | undefined {
  if (!label) return undefined;
  return STORY_FORMATS.find((f) => STORY_FORMAT_OPTIONS[f].label === label || f === label);
}

/**
 * The Story Doctor reading `?from=` ("Run again") and `?framework=` from the
 * URL on the client, so the page can be prerendered. Render inside <Suspense>.
 */
export function StoryToolFromUrl() {
  const params = useSearchParams();
  const framework = params.get("framework");
  return <StoryTool fromEntryId={params.get("from") ?? undefined} initialFramework={isFrameworkId(framework) ? framework : undefined} />;
}

/** Story Doctor: form, framework picker, loading state and results. */
export function StoryTool({ fromEntryId, initialFramework }: { fromEntryId?: string; initialFramework?: FrameworkId }) {
  const { ready, entry } = useEntryPrefill("story", fromEntryId);
  if (!ready) return <Skeleton className="h-[36rem] rounded-2xl" />;
  const parts = entry ? parseLabInput(entry.input) : null;
  return (
    <StoryWorkbench
      key={entry?.id ?? "new"}
      initial={{
        title: entry?.title && entry.title !== deriveTitle(parts?.main ?? "") ? entry.title : "",
        text: parts?.main ?? "",
        framework: entry?.framework ?? initialFramework ?? "three-act",
        format: formatFromLabel(parts ? extraValue(parts, INPUT_LABELS.format) : undefined) ?? "short-film",
      }}
    />
  );
}

interface StoryInitial {
  title: string;
  text: string;
  framework: FrameworkId;
  format: StoryFormat;
}

function StoryWorkbench({ initial }: { initial: StoryInitial }) {
  const id = useId();
  const [title, setTitle] = useState(initial.title);
  const [text, setText] = useState(initial.text);
  const [framework, setFramework] = useState<FrameworkId>(initial.framework);
  const [format, setFormat] = useState<StoryFormat>(initial.format);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<(StoryResponse & { entryId: string; runId: number; xpGained: number; replaced: boolean }) | null>(null);
  const request = useLabRequest<StoryRequest, StoryResponse>("/api/lab/story");
  const addLabEntry = useAppStore((s) => s.addLabEntry);
  const headingRef = useRevealOnChange<HTMLHeadingElement>(result?.runId);
  /** Counts submissions, so a re-run that updates the same saved entry still reveals the fresh result. */
  const runs = useRef(0);

  const trimmed = text.trim();
  const words = wordCount(text);
  const tooShort = trimmed.length < MIN_CHARS;
  const invalid = showValidation && tooShort;
  const chosen = FRAMEWORKS[framework];

  async function submit() {
    if (request.pending) return;
    if (tooShort) {
      setShowValidation(true);
      return;
    }
    const cleanTitle = title.trim();
    const data = await request.run({
      title: cleanTitle || undefined,
      text: trimmed,
      framework,
      format,
      profile: toCoachProfile(useAppStore.getState().profile),
    });
    if (!data) return;
    const entry = {
      tool: "story" as const,
      title: cleanTitle || deriveTitle(trimmed),
      input: composeLabInput(trimmed, [{ label: INPUT_LABELS.format, value: STORY_FORMAT_OPTIONS[format].label }]),
      framework,
      result: data.analysis,
      mode: data.mode,
    };
    const previous = useAppStore.getState().labEntries.find((e) => labEntryKey(e) === labEntryKey(entry));
    const saved = addLabEntry(entry);
    // Re-running the same draft updates its saved entry in place; ticks on an older, different plan no longer apply.
    if (saved.replaced && previous?.tool === "story" && previous.result.revisionPlan.join("\n") !== data.analysis.revisionPlan.join("\n")) {
      forgetRevisionProgress(saved.id);
    }
    setResult({ ...data, entryId: saved.id, runId: ++runs.current, xpGained: saved.xpGained, replaced: saved.replaced });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function loadSample(sampleId: string) {
    const sample = SAMPLE_STORIES.find((s) => s.id === sampleId);
    if (!sample) return;
    setTitle(sample.title);
    setText(sample.text);
    setFormat(sample.format);
    setFramework(sample.framework);
    setShowValidation(false);
  }

  return (
    <>
      <Card>
        <form onSubmit={onSubmit} noValidate aria-label="Story Doctor" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-title`} className="label">
                Title <span className="font-normal text-sea-400">(optional)</span>
              </label>
              <input
                id={`${id}-title`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="e.g. Night Ferry"
                autoComplete="off"
                className="field"
              />
            </div>
            <div>
              <label htmlFor={`${id}-format`} className="label">
                Format
              </label>
              <select
                id={`${id}-format`}
                value={format}
                onChange={(e) => setFormat(e.target.value as StoryFormat)}
                aria-describedby={`${id}-format-hint`}
                className="field appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238ea0c4' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                }}
              >
                {STORY_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {STORY_FORMAT_OPTIONS[f].label}
                  </option>
                ))}
              </select>
              <p id={`${id}-format-hint`} className="mt-1.5 text-xs text-sea-400">
                {STORY_FORMAT_OPTIONS[format].hint}
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="label">Structure framework</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FRAMEWORK_LIST.map((f) => (
                <label key={f.id} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name={`${id}-framework`}
                    value={f.id}
                    checked={framework === f.id}
                    onChange={() => setFramework(f.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-full flex-col rounded-xl border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-bronze-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-sea-900",
                      framework === f.id ? "border-bronze-400/70 bg-bronze-500/10" : "border-sea-700 bg-sea-950/40 hover:border-sea-500",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm font-semibold", framework === f.id ? "text-bronze-200" : "text-sea-100")}>{f.name}</span>
                      <span className="text-[11px] text-sea-400 tabular-nums">{f.beats.length} beats</span>
                    </span>
                    <span className="mt-1 text-xs leading-relaxed text-sea-300">{f.bestFor}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-sea-700/70 bg-sea-950/40 p-4" aria-live="polite">
              <p className="text-sm leading-relaxed text-sea-200">
                <span className="font-semibold text-sea-100">{chosen.name}.</span> {chosen.summary}
              </p>
              <ol className="mt-3 flex flex-wrap gap-1.5" aria-label={`${chosen.name} beats`}>
                {chosen.beats.map((b, i) => (
                  <li
                    key={`${b.name}-${i}`}
                    title={b.description}
                    className="rounded-md border border-sea-600/80 bg-sea-800/60 px-2 py-0.5 text-[11px] font-medium text-sea-200"
                  >
                    <span className="mr-1 text-sea-400">{i + 1}</span>
                    {b.name}
                  </li>
                ))}
              </ol>
            </div>
          </fieldset>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`${id}-text`} className="label mb-0">
                Your story
              </label>
              <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Load a sample">
                <span className="mr-1 text-xs text-sea-400">Samples:</span>
                {SAMPLE_STORIES.map((s) => (
                  <Button key={s.id} variant="ghost" size="sm" onClick={() => loadSample(s.id)} className="h-7 px-2 text-xs">
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <textarea
              id={`${id}-text`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (showValidation && e.target.value.trim().length >= MIN_CHARS) setShowValidation(false);
              }}
              rows={16}
              maxLength={MAX_CHARS}
              placeholder="Paste a story, treatment, outline or scene. Paragraph breaks help the coach find your beats."
              aria-describedby={`${id}-text-hint${invalid ? ` ${id}-text-error` : ""}`}
              aria-invalid={invalid || undefined}
              className={cn("field mt-2 min-h-72 resize-y leading-7", invalid && "border-wine-500/70")}
            />
            <FieldMeta
              id={`${id}-text-hint`}
              count={`${words.toLocaleString()} ${words === 1 ? "word" : "words"}`}
              max={text.length > MAX_CHARS * 0.8 ? `${MAX_CHARS.toLocaleString()} characters` : undefined}
            >
              {words < 150
                ? "Anything from a 150-word pitch to a full treatment works."
                : `About ${Math.max(1, Math.round(words / 200))} min to read aloud.`}
            </FieldMeta>
            {invalid ? (
              <p id={`${id}-text-error`} className="mt-2 text-sm text-wine-400">
                Give the coach a little more to work with — at least a paragraph ({MIN_CHARS} characters).
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-sea-700/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-sea-400">
              <BookOpen className="size-4" aria-hidden />
              Mapping against {chosen.name} as a {STORY_FORMAT_OPTIONS[format].label.toLowerCase()}.
            </p>
            <Button type="submit" size="lg" loading={request.pending} icon={<ScrollText className="size-5" aria-hidden />}>
              {request.pending ? "Reading…" : "Get story notes"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 space-y-4">
        {request.pending ? (
          <AnalysisProgress
            title="The story editor is reading your draft"
            stages={["Reading the draft", `Mapping ${chosen.name} beats`, "Writing line notes"]}
            tips={CRAFT_TIPS.story}
            onCancel={request.cancel}
          />
        ) : request.error ? (
          <RequestError message={request.error} onRetry={() => void submit()} onDismiss={request.clearError} />
        ) : result ? (
          <>
            <SavedNotice entryId={result.entryId} xpGained={result.xpGained} replaced={result.replaced} />
            <StoryResult key={result.runId} analysis={result.analysis} mode={result.mode} entryId={result.entryId} headingRef={headingRef} />
          </>
        ) : null}
      </div>
    </>
  );
}
