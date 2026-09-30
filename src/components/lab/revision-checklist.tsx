"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

/** localStorage key prefix for revision-plan ticks, one key per saved entry id. */
export const REVISION_PROGRESS_PREFIX = "odysseusx-lab-plan:";
const STORAGE_PREFIX = REVISION_PROGRESS_PREFIX;

/** Drop the remembered ticks for a saved entry (call when the entry is deleted). */
export function forgetRevisionProgress(entryId: string): void {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + entryId);
  } catch {
    // storage unavailable — nothing was remembered
  }
}

function readChecked(storageKey: string | undefined, length: number): boolean[] {
  const empty = Array.from({ length }, () => false);
  if (!storageKey || typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return empty;
    return empty.map((_, i) => parsed[i] === true);
  } catch {
    return empty;
  }
}

/**
 * The revision plan as a checklist. With a `storageKey` (the saved entry's
 * id) progress is remembered on this device. Rendered only on the client
 * (after a fetch or behind the store's hydration gate), so reading
 * localStorage in the initialiser can't cause a hydration mismatch.
 */
export function RevisionChecklist({ steps, storageKey }: { steps: string[]; storageKey?: string }) {
  const id = useId();
  const [checked, setChecked] = useState(() => readChecked(storageKey, steps.length));
  const done = checked.filter(Boolean).length;

  function toggle(index: number) {
    const next = checked.map((v, i) => (i === index ? !v : v));
    setChecked(next);
    if (!storageKey) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(next));
    } catch {
      // storage full or unavailable — the checklist still works for this visit
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={steps.length ? done / steps.length : 0} label="Revision progress" className="flex-1" />
        <span className="shrink-0 text-xs text-sea-300 tabular-nums" aria-live="polite">
          {done} of {steps.length} done
        </span>
      </div>
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const inputId = `${id}-step-${i}`;
          return (
            <li key={i}>
              <label
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  checked[i] ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-sea-700/80 bg-sea-950/40 hover:border-sea-500",
                )}
              >
                <input id={inputId} type="checkbox" checked={checked[i] ?? false} onChange={() => toggle(i)} className="peer sr-only" />
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-bronze-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-sea-900",
                    checked[i] ? "border-emerald-400 bg-emerald-400 text-sea-950" : "border-sea-500",
                  )}
                >
                  {checked[i] ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
                <span className={cn("text-sm leading-relaxed", checked[i] ? "text-sea-400 line-through decoration-sea-500" : "text-sea-100")}>
                  <span className="mr-1.5 font-display font-semibold text-bronze-300">{i + 1}.</span>
                  {step}
                </span>
              </label>
            </li>
          );
        })}
      </ol>
      {storageKey ? <p className="mt-3 text-xs text-sea-400">Your ticks are remembered on this device.</p> : null}
    </div>
  );
}
