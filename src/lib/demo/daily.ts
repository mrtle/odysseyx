/**
 * Offline demo coach for the daily challenge. Deterministic heuristics: the
 * same response always earns the same feedback, which quotes the learner's
 * own words and holds them to the prompt's checkable constraint.
 */
import type { DailyChallenge } from "@/content/daily-prompts";
import { clampScore, type DailyFeedbackRequest, type MicroFeedback } from "@/lib/ai/schemas";
import {
  checkConstraints,
  countParagraphs,
  countWords,
  dialogueShape,
  findTerms,
  nonEmptyLines,
  type ConstraintCheck,
  type CountRange,
  type DailyRule,
} from "@/lib/daily";
import {
  LEXICON,
  averageSentenceLength,
  countTerms,
  firstLine,
  hasAny,
  lexicalVariety,
  pick,
  questionCount,
  scale,
  sentenceLengthVariance,
  sentences,
  specificityMarkers,
  words,
} from "@/lib/demo/text";
import type { SkillId } from "@/lib/skills";

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------

const ON_THE_NOSE = [
  "i feel",
  "i felt",
  "i want",
  "i need",
  "i love you",
  "i hate you",
  "i'm angry",
  "i am angry",
  "i'm sad",
  "i am sad",
  "i'm scared",
  "i am scared",
  "i'm jealous",
  "you hurt me",
  "i miss you",
];

