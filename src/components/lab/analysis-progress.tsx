"use client";

import { useEffect, useState } from "react";
import { Check, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, ThinkingDots } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const TIP_SECONDS = 8;
const STAGE_SECONDS = 7;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The waiting room for a long analysis: progress stages, a rotating craft
 * tip, elapsed time and a cancel button. Live analyses can take up to a
 * minute, so the wait should teach something.
 */
export function AnalysisProgress({
  title,
  stages,
  tips,
  onCancel,
  className,
}: {
  title: string;
  stages: string[];
  tips: string[];
  onCancel: () => void;
  className?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const stageIndex = Math.min(stages.length - 1, Math.floor(elapsed / STAGE_SECONDS));
  const tipIndex = Math.floor(elapsed / TIP_SECONDS) % Math.max(tips.length, 1);
  const tip = tips[tipIndex];

  return (
    <Card className={cn("animate-rise overflow-hidden", className)} aria-busy="true">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <ThinkingDots label={title} />
            <h2 className="font-display text-lg font-semibold text-sea-100">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-sea-300">
            <span aria-hidden>{formatElapsed(elapsed)} · </span>
            {elapsed >= 20 ? "A careful read takes a moment — live analyses can run up to a minute." : "This usually takes a few seconds in demo mode, longer with the live coach."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onCancel} icon={<X className="size-4" aria-hidden />}>
          Cancel
        </Button>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="Progress">
        {stages.map((stage, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          return (
            <li
              key={stage}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                done && "border-emerald-500/30 bg-emerald-500/5 text-emerald-200",
                current && "border-bronze-500/40 bg-bronze-500/10 text-bronze-200",
                !done && !current && "border-sea-700 text-sea-400",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  done ? "border-emerald-400 bg-emerald-400 text-sea-950" : current ? "border-bronze-400 text-bronze-300" : "border-sea-600 text-sea-400",
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="min-w-0">{stage}</span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {stages[stageIndex]}
      </p>

      {tip ? (
        <div className="mt-5 flex gap-3 rounded-xl border border-sea-700/80 bg-sea-950/50 p-4">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-bronze-300" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-bronze-400 uppercase">While you wait</p>
            <p key={tipIndex} className="mt-1 animate-fade-in text-sm leading-relaxed text-sea-200">
              {tip}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3" aria-hidden>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </Card>
  );
}
