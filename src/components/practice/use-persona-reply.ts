"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessageInput, CoachProfile } from "@/lib/ai/schemas";
import { NOTICE_MARKER, splitNotice } from "@/lib/ai/stream-protocol";
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

/** A reply the server cut short with an out-of-character notice (an error or a refusal mid-stream). */
export interface InterruptedReply {
  /** The in-character text that arrived before the notice. Never includes the notice. */
  text: string;
  notice: string;
}

const EMPTY_REPLY = "The reply came back empty. Try again.";
const INTERRUPTED = "The reply was interrupted. Try again.";

/** How a finished stream should be handled: committed as dialogue, held as a cut-off reply, or treated as a failed turn. */
export type SettledReply =
  | { kind: "reply"; text: string }
  | { kind: "interrupted"; text: string; notice: string }
  | { kind: "failed"; error: string };

/**
 * Split a complete response body per the stream protocol. The notice (the
 * text after NOTICE_MARKER) is never part of the persona's words; when no
 * in-character text arrived before it, the turn failed.
 */
export function settleReply(body: string): SettledReply {
  const { reply, notice } = splitNotice(body);
  const text = reply.trim();
  if (!body.includes(NOTICE_MARKER)) return text ? { kind: "reply", text } : { kind: "failed", error: EMPTY_REPLY };
  if (!text) return { kind: "failed", error: notice ?? INTERRUPTED };
  return { kind: "interrupted", text, notice: notice ?? INTERRUPTED };
}

/** The in-character part of a body that may still be streaming (hides a notice as soon as its marker arrives). */
export function visibleReply(body: string): string {
  return splitNotice(body).reply;
}

/**
 * Streams the persona's next line from /api/coach/chat. `draft` holds the
 * text so far while a reply is streaming (null otherwise); `onReply` fires
 * once, before the draft clears, so the caller can commit the message in
 * the same render. A reply the server cut short is held in `interrupted`
 * (not committed) so the caller can offer a retry or keep the partial line.
 */
export function usePersonaReply(scenarioId: string) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interrupted, setInterrupted] = useState<InterruptedReply | null>(null);
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
      setInterrupted(null);
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
            setDraft(visibleReply(text));
          }
          text += decoder.decode();
        } else {
          text = await res.text();
        }
        const settled = settleReply(text);
        if (settled.kind === "reply") onReply({ text: settled.text, mode: replyMode, stopped: false });
        else if (settled.kind === "interrupted") setInterrupted({ text: settled.text, notice: settled.notice });
        else setError(settled.error);
      } catch (err) {
        if (controller.signal.aborted) {
          // Stopped by the learner: keep whatever in-character text arrived. Aborted by unmount: drop it.
          const partial = visibleReply(text).trim();
          if (stoppedRef.current && partial) onReply({ text: `${partial}…`, mode: replyMode, stopped: true });
        } else if (err instanceof TypeError) {
          setError("Couldn't reach the coach. Check your connection and try again.");
        } else {
          setError(err instanceof Error && err.message ? err.message : INTERRUPTED);
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

  /** Hand back the cut-off reply (to keep it in the transcript) and clear it. */
  const takeInterrupted = useCallback((): InterruptedReply | null => {
    const current = interrupted;
    setInterrupted(null);
    return current;
  }, [interrupted]);

  useEffect(
    () => () => {
      stoppedRef.current = false;
      controllerRef.current?.abort();
    },
    [],
  );

  return { draft, streaming: draft !== null, error, interrupted, mode, request, stop, clearError, takeInterrupted };
}
