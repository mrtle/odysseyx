/**
 * Lightweight text analysis used by the offline demo coach. These are
 * heuristics, not understanding — good enough to give plausible,
 * deterministic feedback when no API key is configured.
 */

export function sentences(text: string): string[] {
  return (text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
}

export function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Count how many of `terms` appear (as words or phrases) in `text`. */
export function countTerms(text: string, terms: readonly string[]): number {
  const lower = ` ${text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ")} `;
  return terms.reduce((n, term) => (lower.includes(` ${term} `) ? n + 1 : n), 0);
}

export function hasAny(text: string, terms: readonly string[]): boolean {
  return countTerms(text, terms) > 0;
}

export const LEXICON = {
  conflict: ["but", "however", "until", "against", "struggle", "fight", "refuse", "refused", "forbidden", "obstacle", "threat", "enemy", "rival", "trapped", "must", "can't", "cannot", "won't", "afraid", "fear", "lose", "losing", "risk", "danger", "problem", "conflict"],
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
