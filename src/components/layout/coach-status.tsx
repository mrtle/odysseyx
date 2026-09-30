"use client";

import { useEffect, useState } from "react";
import type { CoachMode } from "@/lib/types";

export interface CoachStatus {
  mode: CoachMode;
  model: string;
}

let cached: Promise<CoachStatus | null> | null = null;

function fetchStatus(): Promise<CoachStatus | null> {
  cached ??= fetch("/api/status")
    .then((res) => (res.ok ? (res.json() as Promise<CoachStatus>) : null))
    .catch(() => null);
  return cached;
}

/** Whether the server has a live Claude connection or runs the offline demo coach. */
export function useCoachStatus(): CoachStatus | null {
  const [status, setStatus] = useState<CoachStatus | null>(null);
  useEffect(() => {
    let active = true;
    void fetchStatus().then((s) => {
      if (active) setStatus(s);
    });
    return () => {
      active = false;
    };
  }, []);
  return status;
}

export function CoachModeBadge() {
  const status = useCoachStatus();
  if (!status) return null;
  const live = status.mode === "live";
  return (
    <span
      title={
        live
          ? `Coaching powered by Claude (${status.model})`
          : "Demo mode: no API key configured, so an offline coach gives heuristic feedback. Set ANTHROPIC_API_KEY for full AI coaching."
      }
      className={
        live
          ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
          : "inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200"
      }
    >
      <span className={live ? "size-1.5 rounded-full bg-emerald-400" : "size-1.5 rounded-full bg-amber-300"} />
      {live ? "Live AI coach" : "Demo coach"}
    </span>
  );
}
