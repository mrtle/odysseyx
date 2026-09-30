/**
 * Lightweight text analysis used by the offline demo coach. These are
 * heuristics, not understanding — good enough to give plausible,
 * deterministic feedback when no API key is configured.
 */

/** Abbreviations whose dots shouldn't end a sentence ("Dr.", "4 a.m."). */
const ABBREVIATIONS = /\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|a\.m|p\.m|U\.S)\./gi;
const DOT = "\u2024"; // one-dot leader, restored after splitting

/** Past this many words a "sentence" is really a run-on (dictated or unpunctuated text). */
const RUN_ON_WORDS = 40;
/** Target size of the pieces a run-on is cut into. */
const CLAUSE_WORDS = 25;
const CLAUSE_BREAK = /\s+(?=(?:and then|and so|but|so|until|then|when|because|one day|after that|that night|the next day|years later|finally)\s)/i;

/** Split a run-on at clause boundaries (conjunctions, then commas), falling back to fixed word windows. */
function splitRunOn(sentence: string): string[] {
  const count = (s: string) => s.split(/\s+/).filter(Boolean).length;
  if (count(sentence) <= RUN_ON_WORDS) return [sentence];
  const pieces: string[] = [];
  let current = "";
  const parts = sentence.split(CLAUSE_BREAK).flatMap((p) => (count(p) > CLAUSE_WORDS ? p.split(/(?<=[,;:—–])\s+/) : [p]));
  // Carry a dangling conjunction ("…a silver button and") over to the clause it introduces.
  for (let i = 0; i < parts.length - 1; i++) {
    const dangling = parts[i].match(/\s+(and|but|or|yet)$/i);
    if (dangling) {
      parts[i] = parts[i].slice(0, dangling.index);
      parts[i + 1] = `${dangling[1]} ${parts[i + 1]}`;
    }
  }
  for (const part of parts) {
    const next = current ? `${current} ${part}` : part;
    if (current && count(next) > CLAUSE_WORDS) {
      pieces.push(current);
      current = part;
    } else {
      current = next;
    }
  }
  if (current) pieces.push(current);
  return pieces.flatMap((piece) => {
    const w = piece.split(/\s+/).filter(Boolean);
    if (w.length <= RUN_ON_WORDS) return [piece];
    const windows: string[] = [];
    for (let i = 0; i < w.length; i += CLAUSE_WORDS) windows.push(w.slice(i, i + CLAUSE_WORDS).join(" "));
    return windows;
  });
}

/**
 * Sentences, split on . ! ? (keeping abbreviations like "Dr." intact), plus
 * the CJK full stops 。！？. Run-ons over RUN_ON_WORDS words — typically
 * dictated or unpunctuated text — are cut at clause boundaries so beat
 * mapping and first-line checks still have units to work with.
 */
