"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Ref } from "react";
import { FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading";
import { ScoreRing } from "@/components/ui/score-ring";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { LabEntry, LabToolId } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { LAB_TOOLS, LAB_TOOL_LIST, entryHref, entryScore } from "./lab-meta";
import { forgetRevisionProgress } from "./revision-checklist";

type Filter = "all" | LabToolId;

function HistoryItem({ entry, onDelete, linkRef }: { entry: LabEntry; onDelete: () => void; linkRef: Ref<HTMLAnchorElement> }) {
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const trashRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Opening the confirmation focuses "Keep"; cancelling it (Keep or Escape) returns focus to the trash button.
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
    else if (wasConfirming.current) trashRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  const tool = LAB_TOOLS[entry.tool];
  const Icon = tool.icon;
  const score = entryScore(entry);

  return (
    <li
      className="group relative flex items-center gap-3 rounded-xl border border-sea-700/80 bg-sea-900/60 p-3 transition-colors focus-within:border-sea-500 hover:border-sea-500 sm:gap-4 sm:p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape" && confirming) setConfirming(false);
      }}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tool.accent.tile)} aria-hidden>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          ref={linkRef}
          href={entryHref(entry.id)}
          className="line-clamp-2 font-medium text-sea-100 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-bronze-400/80 group-hover:text-bronze-200"
        >
          {entry.title}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-sea-400">
          {tool.name} · <time dateTime={entry.createdAt}>{formatRelative(entry.createdAt)}</time>
          {entry.mode === "demo" ? " · Demo coach" : ""}
        </p>
      </div>

      {score !== null ? (
        <ScoreRing score={score} size={44} stroke={4} className={cn("shrink-0", confirming && "hidden sm:inline-flex")} />
      ) : entry.tool === "shots" ? (
        <span className={cn("shrink-0 rounded-full border border-sea-600 px-2.5 py-1 text-xs text-sea-300 tabular-nums", confirming && "hidden sm:inline")}>
          {entry.result.shots.length} shots
        </span>
      ) : null}

      <div className="relative z-10 flex shrink-0 items-center gap-1">
        {confirming ? (
          <>
            <Button variant="danger" size="sm" onClick={onDelete} aria-label={`Delete “${entry.title}”`}>
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} ref={keepRef}>
              Keep
            </Button>
          </>
        ) : (
          <button
            ref={trashRef}
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete “${entry.title}”`}
            className="flex size-9 items-center justify-center rounded-lg text-sea-400 transition-colors hover:bg-wine-600/20 hover:text-wine-400"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

/** The Story Lab logbook: every saved analysis, newest first, filterable by tool. */
export function LabHistory() {
  const hydrated = useHasHydrated();
  const entries = useAppStore((s) => s.labEntries);
  const deleteLabEntry = useAppStore((s) => s.deleteLabEntry);
  const [filter, setFilter] = useState<Filter>("all");
  const [announcement, setAnnouncement] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const links = useRef(new Map<string, HTMLAnchorElement>());
  /** Where keyboard focus goes once a deleted row has unmounted: a neighbouring entry's link, or the logbook itself. */
  const focusAfterDelete = useRef<string | null>(null);

  useEffect(() => {
    const target = focusAfterDelete.current;
    if (target === null) return;
    focusAfterDelete.current = null;
    const link = links.current.get(target);
    if (link) link.focus();
    else rootRef.current?.focus();
  }, [entries]);

  function remove(entry: LabEntry, visible: LabEntry[]) {
    const index = visible.findIndex((e) => e.id === entry.id);
    const neighbour = visible[index + 1] ?? visible[index - 1];
    focusAfterDelete.current = neighbour?.id ?? "";
    forgetRevisionProgress(entry.id);
    deleteLabEntry(entry.id);
    setAnnouncement(`Deleted “${entry.title}” from your logbook.`);
  }

  const linkRef = (id: string) => (el: HTMLAnchorElement | null) => {
    if (el) links.current.set(id, el);
    else links.current.delete(id);
  };

  const status = (
    <p role="status" className="sr-only">
      {announcement}
    </p>
  );

  if (!hydrated) {
    return (
      <div className="space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[4.5rem]" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div ref={rootRef} tabIndex={-1} className="rounded-2xl focus:outline-none">
        {status}
        <EmptyState
          icon={<FlaskConical className="size-8" aria-hidden />}
          title="Your logbook is empty"
          description="Every analysis you run is saved here, so you can come back to the notes and watch your drafts improve voyage by voyage."
        />
      </div>
    );
  }

  const counts: Record<Filter, number> = {
    all: entries.length,
    logline: entries.filter((e) => e.tool === "logline").length,
    story: entries.filter((e) => e.tool === "story").length,
    shots: entries.filter((e) => e.tool === "shots").length,
  };
  const visible = filter === "all" ? entries : entries.filter((e) => e.tool === filter);
  const filters: { id: Filter; label: string }[] = [{ id: "all", label: "All" }, ...LAB_TOOL_LIST.map((t) => ({ id: t.id as Filter, label: t.name }))];

  return (
    <div ref={rootRef} tabIndex={-1} className="rounded-2xl focus:outline-none">
      {status}
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by tool">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.id ? "border-bronze-400/60 bg-bronze-500/15 text-bronze-200" : "border-sea-700 text-sea-300 hover:border-sea-500 hover:text-sea-100",
            )}
          >
            {f.label}
            <span className="text-sea-400 tabular-nums">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sea-700 px-4 py-6 text-center text-sm text-sea-300">
          Nothing from the {LAB_TOOLS[filter as LabToolId].name} yet.{" "}
          <Link href={LAB_TOOLS[filter as LabToolId].href} className="font-medium text-bronze-300 hover:text-bronze-200">
            Run your first one
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} linkRef={linkRef(entry.id)} onDelete={() => remove(entry, visible)} />
          ))}
        </ul>
      )}
    </div>
  );
}
