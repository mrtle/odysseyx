"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowLeft, ArrowUp, Flag, Mic, MicOff, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import { useCoachStatus } from "@/components/layout/coach-status";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ProgressBar } from "@/components/ui/progress-bar";
import { toCoachProfile } from "@/lib/api";
import { useSpeechRecognition, useSpeechSynthesis } from "@/lib/hooks/use-speech";
import { useAppStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./chat-bubble";
import { PersonaAvatar } from "./persona-avatar";
import { firstName, type PublicScenario } from "./public-scenario";
import { MAX_MESSAGES, toRequestMessages, usePersonaReply } from "./use-persona-reply";

const MIN_TURNS_TO_SCORE = 2;
const MAX_INPUT = 2000;

/**
 * Learner turns as the persona counts them: non-empty lines, with back-to-back
 * lines (say, a retry after a failed reply) counted once.
 */
export function countTurns(messages: Pick<ChatMessage, "role" | "content">[]): number {
  let turns = 0;
  let previous: ChatMessage["role"] | null = null;
  for (const m of messages) {
    if (!m.content.trim()) continue;
    if (m.role === "user" && previous !== "user") turns++;
    previous = m.role;
  }
  return turns;
}

export interface PracticeChatProps {
  scenario: PublicScenario;
  sessionId: string;
  /** Read the opening line aloud on mount (the learner just pressed Start). */
  speakOpening?: boolean;
  onEnd: () => void;
}

export function PracticeChat({ scenario, sessionId, speakOpening = false, onEnd }: PracticeChatProps) {
  const { persona } = scenario;
  const name = firstName(persona.name);
  const session = useAppStore((s) => s.sessions.find((x) => x.id === sessionId));
  const addMessage = useAppStore((s) => s.addMessage);
  const autoSpeak = useAppStore((s) => s.settings.autoSpeak);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const status = useCoachStatus();

  const reply = usePersonaReply(scenario.id);
  const { request: requestPersona, takeInterrupted } = reply;
  const { supported: canSpeak, speak: speakText, cancel: cancelSpeech } = useSpeechSynthesis();
  const [input, setInput] = useState("");
  const dictation = useSpeechRecognition({ onText: setInput });
  const [announcement, setAnnouncement] = useState("");

  const inputId = useId();
  const hintId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const messages = session?.messages ?? [];
  const userTurns = countTurns(messages);
  const last = messages[messages.length - 1];
  const atLimit = messages.length >= MAX_MESSAGES - 1;
  const awaitingReply = !reply.streaming && last?.role === "user";
  const pastLength = userTurns >= scenario.suggestedTurns;
  const canScore = userTurns >= MIN_TURNS_TO_SCORE && !reply.streaming;
  const mode = reply.mode ?? status?.mode;

  const speak = useCallback(
    (text: string) => speakText(text, { pitch: persona.voice?.pitch, rate: persona.voice?.rate, voiceKey: persona.name }),
    [speakText, persona.voice?.pitch, persona.voice?.rate, persona.name],
  );

  // Read the opening line aloud once, when the learner has just walked in.
  const spokeOpening = useRef(false);
  useEffect(() => {
    if (!speakOpening || spokeOpening.current || !autoSpeakRef.current) return;
    spokeOpening.current = true;
    speak(scenario.openingLine);
  }, [speakOpening, speak, scenario.openingLine]);

  useEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  // Keep the newest line in view unless the learner has scrolled up to reread.
  useEffect(() => {
    const log = logRef.current;
    if (log && stickToBottom.current) log.scrollTop = log.scrollHeight;
  }, [messages.length, reply.draft, reply.interrupted]);

  const onScroll = () => {
    const log = logRef.current;
    if (log) stickToBottom.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  };

  // Grow the composer with its content, up to a limit. Measure only real
  // text: an empty box stays one row, whatever the placeholder's length.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "";
    if (input) el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  const record = useCallback(
    (message: Pick<ChatMessage, "role" | "content">) => addMessage(sessionId, message),
    [addMessage, sessionId],
  );

  const requestReply = useCallback(() => {
    const state = useAppStore.getState();
    const current = state.sessions.find((s) => s.id === sessionId);
    if (!current) return;
    stickToBottom.current = true;
    void requestPersona(toRequestMessages(current.messages), toCoachProfile(state.profile), (result) => {
      record({ role: "persona", content: result.text });
      setAnnouncement(`${persona.name}: ${result.text}`);
      if (autoSpeakRef.current && !result.stopped) speak(result.text);
    });
  }, [persona.name, record, requestPersona, sessionId, speak]);

  /** Keep a reply the server cut short as the persona's (unfinished) line. The notice itself is never saved. */
  const keepInterrupted = useCallback(() => {
    const partial = takeInterrupted();
    if (partial) record({ role: "persona", content: `${partial.text}…` });
  }, [record, takeInterrupted]);

  const send = () => {
    const text = input.trim();
    if (!text || reply.streaming || atLimit) return;
    dictation.cancel();
    cancelSpeech();
    keepInterrupted();
    record({ role: "user", content: text });
    setInput("");
    requestReply();
  };

  const stopReply = (event: MouseEvent<HTMLButtonElement>) => {
    // Never let this click reach the form: the button can be swapped for Send before its default action runs.
    event.preventDefault();
    reply.stop();
    // The Stop button unmounts; keep focus in the composer rather than dropping it to the page.
    textareaRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    } else if (event.key === "Escape" && reply.streaming) {
      event.preventDefault();
      reply.stop();
    }
  };

  const toggleDictation = () => {
    if (dictation.listening) {
      dictation.stop();
    } else {
      cancelSpeech();
      dictation.start(input);
      textareaRef.current?.focus();
    }
  };

  const toggleSpeech = () => {
    const next = !autoSpeak;
    updateSettings({ autoSpeak: next });
    if (!next) cancelSpeech();
    else {
      const lastPersona = [...messages].reverse().find((m) => m.role === "persona");
      if (lastPersona && !reply.streaming) speak(lastPersona.content);
    }
  };

  const end = () => {
    if (!canScore) return;
    dictation.cancel();
    cancelSpeech();
    keepInterrupted();
    onEnd();
  };

  if (!session) {
    return (
      <Alert tone="error" title="This session is no longer available">
        It may have been deleted. <Link href="/practice" className="underline">Back to Practice</Link>
      </Alert>
    );
  }

  const endLabel = userTurns < MIN_TURNS_TO_SCORE ? `Take at least ${MIN_TURNS_TO_SCORE} turns before ending the scene` : undefined;

  return (
    <div className="flex flex-col animate-fade-in [@media(max-height:32rem)]:-mt-5">
      <div className="mb-4 flex items-center justify-between gap-3 [@media(max-height:32rem)]:mb-2">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-sea-300 transition-colors hover:bg-sea-800/70 hover:text-sea-100"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Leave
        </Link>
        <h1 className="min-w-0 truncate font-display text-lg font-semibold text-sea-100 sm:text-xl">{scenario.title}</h1>
        <span className="w-16 shrink-0" aria-hidden />
      </div>

      {/*
        Below lg the panel sits between the sticky header and the fixed bottom nav, so its height is
        whatever is left of the viewport (never a fixed minimum that would push the composer under
        the nav). Short, landscape screens trim the chrome around it.
      */}
      <div className="flex h-[calc(100dvh_-_15rem_-_env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-2xl border border-sea-700/80 bg-sea-900/60 shadow-xl shadow-black/20 backdrop-blur-sm max-lg:[@media(max-height:32rem)]:h-[calc(100dvh_-_11.25rem_-_env(safe-area-inset-bottom))] lg:h-[calc(100dvh-12rem)] lg:min-h-[26rem]">
        {/* Scene header: the controls wrap under the persona on narrow screens rather than squeezing the name away. */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-sea-800 px-4 py-3 sm:px-5 [@media(max-height:32rem)]:flex-nowrap [@media(max-height:32rem)]:py-2">
          <div className="flex min-w-[12rem] flex-1 items-center gap-3 [@media(max-height:32rem)]:min-w-0">
            <PersonaAvatar persona={persona} category={scenario.category} />
            <div className="min-w-0">
              <p className="truncate font-medium text-sea-100">{persona.name}</p>
              <p className="truncate text-xs text-sea-400 [@media(max-height:32rem)]:hidden">{persona.role}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-28 sm:block" aria-hidden>
              <ProgressBar value={userTurns / scenario.suggestedTurns} />
            </div>
            <p className="text-xs whitespace-nowrap text-sea-400 tabular-nums" aria-live="polite">
              <span className="sr-only sm:not-sr-only">Turn </span>
              <span className="font-semibold text-sea-200">{userTurns}</span>
              <span className="sr-only sm:not-sr-only"> of ~{scenario.suggestedTurns}</span>
              <span className="sm:hidden" aria-hidden>
                /{scenario.suggestedTurns}
              </span>
            </p>
            {canSpeak ? (
              <button
                type="button"
                onClick={toggleSpeech}
                aria-pressed={autoSpeak}
                aria-label={autoSpeak ? "Stop reading replies aloud" : "Read replies aloud"}
                title={autoSpeak ? "Voice on — replies are read aloud" : "Voice off"}
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl border transition-colors",
                  autoSpeak
                    ? "border-bronze-400/50 bg-bronze-500/15 text-bronze-200"
                    : "border-sea-700 text-sea-400 hover:border-sea-500 hover:text-sea-100",
                )}
              >
                {autoSpeak ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
              </button>
            ) : null}
            <Button
              size="sm"
              variant={pastLength ? "primary" : "secondary"}
              onClick={end}
              disabled={!canScore}
              title={endLabel}
              icon={<Flag className="size-3.5" aria-hidden />}
            >
              <span className="sm:hidden">Score</span>
              <span className="hidden sm:inline">End &amp; get scored</span>
            </Button>
          </div>
        </div>

        {/* Conversation: a keyboard-scrollable region; new persona lines are announced separately below. */}
        <div
          ref={logRef}
          onScroll={onScroll}
          role="region"
          aria-label={`Conversation with ${persona.name}`}
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 focus-visible:outline-offset-[-2px] sm:px-5 [@media(max-height:32rem)]:py-3"
        >
          {mode === "demo" ? <DemoNotice mode={mode} className="mb-5 [@media(max-height:32rem)]:hidden" /> : null}
          <ol className="space-y-5" aria-busy={reply.streaming}>
            {messages.map((m) => (
              <ChatBubble
                key={m.id}
                role={m.role}
                content={m.content}
                persona={persona}
                category={scenario.category}
                onSpeak={canSpeak ? () => speak(m.content) : undefined}
              />
            ))}
            {reply.draft !== null ? (
              <ChatBubble role="persona" content={reply.draft} persona={persona} category={scenario.category} streaming />
            ) : reply.interrupted ? (
              <ChatBubble role="persona" content={`${reply.interrupted.text}…`} persona={persona} category={scenario.category} />
            ) : null}
          </ol>
        </div>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        {/* Status banners */}
        <div className="space-y-2 px-4 empty:hidden sm:px-5">
          {reply.error ? (
            <Alert tone="error" title={`${name} didn't answer`} className="mt-3">
              <p>{reply.error}</p>
              <Button size="sm" variant="secondary" className="mt-2" onClick={requestReply} icon={<RotateCcw className="size-3.5" aria-hidden />}>
                Try again
              </Button>
            </Alert>
          ) : reply.interrupted && !reply.streaming ? (
            <Alert tone="error" title={`${name} was cut off`} className="mt-3">
              <p>{reply.interrupted.notice}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={requestReply} icon={<RotateCcw className="size-3.5" aria-hidden />}>
                  Try again
                </Button>
                <Button size="sm" variant="ghost" onClick={keepInterrupted}>
                  Keep the unfinished line
                </Button>
              </div>
            </Alert>
          ) : awaitingReply ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sea-700 bg-sea-800/50 px-3.5 py-2.5 text-sm text-sea-300">
              <span>{name} hasn&apos;t answered your last line yet.</span>
              <Button size="sm" variant="secondary" onClick={requestReply}>
                Get {name}&apos;s reply
              </Button>
            </div>
          ) : null}
          {atLimit ? (
            <Alert tone="info" title="That's a full scene" className="mt-3">
              This conversation has reached its length limit. End the scene to get your scorecard.
            </Alert>
          ) : pastLength && !reply.streaming && !reply.error ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-bronze-500/30 bg-bronze-500/10 px-3.5 py-2.5 text-sm text-bronze-100">
              <span>That&apos;s the scene&apos;s natural length. End it for your scorecard — or keep going if you&apos;re mid-thought.</span>
              <Button size="sm" onClick={end} icon={<Flag className="size-3.5" aria-hidden />}>
                End &amp; get scored
              </Button>
            </div>
          ) : null}
        </div>

        {/* Composer */}
        <form
          className="shrink-0 border-t border-sea-800 p-3 sm:p-4 [@media(max-height:32rem)]:p-2"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Your line to {persona.name}
          </label>
          <div
            className={cn(
              "flex items-end gap-2 rounded-2xl border bg-sea-950/50 p-2 transition-colors focus-within:border-bronze-400/60 focus-within:ring-2 focus-within:ring-bronze-400/15",
              dictation.listening ? "border-wine-400/60" : "border-sea-700",
            )}
          >
            <textarea
              id={inputId}
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAX_INPUT}
              disabled={atLimit}
              aria-describedby={hintId}
              placeholder={dictation.listening ? "Listening…" : reply.streaming ? `${name} is speaking…` : `Reply to ${name}…`}
              className="max-h-[180px] min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-base leading-relaxed text-sea-100 placeholder:text-sea-400 focus:outline-none disabled:opacity-50 sm:text-[15px]"
            />
            {dictation.supported ? (
              <button
                type="button"
                onClick={toggleDictation}
                disabled={atLimit}
                aria-pressed={dictation.listening}
                aria-label={dictation.listening ? "Stop dictation" : "Dictate your line"}
                title={dictation.listening ? "Stop dictation" : "Dictate"}
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50",
                  dictation.listening ? "bg-wine-600/30 text-wine-400" : "text-sea-400 hover:bg-sea-800 hover:text-sea-100",
                )}
              >
                {dictation.listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
                {dictation.listening ? (
                  <span className="absolute top-1.5 right-1.5 size-2 animate-pulse rounded-full bg-wine-400" aria-hidden />
                ) : null}
              </button>
            ) : null}
            {reply.streaming ? (
              <button
                key="stop"
                type="button"
                onClick={stopReply}
                aria-label={`Stop ${name}'s reply`}
                title="Stop (Esc)"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sea-600 bg-sea-800/70 text-sea-100 transition hover:border-sea-500 hover:bg-sea-700/70 active:scale-95"
              >
                <Square className="size-3.5 fill-current" aria-hidden />
              </button>
            ) : (
              <button
                key="send"
                type="submit"
                disabled={!input.trim() || atLimit}
                aria-label="Send"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-bronze-400 to-bronze-600 text-sea-950 shadow-lg shadow-bronze-900/30 transition hover:from-bronze-300 hover:to-bronze-500 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <div id={hintId} className="mt-1.5 flex items-center justify-between gap-3 px-1 text-xs text-sea-400 [@media(max-height:32rem)]:mt-1">
            {dictation.error ? (
              <span className="text-wine-400" role="alert">
                {dictation.error}
              </span>
            ) : (
              <span className="hidden sm:inline [@media(max-height:32rem)]:hidden">
                Enter to send · Shift+Enter for a new line{reply.streaming ? " · Esc to stop" : ""}
              </span>
            )}
            {input.length > MAX_INPUT - 300 ? (
              <span className="ml-auto tabular-nums">
                {input.length}/{MAX_INPUT}
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
