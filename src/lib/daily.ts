/**
 * Daily challenge logic: which prompt is "today's", machine-checkable
 * constraints (word counts, dialogue-only, banned words…), and the
 * countdown to the next challenge. Pure — safe for server and client.
 */
import { DAILY_PROMPTS, type DailyChallenge } from "@/content/daily-prompts";
import { normalizeForMatch, paragraphs, sentences, words } from "@/lib/demo/text";
import type { CoachMode, DailyEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

export interface CountRange {
  min?: number;
  max?: number;
}

/**
 * The checkable part of a prompt's constraint. Anything a heuristic can't
 * judge fairly (tone, "make us half-agree") stays in the prose constraint.
 */
export interface DailyRule {
  words?: CountRange;
  sentences?: CountRange;
  /** Non-empty lines. */
  lines?: CountRange;
  /** Blank-line separated blocks (or lines, when there are no blank lines). */
  paragraphs?: CountRange;
  /** No sentence may run longer than this. */
  maxSentenceWords?: number;
  /** The final sentence must be this short or shorter. */
  lastSentenceMaxWords?: number;
  /** Every line must be speech (quoted, dashed, or `NAME: line`). */
  dialogueOnly?: boolean;
  /** No quotation marks at all. */
  noDialogue?: boolean;
  /** Words or phrases that must not appear (list the inflections you mean to ban). */
  forbidden?: string[];
  /** Label for the banned-words check; defaults to listing the first few words. */
  forbiddenLabel?: string;
  /**
   * Words or phrases that must appear. An array entry is a set of
   * alternatives (e.g. `["close", "cu"]`); list a phrase twice to require it
   * twice.
   */
  required?: (string | readonly string[])[];
  /** Whether `required` phrases must appear in the listed order. */
  requiredInOrder?: boolean;
  /** No question marks anywhere. */
  noQuestionMarks?: boolean;
  /** The piece must not open with any of these words or phrases (e.g. "so"). */
  forbiddenOpeners?: string[];
  /** Label for the openers check; defaults to naming the first one. */
  forbiddenOpenersLabel?: string;
  /**
   * Lines labelled with one of `speakers` (`NAME: line`, case-insensitive)
   * may hold at most `maxWords` words each; at least one such line must exist.
   */
  speakerMaxWords?: { speakers: string[]; maxWords: number; label: string };
}

export interface ConstraintCheck {
  id: string;
  /** Short statement of the rule, e.g. "Exactly 50 words". */
  label: string;
  met: boolean;
  /** Human-readable status, e.g. "47 of 50 words". */
  detail: string;
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

const WORDISH = /[\p{L}\p{N}]/u;
/** Scripts written without spaces between words (Chinese, Japanese, Thai…). */
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

/**
 * Words as a writer counts them: whitespace-separated tokens with at least
 * one letter or digit, in any script. Runs of unspaced scripts are split
 * with a word segmenter, so "赤ちゃんの靴" isn't one word.
 */
export function countWords(text: string): number {
  let n = 0;
  for (const token of text.match(/\S+/g) ?? []) {
    if (!WORDISH.test(token)) continue;
    n += UNSPACED.test(token) ? Math.max(1, words(token).length) : 1;
  }
  return n;
}

export function nonEmptyLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function countParagraphs(text: string): number {
  const blocks = paragraphs(text);
  return blocks.length > 1 ? blocks.length : nonEmptyLines(text).length;
}

// Matching uses the demo coach's shared normaliser (lower-case, possessives reduced — "daughter's" → "daughter" —
// punctuation and hyphens to spaces, space-padded), so the live indicators and the coach agree.

function phraseIndex(normalized: string, phrase: string, from = 0): number {
  const needle = normalizeForMatch(phrase);
  return needle.trim() ? normalized.indexOf(needle, from) : -1;
}

/** Start positions of every whole-word occurrence of `phrase`. */
function phrasePositions(normalized: string, phrase: string): number[] {
  const needle = normalizeForMatch(phrase);
  if (!needle.trim()) return [];
  const positions: number[] = [];
  for (let i = normalized.indexOf(needle); i >= 0; i = normalized.indexOf(needle, i + 1)) positions.push(i);
  return positions;
}

/** Phrases from `terms` that appear as whole words in `text`, in list order. */
export function findTerms(text: string, terms: readonly string[]): string[] {
  const normalized = normalizeForMatch(text);
  return terms.filter((term) => phraseIndex(normalized, term) >= 0);
}

const SPEECH_LINE = /^(?:["“”«—–]|-\s|'(?=[A-Za-z])|‘|[A-Z][A-Za-z.'’() ]{0,32}:\s*\S)/;
const PARENTHETICAL = /^\(.*\)$/;

export interface DialogueShape {
  speech: number;
  narration: number;
  /** Stage directions like "(beat)" — allowed, but not counted as speech. */
  parentheticals: number;
}

export function dialogueShape(text: string): DialogueShape {
  const shape: DialogueShape = { speech: 0, narration: 0, parentheticals: 0 };
  for (const line of nonEmptyLines(text)) {
    if (PARENTHETICAL.test(line)) shape.parentheticals++;
    else if (SPEECH_LINE.test(line)) shape.speech++;
    else shape.narration++;
  }
  return shape;
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function rangeLabel(range: CountRange, noun: string): string {
  const { min, max } = range;
  if (min !== undefined && max !== undefined) {
    return min === max ? `Exactly ${plural(min, noun)}` : `${min}–${max} ${noun}s`;
  }
  if (max !== undefined) return `${plural(max, noun)} max`;
  if (min !== undefined) return `At least ${plural(min, noun)}`;
  return `Any number of ${noun}s`;
}

function inRange(value: number, range: CountRange): boolean {
  return (range.min === undefined || value >= range.min) && (range.max === undefined || value <= range.max);
}

function rangeCheck(id: string, noun: string, value: number, range: CountRange): ConstraintCheck {
  const { min, max } = range;
  const target = min !== undefined && min === max ? min : undefined;
  let detail: string;
  if (target !== undefined) {
    detail = `${value} of ${target} ${noun}s`;
  } else if (max !== undefined && value > max) {
    detail = `${plural(value, noun)} — ${value - max} over`;
  } else if (min !== undefined && value < min) {
    detail = `${plural(value, noun)} — ${min - value} to go`;
  } else {
    detail = plural(value, noun);
  }
  return { id, label: rangeLabel(range, noun), met: inRange(value, range), detail };
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function quoteList(items: string[]): string {
  return joinList(items.map((item) => `“${item}”`));
}

function wordsIn(sentence: string): number {
  return countWords(sentence);
}

/** The first `maxWords` words of `text`, with an ellipsis when cut. */
function clip(text: string, maxWords: number): string {
  const parts = text.split(/\s+/);
  return parts.length > maxWords ? `${parts.slice(0, maxWords).join(" ")}…` : text;
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

/** Display name of a required entry: the phrase, or the first of its alternatives. */
function requiredName(entry: string | readonly string[]): string {
  return typeof entry === "string" ? entry : (entry[0] ?? "");
}

function alternatives(entry: string | readonly string[]): readonly string[] {
  return typeof entry === "string" ? [entry] : entry;
}

/**
 * Required phrases. Every entry must be present (as many times as it's
 * listed); in order means each one is found *after* the previous match, so
 * a phrase that also turns up earlier in passing ("hoped one day to…")
 * doesn't break an otherwise ordered piece.
 */
function requiredCheck(required: readonly (string | readonly string[])[], inOrder: boolean, text: string): ConstraintCheck {
  const normalized = normalizeForMatch(text);

  // Presence: count distinct match positions per entry, against how many times the entry is listed.
  const wanted = new Map<string, { entry: string | readonly string[]; times: number }>();
  for (const entry of required) {
    const key = alternatives(entry).join("|");
    const slot = wanted.get(key);
    if (slot) slot.times++;
    else wanted.set(key, { entry, times: 1 });
  }
  const missing: string[] = [];
  for (const { entry, times } of wanted.values()) {
    const found = new Set(alternatives(entry).flatMap((alt) => phrasePositions(normalized, alt))).size;
    if (found >= times) continue;
    const name = `“${requiredName(entry)}”`;
    missing.push(times === 1 ? name : `${name} (${found === 0 ? `${times} times` : `${times - found} more`})`);
  }

  let ordered = true;
  if (inOrder && missing.length === 0) {
    let from = 0;
    for (const entry of required) {
      const hits = alternatives(entry)
        .map((alt) => ({ at: phraseIndex(normalized, alt, from), length: normalizeForMatch(alt).length }))
        .filter((hit) => hit.at >= 0);
      if (hits.length === 0) {
        ordered = false;
        break;
      }
      const next = hits.reduce((a, b) => (b.at < a.at ? b : a));
      // Resume on the match's trailing space, which the next phrase's leading space can reuse.
      from = next.at + next.length - 1;
    }
  }

  const met = missing.length === 0 && ordered;
  return {
    id: "required",
    label: inOrder ? "Key phrases, in order" : "Key phrases",
    met,
    detail:
      missing.length > 0
        ? `Missing ${joinList(missing)}`
        : met
          ? `All ${required.length} present`
          : "All present, but out of order",
  };
}

/** The forbidden opener the piece starts with, or null. */
function openingPhrase(text: string, openers: readonly string[]): string | null {
  const start = normalizeForMatch(text).slice(0, 60);
  return openers.find((opener) => start.startsWith(normalizeForMatch(opener))) ?? null;
}

const SPEAKER_LINE = /^([A-Za-z][A-Za-z.'’ -]{0,32}?)\s*(?:\([^)]*\))?\s*:\s*(.*)$/;

function speakerCheck(rule: NonNullable<DailyRule["speakerMaxWords"]>, text: string): ConstraintCheck {
  const names = new Set(rule.speakers.map((name) => name.toLowerCase()));
  const spoken: { line: string; words: number }[] = [];
  for (const line of nonEmptyLines(text)) {
    const match = SPEAKER_LINE.exec(line);
    if (!match || !names.has(match[1].trim().toLowerCase())) continue;
    const speech = match[2].replace(/\([^)]*\)/g, " ").trim();
    spoken.push({ line: speech, words: countWords(speech) });
  }
  const label = `${rule.label}: ${rule.maxWords === 1 ? "one word" : `${rule.maxWords} words max`} per line`;
  if (spoken.length === 0) {
    return { id: "speaker-words", label, met: false, detail: `No lines labelled ${rule.label}: yet` };
  }
  const over = spoken.filter((s) => s.words > rule.maxWords);
  return {
    id: "speaker-words",
    label,
    met: over.length === 0,
    detail:
      over.length === 0
        ? `${plural(spoken.length, `${rule.label} line`)}, all within the limit`
        : `“${clip(over[0].line, 8)}” is ${plural(over[0].words, "word")}`,
  };
}

/**
 * Evaluate every checkable rule against `text`. Returns one check per rule
 * part, in a stable order, so the UI can render them as live indicators.
 */
export function checkConstraints(rule: DailyRule | undefined, text: string): ConstraintCheck[] {
  if (!rule) return [];
  const checks: ConstraintCheck[] = [];
  const sentenceList = sentences(text);

  if (rule.words) checks.push(rangeCheck("words", "word", countWords(text), rule.words));
  if (rule.sentences) checks.push(rangeCheck("sentences", "sentence", sentenceList.length, rule.sentences));
  if (rule.lines) checks.push(rangeCheck("lines", "line", nonEmptyLines(text).length, rule.lines));
  if (rule.paragraphs) checks.push(rangeCheck("paragraphs", "paragraph", countParagraphs(text), rule.paragraphs));

  if (rule.maxSentenceWords !== undefined) {
    const longest = sentenceList.reduce((max, s) => Math.max(max, wordsIn(s)), 0);
    checks.push({
      id: "max-sentence",
      label: `No sentence over ${rule.maxSentenceWords} words`,
      met: longest <= rule.maxSentenceWords,
      detail: longest === 0 ? "No sentences yet" : `Longest sentence: ${plural(longest, "word")}`,
    });
  }

  if (rule.lastSentenceMaxWords !== undefined) {
    const last = sentenceList[sentenceList.length - 1];
    const n = last ? wordsIn(last) : 0;
    checks.push({
      id: "last-sentence",
      label: `Final sentence ${plural(rule.lastSentenceMaxWords, "word")} or fewer`,
      met: n > 0 && n <= rule.lastSentenceMaxWords,
      detail: last ? `Final sentence: ${plural(n, "word")}` : "No final sentence yet",
    });
  }

  if (rule.dialogueOnly) {
    const shape = dialogueShape(text);
    checks.push({
      id: "dialogue-only",
      label: "Dialogue only",
      met: shape.speech >= 2 && shape.narration === 0,
      detail:
        shape.narration > 0
          ? `${plural(shape.narration, "line")} of narration`
          : shape.speech < 2
            ? "Needs at least two lines of speech"
            : `${plural(shape.speech, "spoken line")}, no narration`,
    });
  }

  if (rule.noDialogue) {
    const quotes = text.match(/["“”]/g)?.length ?? 0;
    checks.push({
      id: "no-dialogue",
      label: "No dialogue",
      met: quotes === 0,
      detail: quotes === 0 ? "Images only" : "Quotation marks found",
    });
  }

  if (rule.speakerMaxWords) checks.push(speakerCheck(rule.speakerMaxWords, text));

  if (rule.noQuestionMarks) {
    const marks = text.match(/[?？¿]/g)?.length ?? 0;
    checks.push({
      id: "no-question-marks",
      label: "No question marks",
      met: marks === 0,
      detail: marks === 0 ? "None used" : `${plural(marks, "question mark")} used`,
    });
  }

  if (rule.forbiddenOpeners?.length) {
    const opener = openingPhrase(text, rule.forbiddenOpeners);
    checks.push({
      id: "forbidden-opener",
      label: rule.forbiddenOpenersLabel ?? `Don't open with “${capitalize(rule.forbiddenOpeners[0])}…”`,
      met: opener === null,
      detail: opener === null ? "Straight into the moment" : `Opens with “${capitalize(opener)}”`,
    });
  }

  if (rule.forbidden?.length) {
    const found = findTerms(text, rule.forbidden);
    const shown = rule.forbidden.filter((w) => !/\s/.test(w)).slice(0, 3);
    checks.push({
      id: "forbidden",
      label: rule.forbiddenLabel ?? `Avoid ${quoteList(shown)}${rule.forbidden.length > shown.length ? "…" : ""}`,
      met: found.length === 0,
      detail: found.length === 0 ? "None used" : `Used ${quoteList(found)}`,
    });
  }

  if (rule.required?.length) checks.push(requiredCheck(rule.required, Boolean(rule.requiredInOrder), text));

  return checks;
}

// ---------------------------------------------------------------------------
// Today's prompt
// ---------------------------------------------------------------------------

/** Days since the epoch for the *local* calendar date of `date`. */
export function localDayNumber(date: Date): number {
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

/**
 * A step through the prompt list that is coprime with its length, so
 * consecutive days jump between skill groups yet every prompt is visited
 * exactly once per cycle.
 */
export function promptStride(count: number): number {
  if (count <= 2) return 1;
  let stride = Math.max(1, Math.floor(count * 0.38));
  while (gcd(stride, count) !== 1) stride++;
  return stride;
}

export function dailyPromptIndex(date: Date, count: number): number {
  if (count <= 0) return 0;
  const raw = (localDayNumber(date) * promptStride(count)) % count;
  return raw < 0 ? raw + count : raw;
}

/**
 * Today's challenge: stable for the whole local calendar day, and cycling
 * through every prompt before any repeats.
 */
export function dailyPromptFor(date: Date = new Date()): DailyChallenge {
  return pickForDay(date, DAILY_PROMPTS);
}

/** The item for `date`'s local calendar day from any non-empty list (see `dailyPromptFor`). */
export function pickForDay<T>(date: Date, items: readonly T[]): T {
  if (items.length === 0) throw new Error("Nothing to pick from.");
  return items[dailyPromptIndex(date, items.length)];
}

// ---------------------------------------------------------------------------
// Countdown
// ---------------------------------------------------------------------------

/** Milliseconds until the next local midnight (DST-safe). */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return Math.max(0, next.getTime() - now.getTime());
}

/** "5h 12m", "12m 05s" or "42s". */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

// ---------------------------------------------------------------------------
// Saved entries
// ---------------------------------------------------------------------------

/**
 * `DailyEntry` has no `mode` field yet, so the client stores it alongside
 * (a structural extension the persisted store keeps as-is).
 */
export type DailyEntryWithMode = DailyEntry & { mode?: CoachMode };

export function dailyEntryMode(entry: DailyEntry | undefined): CoachMode | undefined {
  const mode = (entry as DailyEntryWithMode | undefined)?.mode;
  return mode === "live" || mode === "demo" ? mode : undefined;
}

/** Daily entries with feedback, newest first. */
export function dailyHistory(daily: Record<string, DailyEntry>): DailyEntry[] {
  return Object.values(daily)
    .filter((entry) => entry.feedback)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
