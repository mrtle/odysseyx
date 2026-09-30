"use client";

/**
 * Voice mode for practice drills: dictation (Web Speech recognition) and
 * spoken persona replies (speech synthesis). Both feature-detect and
 * degrade to `supported: false`, and both clean up on unmount.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Minimal Web Speech types — lib.dom has no SpeechRecognition (or its webkit prefix).
// ---------------------------------------------------------------------------

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function hasSynthesis(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

const noopSubscribe = () => () => {};

/** Feature detection that renders `false` on the server and during hydration. */
function useBrowserSupport(detect: () => boolean): boolean {
  return useSyncExternalStore(noopSubscribe, detect, () => false);
}

// ---------------------------------------------------------------------------
// Dictation
// ---------------------------------------------------------------------------

const RECOGNITION_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser's site settings to dictate.",
  "service-not-allowed": "Dictation isn't available in this browser. You can still type.",
  "audio-capture": "No microphone was found. Check that one is connected.",
  network: "Dictation needs a network connection in this browser.",
  "no-speech": "Didn't catch that — try again a little closer to the mic.",
  "language-not-supported": "Dictation doesn't support this language in your browser.",
};

export interface SpeechRecognitionOptions {
  /** BCP 47 language tag. */
  lang?: string;
  /**
   * Called with the full text — the `prefix` passed to `start()` plus
   * everything heard so far, including interim words — whenever it changes.
   */
  onText?: (text: string) => void;
}

export interface SpeechRecognitionControls {
  supported: boolean;
  listening: boolean;
  error: string | null;
  /** Start dictating; what's heard is appended to `prefix` (usually the current input). */
  start: (prefix?: string) => void;
  /** Stop listening, keeping any final words still being recognised. */
  stop: () => void;
  /** Stop listening and discard anything still pending (e.g. after the text was sent). */
  cancel: () => void;
  clearError: () => void;
}

function joinText(prefix: string, spoken: string): string {
  const base = prefix.replace(/\s+$/, "");
  if (!spoken) return prefix;
  return base ? `${base} ${spoken}` : spoken;
}

export function useSpeechRecognition({ lang = "en-US", onText }: SpeechRecognitionOptions = {}): SpeechRecognitionControls {
  const supported = useBrowserSupport(() => getRecognitionConstructor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognitionRef.current = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
    setListening(false);
  }, []);

  const start = useCallback(
    (prefix = "") => {
      const Recognition = getRecognitionConstructor();
      if (!Recognition) {
        setError("Dictation isn't supported in this browser. You can still type.");
        return;
      }
      recognitionRef.current?.abort();

      const recognition = new Recognition();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        // With continuous recognition the result list holds the whole session, so rebuild from the start.
        let finalText = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) finalText += transcript;
          else interim += transcript;
        }
        const spoken = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
        onTextRef.current?.(joinText(prefix, spoken));
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        setError(RECOGNITION_ERRORS[event.error] ?? "Dictation stopped unexpectedly. Try again, or type instead.");
      };
      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          setListening(false);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setError(null);
        setListening(true);
      } catch {
        recognitionRef.current = null;
        setListening(false);
        setError("Couldn't start dictation. Try again in a moment.");
      }
    },
    [lang],
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(
    () => () => {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    },
    [],
  );

  return { supported, listening, error, start, stop, cancel, clearError };
}

// ---------------------------------------------------------------------------
// Speech synthesis
// ---------------------------------------------------------------------------

export interface SpeakOptions {
  /** 0–2, default 1. */
  pitch?: number;
  /** 0.1–10, default 1. */
  rate?: number;
  lang?: string;
  /** Picks a consistent voice per speaker (e.g. the persona's name) when several are installed. */
  voiceKey?: string;
}

export interface SpeechSynthesisControls {
  supported: boolean;
  speaking: boolean;
  speak: (text: string, options?: SpeakOptions) => void;
  cancel: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string, key?: string): SpeechSynthesisVoice | undefined {
  const prefix = lang.slice(0, 2).toLowerCase();
  const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (matching.length === 0) return undefined;
  const local = matching.filter((v) => v.localService);
  const pool = local.length > 0 ? local : matching;
  return key ? pool[hash(key) % pool.length] : (pool.find((v) => v.default) ?? pool[0]);
}

/** Strip characters that read badly aloud (stray markdown emphasis) and collapse whitespace. */
function speakable(text: string): string {
  return text
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSpeechSynthesis(): SpeechSynthesisControls {
  const supported = useBrowserSupport(hasSynthesis);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    if (!hasSynthesis()) return;
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (!hasSynthesis()) return;
    const content = speakable(text);
    if (!content) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = options.lang ?? "en-US";
    utterance.pitch = clamp(options.pitch ?? 1, 0, 2);
    utterance.rate = clamp(options.rate ?? 1, 0.1, 10);
    const voice = pickVoice(synth.getVoices(), utterance.lang, options.voiceKey);
    if (voice) utterance.voice = voice;

    const finish = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setSpeaking(false);
      }
    };
    utterance.onstart = () => {
      if (utteranceRef.current === utterance) setSpeaking(true);
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, []);

  useEffect(
    () => () => {
      if (utteranceRef.current && hasSynthesis()) {
        utteranceRef.current = null;
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  return { supported, speaking, speak, cancel };
}
