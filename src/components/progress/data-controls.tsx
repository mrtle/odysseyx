"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Download, TriangleAlert, Trash2, Upload } from "lucide-react";
import { writeProfileCookie } from "@/components/home/profile-cookie";
import { Button } from "@/components/ui/button";
import { useAppStore, useStorageHealth } from "@/lib/store";
import {
  MAX_IMPORT_BYTES,
  buildExport,
  exportFileName,
  parseProgressImport,
  pickAppData,
  removeOrphanedStorage,
  summarizeProgress,
  type ProgressImport,
  type ProgressSummary,
} from "./progress-helpers";
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

function plural(n: number, noun: string, pluralNoun = `${noun}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? noun : pluralNoun}`;
}

/** "Penelope · 640 XP · 3 lessons · 2 drills · 1 Story Lab analysis · 4 daily challenges" */
export function describeSummary(summary: ProgressSummary): string {
  return [
    summary.name ?? "No profile",
    `${summary.xp.toLocaleString("en-US")} XP`,
    plural(summary.lessons, "lesson"),
    plural(summary.drills, "drill"),
    plural(summary.labEntries, "Story Lab analysis", "Story Lab analyses"),
    plural(summary.dailies, "daily challenge"),
  ].join(" · ");
}

type Backup = Extract<ProgressImport, { ok: true }>;
type Dialog = { kind: "reset" } | { kind: "import"; file: string; backup: Backup; current: ProgressSummary } | null;

