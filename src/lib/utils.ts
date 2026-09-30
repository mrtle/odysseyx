import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge that knows about the custom `font-display` family. */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-family": ["font-display"] } },
});

/** Join class names; later Tailwind classes override conflicting earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Random id that works outside secure contexts too. */
export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // randomUUID throws outside secure contexts in some browsers
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "just now", "5 min ago", "3 h ago", "2 days ago", or a date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Scripts written without spaces between words (Chinese, Japanese, Thai…). */
const UNSPACED_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

/** Word count in any script: whitespace-separated, or segmented for scripts without spaces. */
export function wordCount(text: string): number {
  if (UNSPACED_SCRIPT.test(text) && typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    let n = 0;
    for (const segment of new Intl.Segmenter(undefined, { granularity: "word" }).segment(text)) {
      if (segment.isWordLike) n++;
    }
    return n;
  }
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

/** Colour band for a 0–100 score, used for text and ring colours. */
export function scoreTone(score: number): "low" | "mid" | "good" | "great" {
  if (score >= 85) return "great";
  if (score >= 70) return "good";
  if (score >= 50) return "mid";
  return "low";
}

export const SCORE_TONE_CLASS: Record<ReturnType<typeof scoreTone>, string> = {
  low: "text-rose-400",
  mid: "text-amber-300",
  good: "text-emerald-300",
  great: "text-sky-300",
};

export const SCORE_TONE_STROKE: Record<ReturnType<typeof scoreTone>, string> = {
  low: "stroke-rose-400",
  mid: "stroke-amber-300",
  good: "stroke-emerald-300",
  great: "stroke-sky-300",
};

/** Read a fetch Response's JSON error message, falling back to status text. */
export async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === "string") return data.error;
  } catch {
    // not JSON
  }
  return res.statusText || `Request failed (${res.status})`;
}
