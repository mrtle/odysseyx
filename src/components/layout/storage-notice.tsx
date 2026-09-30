"use client";

import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { useStorageHealth, type StorageStatus } from "@/lib/store";

const MESSAGES: Record<Exclude<StorageStatus, "ok">, { title: string; body: string }> = {
  unavailable: {
    title: "Progress won't be saved in this browser",
    body: "Your browser is blocking site storage, so lessons, drills and Story Lab entries only last until you close this tab. Allow site data for OdysseusX to keep them.",
  },
  quota: {
    title: "Your browser's storage for OdysseusX is full",
    body: "Recent progress isn't being saved. Export your progress, then delete old practice sessions or Story Lab entries to make room.",
  },
  error: {
    title: "Couldn't save your latest progress",
    body: "The browser refused to store it. Your work is still on screen; export your progress to keep a copy.",
  },
};

/** A dismissible banner when progress can't be saved, or saved data couldn't be read. */
export function StorageNotice() {
  const status = useStorageHealth((s) => s.status);
  const backupKey = useStorageHealth((s) => s.backupKey);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const key = status !== "ok" ? status : backupKey ? "backup" : null;
  if (!key || dismissed === key) return null;

  const message =
    status !== "ok"
      ? MESSAGES[status]
      : {
          title: "Some saved progress couldn't be read",
          body: `OdysseusX started fresh and kept the unreadable copy in your browser under "${backupKey}".`,
        };

  return (
    <div className="mb-6 animate-fade-in">
      <Alert tone="warning" title={message.title}>
        <div className="flex items-start justify-between gap-3">
          <p>
            {message.body}{" "}
            {status === "quota" || status === "error" ? (
              <Link href="/progress" className="font-medium text-bronze-300 underline underline-offset-2 hover:text-bronze-200">
                Go to Progress
              </Link>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setDismissed(key)}
            className="-mt-1 -mr-2 shrink-0 rounded-lg p-1.5 text-sea-300 hover:bg-sea-800/70 hover:text-sea-100"
            aria-label="Dismiss"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </Alert>
    </div>
  );
}
