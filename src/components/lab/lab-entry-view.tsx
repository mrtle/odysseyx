"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileSearch, RotateCcw, Trash2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { FRAMEWORKS } from "@/lib/frameworks";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { LabEntry } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { parseLabInput } from "./lab-input";
import { LAB_TOOLS, toolHref } from "./lab-meta";
import { BackToLab } from "./lab-ui";
import { forgetRevisionProgress } from "./revision-checklist";
import { LoglineResult } from "./logline-result";
import { ShotPlanResult } from "./shot-plan-result";
import { StoryResult } from "./story-result";

function OriginalInput({ entry }: { entry: LabEntry }) {
  const parts = parseLabInput(entry.input);
  const tool = LAB_TOOLS[entry.tool];
  return (
    <details className="group mb-8 rounded-2xl border border-sea-700/80 bg-sea-900/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="font-medium text-sea-100">
          Original {tool.inputNoun}
          {entry.tool === "story" ? <span className="ml-2 text-sm font-normal text-sea-400">· {FRAMEWORKS[entry.framework].name}</span> : null}
        </span>
        <ChevronDown className="size-4 text-sea-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-sea-700/70 px-5 py-4">
        <div
          className={cn(
            "max-h-[28rem] overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-sea-200",
            entry.tool === "shots" && "screenplay",
            entry.tool === "logline" && "font-display text-base",
          )}
        >
          {parts.main}
        </div>
        {parts.extras.length > 0 ? (
          <dl className="grid gap-3 border-t border-sea-700/70 pt-4 sm:grid-cols-2">
            {parts.extras.map((x) => (
              <div key={x.label}>
                <dt className="text-xs font-semibold tracking-[0.14em] text-sea-400 uppercase">{x.label}</dt>
                <dd className="mt-1 text-sm whitespace-pre-wrap text-sea-200">{x.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </details>
  );
}

/** A saved Story Lab analysis, looked up in the browser's store by id. */
export function LabEntryView({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHasHydrated();
  const entry = useAppStore((s) => s.labEntries.find((e) => e.id === id));
  const deleteLabEntry = useAppStore((s) => s.deleteLabEntry);
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Opening the confirmation focuses "Keep"; cancelling it (Keep or Escape) returns focus to "Delete".
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
    else if (wasConfirming.current) deleteRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!hydrated || leaving) {
    return (
      <div aria-hidden>
        <Skeleton className="mb-4 h-5 w-24" />
        <Skeleton className="mb-8 h-24 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="animate-fade-in">
        <BackToLab />
        <EmptyState
          headingLevel={1}
          icon={<FileSearch className="size-8" aria-hidden />}
          title="This analysis isn't in your logbook"
          description="Saved analyses live in this browser. It may have been deleted, or saved on another device."
          action={<ButtonLink href="/lab">Back to the Story Lab</ButtonLink>}
        />
      </div>
    );
  }

  const tool = LAB_TOOLS[entry.tool];
  const created = new Date(entry.createdAt);

  function remove() {
    setLeaving(true);
    forgetRevisionProgress(id);
    deleteLabEntry(id);
    router.push("/lab");
  }

  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow={tool.name}
        title={entry.title}
        description={
          <>
            Saved <time dateTime={entry.createdAt} title={created.toLocaleString()}>{formatRelative(entry.createdAt)}</time>
            {entry.mode === "demo" ? " by the demo coach" : " by the live coach"}.
          </>
        }
        actions={
          <>
            <ButtonLink href={toolHref(entry.tool, entry.id)} icon={<RotateCcw className="size-4" aria-hidden />}>
              Run again
            </ButtonLink>
            {confirming ? (
              <span className="flex items-center gap-2" onKeyDown={(e) => e.key === "Escape" && setConfirming(false)}>
                <Button variant="danger" onClick={remove}>
                  Delete for good
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} ref={keepRef}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button ref={deleteRef} variant="secondary" onClick={() => setConfirming(true)} icon={<Trash2 className="size-4" aria-hidden />}>
                Delete
              </Button>
            )}
          </>
        }
      />

      <OriginalInput entry={entry} />

      {entry.tool === "logline" ? (
        <LoglineResult analysis={entry.result} mode={entry.mode} />
      ) : entry.tool === "story" ? (
        <StoryResult analysis={entry.result} mode={entry.mode} entryId={entry.id} />
      ) : (
        <ShotPlanResult plan={entry.result} mode={entry.mode} title={entry.title} />
      )}
    </div>
  );
}
