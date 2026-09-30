"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageInput, CoachProfile } from "@/lib/ai/schemas";
import { modeFromResponse } from "@/lib/api";
import type { ChatMessage, CoachMode } from "@/lib/types";
import { readError } from "@/lib/utils";

/** The chat API accepts at most 80 messages of up to 8,000 characters. */
export const MAX_MESSAGES = 80;
const MAX_CONTENT = 8000;

export function toRequestMessages(messages: Pick<ChatMessage, "role" | "content">[]): ChatMessageInput[] {
  return messages.slice(0, MAX_MESSAGES).map(({ role, content }) => ({ role, content: content.slice(0, MAX_CONTENT) }));
}

export interface ReplyResult {
  text: string;
  mode: CoachMode;
  /** True when the learner pressed Stop; `text` holds what arrived before that. */
  stopped: boolean;
}

/**
 * Streams the persona's next line from /api/coach/chat. `draft` holds the
 * text so far while a reply is streaming (null otherwise); `onReply` fires
 * once, before the draft clears, so the caller can commit the message in
 * the same render.
 */
export function usePersonaReply(scenarioId: string) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CoachMode | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);

  const request = useCallback(
    async (messages: ChatMessageInput[], profile: CoachProfile | undefined, onReply: (result: ReplyResult) => void) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      stoppedRef.current = false;
      setError(null);
      setDraft("");

      let text = "";
      let replyMode: CoachMode = mode ?? "demo";
      try {
        const res = await fetch("/api/coach/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scenarioId, messages, profile }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await readError(res));
        replyMode = modeFromResponse(res);
        setMode(replyMode);

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
            setDraft(text);
          }
          text += decoder.decode();
        } else {
          text = await res.text();
        }
        if (text.trim()) onReply({ text: text.trim(), mode: replyMode, stopped: false });
        else setError("The reply came back empty. Try again.");
      } catch (err) {
        if (controller.signal.aborted) {
          // Stopped by the learner: keep whatever arrived. Aborted by unmount: drop it.
          if (stoppedRef.current && text.trim()) onReply({ text: `${text.trim()}…`, mode: replyMode, stopped: true });
        } else if (err instanceof TypeError) {
          setError("Couldn't reach the coach. Check your connection and try again.");
        } else {
          setError(err instanceof Error && err.message ? err.message : "The reply was interrupted. Try again.");
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setDraft(null);
        }
      }
    },
    [scenarioId, mode],
  );

  const stop = useCallback(() => {
    if (!controllerRef.current) return;
    stoppedRef.current = true;
    controllerRef.current.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  useEffect(
    () => () => {
      stoppedRef.current = false;
      controllerRef.current?.abort();
    },
    [],
  );

  return { draft, streaming: draft !== null, error, mode, request, stop, clearError };
}