/** "I want / I need" only names a feeling when it reaches for a person or an emotion, not an action. */
const DESIRE_PHRASES = new Set(["i want", "i need"]);
const RELATIONAL = new Set([
  "you",
  "your",
  "yours",
  "us",
  "him",
  "her",
  "them",
  "me",
  "together",
  "forgive",
  "forgiveness",
  "sorry",
  "divorce",
  "marry",
  "love",
  "loved",
  "feel",
  "back",
]);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A case-insensitive, whole-word regex for a lexicon phrase that tolerates curly apostrophes and extra spacing. */
function phraseRegExp(phrase: string): RegExp {
  const body = phrase
    .split(" ")
    .map((part) => escapeRegExp(part).replace(/'/g, "['’]"))
    .join("[\\s,]+");
  return new RegExp(`(?<![\\p{L}\\p{N}'’])${body}(?![\\p{L}\\p{N}])`, "giu");
}

/**
 * On-the-nose lines, quoted from the learner's own text (original case, up
 * to the end of the clause) — never the lexicon entry itself.
 */
export function onTheNoseQuotes(text: string): string[] {
  const quotes: string[] = [];
  for (const phrase of ON_THE_NOSE) {
    for (const match of text.matchAll(phraseRegExp(phrase))) {
      const clause = text.slice(match.index).split(/[.!?;:\n—–]|\s-\s/)[0].trim();
      if (DESIRE_PHRASES.has(phrase)) {
        const rest = words(clause).slice(2);
        const reachesForSomeone = rest.some((w) => RELATIONAL.has(w)) || countTerms(clause, LEXICON.emotion) > 0;
        if (!reachesForSomeone) continue; // "I want to see how long it sits there" is an action, not a confession.
      }
      const clauseWords = clause.split(/\s+/);
      quotes.push(clauseWords.length > 8 ? `${clauseWords.slice(0, 8).join(" ")}…` : clause);
      break;
    }
  }
  return quotes;
}

const HEDGES = LEXICON.hedges.filter((h) => h !== "like");

// ---------------------------------------------------------------------------
// Named emotions
// ---------------------------------------------------------------------------

/** Nouns that turn an emotion word into a thing: "grief counselling", "love letter", "hate mail", "relief fund". */
const EMOTION_COMPOUND_HEADS = new Set([
  "counselling", "counseling", "counsellor", "counselor", "group", "groups", "support", "therapy", "therapist", "letter", "letters",
  "song", "songs", "story", "stories", "affair", "interest", "seat", "handles", "bite", "nest", "factor", "chest", "ride", "rides",
  "trip", "mail", "speech", "crime", "crimes", "fund", "effort", "efforts", "work", "worker", "workers", "package", "pitcher",
  "management", "class", "classes", "course", "workshop", "book", "books", "poem", "poems", "note", "notes", "potion", "triangle",
  "language", "scene", "scenes", "island", "street", "lane", "hotline", "leaflet", "leaflets", "pamphlet", "pamphlets", "sign",
]);
/** "a book on grief", "a pamphlet about anger": the emotion is a topic on a cover, not a feeling on the page. */
const EMOTION_TOPIC_BEFORE =
  /\b(?:book|books|paperback|paperbacks|pamphlet|pamphlets|leaflet|leaflets|guide|guides|essay|essays|article|articles|poem|poems|song|songs|album|film|films|movie|movies|class|classes|course|courses|group|seminar|workshop|lecture|lectures|podcast|chapter|chapters|shelf|shelves|section|sermon|talk|documentary|manual|handbook|poster|posters|sign|magazine|magazines)\s+(?:on|about|of)\s+$/i;
/** "a book called Grief…", "a sign that reads 'Hope'": naming a title or a label. */
const EMOTION_NAMING_BEFORE = /\b(?:called|named|titled|entitled|labelled|labeled|marked|reads|read|says|spells|spelled|spelling)\s+["“‘']?$/i;
const emotionPatterns = new Map<string, RegExp>();

/** True when the word at `index` opens a sentence, a line or a quotation. */
function opensSentence(text: string, index: number): boolean {
  let i = index - 1;
  while (i >= 0 && /[\s"“‘'(\[]/.test(text[i])) i--;
  return i < 0 || /[.!?…:\n]/.test(text[i]);
}

/**
 * The emotions a piece names outright, as a feeling ("she is full of
 * grief"). Emotion words inside a title or a name ("a book called Grief Is
 * a Journey", "a girl named Joy"), a quoted label, a topic ("a book on
 * grief") or a noun compound ("grief counselling", "love letter") are
 * objects in the scene, not the writer naming the feeling.
 */
export function namedEmotions(text: string): string[] {
  const found: string[] = [];
  for (const term of LEXICON.emotion) {
    let pattern = emotionPatterns.get(term);
    if (!pattern) {
      pattern = new RegExp(`(?<![\\p{L}\\p{N}'’])${term}(?![\\p{L}\\p{N}])`, "giu");
      emotionPatterns.set(term, pattern);
    }
    for (const m of text.matchAll(pattern)) {
      const at = m.index ?? 0;
      const before = text.slice(Math.max(0, at - 40), at);
      const after = text.slice(at + m[0].length, at + m[0].length + 24);
      const capitalised = /^\p{Lu}/u.test(m[0]);
      if (capitalised && !opensSentence(text, at)) continue; // a title or a name mid-sentence
      if (capitalised && /^\s+\p{Lu}/u.test(after)) continue; // "Grief Is a Journey" opening a sentence
      if (EMOTION_NAMING_BEFORE.test(before) || EMOTION_TOPIC_BEFORE.test(before)) continue;
      const next = after.match(/^[\s-]+([a-z]+)/)?.[1];
      if (next && EMOTION_COMPOUND_HEADS.has(next)) continue;
      found.push(term);
      break;
    }
  }
  return found;
}

/** Irony and contrast — the engine of most hooks. */
const CONTRAST = [
  "but",
  "yet",
  "though",
  "although",
  "never",
  "not",
  "no longer",
  "without",
  "instead",
  "until",
  "except",
  "only",
  "couldn't",
  "wouldn't",
  "didn't",
  "won't",
  "can't",
  "cannot",
];

/** Hook markers beyond plain contrast: a pinned moment, a secret, something off. */
const HOOK_MARKERS = [
  "still",
  "almost",
  "forgot",
  "forgotten",
  "wrong",
  "secret",
  "last",
  "the day",
  "the morning",
  "the night",
  "the year",
  "nobody",
  "no one",
  "every",
];

/** Words that tell the reader nothing specific. */
const VAGUE = [
  "normal",
  "nothing",
  "something",
  "everything",
  "things",
  "stuff",
  "a lot",
  "nice",
  "good",
  "bad",
  "interesting",
  "whatever",
];

interface Signals {
  text: string;
  wordCount: number;
  sentenceList: string[];
  variety: number;
  specific: number;
  sensory: number;
  visualTerms: number;
  emotionsNamed: string[];
  conflict: number;
  stakes: number;
  desire: number;
  change: number;
  time: number;
  hedgesUsed: string[];
  rhythm: number;
  averageLength: number;
  questions: number;
  speechLines: number;
  onTheNose: string[];
  secondPerson: number;
  vague: number;
}

/**
 * Time pivots and changes the shared lexicon misses but micro-stories lean on
 * ("One night…", "The next year…", "every night after"): the structure skill's
 * score, nudge and praise all read them.
 */
const PIVOTS = [
  "one night", "one morning", "one evening", "one afternoon", "the next year", "the next day", "the next week", "next year",
  "the following", "on the night", "that morning", "that evening", "by morning", "the day after", "weeks later", "months later",
  "after that", "from then on", "every night after", "every day after", "ever after", "this time", "at last",
];
const CHANGES = ["this time", "instead", "for once", "from then on", "ever after", "anymore", "any more", "every night after", "every day after"];

function readSignals(text: string): Signals {
  const lower = words(text);
  return {
    text,
    wordCount: countWords(text),
    sentenceList: sentences(text),
    variety: lexicalVariety(text),
    specific: specificityMarkers(text),
    sensory: countTerms(text, LEXICON.sensory),
    visualTerms: countTerms(text, LEXICON.visual),
    emotionsNamed: namedEmotions(text),
    conflict: countTerms(text, LEXICON.conflict),
    stakes: countTerms(text, LEXICON.stakes),
    desire: countTerms(text, LEXICON.desire),
    change: countTerms(text, LEXICON.change) + countTerms(text, CHANGES),
    time: countTerms(text, LEXICON.time) + countTerms(text, PIVOTS),
    hedgesUsed: findTerms(text, HEDGES),
    rhythm: sentenceLengthVariance(text),
    averageLength: averageSentenceLength(text),
    questions: questionCount(text),
    speechLines: dialogueShape(text).speech,
    onTheNose: onTheNoseQuotes(text),
    secondPerson: lower.filter((w) => w === "you" || w === "your").length,
    vague: countTerms(text, VAGUE) + countTerms(text, HEDGES),
  };
}

function wordsIn(sentence: string): number {
  return countWords(sentence);
}

function contentWords(sentence: string): Set<string> {
  return new Set(words(sentence).filter((w) => w.length > 3));
}

/** Content-word overlap between the first and last sentence — a sign of a callback or recast. */
function bookendOverlap(sentenceList: string[]): number {
  if (sentenceList.length < 2) return 0;
  const first = contentWords(sentenceList[0]);
  const last = contentWords(sentenceList[sentenceList.length - 1]);
  let shared = 0;
  for (const w of last) if (first.has(w)) shared++;
  return shared;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function average(...values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function skillScore(skill: SkillId, s: Signals): number {
  const first = s.sentenceList[0] ?? s.text;
  const last = s.sentenceList[s.sentenceList.length - 1] ?? s.text;
  switch (skill) {
    case "hook": {
      const firstLen = wordsIn(first);
      const intrigue = hookIntrigue(first);
      // A short line only earns concision credit if it has something to be concise about.
      const concision = intrigue <= 0 ? 50 : firstLen <= 22 ? 85 : Math.max(35, 85 - (firstLen - 22) * 3);
      return average(scale(intrigue, 0, 3), concision, scale(s.conflict + s.stakes, 0, 4));
    }
    case "structure":
      return average(
        scale(s.time + s.change, 0, 4),
        scale(Math.min(s.sentenceList.length, 6), 1, 5),
        scale(bookendOverlap(s.sentenceList), 0, 2, 45, 90),
      );
    case "character":
      return average(scale(s.desire + s.specific, 0, 5), scale(s.variety, 0.45, 0.8)) - s.emotionsNamed.length * 4;
    case "conflict":
      return average(scale(s.conflict, 0, 4), scale(s.stakes, 0, 3), scale(s.specific, 0, 3));
    case "dialogue":
      return (
        average(scale(s.speechLines, 1, 8), scale(s.questions, 0, 3, 45, 90), scale(s.variety, 0.45, 0.8)) -
        s.onTheNose.length * 8
      );
    case "visual":
      return average(scale(s.sensory + s.visualTerms, 0, 6), scale(s.specific, 0, 4)) - s.emotionsNamed.length * 6;
    case "pacing": {
      const finalPunch = wordsIn(last) <= 6 && s.sentenceList.length > 1 ? 88 : 55;
      return average(scale(s.rhythm, 1, 8), finalPunch, scale(s.variety, 0.45, 0.8));
    }
    case "delivery": {
      const breath = Math.max(30, 90 - Math.abs(s.averageLength - 12) * 3.5);
      return average(breath, scale(s.secondPerson, 0, 3, 50, 88)) - s.hedgesUsed.length * 6;
    }
  }
}

/** How much a sentence makes the reader lean in: specifics, contrast, conflict, stakes — minus vagueness. */
function hookIntrigue(sentence: string): number {
  return (
    specificityMarkers(sentence) +
    countTerms(sentence, CONTRAST) +
    countTerms(sentence, HOOK_MARKERS) +
    countTerms(sentence, LEXICON.conflict) +
    countTerms(sentence, LEXICON.stakes) -
    countTerms(sentence, VAGUE)
  );
}

function craftScore(s: Signals): number {
  return average(scale(s.variety, 0.45, 0.82), scale(s.specific + s.sensory, 0, 6)) - Math.min(20, s.vague * 5);
}

function constraintAdjustment(checks: ConstraintCheck[]): number {
  if (checks.length === 0) return 0;
  const unmet = checks.filter((c) => !c.met).length;
  return unmet === 0 ? 5 : -Math.min(26, unmet * 12);
}

// ---------------------------------------------------------------------------
// Feedback copy
// ---------------------------------------------------------------------------

function quote(text: string, maxWords = 16): string {
  return `“${firstLine(text, maxWords).replace(/^["“”']+|["“”']+$/g, "")}”`;
}

/**
 * The learner's strongest sentence: the most concrete and specific one that
 * the nudge doesn't criticise (`flagged`). Null when every sentence is
 * flagged — praise then mustn't quote any of them.
 */
function bestSentence(skill: SkillId, s: Signals, flagged: (sentence: string) => boolean = () => false): string | null {
  const unflagged = s.sentenceList.filter((x) => !flagged(x));
  const candidates = unflagged.filter((x) => wordsIn(x) >= 3);
  if (candidates.length === 0) return unflagged[0] ?? (s.sentenceList.length === 0 && !flagged(s.text) ? s.text : null);
  if (skill === "hook") return candidates[0];
  if (skill === "delivery") {
    const speakable = candidates.filter((x) => wordsIn(x) <= 20);
    if (speakable.length > 0) return speakable[speakable.length - 1];
  }
  if (skill === "pacing") {
    const last = candidates[candidates.length - 1];
    if (wordsIn(last) <= 6) return last;
  }
  if (skill === "structure") {
    // Praise for structure is praise for the turn: quote the line where things shift.
    const pivots = candidates.filter((c) => countTerms(c, LEXICON.change) + countTerms(c, CHANGES) + countTerms(c, PIVOTS) + countTerms(c, LEXICON.time) > 0);
    const later = pivots.filter((c) => c !== candidates[0]);
    if (later.length > 0) return later[later.length - 1];
    if (pivots.length > 0) return pivots[0];
  }
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const c of candidates) {
    const score =
      countTerms(c, LEXICON.sensory) * 2 +
      specificityMarkers(c) * 1.5 +
      countTerms(c, LEXICON.conflict) +
      lexicalVariety(c) -
      namedEmotions(c).length;
    if (score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

const PRAISE: Record<SkillId, string[]> = {
  hook: [
    "that opening raises a question before it answers one, which is exactly the job of a first line.",
    "there's a specific promise in that line: we know what kind of story this is and want the next sentence.",
  ],
  structure: [
    "that line gives the piece a spine: we can feel where it started and where it has moved to.",
    "you're thinking in turns, not just events — that line marks a clear shift in the situation.",
  ],
  character: [
    "that detail tells us who this person is without anyone announcing it.",
    "that's characterisation through behaviour, the kind actors and readers both trust.",
  ],
  conflict: [
    "that's where the pressure lives: something concrete stands in the way, and it costs something.",
    "the stakes in that line are specific enough to feel, not just understand.",
  ],
  dialogue: [
    "that line does two jobs at once: it sounds like a person talking and it pushes on the other character.",
    "there's subtext under that line; what's meant sits just beneath what's said.",
  ],
  visual: [
    "that's an image a camera could shoot, and it carries the feeling for you.",
    "concrete and sensory, so we see it rather than being told about it.",
  ],
  pacing: [
    "the rhythm lands there, and the sentence length itself does the storytelling.",
    "you control time in that line: it knows exactly how long to linger.",
  ],
  delivery: [
    "that's written for the ear: short enough to say in one breath and easy to remember.",
    "that line sounds like a person talking to a room, not reading from a page.",
  ],
};

/** Praise that doesn't claim a strength the quoted line visibly lacks. */
const RAW_MATERIAL =
  "there's a real idea in that line. The raw material is here; what it needs now is shaping, not starting over.";

/** Shown when every sentence carries something the nudge criticises: praise that quotes nothing it would contradict. */
const WHOLE_PIECE =
  "You got a complete piece down, and that's the part most people skip. The raw material is here; what it needs now is shaping, not starting over.";

/** Where a sentence can be cut into clauses ("and" is left alone: it joins adjectives as often as clauses). */
const CLAUSE_SPLIT = /\s*[,;:—–]\s*|\s+(?=(?:as|but|while|when|until|because)\s)/;
const LEADING_CONJUNCTION = /^(?:as|but|while|when|until|because)\s+/i;
/** A clause that can stand as a quote: it opens on a subject, not mid-predicate ("tells me to drive"). */
const STANDALONE_CLAUSE = /^(?:\p{Lu}|(?:i|he|she|they|we|you|it|the|a|an|his|her|their|my|our|its|this|that|one|two|three)\b)/u;

/**
 * The line to praise. Sentences the nudge criticises are avoided: first the
 * best clean sentence, then the best clean clause of a flagged one ("the
 * rain falls on his old coat" out of a sentence that also names despair).
 * A line the feedback only criticises for its form (narration in a
 * dialogue-only piece, an over-long sentence, the hedge the nudge quotes)
 * may still be quoted, but without claiming a strength (`clean: false`). A
 * line with a failed brief's banned word or a named emotion is never quoted.
 */
function praiseLine(skill: SkillId, s: Signals, flags: Flags): { line: string; clean: boolean } | null {
  const any = (x: string) => flags.hard(x) || flags.soft(x);
  const sentence = bestSentence(skill, s, any);
  if (sentence !== null) return { line: sentence, clean: true };
  const clauses = s.sentenceList
    .flatMap((x) => x.split(CLAUSE_SPLIT))
    .map((c) => c.trim().replace(LEADING_CONJUNCTION, ""))
    .filter((c) => wordsIn(c) >= 4 && STANDALONE_CLAUSE.test(c));
  const clause = clauses.length > 0 ? bestSentence(skill, { ...s, sentenceList: clauses }, any) : null;
  if (clause !== null && wordsIn(clause) >= 4) return { line: clause, clean: true };
  const formOnly = bestSentence(skill, s, flags.hard);
  return formOnly === null ? null : { line: formOnly, clean: false };
}

function praiseFor(skill: SkillId, s: Signals, checks: ConstraintCheck[], flags: Flags): string {
  const picked = praiseLine(skill, s, flags);
  if (picked === null) return WHOLE_PIECE;
  const { line } = picked;
  const lineWords = wordsIn(line);
  // Each strength is only claimed when the signal behind it is there — and it's the same signal the nudge reads,
  // so the praise never says "a clear shift" above a nudge that says "we don't get the turn".
  const earned =
    picked.clean &&
    (skill !== "delivery" || lineWords <= 20) &&
    (skill !== "hook" || (line === s.sentenceList[0] && lineWords <= 22 && hookIntrigue(line) > 0)) &&
    (skill !== "dialogue" || s.speechLines > 0) &&
    (skill !== "visual" || namedEmotions(line).length === 0) &&
    (skill !== "structure" || hasTurn(s)) &&
    (skill !== "conflict" || s.stakes > 0) &&
    (skill !== "pacing" || s.rhythm >= 3);
  const reason = earned ? pick(PRAISE[skill], `${skill}:${s.text}`) : RAW_MATERIAL;
  const allMet = checks.length > 0 && checks.every((c) => c.met);
  // Only vouch for what was measured: parts of a brief (tone, "first person") aren't machine-checkable.
  const brief = allMet ? ` And you hit every measurable part of the brief (${checks[0].detail.toLowerCase()}).` : "";
  return `${quote(line)} — ${reason}${brief}`;
}

/** The structure nudge's own test: a change word, or at least two time markers. */
function hasTurn(s: Signals): boolean {
  return s.change > 0 || s.time >= 2;
}

interface Flags {
  /** Lines with a word the feedback says must go: a failed brief's banned word, or a named emotion. Never quoted. */
  hard: (sentence: string) => boolean;
  /**
   * Lines the feedback criticises for their form (a question mark, the throat-clearing opener, the over-long or
   * unpunchy sentence, narration) or quotes back (the on-the-nose line, the hedge): quotable, but never praised.
   */
  soft: (sentence: string) => boolean;
}

/**
 * Sentences the feedback criticises, so the praise doesn't hold one up as
 * the best line: any that break a failed rule, and — when the skill nudge is
 * what's shown — the named emotion, on-the-nose line or hedge it calls out.
 */
function flaggedSentences(text: string, s: Signals, skill: SkillId, rule: DailyRule | undefined, checks: ConstraintCheck[]): Flags {
  const failedIds = new Set(checks.filter((c) => !c.met).map((c) => c.id));
  const hard: ((sentence: string) => boolean)[] = [];
  const soft: ((sentence: string) => boolean)[] = [];
  const first = s.sentenceList[0];
  const last = s.sentenceList[s.sentenceList.length - 1];
  if (failedIds.has("forbidden") && rule?.forbidden?.length) {
    const banned = rule.forbidden;
    hard.push((x) => hasAny(x, banned));
  }
  if (failedIds.has("forbidden-opener")) soft.push((x) => x === first);
  if (failedIds.has("no-question-marks")) soft.push((x) => /[?？¿]/.test(x));
  if (failedIds.has("no-dialogue")) soft.push((x) => /["“”]/.test(x));
  if (failedIds.has("max-sentence") && rule?.maxSentenceWords !== undefined) {
    const max = rule.maxSentenceWords;
    soft.push((x) => wordsIn(x) > max);
  }
  if (failedIds.has("last-sentence")) soft.push((x) => x === last);
  if (failedIds.has("dialogue-only")) {
    const narration = nonEmptyLines(text).filter((line) => dialogueShape(line).narration > 0);
    soft.push((x) => narration.some((line) => line.includes(x) || x.includes(line)));
  }
  if (failedIds.has("speaker-words") && rule?.speakerMaxWords) {
    const { speakers, maxWords } = rule.speakerMaxWords;
    const labelled = new RegExp(`^(?:${speakers.map((sp) => sp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:\\s*(.*)$`, "i");
    const tooLong = nonEmptyLines(text)
      .map((line) => line.match(labelled)?.[1])
      .filter((spoken): spoken is string => spoken !== undefined && countWords(spoken) > maxWords);
    soft.push((x) => tooLong.some((spoken) => spoken.includes(x) || x.includes(spoken)));
  }
  // Emotions are penalised whenever these skills are scored, so a line that names one is never the showcase.
  if (skill === "visual" || skill === "character") hard.push((x) => namedEmotions(x).length > 0);
  // The line the skill nudge quotes back (on the nose, or hedged) can still be the raw material, but not the showcase.
  if (failedIds.size === 0) {
    if (skill === "dialogue" && s.onTheNose.length > 0) {
      const called = s.onTheNose[0].replace(/…$/, "");
      soft.push((x) => x.includes(called) || called.includes(x));
    }
    if (skill === "delivery" && s.hedgesUsed.length > 0) {
      const hedge = [s.hedgesUsed[0]];
      soft.push((x) => hasAny(x, hedge));
    }
  }
  return { hard: (x) => hard.some((test) => test(x)), soft: (x) => soft.some((test) => test(x)) };
}

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function countNudge(label: string, noun: string, n: number, range: CountRange | undefined, s: Signals): string {
  const brief = `The brief is “${label.toLowerCase()}”`;
  if (range?.max !== undefined && n > range.max) {
    const hedge = s.hedgesUsed[0];
    const where =
      noun === "word"
        ? hedge
          ? ` Start with “${hedge}”.`
          : " Start with adjectives, stage-setting and anything said twice."
        : " Merge or cut until only the essential ones remain.";
    return `${brief} and this runs ${plural(n, noun)} — ${n - range.max} over. Cutting is where the craft lives.${where}`;
  }
  if (range?.min !== undefined && n < range.min) {
    const short = range.min - n;
    const gift = short === 1 ? `That missing ${noun} is a gift` : `Those ${short} missing ${noun}s are a gift`;
    return range.max === range.min
      ? `${brief} and you're at ${n}. ${gift} — spend ${short === 1 ? "it" : "them"} on the moment that matters most.`
      : `${brief} and you're at ${n}, ${short} short. Give the key moment more room to land.`;
  }
  return `${brief}. Hitting the number exactly is the exercise — reshape it until it fits.`;
}

function constraintNudge(check: ConstraintCheck, s: Signals, skill: SkillId, rule: DailyRule | undefined): string {
  switch (check.id) {
    case "words":
      return countNudge(check.label, "word", s.wordCount, rule?.words, s);
    case "sentences":
      return countNudge(check.label, "sentence", s.sentenceList.length, rule?.sentences, s);
    case "lines":
      return countNudge(check.label, "line", nonEmptyLines(s.text).length, rule?.lines, s);
    case "paragraphs":
      return countNudge(check.label, "paragraph", countParagraphs(s.text), rule?.paragraphs, s);
    case "max-sentence":
      return `${check.detail} — too long to say in one breath. Split it where the idea turns, usually at an “and” or a “but”.`;
    case "last-sentence":
      return `${check.detail}; the brief wants ${rule?.lastSentenceMaxWords ?? 3} words or fewer. End on a hard stop so the rhythm lands like a slammed door.`;
    case "dialogue-only": {
      const narration = nonEmptyLines(s.text).find((line) => dialogueShape(line).narration > 0);
      return narration
        ? `The brief is dialogue only, but ${quote(narration, 10)} reads as narration. Move that information into what the characters say — or pointedly don't say.`
        : "The brief is dialogue only — give us at least two spoken lines, one per line, and let the talk carry everything.";
    }
    case "no-dialogue":
      return "The brief is silent film: no quotation marks. Find the gesture or image that replaces the line you wanted to write.";
    case "forbidden": {
      const used = findTerms(s.text, rule?.forbidden ?? []);
      const list = used.map((w) => `“${w}”`).join(", ");
      return skill === "visual"
        ? `You named the feeling — ${list}. Take the word out and let the weather or the object carry it instead.`
        : `You used ${list} — the brief took ${used.length > 1 ? "those words" : "that word"} away on purpose. Make us sense it without saying it.`;
    }
    case "required":
      return `${check.detail}. The brief's key phrases are the scaffolding here — build the piece on them${rule?.requiredInOrder ? ", in order" : ""}.`;
    case "speaker-words":
      return check.detail.startsWith("No lines")
        ? `Label the ${rule?.speakerMaxWords?.label ?? "speaker"}'s lines “${rule?.speakerMaxWords?.label ?? "NAME"}:” so we can hear who's holding back.`
        : `${check.detail} — the brief allows ${rule?.speakerMaxWords?.maxWords === 1 ? "one word" : `${rule?.speakerMaxWords?.maxWords ?? 1} words`}. Cut it to the single word that carries the whole day; the pressure lives in what's left unsaid.`;
    case "no-question-marks":
      return `${check.detail}, and the brief bans them. Leave the question hanging in the situation instead — an unanswered knock, a name nobody recognises.`;
    case "forbidden-opener":
      return `${check.detail}. That's throat-clearing — cut it and start on the first word of the moment itself.`;
    default:
      return `${check.label}: ${check.detail}.`;
  }
}

function skillNudge(skill: SkillId, s: Signals): string {
  const first = s.sentenceList[0] ?? s.text;
  switch (skill) {
    case "hook":
      if (wordsIn(first) > 22) {
        return `Your opening sentence takes ${wordsIn(first)} words to arrive. Get to the strange, specific thing faster — the hook should land before the reader can look away.`;
      }
      return hookIntrigue(first) <= 0
        ? "Sharpen the specificity: a name, a number or a place turns a general premise into one we can picture."
        : "Put the tension in the very first clause. Right now the question the reader should be asking arrives a beat late.";
    case "structure":
      return !hasTurn(s)
        ? "We get the situation but not the turn. Mark the moment where things change, so the ending feels earned rather than stopped."
        : "Make the ending answer the beginning more directly — echo an image or phrase from the first line so the shape clicks shut.";
    case "character":
      if (s.emotionsNamed.length > 0) {
        return `You tell us they're feeling “${s.emotionsNamed[0]}”. Show it through what they do with their hands, or what they choose not to say.`;
      }
      return s.desire === 0
        ? "We don't yet know what this person wants. One concrete desire — even a small one — makes every detail around them mean more."
        : "Push the choice harder: make what they do cost them something, so it reveals who they are rather than just what they did.";
    case "conflict":
      return s.stakes === 0
        ? "What's lost if they fail? Name the cost in concrete, personal terms — not the world, their world."
        : "The obstacle could push back harder. Let it adapt or escalate, so the pressure builds instead of holding steady.";
    case "dialogue":
      if (s.onTheNose.length > 0) {
        return `“${s.onTheNose[0]}” says the feeling out loud. People rarely name what they want — have them argue about something smaller that stands in for it.`;
      }
      return s.questions === 0
        ? "Nobody asks for anything. Give one character a question they need answered, and the other a reason to dodge it."
        : "Give the two voices more contrast — different rhythms, different vocabularies — so we'd know who's speaking without tags.";
    case "visual":
      if (s.emotionsNamed.length > 0) {
        return `You name the emotion (“${s.emotionsNamed[0]}”). Replace it with something a camera could see — the image should do the feeling's work.`;
      }
      return s.sensory < 2
        ? "Engage one more sense. Sound and texture make an image feel filmed rather than described."
        : "Choose the single most telling image and give it more room; right now it competes with the details around it.";
    case "pacing":
      return s.rhythm < 3
        ? `Most sentences run about ${Math.round(s.averageLength)} words, so the rhythm flattens. Vary it: stretch the build-up, then hit the key moment with something very short.`
        : "Compress what's routine and expand the crucial second. The most important moment deserves the most words — or the fewest.";
    case "delivery":
      if (s.hedgesUsed.length > 0) {
        return `Cut the hedge “${s.hedgesUsed[0]}”. Out loud, qualifiers read as nerves — say the thing plainly and let the pause do the work.`;
      }
      return s.averageLength > 18
        ? `Your sentences average ${Math.round(s.averageLength)} words — long for the ear. Break them so a listener never has to hold a clause in their head.`
        : "Land the ending harder. The last line is the one people repeat — make it short, concrete and yours.";
  }
}

const TRY_THIS: Record<SkillId, string[]> = {
  hook: [
    "Rewrite your first line starting with a verb, dropped into the middle of an action, and cut everything before the first surprising detail.",
    "Write three alternative first lines — one question, one image, one statement of fact — and keep the one that makes you want line two.",
  ],
  structure: [
    "Write the one-sentence spine first: “X wants Y, but Z, so…”. Then cut any sentence that doesn't serve it.",
    "Underline the turning point. If you can't find it, write the sentence where everything changes and build around it.",
  ],
  character: [
    "Give your character one physical habit that contradicts what they say, and put it in the final line.",
    "Rewrite it so the character makes a choice in the last line that we wouldn't have predicted from the first.",
  ],
  conflict: [
    "Add a deadline and a witness: by when must it be done, and who's watching when it goes wrong?",
    "Rewrite the obstacle as a person with their own good reason to stand in the way.",
  ],
  dialogue: [
    "Rewrite the most direct line as a question — or as a line about something else entirely — and let the other character answer the subtext.",
    "Read it aloud as two different actors. Wherever the voices blur, change one character's rhythm.",
  ],
  visual: [
    "Pick your strongest image and write it as a shot: size, angle, and the one sound we hear.",
    "Rewrite one sentence of telling as a single close-up that shows the same thing.",
  ],
  pacing: [
    "Read it aloud and mark where you breathe. Then cut the sentence right before the key moment in half.",
    "Rewrite it with the most important moment in the shortest sentence of the piece.",
  ],
  delivery: [
    "Say it out loud against a 30-second timer. Every place you stumble is a sentence to shorten.",
    "Rewrite your closing line so it could be the thing someone repeats to a friend afterwards.",
  ],
};

function tryThisFor(skill: SkillId, s: Signals, failed: ConstraintCheck | undefined, flags: Flags): string {
  const keep = praiseLine(skill, s, flags)?.line ?? null;
  if (keep !== null && (failed?.id === "words" || failed?.id === "sentences" || failed?.id === "lines")) {
    return `Do a hard-constraint pass: keep ${quote(keep, 10)} untouched and rebuild everything around it until you hit “${failed.label.toLowerCase()}” on the nose.`;
  }
  return pick(TRY_THIS[skill], `try:${skill}:${s.text}`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * The daily route used to import the English check from here; it now lives
 * in ./language with every other demo route's, and is re-exported so older
 * imports keep working.
 */
export { DEMO_ENGLISH_ONLY, demoCanRead } from "@/lib/demo/language";

export function demoDailyFeedback(prompt: DailyChallenge, request: Pick<DailyFeedbackRequest, "response">): MicroFeedback {
  const text = request.response.trim();
  const signals = readSignals(text);
  const checks = checkConstraints(prompt.rule, text);
  const failed = checks.find((c) => !c.met);
  const flags = flaggedSentences(text, signals, prompt.skill, prompt.rule, checks);

  const raw =
    0.4 * craftScore(signals) +
    0.6 * skillScore(prompt.skill, signals) +
    constraintAdjustment(checks) -
    (signals.wordCount < 12 && !prompt.rule?.words ? 10 : 0);
  const score = clampScore(Math.max(18, Math.min(94, raw)));

  return {
    score,
    praise: praiseFor(prompt.skill, signals, checks, flags),
    nudge: failed ? constraintNudge(failed, signals, prompt.skill, prompt.rule) : skillNudge(prompt.skill, signals),
    tryThis: tryThisFor(prompt.skill, signals, failed, flags),
    skill: prompt.skill,
  };
}
