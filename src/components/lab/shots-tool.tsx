"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import type { ShotPlan, ShotsRequest } from "@/lib/ai/schemas";
import { toCoachProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { CoachMode } from "@/lib/types";
import { cn, wordCount } from "@/lib/utils";
import { AnalysisProgress } from "./analysis-progress";
import { INPUT_LABELS, composeLabInput, extraValue, parseLabInput } from "./lab-input";
import { deriveTitle } from "./lab-meta";
import { FieldMeta, RequestError, SavedNotice } from "./lab-ui";
import { CRAFT_TIPS, DIRECTING_INTENT_IDEAS, SAMPLE_SCENES } from "./samples";
import { ShotPlanResult } from "./shot-plan-result";
import { useEntryPrefill, useLabRequest } from "./use-lab-request";
import { useRevealOnChange } from "./use-reveal";

interface ShotsResponse {
  plan: ShotPlan;
  mode: CoachMode;
}

const MIN_CHARS = 40;
const MAX_SCENE = 12000;
const MAX_INTENT = 1000;
const MAX_SHOTS = 4000;

/** The Shot Planner reading "Run again" (`?from=`) from the URL on the client. Render inside <Suspense>. */
export function ShotsToolFromUrl() {
  const from = useSearchParams().get("from");
  return <ShotsTool fromEntryId={from ?? undefined} />;
}

/** Shot Planner: scene, intent and shot ideas in; a shot plan out. */
export function ShotsTool({ fromEntryId }: { fromEntryId?: string }) {
  const { ready, entry } = useEntryPrefill("shots", fromEntryId);
  if (!ready) return <Skeleton className="h-[32rem] rounded-2xl" />;
  const parts = entry ? parseLabInput(entry.input) : null;
  return (
    <ShotsWorkbench
      key={entry?.id ?? "new"}
      initial={{
        scene: parts?.main ?? "",
        intent: (parts && extraValue(parts, INPUT_LABELS.intent)) ?? "",
        userShots: (parts && extraValue(parts, INPUT_LABELS.userShots)) ?? "",
      }}
    />
  );
}

function ShotsWorkbench({ initial }: { initial: { scene: string; intent: string; userShots: string } }) {
  const id = useId();
  const [scene, setScene] = useState(initial.scene);
  const [intent, setIntent] = useState(initial.intent);
  const [userShots, setUserShots] = useState(initial.userShots);
  const [showValidation, setShowValidation] = useState(false);
  const [result, setResult] = useState<(ShotsResponse & { entryId: string; runId: number; xpGained: number; replaced: boolean; title: string }) | null>(null);
  const request = useLabRequest<ShotsRequest, ShotsResponse>("/api/lab/shots");
  const addLabEntry = useAppStore((s) => s.addLabEntry);
  const headingRef = useRevealOnChange<HTMLHeadingElement>(result?.runId);
  /** Counts submissions, so a re-run that updates the same saved entry still reveals the fresh result. */
  const runs = useRef(0);

  const trimmed = scene.trim();
  const words = wordCount(scene);
  const tooShort = trimmed.length < MIN_CHARS;
  const invalid = showValidation && tooShort;
  const shotIdeas = userShots.split("\n").filter((l) => l.trim()).length;

  async function submit() {
    if (request.pending) return;
    if (tooShort) {
      setShowValidation(true);
      return;
    }
    const cleanIntent = intent.trim();
    const cleanShots = userShots.trim();
    const data = await request.run({
      scene: trimmed,
      intent: cleanIntent || undefined,
      userShots: cleanShots || undefined,
      profile: toCoachProfile(useAppStore.getState().profile),
    });
    if (!data) return;
    const title = deriveTitle(trimmed);
    const saved = addLabEntry({
      tool: "shots",
      title,
      input: composeLabInput(trimmed, [
        { label: INPUT_LABELS.intent, value: cleanIntent },
        { label: INPUT_LABELS.userShots, value: cleanShots },
      ]),
      result: data.plan,
      mode: data.mode,
    });
    setResult({ ...data, entryId: saved.id, runId: ++runs.current, xpGained: saved.xpGained, replaced: saved.replaced, title });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void submit();
  }

  function loadSample(sampleId: string) {
    const sample = SAMPLE_SCENES.find((s) => s.id === sampleId);
    if (!sample) return;
    setScene(sample.scene);
    setIntent(sample.intent);
    setUserShots(sample.userShots);
    setShowValidation(false);
  }

  return (
    <>
      <Card>
        <form onSubmit={onSubmit} noValidate aria-label="Shot Planner" className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={`${id}-scene`} className="label mb-0">
                The scene
              </label>
              <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Load a sample scene">
                <span className="mr-1 text-xs text-sea-400">Samples:</span>
                {SAMPLE_SCENES.map((s) => (
                  <Button key={s.id} variant="ghost" size="sm" onClick={() => loadSample(s.id)} className="h-7 px-2 text-xs">
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <textarea
              id={`${id}-scene`}
              value={scene}
              onChange={(e) => {
                setScene(e.target.value);
                if (showValidation && e.target.value.trim().length >= MIN_CHARS) setShowValidation(false);
              }}
              rows={14}
              maxLength={MAX_SCENE}
              spellCheck={false}
              placeholder={"INT. KITCHEN - NIGHT\n\nRain on the windows. MARA stands at the stove...\n\nScreenplay format or plain prose both work."}
              aria-describedby={`${id}-scene-hint${invalid ? ` ${id}-scene-error` : ""}`}
              aria-invalid={invalid || undefined}
              className={cn("field screenplay mt-2 min-h-72 resize-y text-base leading-6 sm:text-[0.95rem]", invalid && "border-wine-500/70")}
            />
            <FieldMeta
              id={`${id}-scene-hint`}
              count={`${words.toLocaleString()} ${words === 1 ? "word" : "words"}`}
              max={scene.length > MAX_SCENE * 0.8 ? `${MAX_SCENE.toLocaleString()} characters` : undefined}
            >
              Sluglines (INT./EXT.) and character cues help the planner find locations and speakers.
            </FieldMeta>
            {invalid ? (
              <p id={`${id}-scene-error`} className="mt-2 text-sm text-wine-400">
                Add a little more of the scene — at least a few lines of action ({MIN_CHARS} characters).
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${id}-intent`} className="label">
              Directing intent <span className="font-normal text-sea-400">(optional)</span>
            </label>
            <textarea
              id={`${id}-intent`}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={2}
              maxLength={MAX_INTENT}
              placeholder="What should the audience feel? e.g. Quiet and tense — a secret surfacing without anyone saying it."
              aria-describedby={`${id}-intent-ideas`}
              className="field resize-y"
            />
            <div id={`${id}-intent-ideas`} className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Intent ideas">
              <span className="text-xs text-sea-400">Ideas:</span>
              {DIRECTING_INTENT_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setIntent(idea)}
                  aria-pressed={intent === idea}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    intent === idea ? "border-bronze-400/60 bg-bronze-500/15 text-bronze-200" : "border-sea-600 text-sea-300 hover:border-sea-500 hover:text-sea-100",
                  )}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-shots`} className="label">
              Your shot ideas <span className="font-normal text-sea-400">(optional — one per line)</span>
            </label>
            <textarea
              id={`${id}-shots`}
              value={userShots}
              onChange={(e) => setUserShots(e.target.value)}
              rows={4}
              maxLength={MAX_SHOTS}
              placeholder={"Wide on the lighthouse as the storm rolls in\nClose-up on the envelope as Tom slides it across"}
              aria-describedby={`${id}-shots-hint`}
              className="field resize-y"
            />
            <p id={`${id}-shots-hint`} className="mt-1.5 text-xs text-sea-400">
              {shotIdeas > 0 ? `${shotIdeas} idea${shotIdeas === 1 ? "" : "s"} — each gets a specific note.` : "Already have shots in mind? List them and the planner will give you notes on each."}
            </p>
          </div>

          <div className="flex justify-end border-t border-sea-700/70 pt-5">
            <Button type="submit" size="lg" loading={request.pending} icon={<Clapperboard className="size-5" aria-hidden />}>
              {request.pending ? "Planning…" : "Plan the shots"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-8 space-y-4">
        {request.pending ? (
          <AnalysisProgress
            title="Your cinematographer is breaking down the scene"
            stages={["Reading the scene", "Blocking the coverage", "Writing coverage notes"]}
            tips={CRAFT_TIPS.shots}
            onCancel={request.cancel}
          />
        ) : request.error ? (
          <RequestError message={request.error} onRetry={() => void submit()} onDismiss={request.clearError} />
        ) : result ? (
          <>
            <SavedNotice entryId={result.entryId} xpGained={result.xpGained} replaced={result.replaced} />
            <ShotPlanResult plan={result.plan} mode={result.mode} title={result.title} headingRef={headingRef} />
          </>
        ) : null}
      </div>
    </>
  );
}
