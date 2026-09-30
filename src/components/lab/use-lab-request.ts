"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, postJson } from "@/lib/api";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { LabEntry, LabToolId } from "@/lib/types";

export type LabRequestStatus = "idle" | "pending" | "error";

/**
 * POST to a Story Lab route with cancellation. Starting a new request (or
 * unmounting) aborts the one in flight; an aborted request resolves to null
 * without surfacing an error.
 */
export function useLabRequest<TBody, TResponse>(url: string) {
  const controllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<LabRequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(
    async (body: TBody): Promise<TResponse | null> => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("pending");
      setError(null);
      try {
        const data = await postJson<TResponse>(url, body, controller.signal);
        if (controller.signal.aborted) return null;
        setStatus("idle");
        return data;
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return null;
        setError(err instanceof ApiError ? err.message : "Something went wrong reaching the coach. Try again.");
        setStatus("error");
        return null;
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [url],
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  return { status, pending: status === "pending", error, run, cancel, clearError };
}

/**
 * "Run again" support: once the store has hydrated, the saved entry named by
 * `?from=` (if it belongs to this tool). `ready` is false until we know.
 */
export function useEntryPrefill<T extends LabToolId>(
  tool: T,
  fromEntryId: string | undefined,
): { ready: boolean; entry: Extract<LabEntry, { tool: T }> | null } {
  const hydrated = useHasHydrated();
  const entry = useAppStore((s) => (fromEntryId ? s.labEntries.find((e) => e.id === fromEntryId) : undefined));
  if (!fromEntryId) return { ready: true, entry: null };
  if (!hydrated) return { ready: false, entry: null };
  return { ready: true, entry: entry && entry.tool === tool ? (entry as Extract<LabEntry, { tool: T }>) : null };
}
