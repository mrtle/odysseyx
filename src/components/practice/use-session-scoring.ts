"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postJson, toCoachProfile } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { CoachMode, Evaluation } from "@/lib/types";
import { toRequestMessages } from "./use-persona-reply";

export interface ScoreResult {
  evaluation: Evaluation;
  mode: CoachMode;
  /** XP awarded by this scoring (0 when re-scoring a session). */
  xp: number;
}

/** Sends a session's transcript to /api/coach/evaluate and saves the scorecard. */
export function useSessionScoring() {
  const finishSession = useAppStore((s) => s.finishSession);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const score = useCallback(
    async (sessionId: string): Promise<ScoreResult | null> => {
      const state = useAppStore.getState();
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        setError("We couldn't find that session any more.");
        return null;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setPending(true);
      setError(null);
      try {
        const { evaluation, mode } = await postJson<{ evaluation: Evaluation; mode: CoachMode }>(
          "/api/coach/evaluate",
          {
            scenarioId: session.scenarioId,
            messages: toRequestMessages(session.messages),
            profile: toCoachProfile(state.profile),
          },
          controller.signal,
        );
        const xp = finishSession(sessionId, evaluation, mode);
        return { evaluation, mode, xp };
      } catch (err) {
        if (controller.signal.aborted) return null;
        setError(err instanceof Error && err.message ? err.message : "Scoring failed. Try again.");
        return null;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setPending(false);
        }
      }
    },
    [finishSession],
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { score, pending, error, clearError };
}
