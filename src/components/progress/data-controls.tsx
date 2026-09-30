"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, TriangleAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { buildExport, exportFileName } from "./progress-helpers";
import { SectionCard } from "./section-card";

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a beat to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Export everything as JSON, or wipe this browser's progress after confirming. */
export function DataControls({ className }: { className?: string }) {
  const router = useRouter();
  const resetProgress = useAppStore((s) => s.resetProgress);
  const [status, setStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (wasConfirming.current) resetRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  function exportProgress() {
    try {
      const now = new Date();
      const filename = exportFileName(now);
      downloadJson(filename, buildExport(useAppStore.getState(), now));
      setStatus(`Saved ${filename}.`);
    } catch {
      setStatus("Couldn't create the export in this browser.");
    }
  }

  function erase() {
    resetProgress();
    setConfirming(false);
    router.push("/");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setConfirming(false);
    }
  }

  return (
    <SectionCard
      id="data-heading"
      title="Your data"
      description="Everything lives in this browser — there's no account. Export a backup before clearing site data or switching devices."
      className={className}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={exportProgress} icon={<Download className="size-4" aria-hidden />}>
          Export progress (JSON)
        </Button>
        {!confirming ? (
          <Button
            ref={resetRef}
            variant="danger"
            onClick={() => setConfirming(true)}
            icon={<Trash2 className="size-4" aria-hidden />}
          >
            Reset progress…
          </Button>
        ) : null}
      </div>
      <p className="mt-2 min-h-5 text-xs text-sea-400" role="status" aria-live="polite">
        {status}
      </p>

      {confirming ? (
        <div
          role="alertdialog"
          aria-labelledby="reset-confirm-title"
          aria-describedby="reset-confirm-desc"
          onKeyDown={handleKeyDown}
          className="mt-3 animate-fade-in rounded-xl border border-wine-500/50 bg-wine-600/10 p-4"
        >
          <p id="reset-confirm-title" className="flex items-center gap-2 font-semibold text-wine-400">
            <TriangleAlert className="size-4" aria-hidden /> Erase all progress?
          </p>
          <p id="reset-confirm-desc" className="mt-1.5 text-sm leading-relaxed text-sea-200">
            This permanently deletes your profile, XP and rank, streak, lesson progress, practice transcripts, Story Lab entries
            and daily log from this browser. It can&apos;t be undone.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button ref={cancelRef} variant="secondary" onClick={() => setConfirming(false)}>
              Keep my progress
            </Button>
            <Button variant="ghost" onClick={exportProgress} icon={<Download className="size-4" aria-hidden />}>
              Export first
            </Button>
            <Button variant="danger" onClick={erase} icon={<Trash2 className="size-4" aria-hidden />}>
              Yes, erase everything
            </Button>
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
