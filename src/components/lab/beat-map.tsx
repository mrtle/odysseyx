"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Lightbulb, Minus, TriangleAlert, X } from "lucide-react";
import type { BeatStatus, StoryAnalysis } from "@/lib/ai/schemas";
import { FRAMEWORKS, type FrameworkId } from "@/lib/frameworks";
import { cn } from "@/lib/utils";
import { BEAT_STATUS_META } from "./lab-meta";

type Beat = StoryAnalysis["beats"][number];

const STATUS_ORDER: BeatStatus[] = ["strong", "present", "weak", "missing"];

function StatusGlyph({ status, className }: { status: BeatStatus; className?: string }) {
  const cls = cn("size-3.5", className);
  if (status === "strong") return <Check className={cls} strokeWidth={3} aria-hidden />;
  if (status === "present") return <Minus className={cls} strokeWidth={3} aria-hidden />;
  if (status === "weak") return <TriangleAlert className={cls} strokeWidth={2.5} aria-hidden />;
  return <X className={cls} strokeWidth={2.5} aria-hidden />;
}

function Marker({ status, size = "md" }: { status: BeatStatus; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-transform",
        size === "md" ? "size-8" : "size-6",
        BEAT_STATUS_META[status].marker,
      )}
    >
      <StatusGlyph status={status} className={size === "sm" ? "size-3" : undefined} />
    </span>
  );
}

function StatusBadge({ status }: { status: BeatStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", BEAT_STATUS_META[status].badge)}>
      <StatusGlyph status={status} className="size-3" />
      {BEAT_STATUS_META[status].label}
    </span>
  );
}

function BeatDetail({ beat, description, position }: { beat: Beat; description?: string; position?: number }) {
  return (
    <div className="space-y-3">
      {description ? (
        <p className="text-sm text-sea-400 italic">
          {position !== undefined ? <span className="not-italic">~{Math.round(position * 100)}% through · </span> : null}
          {description}
        </p>
      ) : null}
      {beat.evidence.trim() ? (
        <blockquote className="border-l-2 border-sea-500 pl-3 font-display text-base leading-relaxed text-sea-100">“{beat.evidence}”</blockquote>
      ) : (
        <p className="rounded-lg border border-dashed border-sea-600 px-3 py-2 text-sm text-sea-300">Nothing in the draft lands here yet.</p>
      )}
      <p className="flex gap-2 text-sm leading-relaxed text-sea-200">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-bronze-300" aria-hidden />
        <span>{beat.suggestion}</span>
      </p>
    </div>
  );
}

/**
 * The story laid out against the framework: a horizontal timeline of beat
 * markers on wider screens (arrow keys move between beats), a stacked list
 * of expandable beats on phones.
 */
export function BeatMap({ beats, framework }: { beats: Beat[]; framework: FrameworkId }) {
  const id = useId();
  const defs = FRAMEWORKS[framework].beats;
  const firstNeedingWork = beats.findIndex((b) => b.status === "weak" || b.status === "missing");
  const [selected, setSelected] = useState(firstNeedingWork >= 0 ? firstNeedingWork : 0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = beats[Math.min(selected, beats.length - 1)];

  // Up to nine beats share the width on large screens; longer frameworks scroll.
  const compact = beats.length <= 9;
  const counts = STATUS_ORDER.map((status) => ({ status, count: beats.filter((b) => b.status === status).length }));

  function focusBeat(index: number) {
    const next = (index + beats.length) % beats.length;
    setSelected(next);
    const el = tabs.current[next];
    el?.focus();
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: beats.length - 1 };
    if (e.key in keys) {
      e.preventDefault();
      focusBeat(keys[e.key]);
    }
  }

  if (beats.length === 0) return null;

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-sea-300" aria-label="Legend">
        {counts.map(({ status, count }) => (
          <li key={status} className="flex items-center gap-1.5" title={BEAT_STATUS_META[status].description}>
            <Marker status={status} size="sm" />
            <span className={cn("font-semibold", BEAT_STATUS_META[status].text)}>{BEAT_STATUS_META[status].label}</span>
            <span className="text-sea-400 tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      {/* Timeline (tablet and up) */}
      <div className="hidden md:block">
        {/* The padding keeps the selected marker's ring and the focus outline inside the scroller, which clips on both axes. */}
        <div className="-mx-1.5 overflow-x-auto px-1.5 pt-1.5 pb-2">
          <div role="tablist" aria-label="Story beats" className={cn("relative flex min-w-max gap-1", compact && "lg:min-w-0")}>
            <span aria-hidden className="absolute top-4 right-8 left-8 h-0.5 bg-gradient-to-r from-sea-600 via-sea-500 to-sea-600" />
            {beats.map((beat, i) => {
              const active = i === selected;
              return (
                <button
                  key={`${beat.beat}-${i}`}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${i}`}
                  aria-selected={active}
                  aria-controls={`${id}-panel`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSelected(i)}
                  onFocus={() => setSelected(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "group relative flex w-24 flex-col items-center gap-2 rounded-xl px-1 pt-0 pb-2 text-center transition-colors",
                    compact && "lg:w-auto lg:min-w-0 lg:flex-1",
                    active ? "bg-sea-800/70" : "hover:bg-sea-800/40",
                  )}
                >
                  <span className={cn("relative rounded-full ring-offset-2 ring-offset-sea-900", active && "ring-2 ring-bronze-400")}>
                    <Marker status={beat.status} />
                  </span>
                  <span className={cn("line-clamp-2 text-[11px] leading-tight font-medium", active ? "text-sea-100" : "text-sea-300")}>{beat.beat}</span>
                  <span className="sr-only">— {BEAT_STATUS_META[beat.status].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${selected}`}
          className="mt-3 rounded-xl border border-sea-700/80 bg-sea-950/50 p-5"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold tracking-[0.18em] text-sea-400 uppercase">
              Beat {selected + 1} of {beats.length}
            </p>
            <h3 className="font-display text-lg font-semibold text-sea-100">{current.beat}</h3>
            <StatusBadge status={current.status} />
          </div>
          <BeatDetail beat={current} description={defs[selected]?.description} position={defs[selected]?.position} />
        </div>
      </div>

      {/* Stacked list (phones) */}
      <ol className="space-y-2 md:hidden">
        {beats.map((beat, i) => (
          <li key={`${beat.beat}-${i}`}>
            <details className="group rounded-xl border border-sea-700/80 bg-sea-950/40 open:bg-sea-900/70" open={i === selected}>
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                <Marker status={beat.status} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-sea-100">{beat.beat}</span>
                  <span className={cn("block text-xs", BEAT_STATUS_META[beat.status].text)}>{BEAT_STATUS_META[beat.status].label}</span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-sea-400 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="border-t border-sea-700/70 p-3">
                <BeatDetail beat={beat} description={defs[i]?.description} />
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