export function sentences(text: string): string[] {
  const protectedText = text
    .replace(/\s+/g, " ")
    .replace(ABBREVIATIONS, (m) => m.replaceAll(".", DOT));
  return (protectedText.match(/[^.!?。！？]+[.!?。！？]+["')\]”’」』]*|[^.!?。！？]+$/g) ?? [])
    .map((s) => s.replaceAll(DOT, ".").trim())
    .filter(Boolean)
    .flatMap(splitRunOn);
}

/** Scripts written without spaces between words; these need a word segmenter. */
const UNSPACED_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u;

const segmenter: Intl.Segmenter | null =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "word" }) : null;

/** Straight apostrophes, and possessive 's / s' removed: "his daughter's" → "his daughter". */
function normalizeApostrophes(lower: string): string {
  return lower
    .replace(/[’‘ʼ]/g, "'")
    .replace(/(?<=[\p{L}\p{N}])'s(?![\p{L}\p{N}])/gu, "")
    .replace(/(?<=[\p{L}]s)'(?![\p{L}\p{N}])/gu, "");
}

/**
 * Lower-cased words in any script. Possessives are reduced to the noun
 * ("daughter's" → "daughter"); contractions like "can't" stay whole. Text
 * in scripts without spaces (Chinese, Japanese, Thai…) is segmented with
 * Intl.Segmenter where available.
 */
export function words(text: string): string[] {
  const lower = normalizeApostrophes(text.toLowerCase());
  if (segmenter && UNSPACED_SCRIPT.test(lower)) {
    return Array.from(segmenter.segment(lower))
      .filter((s) => s.isWordLike)
      .map((s) => s.segment);
  }
  return lower.match(/[\p{L}\p{M}\p{N}]+(?:'[\p{L}\p{M}\p{N}]+)*/gu) ?? [];
}

/** Share of letters that are Latin script (1 for English; near 0 for Japanese or Russian). */
export function latinShare(text: string): number {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return 1;
  return (text.match(/\p{Script=Latin}/gu) ?? []).length / letters.length;
}

/**
 * Text normalised for phrase matching: lower-case, possessives reduced,
 * punctuation (including hyphens) turned into spaces, space-padded — so
 * `includes(" term ")` finds whole words and phrases. Use the same
 * function on the terms.
 */
export function normalizeForMatch(text: string): string {
  const cleaned = normalizeApostrophes(text.toLowerCase())
    .replace(/[^\p{L}\p{M}\p{N}' ]+/gu, " ")
    .replace(/(^|\s)'+|'+(?=\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return ` ${cleaned} `;
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Count how many of `terms` appear (as words or phrases) in `text`. */
export function countTerms(text: string, terms: readonly string[]): number {
  const hay = normalizeForMatch(text);
  return terms.reduce((n, term) => {
    const needle = normalizeForMatch(term);
    return needle.trim() && hay.includes(needle) ? n + 1 : n;
  }, 0);
}

/**
 * Like countTerms, but a term only counts inside a sentence that also
 * contains one of `context` — e.g. stakes words ("home", "family") only
 * where there's also conflict or desire, not in "we went home".
 */
export function countTermsInContext(text: string, terms: readonly string[], context: readonly string[]): number {
  const found = new Set<string>();
  for (const sentence of sentences(text)) {
    if (countTerms(sentence, context) === 0) continue;
    const hay = normalizeForMatch(sentence);
    for (const term of terms) {
      const needle = normalizeForMatch(term);
      if (needle.trim() && hay.includes(needle)) found.add(term);
    }
  }
  return found.size;
}

export function hasAny(text: string, terms: readonly string[]): boolean {
  return countTerms(text, terms) > 0;
}

export const LEXICON = {
  conflict: ["but", "however", "until", "against", "struggle", "fight", "refuse", "refused", "forbidden", "obstacle", "threat", "enemy", "rival", "trapped", "must", "can't", "cannot", "won't", "afraid", "fear", "lose", "losing", "lost", "loses", "failed", "fails", "crashed", "died", "stole", "betrayed", "risk", "danger", "problem", "conflict"],
  stakes: ["or else", "before", "lose", "losing", "die", "death", "save", "forever", "last chance", "only", "everything", "never", "destroy", "ruin", "fired", "alone", "family", "home", "life"],
  desire: ["want", "wants", "wanted", "need", "needs", "dream", "dreams", "hope", "goal", "determined", "desperate", "longs", "longed", "tries", "tried", "trying", "must", "sets out", "decides", "decided", "wish"],
  change: ["realized", "realised", "learned", "learnt", "understood", "finally", "since then", "ever since", "now", "changed", "different", "became", "no longer", "for the first time"],
  sensory: ["saw", "heard", "smelled", "smell", "tasted", "cold", "warm", "hot", "bright", "dark", "red", "blue", "green", "gold", "silver", "rain", "wind", "light", "shadow", "quiet", "loud", "whisper", "rough", "smooth", "sweat", "blood", "smoke", "dust", "sun", "moon", "neon", "glass"],
  time: ["when", "then", "after", "before", "suddenly", "one day", "that night", "the next morning", "later", "finally", "until", "meanwhile", "years later"],
  emotion: ["love", "hate", "fear", "afraid", "angry", "furious", "sad", "grief", "joy", "shame", "guilt", "lonely", "hope", "desperate", "terrified", "heartbroken", "proud", "jealous", "relief"],
  hedges: ["kind of", "sort of", "basically", "like", "maybe", "i guess", "i think", "just", "really", "very", "actually", "literally", "um", "uh"],
  visual: ["shot", "close-up", "wide", "frame", "camera", "light", "lighting", "color", "colour", "silhouette", "lens", "angle", "tracking", "push in", "handheld", "composition", "image"],
} as const;

/** 0–1 ratio of distinct words — a rough proxy for vivid, specific language. */
export function lexicalVariety(text: string): number {
  const w = words(text);
  if (w.length === 0) return 0;
  return new Set(w).size / w.length;
}

/** Words that look like proper nouns or numbers — signs of specificity. */
export function specificityMarkers(text: string): number {
  const properNouns = text.match(/(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b/g)?.length ?? 0;
  const numbers = text.match(/\b\d+\b/g)?.length ?? 0;
  return properNouns + numbers;
}

export function dialogueLines(text: string): number {
  return text.match(/["“][^"”]{2,}["”]/g)?.length ?? 0;
}

export function questionCount(text: string): number {
  return text.match(/\?/g)?.length ?? 0;
}

export function averageSentenceLength(text: string): number {
  const s = sentences(text);
  if (s.length === 0) return 0;
  return words(text).length / s.length;
}

/** Standard deviation of sentence lengths — higher means more varied rhythm. */
export function sentenceLengthVariance(text: string): number {
  const lengths = sentences(text).map((s) => words(s).length);
  if (lengths.length < 2) return 0;
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  return Math.sqrt(lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length);
}

/** Map a raw value onto 0–100 with a soft floor/ceiling. */
export function scale(value: number, low: number, high: number, floor = 25, ceiling = 92): number {
  if (high === low) return floor;
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return Math.round(floor + t * (ceiling - floor));
}

/** Deterministic pick from a list, seeded by a string. */
export function pick<T>(items: readonly T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return items[Math.abs(h) % items.length];
}

/** First sentence (or first ~20 words) for quoting back to the user. */
export function firstLine(text: string, maxWords = 20): string {
  const s = sentences(text)[0] ?? text;
  const w = s.split(/\s+/);
  return w.length > maxWords ? `${w.slice(0, maxWords).join(" ")}…` : s;
}