/** Export everything as JSON, restore an export, or wipe this browser's progress after confirming. */
export function DataControls({ className }: { className?: string }) {
  const router = useRouter();
  const resetProgress = useAppStore((s) => s.resetProgress);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  const importRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<RefObject<HTMLButtonElement | null> | null>(null);

  useEffect(() => {
    if (dialog) cancelRef.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current.current?.focus();
      returnFocus.current = null;
    }
  }, [dialog]);

  function closeDialog(focus: RefObject<HTMLButtonElement | null>) {
    returnFocus.current = focus;
    setDialog(null);
  }

  function exportProgress() {
    try {
      const now = new Date();
      const filename = exportFileName(now);
      downloadJson(filename, buildExport(useAppStore.getState(), now));
      setStatus({ tone: "ok", text: `Saved ${filename}. Keep it somewhere safe — Import restores it here or in another browser.` });
    } catch {
      setStatus({ tone: "error", text: "Couldn't create the export in this browser." });
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = ""; // choosing the same file again should still fire a change
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setStatus({ tone: "error", text: "That file is far bigger than any OdysseusX export, so it wasn't read." });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ tone: "error", text: "Couldn't read that file." });
      return;
    }
    const result = parseProgressImport(text);
    if (!result.ok) {
      setStatus({ tone: "error", text: result.error });
      return;
    }
    setStatus(null);
    setDialog({ kind: "import", file: file.name, backup: result, current: summarizeProgress(pickAppData(useAppStore.getState())) });
  }

  function applyImport(backup: Backup, file: string) {
    useAppStore.setState(backup.data);
    // Checklist ticks for entries that aren't in the backup would never be seen again.
    removeOrphanedStorage(new Set(backup.data.labEntries.map((e) => e.id)));
    writeProfileCookie(backup.data.profile !== null);
    setStatus({
      tone: "ok",
      text: `Restored your progress from ${file}.${backup.skipped > 0 ? ` ${plural(backup.skipped, "unreadable record")} left out.` : ""}`,
    });
    closeDialog(importRef);
  }

  function erase() {
    resetProgress();
    // The store only knows its own key: drafts, per-entry checklists and unreadable-data copies go too.
    removeOrphanedStorage();
    useStorageHealth.setState({ backupKey: null });
    writeProfileCookie(false);
    setDialog(null);
    router.push("/");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && dialog) {
      event.stopPropagation();
      closeDialog(dialog.kind === "reset" ? resetRef : importRef);
    }
  }

  return (
    <SectionCard
      id="data-heading"
      title="Your data"
      description="Everything lives in this browser — there's no account. Export a backup before clearing site data or switching devices, then import it to pick up where you left off."
      className={className}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={exportProgress} icon={<Download className="size-4" aria-hidden />}>
          Export progress (JSON)
        </Button>
        <Button
          ref={importRef}
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          icon={<Upload className="size-4" aria-hidden />}
        >
          Import progress…
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={chooseFile}
        />
        {dialog?.kind !== "reset" ? (
          <Button ref={resetRef} variant="danger" onClick={() => setDialog({ kind: "reset" })} icon={<Trash2 className="size-4" aria-hidden />}>
            Reset progress…
          </Button>
        ) : null}
      </div>
      <p
        className={`mt-2 min-h-5 text-xs ${status?.tone === "error" ? "text-wine-400" : "text-sea-400"}`}
        role="status"
        aria-live="polite"
      >
        {status?.text}
      </p>

      {dialog?.kind === "reset" ? (
        <ConfirmPanel
          id="reset-confirm"
          title="Erase all progress?"
          onKeyDown={handleKeyDown}
          description={
            <>
              This permanently deletes your profile, XP and rank, streak, lesson progress, practice transcripts, Story Lab entries
              and daily log from this browser. It can&apos;t be undone.
            </>
          }
        >
          <Button ref={cancelRef} variant="secondary" onClick={() => closeDialog(resetRef)}>
            Keep my progress
          </Button>
          <Button variant="ghost" onClick={exportProgress} icon={<Download className="size-4" aria-hidden />}>
            Export first
          </Button>
          <Button variant="danger" onClick={erase} icon={<Trash2 className="size-4" aria-hidden />}>
            Yes, erase everything
          </Button>
        </ConfirmPanel>
      ) : null}

      {dialog?.kind === "import" ? (
        <ConfirmPanel
          id="import-confirm"
          title="Replace your progress with this backup?"
          onKeyDown={handleKeyDown}
          description={
            <>
              <span className="block">
                <span className="font-semibold text-sea-100">{dialog.file}</span>
                {dialog.backup.exportedAt ? (
                  <>
                    {" "}
                    · exported{" "}
                    <time dateTime={dialog.backup.exportedAt}>
                      {new Date(dialog.backup.exportedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </time>
                  </>
                ) : null}
              </span>
              <span className="mt-2 block">Backup: {describeSummary(dialog.backup.summary)}</span>
              <span className="block">Now: {describeSummary(dialog.current)}</span>
              <span className="mt-2 block">
                Everything in this browser is replaced by the backup — nothing is merged. Export first if you might want today&apos;s
                progress back.
                {dialog.backup.skipped > 0 ? ` ${plural(dialog.backup.skipped, "record")} in the file couldn't be read and will be left out.` : ""}
              </span>
            </>
          }
        >
          <Button ref={cancelRef} variant="secondary" onClick={() => closeDialog(importRef)}>
            Keep current progress
          </Button>
          <Button variant="ghost" onClick={exportProgress} icon={<Download className="size-4" aria-hidden />}>
            Export current first
          </Button>
          <Button onClick={() => applyImport(dialog.backup, dialog.file)} icon={<Upload className="size-4" aria-hidden />}>
            Replace with backup
          </Button>
        </ConfirmPanel>
      ) : null}
    </SectionCard>
  );
}

function ConfirmPanel({
  id,
  title,
  description,
  onKeyDown,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      onKeyDown={onKeyDown}
      className="mt-3 animate-fade-in rounded-xl border border-wine-500/50 bg-wine-600/10 p-4"
    >
      <p id={`${id}-title`} className="flex items-center gap-2 font-semibold text-wine-400">
        <TriangleAlert className="size-4" aria-hidden /> {title}
      </p>
      <p id={`${id}-desc`} className="mt-1.5 text-sm leading-relaxed text-sea-200">
        {description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
