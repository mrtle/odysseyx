/**
 * The offline Story Lab coach: deterministic heuristics that stand in for
 * Claude when no API key is configured. Every function returns an object
 * that satisfies the same zod schema as the live coach, quotes the writer's
 * own words back to them, and gives feedback specific enough to act on.
 *
 * These are heuristics, not understanding — they read signals (verbs,
 * connectors, lexicon hits, sentence shapes) rather than meaning.
 */
import {
  LOGLINE_COMPONENTS,
  clampScore,
  type BeatStatus,
  type Improvement,
  type LoglineAnalysis,
  type LoglineComponent,
  type LoglineRequest,
  type Shot,
  type ShotPlan,
  type ShotsRequest,
  type SkillScore,
  type StoryAnalysis,
  type StoryFormat,
  type StoryRequest,
} from "@/lib/ai/schemas";
import { SHOT_SIZE_INFO, type ShotSize } from "@/lib/film";
import { FRAMEWORKS, type FrameworkBeat } from "@/lib/frameworks";
import type { SkillId } from "@/lib/skills";
import {
  LEXICON,
  dialogueLines,
  lexicalVariety,
  normalizeForMatch,
  normalizedTerms,
  paragraphs,
  scale,
  sentences,
  specificityMarkers,
  words,
} from "./text";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Lower-case, punctuation-free, space-padded text for phrase matching, with
 * possessives reduced ("his daughter's" → "his daughter") so lexicon terms
 * still match. Shared with the other demo coaches via ./text.
 */
const norm = normalizeForMatch;

/**
 * The subset of `terms` (words or phrases) that appear in `text`, in list
 * order. The text is normalised once per call and the terms' normalised
 * forms come from text.ts's per-array cache (see `normalizedTerms`), so pass
 * module-level constants rather than fresh array literals on hot paths.
 */
function hits(text: string, terms: readonly string[]): string[] {
  return hitsIn(norm(text), terms);
}

/** `hits` for text already passed through `norm` — normalise a sentence once, test it against many lists. */
function hitsIn(hay: string, terms: readonly string[]): string[] {
  const needles = normalizedTerms(terms);
  const found: string[] = [];
  for (let i = 0; i < needles.length; i++) {
    const needle = needles[i];
    if (needle && hay.includes(needle) && !found.includes(terms[i])) found.push(terms[i]);
  }
  return found;
}

/** Total occurrences of `terms` in `text` (every repeat counts), each weighted by `weight(term)`. */
function occurrences(text: string, terms: readonly string[], weight: (term: string) => number = () => 1): number {
  const hay = norm(text);
  const needles = normalizedTerms(terms);
  const seen = new Set<string>();
  let total = 0;
  for (let i = 0; i < needles.length; i++) {
    const needle = needles[i];
    if (!needle || seen.has(terms[i])) continue;
    seen.add(terms[i]);
    let count = 0;
    // Step past the needle but keep its trailing space, so adjacent repeats ("no no") both count.
    for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, at + needle.length - 1)) count++;
    total += count * weight(terms[i]);
  }
  return total;
}

function truncateWords(text: string, max: number): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= max) return text.trim();
  return `${parts.slice(0, max).join(" ").replace(/[,;:—–-]+$/, "")}…`;
}

function stripEnd(text: string): string {
  return text.trim().replace(/[\s.,;:!?—–-]+$/, "").trim();
}

function lowerFirst(text: string): string {
  return text ? text[0].toLowerCase() + text.slice(1) : text;
}

function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

/** Capitalise the first letter, looking past an opening bracket ("[a hero]" → "[A hero]"). */
function capitalizeLead(text: string): string {
  return text.replace(/^([[("“]*)([a-z])/, (_, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`);
}

const ARTICLES = new Set(["a", "an", "the", "his", "her", "their", "our", "my", "its"]);
const DETERMINERS = new Set([...ARTICLES, "two", "three", "four", "five", "six", "some", "several"]);

/** Lower-case a leading determiner so a phrase can sit mid-sentence ("A diver" → "a diver"). */
function midSentence(phrase: string): string {
  const first = phrase.split(/\s+/)[0] ?? "";
  return DETERMINERS.has(first.toLowerCase()) ? phrase[0].toLowerCase() + phrase.slice(1) : phrase;
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Logline Doctor
// ---------------------------------------------------------------------------

/** The logline length window the heuristics reward (and the UI hints at). */
export const IDEAL_LOGLINE_WORDS = { min: 20, max: 45 } as const;
/** Past this a logline reads as a synopsis: its verdict and score are capped. */
const SPRAWL_WORDS = 60;

const INCIDENT_RE = /^(when|after|as|once|while|following|in the wake of|on the eve of|the day|the night)\s+(.+?)\s*[,;:—–]\s*(.+)$/i;

const GOAL_RE =
  /\b(must|has to|have to|needs to|need to|is forced to|are forced to|sets out to|set out to|sets off to|tries to|try to|wants to|want to|fights to|fight to|races to|race to|struggles to|scrambles to|vows to|plans to|decides to|attempts to|hopes to|is determined to|risks everything to|embarks on an? (?:quest|mission|journey) to|teams up with [^,.;]{1,40}? to|joins [^,.;]{1,40}? to|goes undercover to)\s+/i;

/** Verbs that can follow a protagonist noun phrase ("a shy librarian finds…"), present and simple past. */
const SUBJECT_VERBS =
  "rescues|saves|steals|stole|kills|murders|hears|heard|sees|saw|catches|caught|hires|buys|sells|wins|escapes|survives|arrives|crashes|quits|accepts|adopts|marries|kidnaps|betrays|overhears|confesses|breaks|chases|follows|" +
  "is|are|was|were|has|have|had|discovers?|discovered|finds?|found|learns?|learned|learnt|goes|go|went|travels?|travelled|traveled|gets?|got|becomes?|became|falls?|fell|meets?|met|realizes|realises|realize|realized|realised|returns?|returned|inherits?|inherited|wakes?|woke|lands?|landed|joins?|joined|takes?|took|starts?|started|begins?|began|moves?|moved|decides?|decided|agrees?|agreed|embarks?|embarked|sets? off|team up|teams up|receives?|received|loses|lost|uncovers?|uncovered|witnesses|witnessed|stumbles?|stumbled";
/** A first name with up to two more capitalised words, after an optional title: "Maya", "Maya Okafor", "Dr. Lena Park". */
const NAME_PATTERN = String.raw`(?:(?:Dr|Mr|Mrs|Ms|Mx|Prof|Sgt|Capt|Det|Lt|Rev|Sr|Fr)\.?\s+|(?:Detective|Captain|Doctor|Professor|Officer|Agent|Sergeant|Sister|Brother|Father|Judge|Sheriff|Coach)\s+(?=[A-Z]))?[A-Z][a-z]+(?:\s+[A-Z][a-z'’-]+){0,2}`;
const NAME_LED_RE = new RegExp(`^${NAME_PATTERN}\\b`);
/** "Maya Okafor, a nurse, …": a name with an appositive, which needs its closing comma before a verb. */
const NAME_APPOSITIVE_RE = new RegExp(`^${NAME_PATTERN},\\s`);
// Case-sensitive on purpose (hence the [Aa] classes): a lower-case phrase ("her estranged father") is never a name.
const PROTAGONIST_PHRASE = String.raw`(?:[Aa]n?|[Tt]he|[Tt]wo|[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Aa] pair of|[Aa] group of|[Aa] band of|\d+)\s+[^,.;]{2,60}?|${NAME_PATTERN}(?:,\s*[Aa]n?\s+[^,]{2,40},)?`;
/** "A retired cop who lands a job… discovers" — the phrase may carry a relative clause, but never ends on "who". */
const FALLBACK_PROTAGONIST_RE = new RegExp(String.raw`^(${PROTAGONIST_PHRASE})(?<!\b(?:who|whose|that|which))\s+(?=(?:${SUBJECT_VERBS})\b)`);
/** Second pass when no main verb follows the relative clause: "A shy kid who wants to be a pilot." */
const FALLBACK_WHO_RE = new RegExp(String.raw`^(${PROTAGONIST_PHRASE})\s+(?=who\b)`);

/** An action that is really an inciting event rather than a goal ("discovers she can rewind time"). */
const INCIDENT_ACTION_RE =
  /^(?:discovers?|discovered|finds?|found|learns?|learned|learnt|realizes|realises|realized|realised|inherits?|inherited|wakes?(?: up)?|woke(?: up)?|receives?|received|(?:is|was) (?:diagnosed|framed|fired|dumped|kidnapped|abducted|accused|arrested)|loses|lost|gets? (?:fired|dumped|framed)|got (?:fired|dumped|framed)|meets?|met|lands?|landed|becomes?|became|uncovers?|uncovered|witnesses|witnessed|stumbles?|stumbled)\b/i;

/** Simple past → present for the first verb of an incident, so it sits in a present-tense logline. */
const PRESENT_TENSE: Record<string, string> = {
  discovered: "discovers", found: "finds", learned: "learns", learnt: "learns", realized: "realizes", realised: "realises",
  inherited: "inherits", woke: "wakes", received: "receives", was: "is", were: "are", lost: "loses", got: "gets", met: "meets",
  landed: "lands", became: "becomes", uncovered: "uncovers", witnessed: "witnesses", stumbled: "stumbles",
};

/** Verb agreement after a pronoun: "they discovers" → "they discover" (first word only). */
function agree(pronoun: string, phrase: string): string {
  return pronoun === "they" ? toBaseForm(phrase) : phrase;
}

function presentTense(action: string): string {
  const [first, ...rest] = action.split(/\s+/);
  const present = PRESENT_TENSE[first.toLowerCase()];
  return present ? [present, ...rest].join(" ") : action;
}

const STRONG_GOAL_VERBS = ["must", "races to", "fights to", "vows to", "is forced to", "risks everything to", "scrambles to", "has to"];
const WEAK_GOAL_VERBS = ["wants to", "want to", "hopes to", "tries to", "try to", "plans to"];

const HARD_CONNECTORS = new Set(["but", "against", "while", "despite", "until", "only to", "even as", "without"]);

const FLAW_WORDS = [
  "disgraced", "reluctant", "washed up", "washed-up", "burned out", "burnt out", "cynical", "broke", "grieving", "widowed",
  "estranged", "agoraphobic", "shy", "timid", "cowardly", "ex con", "former", "retired", "failed", "failing", "aging",
  "ageing", "lonely", "anxious", "neurotic", "disillusioned", "jaded", "alcoholic", "recovering", "blind", "deaf",
  "orphaned", "overprotective", "perfectionist", "selfish", "arrogant", "naive", "struggling", "unemployed", "divorced",
  "disowned", "exiled", "banished", "bankrupt", "dying", "haunted", "guilt ridden", "fugitive", "small time", "has been",
  "insecure", "paranoid", "stubborn", "germaphobic", "introverted", "pacifist", "tone deaf",
];

const IRONY_MARKERS = [
  "the only", "the last", "who can't", "who cannot", "who hates", "who fears", "afraid of", "terrified of", "allergic to",
  "who has never", "who's never", "never", "unlikely", "reluctant", "must pretend", "pretends", "posing as", "disguised as",
  "undercover", "the one person", "her own", "his own", "their own", "ex", "former", "even though", "despite", "yet",
  "instead", "secretly", "accidentally", "wrong", "fake",
];

const STAKES_TERMS = [
  ...LEXICON.stakes,
  "career", "custody", "freedom", "reputation", "marriage", "kingdom", "planet", "world", "city", "town", "daughter",
  "son", "brother", "sister", "wife", "husband", "mother", "father", "child", "children", "job", "farm", "company",
  "soul", "sanity", "lives", "savings", "innocence", "evidence", "future", "kill", "killed", "buries", "drown",
  "extinction", "war", "prison", "jail",
];

const TIME_PRESSURE_RE =
  /\b(before|by|within|in)\s+(dawn|midnight|sunrise|sunset|nightfall|morning|the (?:end|storm|wedding|election|trial|deadline|tide|funeral|verdict|execution|eclipse|harvest|season)|(?:a|one|\d+|two|three|four|five|seven|ten|twenty[- ]four)\s+(?:hours?|days?|minutes?|weeks?|nights?))\b|\b(deadline|countdown|ticking|last chance|running out)\b/i;

const ANTAGONIST_TERMS = [
  "coast guard", "border patrol", "smugglers", "traffickers", "kidnappers", "poachers", "authorities", "killer", "murderer", "serial", "cartel", "mob", "mafia", "gang", "army", "regime", "empire", "corporation", "storm",
  "hurricane", "monster", "creature", "demon", "ghost", "rival", "enemy", "nemesis", "boss", "dictator", "cult", "virus",
  "plague", "police", "fbi", "detective", "hitman", "assassin", "warlord", "witch", "dragon", "shark", "government",
  "sheriff", "bully", "landlord", "tycoon", "developer", "bureaucracy", "flood", "fire", "wildfire", "judge", "tribunal",
  "hunter", "bounty hunter", "invaders", "rebels", "pirates", "stalker",
];

const GENERIC_NOUNS = new Set([
  "man", "woman", "guy", "girl", "boy", "person", "people", "someone", "somebody", "kid", "child", "character", "hero",
  "heroine", "protagonist", "friends", "group", "family", "he", "she", "they", "individual", "human", "adult",
]);

const VAGUE_TERMS = [
  "journey", "himself", "herself", "themselves", "things", "stuff", "something", "somehow", "what really matters",
  "true meaning", "meaning of life", "find love", "find happiness", "adventure", "struggles", "challenges", "issues",
  "everything changes", "changes forever", "learns a lesson", "learns what", "discovers what", "finds out", "figure out",
  "deal with", "a lot", "many", "various", "life changing", "life-changing", "true self", "who they really are",
];

const HEDGE_TERMS = ["really", "very", "basically", "just", "kind of", "sort of", "actually", "literally", "somewhat", "quite"];

interface GenreCue {
  genre: string;
  tone: string;
  audience: string;
  terms: string[];
}

const GENRE_CUES: GenreCue[] = [
  {
    genre: "Thriller",
    tone: "tense and propulsive",
    audience: "adult audiences who like a ticking clock",
    terms: ["killer", "murder", "murdered", "detective", "heist", "conspiracy", "hostage", "cartel", "assassin", "kidnapped", "kidnapping", "fbi", "cia", "spy", "agent", "evidence", "witness", "framed", "ransom", "hitman", "undercover", "corrupt", "blackmail"],
  },
  {
    genre: "Horror",
    tone: "dread-soaked",
    audience: "genre fans who want to be scared",
    terms: ["haunted", "demon", "creature", "possessed", "ghost", "curse", "cursed", "cabin", "monster", "ritual", "cult", "undead", "zombie", "zombies", "exorcism", "nightmare", "entity"],
  },
  {
    genre: "Science fiction",
    tone: "speculative",
    audience: "audiences who like big ideas with human stakes",
    terms: ["planet", "robot", "android", "spaceship", "starship", "colony", "mars", "alien", "aliens", "future", "ai", "clone", "galaxy", "orbit", "simulation", "dystopian", "cyborg", "asteroid", "time travel", "time loop"],
  },
  {
    genre: "Fantasy",
    tone: "mythic",
    audience: "audiences who love immersive worlds",
    terms: ["kingdom", "dragon", "witch", "wizard", "spell", "magic", "magical", "prophecy", "sorcerer", "throne", "quest", "realm", "fairy", "elf", "enchanted", "gods"],
  },
  {
    genre: "Romance",
    tone: "warm and yearning",
    audience: "audiences who want to fall in love alongside the characters",
    terms: ["falls in love", "love", "wedding", "romance", "date", "dating", "marry", "married", "fiance", "fiancee", "crush", "soulmate", "kiss", "matchmaker"],
  },
  {
    genre: "Comedy",
    tone: "comic",
    audience: "a broad audience looking for laughs",
    terms: ["hilarious", "prank", "bachelor", "bachelorette", "mistaken", "hapless", "clueless", "wacky", "awkward", "pretend", "pretends", "fake", "impersonate", "talent show", "road trip", "reunion", "disastrous", "accidentally"],
  },
  {
    genre: "Drama",
    tone: "grounded and emotional",
    audience: "adult audiences drawn to character-driven stories",
    terms: ["grief", "grieving", "dying", "divorce", "addiction", "recovering", "estranged", "funeral", "illness", "cancer", "widow", "widowed", "inheritance", "reconcile", "guilt", "forgive", "custody"],
  },
  {
    genre: "Action-adventure",
    tone: "kinetic",
    audience: "audiences who want spectacle with momentum",
    terms: ["treasure", "mission", "rescue", "expedition", "escape", "battle", "war", "soldier", "pirates", "jungle", "explosive", "chase", "hurricane", "survive", "survival", "sunken", "wreck"],
  },
  {
    genre: "Underdog comedy-drama",
    tone: "rousing and warm",
    audience: "a broad audience that loves rooting for an underdog",
    terms: ["tournament", "competition", "contest", "championship", "trivia", "pageant", "league", "underdog", "spelling bee", "talent show", "final"],
  },
  {
    genre: "Coming-of-age",
    tone: "tender and bittersweet",
    audience: "younger audiences and anyone who remembers being one",
    terms: ["teen", "teenage", "teenager", "high school", "summer", "prom", "graduation", "camp", "adolescent", "year old", "first love"],
  },
];

interface LoglineParts {
  text: string;
  wordCount: number;
  sentenceCount: number;
  incident: string | null;
  /** The conjunction that introduced the incident ("when", "after"…). */
  incidentLead: string;
  /**
   * The incident as it reads once the protagonist has been named ("she learns
   * her crew is smuggling refugees"), when the incident is where the logline
   * introduces them.
   */
  incidentAfterNamed: string | null;
  /** True when the incident is where the protagonist is named, so the main clause can use a pronoun. */
  incidentNamesProtagonist: boolean;
  /** "once a celebrated chef, now a prison cook": a fall or reinvention, which is irony in itself. */
  formerSelf: string | null;
  /** The subject the writer used in the main clause, when it's a pronoun standing in for the protagonist. */
  subjectPronoun: string | null;
  protagonist: string | null;
  descriptors: string[];
  head: string | null;
  named: boolean;
  whoClause: string | null;
  goalVerb: string | null;
  goal: string | null;
  /** A goal only implied by a relative clause ("the only surgeon who can save the president"). */
  impliedGoal: string | null;
  /** "X is the woman he deported" — who the protagonist turns out to be. */
  identity: string | null;
  action: string | null;
  /** True when the action is an inciting event ("discovers she can rewind time"), not a goal. */
  actionIsIncident: boolean;
  obstacle: string | null;
  connector: string | null;
  stakes: string | null;
  pronoun: "she" | "he" | "they";
  plural: boolean;
}

const SHE_NOUNS = /\b(woman|women|girl|mother|mom|daughter|wife|sister|widow|queen|princess|actress|waitress|nun|grandmother|grandma|aunt|niece|bride|heiress|lady|housewife|matriarch|stepmother|ballerina|mistress|duchess|empress|sorceress|goddess|priestess|countess|baroness|landlady|spokeswoman|policewoman|businesswoman|congresswoman|chairwoman|diva|debutante|schoolgirl|cowgirl)\b/i;
const HE_NOUNS = /\b(man|men|boy|father|dad|son|husband|brother|widower|king|prince|actor|waiter|monk|grandfather|grandpa|uncle|nephew|groom|heir|gentleman|stepfather|patriarch|duke|emperor|sorcerer|god|priest|count|baron|landlord|spokesman|policeman|businessman|congressman|chairman|schoolboy|cowboy|fisherman|fireman|lawman|doorman|conman|con man)\b/i;

/** "she"/"he" when the phrase's own noun is gendered ("a single mother", "the woman he deported"). */
function genderOf(phrase: string): "she" | "he" | null {
  const core = phrase.replace(/\s+(?:who|whose|that|with)\s+.+$/i, "");
  if (SHE_NOUNS.test(core)) return "she";
  if (HE_NOUNS.test(core)) return "he";
  return null;
}

/** Heads that look like agent nouns (-er, -or…) but aren't people. */
const NON_PERSON_HEADS = new Set([
  "letter", "stranger", "murder", "danger", "power", "answer", "border", "water", "winter", "summer", "matter", "dinner", "number",
  "computer", "order", "paper", "monster", "fever", "cancer", "disaster", "weather", "center", "centre", "poster", "meteor", "mirror",
  "elevator", "tractor", "error", "terror", "horror", "rumor", "rumour", "tumor", "tumour", "trailer", "flyer", "folder", "recorder",
]);
const PERSON_HEADS = new Set([
  "captain", "pilot", "nurse", "surgeon", "paramedic", "pianist", "librarian", "cop", "detective", "soldier", "chef", "widow",
  "teen", "teenager", "student", "girl", "boy", "woman", "man", "orphan", "veteran", "sheriff", "mayor", "judge", "clerk", "prodigy",
  "thief", "spy", "agent", "priest", "nun", "actress", "actor", "mother", "father", "kid", "child", "diver", "doctor", "medic",
  "lawyer", "journalist", "scientist", "astronaut", "hacker", "janitor", "waitress", "bartender", "boxer", "athlete", "coach",
  "monk", "witch", "wizard", "knight", "princess", "prince", "queen", "king", "heir", "heiress", "rookie", "intern", "immigrant",
  "refugee", "convict", "inmate", "addict", "alcoholic", "mom", "dad", "grandmother", "grandfather", "twin", "twins", "couple",
  "friends", "siblings", "sisters", "brothers", "family", "crew", "team", "outcast", "loner", "misfit", "genius", "comedian",
  "musician", "artist", "dancer", "novelist", "poet", "sommelier", "surgeon", "therapist", "psychiatrist", "chemist", "professor",
  "cadet", "officer", "marine", "sailor", "fisherman", "farmer", "rancher", "cowboy", "mechanic", "courier", "assassin", "mercenary",
  "champion", "star", "legend", "hero", "heroine", "icon", "celebrity", "idol", "cook", "tycoon", "mogul", "millionaire", "billionaire",
]);

function headNoun(phrase: string): string {
  const core = phrase.replace(/\s+(?:who|whose|that|with|on|in|at|from|of|aboard)\s+.+$/i, "");
  const tokens = core.split(/\s+/);
  return (tokens[tokens.length - 1] ?? "").toLowerCase().replace(/[^a-z'-]/g, "");
}

function looksLikePerson(phrase: string): boolean {
  const head = headNoun(phrase);
  if (!head || NON_PERSON_HEADS.has(head)) return false;
  if (PERSON_HEADS.has(head)) return true;
  // Agent nouns: keeper, painter, dentist, librarian, accountant, detective, prodigy…
  return /(?:er|or|ist|ian|ant|ent|ive|ess)$/.test(head);
}

/** Match a protagonist phrase at the start of a clause; returns the phrase and what follows it. */
function matchProtagonist(clause: string): { phrase: string; rest: string; viaWho: boolean } | null {
  const main = clause.match(FALLBACK_PROTAGONIST_RE);
  if (main) return { phrase: stripEnd(main[1]), rest: clause.slice(main[0].length), viaWho: false };
  const who = clause.match(FALLBACK_WHO_RE);
  if (who) return { phrase: stripEnd(who[1]), rest: clause.slice(who[0].length), viaWho: true };
  return null;
}

const PRONOUN_SUBJECT_RE = /^(she|he|they)$/i;

/**
 * In "When a disgraced ferry captain learns…, she must…" the protagonist is
 * introduced in the incident and the main clause only has a pronoun. Lift
 * the incident's subject when it plausibly is that person: not the
 * antagonist, not someone else's relative ("her father"), not acting on
 * the protagonist ("a stranger saves him"), gender-compatible with the
 * pronoun, and named, flawed ("an aging pianist") or a person noun.
 */
function liftFromIncident(incident: string, pronoun: string): { phrase: string; rest: string } | null {
  const m = matchProtagonist(incident);
  if (!m || m.viaWho) return null;
  const { phrase, rest } = m;
  const nameLed = /^[A-Z][a-z]+\b/.test(phrase) && !ARTICLES.has(phrase.split(/\s+/)[0].toLowerCase());
  if (!nameLed && !/^(?:an?|the|two|three|four|five|six|a pair of|a group of|a band of|\d+)\s/i.test(phrase)) return null;
  if (hits(phrase, ANTAGONIST_TERMS).length > 0) return null;
  const gender = genderOf(phrase);
  const p = pronoun.toLowerCase();
  if (gender && p !== "they" && gender !== p) return null;
  // "When a stranger saves him…": the incident's subject acts on the protagonist, so it's someone else. Only the
  // incident's own clause counts: in "…discovers a leak, but nobody believes her" the "her" is the discoverer.
  const own = rest.split(/\s*[,;—–]\s*(?=(?:but|and|while|so|yet|only|until)\b)|\s+(?=but\s)/i)[0];
  const actsOnProtagonist =
    p === "he"
      ? /\b(him|himself)\b/i.test(own)
      : p === "she"
        ? /\bher\b(?=\s*(?:[,.;:—–]|$|\s(?:to|from|with|for|in|on|at|into|out|away|up|down|back|off|over|again|alone|and|but)\b))/i.test(own)
        : /\bthem\b/i.test(own);
  if (actsOnProtagonist) return null;
  if (!nameLed && hits(phrase, FLAW_WORDS).length === 0 && !looksLikePerson(phrase)) return null;
  return { phrase, rest: stripEnd(rest) };
}

/** A clause's own verb: a phrase containing one isn't just a subject. */
const SUBJECT_VERB_RE = new RegExp(String.raw`\b(?:${SUBJECT_VERBS})\b`, "i");
/** "the town's doctor, a recovering alcoholic" / "Maya Okafor, a disgraced ferry captain": a noun phrase with one appositive. */
const APPOSITIVE_SUBJECT_RE = /^[^,;:—–]{1,60},\s*(?:an?|the|his|her|their)\s+[^,;:—–]{1,60},?$/i;
/** How a main-clause subject starts: a pronoun or a determiner (names are checked with NAME_LED_RE). */
const SUBJECT_START_RE = /^(?:(?:she|he|they)\b|(?:an?|the|his|her|their|two|three|four|five|six|a pair of|a group of|a band of|\d+)\s)/i;

/** True when `phrase` reads as a clause's subject — a pronoun, or a noun phrase (with at most one appositive) and no verb of its own. */
function isSubjectPhrase(phrase: string): boolean {
  const p = stripEnd(phrase);
  if (!p || words(p).length > 14) return false;
  if (PRONOUN_SUBJECT_RE.test(p)) return true;
  if (/[,;:—–]/.test(p) && !APPOSITIVE_SUBJECT_RE.test(p)) return false;
  return !SUBJECT_VERB_RE.test(p);
}

/**
 * INCIDENT_RE ends the incident at its first comma, which is wrong when the
 * incident names someone with an appositive ("When Maya Okafor, a disgraced
 * ferry captain, learns…, she must…"). Move the boundary to the separator
 * right before the main clause's subject — the first one after which only a
 * subject phrase stands before the goal verb.
 */
function resplitIncident(body: string, lead: string, rest: string, goalIndex: number): { incident: string; rest: string } | null {
  const before = rest.slice(0, goalIndex);
  if (!/[,;:—–]/.test(stripEnd(before)) || isSubjectPhrase(before)) return null;
  const restStart = body.length - rest.length;
  for (const sep of before.matchAll(/\s*[,;:—–]\s*/g)) {
    const at = sep.index ?? 0;
    const candidate = before.slice(at + sep[0].length);
    if (!(SUBJECT_START_RE.test(candidate) || NAME_LED_RE.test(candidate)) || !isSubjectPhrase(candidate)) continue;
    return { incident: stripEnd(body.slice(lead.length, restStart + at)), rest: rest.slice(at + sep[0].length) };
  }
  return null;
}

/**
 * "Sarah is a cop. She must stop a bomber…": parse the sentence that holds
 * the goal (and anything after it), keeping the sentence before it as
 * context for who "she" is.
 */
function goalSentence(premise: string): { main: string; context: string | null } {
  const units = sentences(premise);
  if (units.length < 2) return { main: premise, context: null };
  const at = units.findIndex((u) => GOAL_RE.test(u));
  if (at <= 0) return { main: premise, context: null };
  return { main: stripEnd(units.slice(at).join(" ")), context: stripEnd(units[at - 1]) };
}

const COPULA_RE = /^(.+?)\s+(?:is|was)\s+((?:an?|the)\s+[^,;:—–]+)$/i;
const WHOLE_NAME_RE = new RegExp(`^${NAME_PATTERN}$`);

/**
 * What the sentence before the goal says about the protagonist: "Sarah is a
 * cop." introduces them ("Sarah, a cop"); "A retired cop finds a bomb in her
 * mailbox." is an incident that names them.
 */
function introFromContext(context: string): { phrase: string } | { incident: string } | null {
  const copula = context.match(COPULA_RE);
  if (copula) {
    const [, subject, role] = copula;
    if (WHOLE_NAME_RE.test(subject) && !ARTICLES.has(subject.split(/\s+/)[0].toLowerCase())) return { phrase: `${subject}, ${midSentence(role)}` };
    if (/^(?:an?|the)\s/i.test(subject) && words(subject).length <= 8) return { phrase: midSentence(subject) };
    return null;
  }
  const m = matchProtagonist(context);
  return m && !m.viaWho ? { incident: midSentence(context) } : null;
}

/** "Once a celebrated chef, now a prison cook, Marco must…": a former self (and a present one), not an inciting event. */
const FORMER_SELF_RE = /^once\s+((?:an?|the)\s+[^,;:—–]+?)\s*,\s*(?:(?:and\s+|but\s+)?now\s+((?:an?|the)\s+[^,;:—–]+?)\s*,\s*)?(.+)$/i;

/** "Maya Okafor, a disgraced ferry captain" → name and descriptor. */
const NAMED_CORE_RE = new RegExp(`^(${NAME_PATTERN})(?:,\\s*(.+?))?,?$`);

function stripArticle(phrase: string): string {
  return phrase.replace(/^(?:an?|the)\s+/i, "");
}

function parseLogline(raw: string): LoglineParts {
  const text = raw.replace(/\s+/g, " ").trim();
  // "What if a shy teenager discovered…?" is a premise question: read what follows it.
  const premise = stripEnd(text).replace(/^what if\s+/i, "");
  const { main, context } = goalSentence(premise);
  const former = main.match(FORMER_SELF_RE);
  const formerSelf =
    former && !SUBJECT_VERB_RE.test(former[1]) && (looksLikePerson(former[1]) || hits(former[1], FLAW_WORDS).length > 0)
      ? { was: midSentence(stripEnd(former[1])), now: former[2] ? stripEnd(former[2]) : null }
      : null;
  const body = formerSelf && former ? former[3] : main;
  const incidentMatch = body.match(INCIDENT_RE);
  let incident = incidentMatch ? stripEnd(incidentMatch[2]) : null;
  const incidentLead = incidentMatch ? incidentMatch[1].toLowerCase() : "when";
  let rest = incidentMatch ? incidentMatch[3] : body;

  let protagonist: string | null = null;
  let goalVerb: string | null = null;
  let goal: string | null = null;
  let action: string | null = null;
  let afterGoal = "";
  let viaWho = false;

  let goalMatch = rest.match(GOAL_RE);
  if (incidentMatch && goalMatch?.index !== undefined) {
    const resplit = resplitIncident(body, incidentMatch[1], rest, goalMatch.index);
    if (resplit) {
      incident = resplit.incident;
      rest = resplit.rest;
      goalMatch = rest.match(GOAL_RE);
    }
  }
  if (goalMatch && goalMatch.index !== undefined) {
    const before = stripEnd(rest.slice(0, goalMatch.index));
    protagonist = before.length > 0 ? before : null;
    goalVerb = goalMatch[1].toLowerCase();
    afterGoal = rest.slice(goalMatch.index + goalMatch[0].length);
  } else {
    const fallback = matchProtagonist(rest);
    if (fallback) {
      protagonist = fallback.phrase;
      viaWho = fallback.viaWho;
      action = stripEnd(fallback.rest.replace(viaWho ? /^who\s+/i : /^$/, ""));
    }
  }

  // A pronoun subject: find who it stands for — in the incident, or in the sentence before.
  const pronounSubject = protagonist !== null && PRONOUN_SUBJECT_RE.test(protagonist);
  const intro = pronounSubject && context ? introFromContext(context) : null;
  if (intro && "incident" in intro && !incident) incident = intro.incident;
  let subjectPronoun: string | null = null;
  let incidentNamesProtagonist = false;
  let incidentAfterNamed: string | null = incident ? `${incidentLead} ${incident}` : null;
  if (protagonist && pronounSubject && incident) {
    const lifted = liftFromIncident(incident, protagonist);
    if (lifted) {
      subjectPronoun = protagonist.toLowerCase();
      protagonist = lifted.phrase;
      incidentAfterNamed = `${incidentLead} ${subjectPronoun} ${lifted.rest}`;
      incidentNamesProtagonist = true;
    }
  }
  if (protagonist && PRONOUN_SUBJECT_RE.test(protagonist) && intro && "phrase" in intro) {
    subjectPronoun = protagonist.toLowerCase();
    protagonist = intro.phrase;
  }
  // "Once a celebrated chef, now a prison cook, Marco…" → "Marco, a celebrated chef turned prison cook".
  if (protagonist && formerSelf) {
    const self = formerSelf.now ? `${formerSelf.was} turned ${stripArticle(formerSelf.now)}` : `a former ${stripArticle(formerSelf.was)}`;
    if (PRONOUN_SUBJECT_RE.test(protagonist)) {
      subjectPronoun = protagonist.toLowerCase();
      protagonist = self;
    } else if (WHOLE_NAME_RE.test(protagonist) && !ARTICLES.has(protagonist.split(/\s+/)[0].toLowerCase())) {
      protagonist = `${protagonist}, ${self}`;
    }
  }

  // "…X is the woman he deported": the copula names who the protagonist really is.
  let identity: string | null = null;
  let impliedGoal: string | null = null;
  let actionIsIncident = false;
  let actionCore: string | null = null;
  if (action) {
    const copula = action.match(/^(?:is|are|was|were)\s+((?:an?|the|his|her|their|my)\s+.+)$/i);
    if (copula) {
      identity = stripEnd(copula[1]);
      action = null;
    } else if (!viaWho && INCIDENT_ACTION_RE.test(action)) {
      actionIsIncident = true;
    }
  }

  // Split what follows the goal verb into goal / obstacle / stakes.
  let obstacle: string | null = null;
  let connector: string | null = null;
  let stakes: string | null = null;
  if (afterGoal) {
    const cut = afterGoal.match(/\s*(?:[,;—–]|\s-\s)?\s*\b(but|against|while|despite|until|only to|even as|without|when|before|or else|or|lest)\b\s+/i);
    if (cut && cut.index !== undefined && cut.index > 0) {
      goal = stripEnd(afterGoal.slice(0, cut.index));
      const word = cut[1].toLowerCase();
      const tail = afterGoal.slice(cut.index + cut[0].length);
      if (word === "before" || word === "or" || word === "or else" || word === "lest") {
        // "before the wedding, but the boss is his father-in-law": the deadline, then the obstacle.
        const obstacleCut = tail.match(/\s*[,;—–]\s*\b(but|while|despite|even as|only to)\b\s+/i);
        if (obstacleCut && obstacleCut.index !== undefined && obstacleCut.index > 0) {
          stakes = stripEnd(`${word} ${tail.slice(0, obstacleCut.index)}`);
          connector = obstacleCut[1].toLowerCase();
          obstacle = stripEnd(tail.slice(obstacleCut.index + obstacleCut[0].length));
        } else {
          stakes = stripEnd(`${word} ${tail}`);
        }
      } else {
        connector = word;
        const stakesCut = tail.match(/\s*[,;—–]?\s*\b(before|or else|or|lest)\b\s+/i);
        if (stakesCut && stakesCut.index !== undefined && stakesCut.index > 0) {
          obstacle = stripEnd(tail.slice(0, stakesCut.index));
          stakes = stripEnd(`${stakesCut[1].toLowerCase()} ${tail.slice(stakesCut.index + stakesCut[0].length)}`);
        } else {
          obstacle = stripEnd(tail);
        }
      }
    } else {
      goal = stripEnd(afterGoal.split(/\s[—–]\s|;/)[0]);
    }
  } else if (action) {
    const cut = action.match(/\s*[,;—–]?\s*\b(but|against|while|despite|until|only to|when)\b\s+/i);
    if (cut && cut.index !== undefined && cut.index > 0) {
      connector = cut[1].toLowerCase();
      obstacle = stripEnd(action.slice(cut.index + cut[0].length));
      // "discovered she could rewind time, but every rewind…": the incident ends where the obstacle starts.
      if (actionIsIncident) actionCore = stripEnd(action.slice(0, cut.index));
    }
  }

  // Protagonist anatomy: strip a trailing relative clause, then peel off the article.
  let descriptors: string[] = [];
  let head: string | null = null;
  let whoClause: string | null = null;
  let named = false;
  if (protagonist) {
    const who = protagonist.match(/\s+(who|whose|that|with)\s+(.+)$/i);
    whoClause = who ? who[0].trim() : null;
    const core = who ? protagonist.slice(0, who.index).trim() : protagonist;
    const namedMatch = core.match(NAMED_CORE_RE);
    let descriptorSource = core;
    if (namedMatch && !ARTICLES.has(namedMatch[1].toLowerCase())) {
      named = true;
      descriptorSource = namedMatch[2] ?? "";
    }
    const tokens = descriptorSource.split(/\s+/).filter(Boolean);
    while (tokens.length > 1 && (DETERMINERS.has(tokens[0].toLowerCase()) || /^(pair|group|band|of)$/i.test(tokens[0]))) tokens.shift();
    if (tokens.length > 0) {
      head = tokens[tokens.length - 1].toLowerCase().replace(/[^a-z'-]/g, "");
      descriptors = tokens.slice(0, -1).filter((t) => !["and", "of", "a", "an"].includes(t.toLowerCase()));
    } else if (named) {
      head = namedMatch?.[1] ?? null;
    }
    // "the only surgeon who can save the president": the relative clause carries the goal.
    if (!goalVerb && whoClause) {
      const wants = whoClause.match(/^who\s+(?:alone\s+)?(?:can|could|must|has to|have to|needs to|need to|is able to|are able to)\s+(.+)$/i);
      if (wants) impliedGoal = stripEnd(wants[1]);
    }
  }
  // An incident told as the protagonist's action becomes the incident.
  const incidentAction = actionCore ?? action;
  if (actionIsIncident && protagonist && incidentAction && !incident) incident = `${midSentence(protagonist)} ${presentTense(incidentAction)}`;

  const lower = ` ${text.toLowerCase()} `;
  const plural = protagonist !== null && /^(two|three|four|five|six|a pair of|a group of|a band of|\d+)\b/i.test(protagonist);
  const gendered = genderOf(identity ?? protagonist ?? "");
  // Subject and possessive pronouns usually point at the protagonist ("When her father…, a diver must…"); object
  // pronouns often point at someone else ("…buries it — and him —"), so they only count when nothing else does.
  const textPronoun = lower.match(/\b(she|he|his|her|hers)\b/)?.[1] ?? lower.match(/\b(him|himself|herself)\b/)?.[1] ?? null;
  const pronoun = plural
    ? "they"
    : subjectPronoun === "she" || subjectPronoun === "he" || subjectPronoun === "they"
      ? subjectPronoun
      : gendered
        ? gendered
        : textPronoun === null
          ? "they"
          : /^(she|her|hers|herself)$/.test(textPronoun)
            ? "she"
            : "he";
  if (actionIsIncident && protagonist && incidentAction) incidentAfterNamed = `when ${pronoun} ${agree(pronoun, presentTense(incidentAction))}`;
  else if (incidentNamesProtagonist && incidentAfterNamed) incidentAfterNamed = incidentAfterNamed.replace(/^(\S+ \S+) (\S+)/, (m, lead: string, verb: string) => `${lead} ${agree(pronoun, verb)}`);

  return {
    text,
    wordCount: words(text).length,
    sentenceCount: sentences(text).length,
    incident,
    incidentLead: actionIsIncident && !incidentMatch ? "when" : incidentLead,
    incidentAfterNamed: incident ? incidentAfterNamed : null,
    incidentNamesProtagonist: incidentNamesProtagonist || actionIsIncident,
    formerSelf: formerSelf ? `once ${formerSelf.was}${formerSelf.now ? `, now ${midSentence(formerSelf.now)}` : ""}` : null,
    subjectPronoun,
    protagonist,
    descriptors,
    head,
    named,
    whoClause,
    goalVerb,
    goal: goal && goal.length > 0 ? goal : null,
    impliedGoal,
    identity,
    action: action && action.length > 0 ? action : null,
    actionIsIncident,
    obstacle: obstacle && obstacle.length > 0 ? obstacle : null,
    connector,
    stakes: stakes && stakes.length > 0 ? stakes : null,
    pronoun,
    plural,
  };
}

interface ComponentResult {
  key: LoglineComponent;
  score: number;
  note: string;
}

const COMPONENT_PRAISE: Record<LoglineComponent, string> = {
  protagonist: "the protagonist is vivid",
  goal: "the goal is concrete",
  obstacle: "the opposition is clear",
  stakes: "the stakes land",
  hook: "there's a real hook",
  specificity: "the world is specific",
};

const COMPONENT_GAP: Record<LoglineComponent, string> = {
  protagonist: "the protagonist is still a placeholder",
  goal: "the goal is fuzzy",
  obstacle: "nothing is fighting back yet",
  stakes: "the stakes are still abstract",
  hook: "the irony hasn't surfaced",
  specificity: "the details are generic",
};

function scoreProtagonist(p: LoglineParts, flaws: string[]): ComponentResult {
  if (!p.protagonist) {
    return {
      key: "protagonist",
      score: 2,
      note: "I can't find a clear protagonist. Lead with who this is about — \"a [flawed, specific] [role]\" — so we know whose story we're in from the first words.",
    };
  }
  const generic = p.head !== null && GENERIC_NOUNS.has(p.head) && p.descriptors.length === 0;
  let score = 4 + Math.min(p.descriptors.length, 2) * 1.5;
  if (flaws.length > 0) score += 1.5;
  if (p.named) score += 1;
  if (p.whoClause) score += 1;
  if (generic) score -= 2;
  score = clamp(Math.round(score), 1, 10);
  const quoted = `"${truncateWords(p.protagonist, 12)}"`;
  let note: string;
  if (score >= 8) {
    note = `${quoted} is a specific person${flaws.length > 0 ? ` with a built-in flaw (${flaws[0]})` : ""} — we can already picture who to cast.`;
  } else if (score >= 6) {
    note =
      flaws.length > 0
        ? `${quoted} comes with a built-in flaw (${flaws[0]}). One more specific detail — a job, a world, a contradiction — would make them castable.`
        : `${quoted} is clear, but one sharper descriptor — a flaw or contradiction that makes this goal hard for them — would make them castable.`;
  } else if (generic) {
    note = `${quoted} is a placeholder rather than a person. Give them a role and a flaw: not "a man" but "a washed-up stunt driver".`;
  } else {
    note = `${quoted} tells us a role, not a person. Add the one trait that makes this story hardest for them.`;
  }
  return { key: "protagonist", score, note };
}

function scoreGoal(p: LoglineParts, vague: string[]): ComponentResult {
  if (!p.goalVerb || !p.goal) {
    if (p.impliedGoal) {
      return {
        key: "goal",
        score: 4,
        note: `The goal is only implied — "${truncateWords(p.impliedGoal, 10)}" — and no one is pursuing it yet. Make it the protagonist's active objective: "must ${truncateWords(p.impliedGoal, 8)}…".`,
      };
    }
    if (p.actionIsIncident && p.action) {
      const them = p.pronoun === "she" ? "her" : p.pronoun === "he" ? "him" : "them";
      return {
        key: "goal",
        score: 3,
        note: `"${truncateWords(p.action, 10)}" is an inciting event, not a goal. What does ${p.pronoun} set out to do about it? Try "must…" and name something we could watch ${them} attempt.`,
      };
    }
    if (p.action) {
      return {
        key: "goal",
        score: vague.length > 0 ? 2 : 3,
        note: `There's movement — "${truncateWords(p.action, 10)}" — but no concrete objective. What does the protagonist actively set out to do? Try "must…" and name something we could watch them attempt.`,
      };
    }
    return {
      key: "goal",
      score: 2,
      note: "I can't find a goal. A logline needs an active verb and an objective: \"must win back…\", \"races to find…\", \"fights to keep…\".",
    };
  }
  const goalWords = words(p.goal).length;
  const concrete = /\b[a-z]{7,}\b/i.test(p.goal) || specificityMarkers(` x ${p.goal}`) > 0;
  const goalVague = hits(p.goal, VAGUE_TERMS);
  let score = 5;
  if (goalWords >= 3) score += 1.5;
  if (concrete) score += 1.5;
  if (STRONG_GOAL_VERBS.includes(p.goalVerb)) score += 1;
  if (WEAK_GOAL_VERBS.includes(p.goalVerb)) score -= 0.5;
  if (goalVague.length > 0) score -= 2.5;
  score = clamp(Math.round(score), 1, 10);
  const quoted = `"${p.goalVerb} ${truncateWords(p.goal, 12)}"`;
  let note: string;
  if (goalVague.length > 0) {
    note = `${quoted} leans on "${goalVague[0]}", which we can't see on screen. Name the external objective — the thing we'd watch them attempt.`;
  } else if (WEAK_GOAL_VERBS.includes(p.goalVerb)) {
    note = `${quoted} is clear, but "${p.goalVerb}" is passive. "Must" or "races to" makes the want feel urgent and active.`;
  } else if (score >= 8) {
    note = `${quoted} is an objective we can picture — active, external and finite. That's the engine of the whole story.`;
  } else {
    note = `${quoted} points in the right direction; make the objective more concrete so we know exactly what winning looks like.`;
  }
  return { key: "goal", score, note };
}

function scoreObstacle(p: LoglineParts, antagonists: string[], conflict: string[]): ComponentResult {
  let score = 2;
  if (p.connector && HARD_CONNECTORS.has(p.connector)) score += 3;
  else if (p.connector) score += 1.5;
  if (p.incident) score += 0.5;
  score += Math.min(antagonists.length, 2) * 2;
  if (conflict.length > 0) score += 1;
  score = clamp(Math.round(score), 1, 10);
  let note: string;
  if (p.obstacle && antagonists.length > 0) {
    note = `"${p.connector} ${truncateWords(p.obstacle, 10)}" gives the opposition a face (${antagonists[0]}). Active resistance is what turns a premise into a plot.`;
  } else if (p.obstacle) {
    note = `"${p.connector} ${truncateWords(p.obstacle, 10)}" introduces friction. Can you personify it — who, specifically, is making this hard?`;
  } else if (antagonists.length > 1 && score >= 7) {
    note = `Opposition comes from two directions — the ${antagonists[0]} and the ${antagonists[1]}. Make sure the protagonist has to confront them directly, not just outrun them.`;
  } else if (antagonists.length > 0) {
    note = `The ${antagonists[0]} is a promising opposing force, but the sentence doesn't set it against the goal. Connect them with "but", "against" or "while".`;
  } else {
    note = "Nothing stands in the way yet. Add the force that fights back — a rival, a system, a storm, a secret — with \"but\" or \"against\".";
  }
  return { key: "obstacle", score, note };
}

function scoreStakes(p: LoglineParts, stakesHits: string[], timePressure: string | null): ComponentResult {
  let score = 2 + Math.min(stakesHits.length, 3) * 1.5;
  if (timePressure) score += 2;
  if (p.stakes) score += 1.5;
  score = clamp(Math.round(score), 1, 10);
  let note: string;
  if (p.stakes && score >= 7) {
    note = `"${truncateWords(p.stakes, 12)}" tells us what failure costs${timePressure ? ` and puts a clock on it ("${timePressure}")` : ""}. That's what makes an audience lean in.`;
  } else if (p.stakes) {
    note = `"${truncateWords(p.stakes, 12)}" hints at consequences; make the loss personal and irreversible — what does *this* person lose?`;
  } else if (stakesHits.length > 0) {
    note = `Words like "${stakesHits[0]}" gesture at stakes, but the logline never says what happens if the protagonist fails. Spell out the loss.`;
  } else {
    note = "There are no stated stakes. Finish the sentence with what's lost if they fail — \"…before she loses custody of her son for good.\"";
  }
  if (!timePressure && score < 8) note += " A deadline would tighten it further.";
  return { key: "stakes", score, note };
}

function scoreHook(p: LoglineParts, irony: string[], flaws: string[], vague: string[], timePressure: string | null): ComponentResult {
  let score = 3 + Math.min(irony.length, 3) * 1.5;
  if (flaws.length > 0) score += 1;
  if (flaws.length > 1) score += 0.5;
  if (timePressure) score += 0.5;
  if (p.incident) score += 1;
  if (lexicalVariety(p.text) > 0.85 && p.wordCount >= 15) score += 0.5;
  if (vague.length > 0) score -= 1;
  score = clamp(Math.round(score), 1, 10);
  let note: string;
  if (score >= 8) {
    note = `There's a built-in contradiction here${irony.length > 0 ? ` ("${irony[0]}")` : ""} — the premise generates its own tension before we know anything else.`;
  } else if (irony.length > 0 || flaws.length > 0) {
    note = `The seed of irony is here ("${irony[0] ?? flaws[0]}"). Push it: pair the protagonist with the goal they're least equipped for.`;
  } else if (p.incident) {
    note = `The inciting event ("${truncateWords(p.incident, 10)}") is a start, but nothing about it is surprising yet. What's the twist only your story has?`;
  } else {
    note = "The premise is straightforward. The best hooks contain an irony — the agoraphobe who must cross the country, the pacifist forced to fight.";
  }
  return { key: "hook", score, note };
}

function scoreSpecificity(p: LoglineParts, vague: string[], genreHits: number, userGenre: boolean): ComponentResult {
  const markers = specificityMarkers(p.text);
  const longWords = (p.text.match(/\b[a-z]{8,}\b/gi) ?? []).length;
  let score = 3 + Math.min(markers, 2) + Math.min(longWords, 4) * 0.75;
  if (genreHits > 0) score += 1.5;
  if (userGenre) score += 0.5;
  if (/\b(in|on|at|aboard|across|inside|beneath|under)\s+(an?|the)\s+[a-z]/i.test(p.text)) score += 1;
  score -= Math.min(vague.length, 3) * 1.25;
  if (p.wordCount < 12) score -= 2;
  if (p.wordCount > 50) score -= 1.5;
  score = clamp(Math.round(score), 1, 10);
  // A sprawling logline can't score well on specificity, however many details it piles up.
  if (p.wordCount > 60) score = Math.min(score, 4);
  else if (p.wordCount > 50) score = Math.min(score, 6);
  let note: string;
  if (vague.length > 0) {
    note = `Generic phrasing ("${vague.slice(0, 2).join("\", \"")}") could describe a thousand stories. Swap it for the concrete detail only yours has.`;
  } else if (p.wordCount < 12) {
    note = `At ${p.wordCount} words it's too thin to picture. Most working loglines run 20–45 words: room for who, what, against whom, and what's at risk.`;
  } else if (p.wordCount > 50) {
    note = `At ${p.wordCount} words it sprawls. Keep the one detail that defines the world and cut the rest; aim for 20–45 words.`;
  } else if (score >= 7) {
    note = `Concrete nouns and a clear world — at ${p.wordCount} words it's in the sweet spot, and we know what kind of film this is.`;
  } else {
    note = `At ${p.wordCount} words the length is fine, but the world is under-described. Where and when does this happen?`;
  }
  return { key: "specificity", score, note };
}

function readGenre(p: LoglineParts, userGenre: string | undefined): { text: string; hits: number } {
  const scored = GENRE_CUES.map((cue) => ({ cue, found: hits(p.text, cue.terms) }))
    .filter((g) => g.found.length > 0)
    .sort((a, b) => b.found.length - a.found.length);
  const top = scored[0];
  const second = scored[1];
  const given = userGenre?.trim();
  if (!top) {
    return {
      hits: 0,
      text: given
        ? `You've labelled it ${given}, but nothing in the wording signals it yet — no genre-specific world, threat or tone words. Let the logline do that work on its own.`
        : "The genre is hard to read. Nothing in the wording signals tone, world or audience yet — a single genre-specific detail would fix that.",
    };
  }
  const blend = second && second.found.length >= top.found.length - 1 ? ` with ${second.cue.genre.toLowerCase()} underneath` : "";
  const evidence = top.found.slice(0, 2).map((t) => `"${t}"`).join(" and ");
  if (given) {
    const matches = given.toLowerCase().includes(top.cue.genre.toLowerCase().split(/[ -]/)[0]) ||
      top.cue.genre.toLowerCase().includes(given.toLowerCase());
    return {
      hits: top.found.length,
      text: matches
        ? `Reads as the ${given.toLowerCase()} you intend${blend}: ${evidence} set a ${top.cue.tone} tone for ${top.cue.audience}.`
        : `You've labelled it ${given}, but the language (${evidence}) reads more like ${top.cue.genre.toLowerCase()}${blend}. Decide which promise you're making and let the wording commit to it.`,
    };
  }
  return {
    hits: top.found.length,
    text: `Reads as ${top.cue.genre.toLowerCase()}${blend} — ${evidence} set a ${top.cue.tone} tone, pitched at ${top.cue.audience}.`,
  };
}

function verdictFor(overall: number, best: LoglineComponent, worst: LoglineComponent, p: Pick<LoglineParts, "wordCount" | "sentenceCount">): string {
  const praise = COMPONENT_PRAISE[best];
  const gap = COMPONENT_GAP[worst];
  if (p.wordCount > SPRAWL_WORDS || p.sentenceCount > 2) {
    const size = p.wordCount > SPRAWL_WORDS ? `at ${p.wordCount} words` : `in ${p.sentenceCount} sentences`;
    return `Not pitchable yet: ${size} this is a synopsis, not a logline. ${capitalize(praise)} — now cut to one sentence of ${IDEAL_LOGLINE_WORDS.min}–${IDEAL_LOGLINE_WORDS.max} words: who, wants what, against what, or else.`;
  }
  if (overall >= 80) return `Pitch-ready: ${praise}, and every element is doing work. Polish, don't rebuild.`;
  if (overall >= 65) return `Strong bones — ${praise}, but ${gap}. One pass on that and it's ready to pitch.`;
  if (overall >= 50) return `A real premise is in here: ${praise}, though ${gap}.`;
  if (overall >= 35) return `The story is still hiding — ${gap}, and the other elements can't compensate yet.`;
  return `More situation than story so far: ${gap}. Start with who wants what, and what stands in the way.`;
}

function buildQuestions(p: LoglineParts, order: LoglineComponent[], timePressure: string | null, overall: number): string[] {
  const who = p.protagonist ? `"${truncateWords(midSentence(p.protagonist), 8)}"` : "your protagonist";
  const bank: Record<LoglineComponent, string> = {
    protagonist: `Who is ${who} before the story starts — and what flaw makes this particular goal the hardest thing they could attempt?`,
    goal: p.goal
      ? `You wrote "${truncateWords(p.goal, 10)}" — what would we literally see on screen when ${p.pronoun === "they" ? "they succeed" : `${p.pronoun} succeeds`}?`
      : `What, concretely, does ${who} have to do — the objective we'd watch them attempt scene by scene?`,
    obstacle: "Who or what actively fights back? If you had to cast the opposition, who would you cast?",
    stakes: `What does ${who} lose — personally, not abstractly — if ${p.pronoun === "they" ? "they fail" : `${p.pronoun} fails`}?`,
    hook: "What's the irony or contradiction at the heart of this premise — the thing that makes it impossible to ignore?",
    specificity: "Where and when does this happen, and what one detail could only belong to your story?",
  };
  const count = overall >= 80 ? 2 : overall <= 40 ? 4 : 3;
  const qs = order.slice(0, count).map((k) => bank[k]);
  if (!timePressure && qs.length < 4 && !order.slice(0, count).includes("stakes")) {
    qs.push("Is there a clock? What forces this to happen now rather than next year?");
  }
  return qs.slice(0, 4);
}

function cleanHedges(text: string): string {
  let out = text;
  for (const h of HEDGE_TERMS) out = out.replace(new RegExp(`\\b${h}\\s+`, "gi"), "");
  return out.replace(/\s+/g, " ").trim();
}

const RELATION_NOUN_RE =
  /\b(her|his|their)\s+((?:(?:own|estranged|only|last|little|younger|older|missing|sick|dying|beloved|family|kidnapped|abducted|twin|baby|infant|teenage|newborn|adopted|autistic|disabled)\s+){0,2})(son|daughter|children|child|brother|sister|wife|husband|mother|father|family|career|freedom|farm|home|job|marriage|company|reputation|sanity|life|kingdom|crew|town|best friend|partner)\b(?!-)/gi;

/** Words after a relation noun that make it the subject of its own clause ("her father sold…", "her partner is selling…"). */
const SUBJECT_OF_CLAUSE_RE =
  /^\s+(?:is|was|are|were|has|had|will|would|can|could|must|who|dies|die|dying|sold|stole|killed|murdered|framed|betrayed|abandoned|left|drove|took|kidnapped|sabotaged|ruined|lied|cheated|blackmails?|betrays?|sells|steals|kills|frames|abandons|[a-z]+ed)\b/i;

/**
 * The personal loss to name in a rewrite ("his daughter"), skipping relation
 * nouns that can't be lost: people doing the harm ("her partner is selling
 * organs", "the spot her father sold") and people already dead ("widowed…
 * her husband", "avenge his brother", "drove her husband to his death").
 */
function stakesNoun(p: LoglineParts): string | null {
  const widowed = /\b(widow|widowed|widower)\b/i.test(p.text);
  for (const m of p.text.matchAll(RELATION_NOUN_RE)) {
    const noun = m[3].toLowerCase();
    const before = p.text.slice(0, m.index);
    const after = p.text.slice((m.index ?? 0) + m[0].length);
    if (SUBJECT_OF_CLAUSE_RE.test(after)) continue;
    if (widowed && (noun === "husband" || noun === "wife")) continue;
    if (/\b(late|dead|murdered|slain|deceased|avenge|avenges|avenging|mourn|mourns|mourning|buried|buries|killed|kills|murders|lose|loses|losing|lost|drove|drives)\s+$/i.test(before)) continue;
    if (/^\s+(?:to|into)\s+(?:his|her|their)\s+(?:death|grave|suicide)\b/i.test(after)) continue;
    return m[0].toLowerCase();
  }
  return null;
}

const TRAILING_FUNCTION_WORDS =
  /\s+(a|an|the|of|to|from|and|but|with|what|that|her|his|their|its|in|on|at|for|by|or|as|toward|towards|only|into|onto|across|through|own|about|over|under|after|before|while|until|who|which|whose|when|where|if|than|so|just|very|more|most|—|–|-)$/i;

/**
 * Points where a phrase can end cleanly: before punctuation or a subordinate clause — never inside a noun phrase.
 * "to" only when it starts a purpose ("to pay his debts"), not a destination ("to Moscow", "to the coast"), and
 * "as" only as a conjunction ("as the storm hits"), not a comparison ("as fast as he can").
 */
const CLAUSE_CUT_RE =
  /\s*(?:[,;:]|\s[—–-])\s+|\s+(?=(?:to(?!\s+(?:(?:the|a|an|his|her|their|its|my|our|your|this|that|these|those)\b|[A-Z]))|as(?=\s+(?:the|a|an|his|her|their|its|she|he|they|it|we|i|you)\b)|so that|in order to|while|before|until|when|because|only to|even as|without)\s)/g;

/**
 * Shorten a phrase to at most `max` words by cutting at a clause boundary.
 * Returns the whole phrase when it already fits, and null when there's no
 * clean cut — callers drop the element rather than mangle it.
 */
function clauseCut(text: string, max: number): string | null {
  const clean = stripEnd(text);
  if (words(clean).length <= max) return clean;
  let best: string | null = null;
  for (const m of clean.matchAll(CLAUSE_CUT_RE)) {
    let head = stripEnd(clean.slice(0, m.index));
    while (TRAILING_FUNCTION_WORDS.test(head)) head = head.replace(TRAILING_FUNCTION_WORDS, "");
    const n = words(head).length;
    if (n >= 3 && n <= max) best = head;
  }
  return best;
}

/** "goes on a journey" → "go on a journey": third-person verb to base form (first word only). */
function toBaseForm(phrase: string): string {
  const [first, ...rest] = phrase.trim().split(/\s+/);
  if (!first) return phrase;
  const lower = first.toLowerCase();
  const irregular: Record<string, string> = { goes: "go", does: "do", has: "have", is: "be" };
  let base = irregular[lower];
  if (!base) {
    if (/ies$/.test(lower)) base = lower.replace(/ies$/, "y");
    else if (/(sses|shes|ches|xes|zes)$/.test(lower)) base = lower.replace(/es$/, "");
    else if (/[^su]s$/.test(lower)) base = lower.slice(0, -1);
    else base = lower;
  }
  return [base, ...rest].join(" ");
}

/** "lose her farm" → "she loses her farm"; clauses ("the town drowns") pass through. */
function consequenceClause(consequence: string, pronoun: LoglineParts["pronoun"]): string {
  const m = consequence.match(/^(lose|die|face|be|watch|spend|go|become|end up|forfeit|miss)\b(.*)$/i);
  if (!m) return consequence;
  if (pronoun === "they") return `they ${m[1].toLowerCase() === "be" ? "are" : m[1].toLowerCase()}${m[2]}`;
  const third: Record<string, string> = { lose: "loses", die: "dies", face: "faces", be: "is", watch: "watches", spend: "spends", go: "goes", become: "becomes", "end up": "ends up", forfeit: "forfeits", miss: "misses" };
  return `${pronoun} ${third[m[1].toLowerCase()]}${m[2]}`;
}

type RewriteKey = "classic" | "irony" | "stakes" | "tighter";

/** An inserted phrase that needs closing before a verb: "the town's doctor, a recovering alcoholic", "a sailor, now blind". */
const INSERTED_PHRASE_RE = /,\s*(?:an?|the|his|her|their|now|once|formerly|still)\s+[^,]+$/i;

/** A deadline that already names what's lost: "before she loses her father", "before the town dies". */
const STATED_LOSS_RE = /\b(?:lose|loses|losing|lost|die|dies|dying|killed|kills|destroyed|destroys|gone for good)\b/i;

/** Protagonist for the "Tighter" rewrite: drop trailing where/who detail ("a reluctant keeper on a remote island" → "a reluctant keeper"). */
function tightenProtagonist(core: string): string {
  if (NAME_APPOSITIVE_RE.test(core)) return core;
  const cut = core.match(/^(.+?)\s+(?:on|in|at|from|with|aboard|inside|near|who|whose|that)\s+/i);
  const shorter = cut && words(cut[1]).length >= 2 ? cut[1] : core;
  return words(shorter).length <= 6 ? shorter : core;
}

/** All four rewrite candidates for a parsed logline (the doctor returns the three that fit it best). */
function rewriteOptions(p: LoglineParts): Record<RewriteKey, string> {
  const they = p.pronoun;
  const fails = they === "they" ? "they fail" : `${they} fails`;
  const loses = they === "they" ? "they lose" : `${they} loses`;
  const possessive = they === "she" ? "her" : they === "he" ? "his" : "their";
  const placeholderProtagonist = "[a specific, flawed protagonist]";
  // "The only surgeon who can save the president is the woman he deported": the reveal is the person.
  // A bare pronoun ("she must…") isn't a protagonist yet: rewrites ask for one rather than repeat it.
  const who = p.identity ?? (p.protagonist && !PRONOUN_SUBJECT_RE.test(p.protagonist) ? p.protagonist : null);
  const full = who ? midSentence(cleanHedges(who)) : placeholderProtagonist;
  const core = who ? midSentence(cleanHedges(who.replace(/\s+(who|whose|that|with)\s+.+$/i, ""))) : placeholderProtagonist;
  /** Close an appositive ("Maya, a nurse" → "Maya, a nurse,") when a verb follows. */
  const asSubject = (phrase: string) =>
    (NAME_APPOSITIVE_RE.test(phrase) || INSERTED_PHRASE_RE.test(phrase)) && !/,$/.test(phrase) ? `${phrase},` : phrase;

  const goal = p.goal
    ? cleanHedges(p.goal)
    : p.impliedGoal
      ? cleanHedges(p.impliedGoal)
      : p.action && !p.actionIsIncident
        ? toBaseForm(cleanHedges(p.action.split(/\s+and\s+|,\s*/)[0]))
        : "[a concrete goal]";
  // "to pay off his debts" is a purpose; "to the mainland" is a destination and stays in the goal.
  const purposeSplit = goal.match(/^(\S+(?:\s+\S+){2,}?)\s+(to(?!\s+(?:(?:the|a|an|his|her|their|its|my|our|your|this|that|these|those)\b|[A-Z]))|so that|in order to)\s+(.+)$/);
  const goalHead = purposeSplit ? purposeSplit[1] : goal;
  const purpose = purposeSplit ? `${purposeSplit[2]} ${purposeSplit[3]}` : null;

  // The incident as written (it may name the protagonist), and as it reads once they've been named.
  const incidentFull = p.incident
    ? `${p.incidentLead} ${cleanHedges(p.incident)}`
    : p.connector === "when" && p.obstacle
      ? `when ${cleanHedges(p.obstacle)}`
      : null;
  const incidentNamed = p.incident && p.incidentAfterNamed ? cleanHedges(p.incidentAfterNamed) : incidentFull;
  const incidentNamesProtagonist = p.incidentNamesProtagonist;
  // An obstacle the incident already states ("…discovers she can rewind time, but every rewind…") isn't repeated.
  const obstacleInIncident = p.obstacle !== null && incidentFull !== null && norm(incidentFull).includes(norm(p.obstacle));
  const obstacle =
    p.obstacle && p.connector && !(p.connector === "when" && !p.incident) && !obstacleInIncident ? `${p.connector} ${cleanHedges(p.obstacle)}` : null;
  const deadline = p.stakes && /^before\b/i.test(p.stakes) ? cleanHedges(p.stakes) : null;
  const consequence = p.stakes && !deadline ? cleanHedges(p.stakes).replace(/^(or else|or|lest)\s+/i, "") : null;
  // "before midnight — or lose her only child" / "before she loses her father for good": the loss is already spelled out.
  const lossStated =
    consequence !== null ||
    (deadline !== null && (/(?:[,;—–]|\s-\s)\s*or\s|\bor\s+(?:else|lose|die|watch|be)\b/i.test(deadline) || STATED_LOSS_RE.test(deadline)));
  const deadlineCore = deadline ? (deadline.split(/\s*(?:[,;—–]|\s-\s)\s*(?=or\b)/i)[0] ?? deadline) : null;
  const loss = stakesNoun(p);

  // Classic shape: When [incident], [protagonist] must [goal] before [stakes].
  const classicStakes = deadline
    ? ` ${deadline}`
    : consequence
      ? ` — or ${consequence}`
      : loss
        ? ` before ${loses} ${loss} for good`
        : ` before [what ${loses} if ${fails}]`;
  // Clause-like obstacles ("but the crew thinks he's the rat") read best at the end.
  const clauseObstacle = obstacle && (p.connector === "but" || p.connector === "only to") ? obstacle : null;
  const inlineObstacle = obstacle && !clauseObstacle ? ` ${obstacle}` : "";
  const opening = incidentFull ? capitalize(incidentFull) : "When [the inciting incident]";
  // When the incident already names the protagonist, the main clause keeps the writer's pronoun.
  const classicSubject = incidentFull && incidentNamesProtagonist ? they : asSubject(full);
  let classic = `${opening}, ${classicSubject} must ${goal}${inlineObstacle}${classicStakes}${clauseObstacle ? ` — ${clauseObstacle}` : ""}.`;
  if (words(classic).length > 50 && obstacle) {
    classic = `${opening}, ${classicSubject} must ${goal}${classicStakes}.`;
  }

  // Sharpen the irony: frame the protagonist as the last person for this job.
  const has = p.plural ? "have" : "has";
  const ironyTail = incidentNamed
    ? `${has} no choice ${incidentNamed}`
    : purpose
      ? `must do it ${purpose}`
      : obstacle
        ? p.connector === "but"
          ? `${has} to try, ${obstacle}`
          : `${has} to try ${obstacle}`
        : deadline
          ? `${has} to do it ${deadline}`
          : `${has} no choice — [what forces ${possessive} hand]`;
  const deadlineUsed = !incidentNamed && !purpose && !obstacle && deadline !== null;
  const ironyLead = `${p.plural ? "The last people" : "The last person"} who should ${goalHead} — ${full} —`;
  let irony = `${ironyLead} ${ironyTail}${deadline && !deadlineUsed ? `, ${deadline}` : ""}.`;
  if (words(irony).length > 42 && deadline && !deadlineUsed) irony = `${ironyLead} ${ironyTail}.`;

  // Raise the stakes: one chance, and a personal, irreversible loss (unless the writer already named one).
  const forever = deadline !== null && /\b(forever|for good)\b/i.test(deadline);
  const lossPart = consequence
    ? consequenceClause(consequence, they)
    : loss
      ? `${loses} ${loss}${forever ? "" : " for good"}`
      : `${loses} [the one thing ${they} can't bear to lose]`;
  const joiner = deadline?.match(/[—–]/) ? ", and" : " — and";
  const stakesLine = (withObstacle: boolean) => {
    const lead = `${capitalize(asSubject(core))} ${p.plural ? "have" : "has"} one chance to ${goal}${withObstacle ? inlineObstacle : ""}${deadline ? ` ${deadline}` : ""}`;
    if (lossStated && deadline) return `${lead}${withObstacle && clauseObstacle ? ` — ${clauseObstacle}` : ""}.`;
    return `${lead}${withObstacle && clauseObstacle ? ` — ${clauseObstacle}, and` : joiner} if ${fails}, ${lossPart}.`;
  };
  let stakes = stakesLine(true);
  if (words(stakes).length > 46 && obstacle) stakes = stakesLine(false);

  // Tighter: protagonist core, goal, then as much obstacle and deadline as fits — whole clauses only.
  const tightProtagonist = capitalize(asSubject(tightenProtagonist(core)));
  const tightGoal = clauseCut(goalHead, 12) ?? goalHead;
  const tightObstacle = obstacle ? clauseCut(obstacle, 12) : null;
  const tightDeadline = deadline ? clauseCut(deadline, 12) ?? (deadlineCore ? clauseCut(deadlineCore, 12) : null) : null;
  const obstaclePart = tightObstacle ? `${clauseObstacle ? " —" : ""} ${tightObstacle}` : "";
  const candidates = [
    `${tightProtagonist} must ${tightGoal}${obstaclePart}${tightDeadline ? ` ${tightDeadline}` : ""}.`,
    `${tightProtagonist} must ${tightGoal}${tightDeadline ? ` ${tightDeadline}` : ""}.`,
    `${tightProtagonist} must ${tightGoal}${obstaclePart}.`,
    `${tightProtagonist} must ${tightGoal}.`,
  ];
  const tighter = candidates.find((c) => words(c).length <= 28) ?? candidates[candidates.length - 1];

  return { classic, irony, stakes, tighter };
}

const tidyRewrite = (s: string) =>
  capitalizeLead(s.replace(/\s+/g, " ").replace(/\s+([,.;])/g, "$1").replace(/,,/g, ",").replace(/\.\.+/g, ".").replace(/,\./g, ".").trim());

/** Test hook: every rewrite candidate the Logline Doctor considers, tidied, before it picks three. */
export function loglineRewriteCandidates(logline: string): Record<RewriteKey, string> {
  const options = rewriteOptions(parseLogline(logline));
  return {
    classic: tidyRewrite(options.classic),
    irony: tidyRewrite(options.irony),
    stakes: tidyRewrite(options.stakes),
    tighter: tidyRewrite(options.tighter),
  };
}

function buildRewrites(p: LoglineParts, order: LoglineComponent[]): { angle: string; logline: string }[] {
  const raw = rewriteOptions(p);
  const same = (a: string, b: string) => norm(a) === norm(b);

  const options: Record<"irony" | "stakes" | "tighter", { angle: string; logline: string }> = {
    irony: { angle: "Sharpen the irony", logline: tidyRewrite(raw.irony) },
    stakes: { angle: "Raise the stakes", logline: tidyRewrite(raw.stakes) },
    tighter: { angle: "Tighter", logline: tidyRewrite(raw.tighter) },
  };

  const priority: ("irony" | "stakes" | "tighter")[] = [];
  if (p.wordCount > 40) priority.push("tighter");
  for (const key of order) {
    if (key === "hook" || key === "protagonist") priority.push("irony");
    if (key === "stakes" || key === "obstacle") priority.push("stakes");
    if (key === "specificity" || key === "goal") priority.push("tighter");
  }
  priority.push("irony", "stakes", "tighter");
  const ranked = Array.from(new Set(priority));

  const classicOption = { angle: "Classic shape", logline: tidyRewrite(raw.classic) };
  const result: { angle: string; logline: string }[] = [];
  // Past the ideal length, cutting comes first.
  if (p.wordCount > IDEAL_LOGLINE_WORDS.max && !same(options.tighter.logline, p.text)) result.push(options.tighter);
  // The classic shape is only useful when it actually changes the writer's sentence.
  if (!same(classicOption.logline, p.text)) result.push(classicOption);
  for (const key of ranked) {
    if (result.length >= 3) break;
    const option = options[key];
    if (same(option.logline, p.text) || result.some((r) => same(r.logline, option.logline))) continue;
    result.push(option);
  }
  if (result.length < 3 && !result.includes(classicOption)) result.unshift(classicOption);
  return result.slice(0, 3);
}

/** Offline Logline Doctor. */
export function demoLogline(req: Pick<LoglineRequest, "logline" | "genre">): LoglineAnalysis {
  const p = parseLogline(req.logline);
  const flaws = hits(p.protagonist ?? p.text, FLAW_WORDS);
  const irony = p.formerSelf ? [p.formerSelf, ...hits(p.text, IRONY_MARKERS)] : hits(p.text, IRONY_MARKERS);
  const vague = hits(p.text, VAGUE_TERMS);
  const antagonists = hits(p.text, ANTAGONIST_TERMS);
  const conflict = hits(p.text, LEXICON.conflict);
  const stakesHits = hits(p.text, STAKES_TERMS);
  const timePressure = p.text.match(TIME_PRESSURE_RE)?.[0] ?? (p.stakes && /^before\b/i.test(p.stakes) ? truncateWords(p.stakes, 8) : null);
  const genre = readGenre(p, req.genre);

  const byKey: Record<LoglineComponent, ComponentResult> = {
    protagonist: scoreProtagonist(p, flaws),
    goal: scoreGoal(p, vague),
    obstacle: scoreObstacle(p, antagonists, conflict),
    stakes: scoreStakes(p, stakesHits, timePressure),
    hook: scoreHook(p, irony, flaws, vague, timePressure),
    specificity: scoreSpecificity(p, vague, genre.hits, Boolean(req.genre?.trim())),
  };
  const components = LOGLINE_COMPONENTS.map((key) => byKey[key]);

  const weights: Record<LoglineComponent, number> = { protagonist: 1, goal: 1.2, obstacle: 1.1, stakes: 1.1, hook: 1, specificity: 0.8 };
  const weighted = sum(components.map((c) => c.score * weights[c.key])) / sum(Object.values(weights));
  let overall = weighted * 10;
  if (p.wordCount < 12) overall -= 8;
  // Every word past the ideal window costs more, up to 30 points for a pasted paragraph.
  else if (p.wordCount > IDEAL_LOGLINE_WORDS.max) overall -= Math.min(30, (p.wordCount - IDEAL_LOGLINE_WORDS.max) * 0.6);
  if (p.sentenceCount > 2) overall -= 4;
  else if (p.sentenceCount === 2) overall -= 2;
  // A synopsis can't read as "strong bones", whatever its parts score.
  if (p.wordCount > SPRAWL_WORDS || p.sentenceCount > 2) overall = Math.min(overall, 55);
  overall = clampScore(clamp(overall, 8, 96));

  // Ascending by score; ties broken by the canonical component order.
  const order = [...components].sort((a, b) => a.score - b.score || LOGLINE_COMPONENTS.indexOf(a.key) - LOGLINE_COMPONENTS.indexOf(b.key)).map((c) => c.key);
  const best = [...components].sort((a, b) => b.score - a.score || LOGLINE_COMPONENTS.indexOf(a.key) - LOGLINE_COMPONENTS.indexOf(b.key))[0].key;
  const worst = order[0];

  return {
    overall,
    verdict: verdictFor(overall, best, worst, p),
    genreRead: genre.text,
    components: components.map((c) => ({ key: c.key, score: c.score, note: c.note })),
    rewrites: buildRewrites(p, order),
    questions: buildQuestions(p, order, timePressure, overall),
  };
}

// ---------------------------------------------------------------------------
// Story Doctor
// ---------------------------------------------------------------------------

type BeatKind =
  | "setup"
  | "routine"
  | "theme"
  | "desire"
  | "inciting"
  | "doubt"
  | "ally"
  | "commit"
  | "rising"
  | "develop"
  | "midpoint"
  | "crisis"
  | "climax"
  | "resolution";

const BEAT_KINDS: Record<string, BeatKind> = {
  Setup: "setup",
  "Inciting Incident": "inciting",
  "Plot Point One": "commit",
  "Rising Action": "rising",
  Midpoint: "midpoint",
  "Crisis / Plot Point Two": "crisis",
  Climax: "climax",
  Resolution: "resolution",
  "Ordinary World": "setup",
  "Call to Adventure": "inciting",
  "Refusal of the Call": "doubt",
  "Meeting the Mentor": "ally",
  "Crossing the Threshold": "commit",
  "Tests, Allies, Enemies": "rising",
  "Approach to the Inmost Cave": "rising",
  "The Ordeal": "crisis",
  Reward: "midpoint",
  "The Road Back": "rising",
  Resurrection: "climax",
  "Return with the Elixir": "resolution",
  "Opening Image": "setup",
  "Theme Stated": "theme",
  "Set-Up": "setup",
  Catalyst: "inciting",
  Debate: "doubt",
  "Break into Two": "commit",
  "B Story": "ally",
  "Fun and Games": "rising",
  "Bad Guys Close In": "rising",
  "All Is Lost": "crisis",
  "Dark Night of the Soul": "crisis",
  "Break into Three": "commit",
  Finale: "climax",
  "Final Image": "resolution",
  You: "setup",
  Need: "desire",
  Go: "commit",
  Search: "rising",
  Find: "midpoint",
  Take: "crisis",
  Return: "climax",
  Change: "resolution",
  "Ki — Introduction": "setup",
  "Shō — Development": "develop",
  "Ten — Twist": "midpoint",
  "Ketsu — Reconciliation": "resolution",
  "Once upon a time…": "setup",
  "Every day…": "routine",
  "Until one day…": "inciting",
  "Because of that…": "rising",
  "Until finally…": "climax",
  "And ever since then…": "resolution",
};

function kindForBeat(beat: FrameworkBeat): BeatKind {
  const known = BEAT_KINDS[beat.name];
  if (known) return known;
  if (beat.position < 0.08) return "setup";
  if (beat.position < 0.2) return "inciting";
  if (beat.position < 0.3) return "commit";
  if (beat.position < 0.45) return "rising";
  if (beat.position < 0.6) return "midpoint";
  if (beat.position < 0.8) return "crisis";
  if (beat.position < 0.94) return "climax";
  return "resolution";
}

/**
 * Conflict vocabulary for prose, in two strengths. Real opposition — threat,
 * fear, loss, secrets, pursuit — counts in full; connectives, modals and
 * negations ("but", "must", "should", "never", "don't") are everywhere in
 * calm writing too, so they only count for a quarter.
 */
const STRONG_CONFLICT = [
  "against", "struggle", "struggled", "fight", "fights", "fought", "refuse", "refused", "refuses", "forbidden", "obstacle", "threat",
  "threatened", "threatens", "enemy", "rival", "trapped", "afraid", "fear", "feared", "scared", "terrified", "panicked", "panic", "lose",
  "losing", "lost", "loses", "failed", "fails", "crashed", "died", "dies", "dying", "stole", "stolen", "betrayed", "betray", "risk",
  "danger", "dangerous", "problem", "conflict", "secret", "lie", "lied", "lying", "hide", "hiding", "hid", "caught", "warned", "argue",
  "argued", "argument", "shouted", "shouts", "screamed", "screams", "demanded", "demands", "deadline", "police", "searching", "missing",
  "sold", "too late", "chased", "chase", "escape", "escaped", "attacked", "attack", "accused", "fired", "hurt", "pain", "blood", "gun",
  "knife", "trouble", "desperate", "furious", "angry", "guards", "sabotaged", "blackmail", "hunted", "cornered", "evicted", "debt",
  "betrayal", "refusal", "confront", "confronts", "confronted", "no way out",
];
const WEAK_CONFLICT = [
  "but", "however", "until", "must", "can't", "cannot", "won't", "should", "instead", "never", "nothing", "stopped", "wouldn't",
  "couldn't", "doesn't", "don't", "no one", "waiting", "truth", "buyer", "hard", "difficult", "worried", "nervous",
];
const STORY_CONFLICT = [...STRONG_CONFLICT, ...WEAK_CONFLICT];
/** Pressure or feeling: what a better opening line would carry. */
const OPENER_TERMS = [...STRONG_CONFLICT, ...LEXICON.emotion];
const WEAK_CONFLICT_SET = new Set(WEAK_CONFLICT);
const conflictWeight = (term: string) => (WEAK_CONFLICT_SET.has(term) ? 0.25 : 1);
const STORY_DESIRE = [...LEXICON.desire, "going to", "trying to", "has to", "have to", "needs to", "had to", "promised", "vowed", "determined", "longing", "chooses", "decides to"];
const STORY_SENSORY = [
  ...LEXICON.sensory, "fog", "mist", "lights", "lamp", "soaked", "wet", "crackles", "hum", "hums", "rattle", "tin", "salt", "steam",
  "grey", "gray", "white", "black", "yellow", "orange", "pale", "scent", "icy", "glow", "glows", "flicker", "flickers", "echo", "echoes",
  "roar", "hiss", "drip", "damp", "rust", "smoke", "ash", "paper", "wood", "stone", "sweat", "breath",
];

const KIND_LEXICON: Record<BeatKind, readonly string[]> = {
  setup: [...LEXICON.sensory, "every", "always", "used to", "would", "lived", "worked", "grew up", "town", "home", "my", "our", "years", "morning"],
  routine: ["every", "always", "each", "usually", "would", "used to", "day", "morning", "night", "week", "routine", "same"],
  theme: ["said", "told", "asked", "lesson", "truth", "always", "never", "means", "believe", "remember", "promise"],
  desire: [...LEXICON.desire],
  inciting: [...LEXICON.time, "phone", "call", "called", "letter", "news", "arrived", "arrives", "appeared", "appears", "found", "discovered", "died", "lost", "fired", "met", "knock", "message", "email", "until", "tonight", "today", "this morning", "this time", "shows up", "walks in", "stranger", "without warning", "out of nowhere"],
  doubt: ["but", "afraid", "fear", "couldn't", "wouldn't", "not sure", "hesitated", "refused", "doubt", "worried", "what if", "no way", "almost", "instead"],
  ally: ["friend", "mentor", "teacher", "coach", "grandmother", "grandfather", "mother", "father", "sister", "brother", "advice", "helped", "taught", "showed", "together", "partner", "told me"],
  commit: [...LEXICON.desire, "decided", "chose", "chooses", "agreed", "left", "packed", "signed", "set off", "went", "said yes", "promised", "vowed", "so i", "so she", "so he", "instead", "lets", "keeps", "takes"],
  rising: [...LEXICON.conflict, "tried", "again", "another", "harder", "worse", "each time", "second", "next", "then"],
  develop: [...LEXICON.sensory, "more", "also", "another", "deeper", "learned", "noticed", "began", "started", "slowly"],
  midpoint: [...LEXICON.change, "discovered", "turned out", "truth", "secret", "revealed", "reveals", "understood", "but then", "instead", "suddenly", "saw", "joins", "together", "unexpected", "actually"],
  crisis: [...LEXICON.stakes, ...LEXICON.emotion, "lost", "gone", "failed", "broke", "nothing left", "gave up", "worst", "couldn't", "empty", "betrayed", "caught", "waiting", "trapped", "no way", "too late", "could"],
  climax: [...LEXICON.conflict, "finally", "faced", "stood", "chose", "ran", "fought", "told", "screamed", "last", "moment", "decided", "turned"],
  resolution: [...LEXICON.change, "now", "since", "today", "still", "later", "years", "home", "again", "remember", "every"],
};

const KIND_TIP: Record<BeatKind, string> = {
  setup: "Show the protagonist doing something that reveals what's missing in their life — one specific, visual behaviour beats a paragraph of background.",
  routine: "Show the routine as a repeated, specific action, so we feel exactly what's about to break.",
  theme: "Plant the story's question in a line of dialogue the protagonist brushes off — they'll only understand it at the end.",
  desire: "Name the want plainly: what does the character want badly enough to act on it?",
  inciting: "Make the disruption a concrete event on the page, at a specific moment — a call, a knock, a discovery — not a gradual realisation.",
  doubt: "Give the hesitation a real cost: what is the protagonist afraid of losing if they say yes?",
  ally: "Let a second character carry the theme — someone who sees the protagonist differently than they see themselves.",
  commit: "Let the protagonist actively choose to go. A decision we witness makes the rest of the story theirs.",
  rising: "Escalate: each attempt should fail in a way that makes the next one harder or costlier.",
  develop: "Deepen what we know without resolving it — add a detail that complicates the picture.",
  midpoint: "Turn the story here: a revelation or reversal that changes what the protagonist wants or how they go after it.",
  crisis: "Push the protagonist to their lowest point and force a choice between two things they value.",
  climax: "Put the protagonist in the decisive moment and make them act — the outcome should come from their choice, not luck.",
  resolution: "Show the change with an image or action that mirrors the opening, rather than explaining the lesson.",
};

const KIND_STRONG: Record<BeatKind, string> = {
  setup: "The world arrives through specifics. Keep it lean — every setup detail should pay off later.",
  routine: "The routine is vivid enough that its disruption will hurt. Keep it.",
  theme: "The story's question is planted without a lecture. Make sure the ending answers it.",
  desire: "The want is clear and active — this is what the audience will follow.",
  inciting: "A concrete disruption that happens on the page. This is where the story truly starts.",
  doubt: "The hesitation has weight, which makes the eventual yes mean something.",
  ally: "A second character sharpens the protagonist by contrast. Let them keep challenging.",
  commit: "We watch the protagonist choose. That choice gives the rest of the story its momentum.",
  rising: "Complications escalate with real friction. Make sure each one costs more than the last.",
  develop: "This deepens the picture without rushing — just what this movement needs.",
  midpoint: "A genuine turn: after this, the story can't go back to how it was.",
  crisis: "The low point has weight and the stakes feel personal. Keep the pressure on.",
  climax: "The protagonist acts in the decisive moment. This is the payoff the setup promised.",
  resolution: "The ending shows change instead of explaining it. Consider echoing an image from the opening.",
};

const FORMAT_INFO: Record<StoryFormat, { label: string; note: string; beatUnit: string }> = {
  "personal-story": {
    label: "Personal story",
    note: "For a told-aloud personal story, beats can be single sentences — what matters is that the listener feels the turn and the change in you.",
    beatUnit: "a sentence or two",
  },
  "short-film": {
    label: "Short film",
    note: "A short film has room for one clear turn; every beat should be something we can see.",
    beatUnit: "a single scene",
  },
  feature: {
    label: "Feature treatment",
    note: "In a feature treatment each beat should read as an event with consequences, not a mood.",
    beatUnit: "a sequence",
  },
  "tv-episode": {
    label: "TV episode",
    note: "In an episode, beats should land on act breaks and leave the character somewhere new for next week.",
    beatUnit: "a scene",
  },
  scene: {
    label: "Scene",
    note: "In a single scene these beats compress into moments — a look, a line, a shift in power.",
    beatUnit: "a moment or a line",
  },
  pitch: {
    label: "Pitch",
    note: "In a pitch, beats are signposts: each one should be a single vivid sentence the listener can repeat.",
    beatUnit: "one sentence",
  },
  "brand-story": {
    label: "Brand story",
    note: "In a brand or founder story, the customer or founder is the protagonist — the product is the mentor, not the hero.",
    beatUnit: "a sentence or two",
  },
};

interface SentenceInfo {
  text: string;
  /** `norm(text)`, computed once: every lexicon test on this sentence reuses it. */
  hay: string;
  wordCount: number;
  position: number;
}

interface Draft {
  /** The text the lexicons read: the prose itself, or a screenplay with its sluglines, cues and parentheticals folded away. */
  text: string;
  /** Units for beats and line notes: sentences, with a screenplay speech kept whole ("Sam: \u201cI sold the truck. Not it.\u201d"). */
  sentences: string[];
  /** What characters say out loud. */
  dialogue: string[];
  screenplay: boolean;
  paragraphs: number;
}

/**
 * Read a draft for the Story Doctor. Screenplay format (a slugline, or two or
 * more character cues) is parsed rather than read as prose: sluglines,
 * transitions and parentheticals drop out, and each speech becomes one
 * quoted line attributed to its speaker. Prose is split into sentences that
 * keep quoted speech whole.
 */
function readDraft(raw: string): Draft {
  const blocks = paragraphs(raw).length;
  const read = readScreenplay(raw);
  if (read.slugs > 0 || read.cues >= 2) {
    const units = read.units.map((u) => (u.kind === "dialogue" ? `${u.speaker ?? "Someone"}: \u201c${u.text}\u201d` : u.text));
    return {
      text: units.join(" "),
      sentences: units,
      dialogue: read.units.filter((u) => u.kind === "dialogue").map((u) => u.text),
      screenplay: true,
      paragraphs: blocks,
    };
  }
  // Standalone caps lines — a title, "ACT ONE" — head the prose rather than start its first sentence.
  const prose = raw
    .split("\n")
    .filter((line) => !(line.trim() === line.trim().toUpperCase() && /[A-Z]/.test(line) && words(line).length <= 8 && !/[.!?]["”]?$/.test(line.trim())))
    .join("\n");
  return {
    text: prose,
    sentences: proseSentences(prose),
    dialogue: (prose.match(/["“][^"”]{2,}["”]/g) ?? []).map((q) => q.slice(1, -1)),
    screenplay: false,
    paragraphs: blocks,
  };
}

function sentenceMap(list: string[]): SentenceInfo[] {
  const counts = list.map((s) => Math.max(1, words(s).length));
  const total = sum(counts);
  let before = 0;
  return list.map((s, i) => {
    const info = { text: s, hay: norm(s), wordCount: counts[i], position: (before + counts[i] / 2) / total };
    before += counts[i];
    return info;
  });
}

const TELLING_RE =
  /\b(felt|feel|feeling|was|were|am|became|got|grew)\s+(so\s+|very\s+|really\s+|incredibly\s+|extremely\s+)?(sad|happy|angry|scared|afraid|nervous|excited|lonely|anxious|terrified|heartbroken|furious|ashamed|guilty|jealous|relieved|overwhelmed|devastated|hopeless|embarrassed|frustrated|upset|depressed|worried)\b/i;

const EMOTION_CUE: Record<string, string> = {
  sad: "I left my dinner untouched and went to bed at seven",
  depressed: "the curtains stayed shut for a week",
  happy: "I laughed out loud, alone",
  angry: "I set the cup down harder than I meant to",
  furious: "I set the cup down harder than I meant to",
  frustrated: "I rewrote the same sentence six times and deleted all of them",
  upset: "I left before dessert without saying why",
  scared: "my hands wouldn't stop shaking",
  afraid: "my hands wouldn't stop shaking",
  terrified: "my legs wouldn't move",
  nervous: "I read the same line four times without taking it in",
  anxious: "I checked the clock every thirty seconds",
  worried: "I checked the clock every thirty seconds",
  excited: "I was at the door before the second knock",
  lonely: "I set the table for two out of habit",
  heartbroken: "I kept her voicemail and played it every night",
  devastated: "I sat in the parked car until the engine ticked cold",
  ashamed: "I couldn't look him in the eye",
  embarrassed: "I couldn't look him in the eye",
  guilty: "I rehearsed the apology all the way home and never said it",
  jealous: "I found reasons to check her page every hour",
  relieved: "my shoulders dropped for the first time in weeks",
  overwhelmed: "the list on the fridge had grown to two pages",
  hopeless: "I stopped opening the mail",
};

const GENERIC_OPENERS = [
  "this is a story about",
  "this story is about",
  "i want to tell you",
  "let me tell you",
  "once upon a time",
  "my name is",
  "there was a",
  "there once was",
  "it was a",
  "in this story",
  "so basically",
];

const LESSON_ENDINGS = ["i learned", "i learnt", "the moral", "taught me", "the lesson", "realized that", "realised that", "learned that", "the point is"];

const PASSIVE_RE = /\b(was|were|been|being|is|are)\s+[a-z]+ed\s+by\b/i;

/** Beats whose timing matters enough to flag when they arrive far from where the framework expects them. */
const TIMED_KINDS = new Set<BeatKind>(["inciting", "commit", "midpoint", "crisis", "climax"]);

interface BeatReading {
  beat: string;
  kind: BeatKind;
  status: BeatStatus;
  evidence: string;
  suggestion: string;
  /** Lexicon fit of the matched passage (0 when missing). */
  signal: number;
}

function kindSignal(s: SentenceInfo, kind: BeatKind): number {
  let signal = hitsIn(s.hay, KIND_LEXICON[kind]).length;
  if ((kind === "theme" || kind === "ally") && dialogueLines(s.text) > 0) signal += 0.5;
  if (kind === "setup" || kind === "develop") signal += Math.min(hitsIn(s.hay, LEXICON.sensory).length, 2) * 0.25;
  return signal;
}

/**
 * Align the framework's beats to sentences, in order. A dynamic programme
 * picks one sentence per beat (strictly increasing), maximising lexicon fit
 * minus distance from where the framework expects the beat; a beat with no
 * worthwhile sentence left is marked missing.
 */
function alignBeats(map: SentenceInfo[], beats: FrameworkBeat[], kinds: BeatKind[]): { assigned: number[]; signals: number[][] } {
  const S = map.length;
  const B = beats.length;
  const LAMBDA = 3;
  const MISSING = -0.6;
  const signals = beats.map((_, b) => map.map((s) => kindSignal(s, kinds[b])));
  const score = (b: number, s: number) => signals[b][s] - LAMBDA * Math.abs(map[s].position - beats[b].position);

  // f[k]: best total for the beats so far using only sentences with index < k.
  let f: number[] = new Array(S + 1).fill(0);
  const choices: Int32Array[] = [];
  for (let b = 0; b < B; b++) {
    const next: number[] = new Array(S + 1);
    const choice = new Int32Array(S + 1);
    let best = -Infinity;
    let bestArg = -1;
    for (let k = 0; k <= S; k++) {
      if (k > 0) {
        const candidate = f[k - 1] + score(b, k - 1);
        if (candidate > best) {
          best = candidate;
          bestArg = k - 1;
        }
      }
      const skip = f[k] + MISSING;
      if (best > skip) {
        next[k] = best;
        choice[k] = bestArg;
      } else {
        next[k] = skip;
        choice[k] = -1;
      }
    }
    choices.push(choice);
    f = next;
  }

  const assigned: number[] = new Array(B).fill(-1);
  let k = S;
  for (let b = B - 1; b >= 0; b--) {
    const c = choices[b][k];
    if (c >= 0) {
      assigned[b] = c;
      k = c;
    }
  }
  return { assigned, signals };
}

function readBeats(map: SentenceInfo[], frameworkId: StoryRequest["framework"], format: StoryFormat): BeatReading[] {
  const framework = FRAMEWORKS[frameworkId];
  const beats = framework.beats;
  const kinds = beats.map(kindForBeat);
  const unit = FORMAT_INFO[format].beatUnit;
  const { assigned, signals } = alignBeats(map, beats, kinds);

  return beats.map((beat, b) => {
    const kind = kinds[b];
    const s = assigned[b];
    if (s < 0) {
      return {
        beat: beat.name,
        kind,
        status: "missing" as const,
        evidence: "",
        // The beat map already shows the beat's definition and that nothing lands here; the suggestion is the fix.
        suggestion: `${KIND_TIP[kind]} In this format it can be as small as ${unit}.`,
        signal: 0,
      };
    }
    const sentence = map[s];
    const signal = signals[b][s];
    const nextFree = s + 1 < map.length && !assigned.includes(s + 1) ? signals[b][s + 1] : 0;
    const local = signal + nextFree * 0.5;
    const drift = sentence.position - beat.position;
    let status: BeatStatus =
      (signal >= 2.5 && sentence.wordCount >= 7) || local >= 3.5
        ? "strong"
        : signal >= 1.5 || (signal >= 1 && Math.abs(drift) <= 0.12)
          ? "present"
          : "weak";
    // A structural beat that lands far from where it belongs is only half doing its job.
    if (TIMED_KINDS.has(kind) && Math.abs(drift) > 0.3) status = status === "strong" ? "present" : "weak";

    let suggestion: string;
    if (status === "strong") suggestion = KIND_STRONG[kind];
    else if (status === "present") suggestion = `It's here, but it could hit harder. ${KIND_TIP[kind]}`;
    else
      suggestion = `This passage doesn't yet do the job of "${beat.name}" — ${beat.description.charAt(0).toLowerCase()}${beat.description.slice(1)} ${KIND_TIP[kind]}`;

    if (TIMED_KINDS.has(kind) && Math.abs(drift) > 0.15) {
      const actual = Math.round(sentence.position * 100);
      const expected = Math.round(beat.position * 100);
      suggestion += drift > 0
        ? ` It also arrives late — about ${actual}% of the way through, where ${framework.name} expects it near ${expected}%. Consider getting here sooner.`
        : ` It also arrives early — about ${actual}% of the way through, where ${framework.name} expects it near ${expected}%. Give the story more room before it.`;
    }
    return { beat: beat.name, kind, status, evidence: truncateWords(sentence.text, 32), suggestion, signal };
  });
}

function bestSentence(list: SentenceInfo[], terms: readonly string[], minWords = 5): SentenceInfo | null {
  let best: SentenceInfo | null = null;
  let bestHits = 0;
  for (const s of list) {
    if (s.wordCount < minWords) continue;
    const n = hitsIn(s.hay, terms).length;
    if (n > bestHits) {
      best = s;
      bestHits = n;
    }
  }
  return best;
}

const SKILL_PRAISE: Partial<Record<SkillId, string>> = {
  hook: "A strong opening pull",
  structure: "A clear shape",
  character: "A protagonist we can follow",
  conflict: "Real pressure on the page",
  pacing: "Confident rhythm",
  visual: "Vivid, filmable detail",
  dialogue: "Lively dialogue",
};

const SKILL_GAP: Partial<Record<SkillId, string>> = {
  hook: "the opening takes too long to grab us",
  structure: "the beats blur together",
  character: "we don't yet know what the protagonist wants",
  conflict: "the stakes stay abstract",
  pacing: "the rhythm stays in one gear",
  visual: "it tells more than it shows",
  dialogue: "the dialogue says too much out loud",
};

function splitLongSentence(sentence: string): string {
  const clean = sentence.trim();
  const m = clean.match(/^(.{25,}?)(,\s+(?:and|but|so|then|which|because|while|when)\s+|;\s+|\s+—\s+)(.+)$/);
  if (!m) return "";
  const first = stripEnd(m[1]);
  const second = m[3].replace(/^(and|but|so|then|which|because|while|when)\s+/i, "");
  return `${first}. ${capitalize(second.trim())}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Sentence-length standard deviation (words) past which a draft's rhythm has real range. */
const HIGH_RHYTHM_VARIANCE = 8;

/** Weighted conflict density (per 100 words) below which a draft reads as calm, and above which it reads as fraught. */
const CONFLICT_DENSITY = { low: 0.6, high: 4.5 } as const;
/** Sensory-detail occurrences per 100 words. */
const SENSORY_DENSITY = { low: 0.5, high: 5 } as const;

/** Offline Story Doctor. */
export function demoStory(req: Pick<StoryRequest, "text" | "framework" | "format" | "title">): StoryAnalysis {
  const draft = readDraft(req.text.trim());
  const text = draft.text;
  const format = req.format;
  const framework = FRAMEWORKS[req.framework];
  const formatInfo = FORMAT_INFO[format];
  const map = sentenceMap(draft.sentences);
  const totalWords = words(text).length;
  const beats = readBeats(map, req.framework, format);
  const firstSentence = map[0]?.text ?? text;
  const lastSentence = map[map.length - 1]?.text ?? text;
  // Densities count every occurrence per 100 words, so a long draft is judged by its texture, not its length.
  const per100 = (n: number) => (n / Math.max(totalWords, 1)) * 100;

  // --- Skill scores -------------------------------------------------------
  const strong = beats.filter((b) => b.status === "strong").length;
  const present = beats.filter((b) => b.status === "present").length;
  const weak = beats.filter((b) => b.status === "weak").length;
  const missing = beats.filter((b) => b.status === "missing").length;
  const coverage = (strong + present * 0.7 + weak * 0.35) / beats.length;
  const closing = map.slice(-2).map((s) => s.text).join(" ");
  const endsWithChange = hits(closing, LEXICON.change).length > 0;
  const statusRank: Record<BeatStatus, number> = { missing: 0, weak: 1, present: 2, strong: 3 };
  const weakestBeat = [...beats].sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.signal - b.signal)[0];
  const landed = strong + present;

  const lessonEnding = hits(lastSentence, LESSON_ENDINGS).length > 0;
  const structureScore = clampScore(scale(coverage, 0.2, 0.92, 22, 90) + (endsWithChange && !lessonEnding ? 4 : 0));
  const structure: SkillScore = {
    skill: "structure",
    score: structureScore,
    comment: `${landed} of ${beats.length} ${framework.name} beats land clearly; the thinnest is "${weakestBeat.beat}".${
      lessonEnding
        ? " The ending states the lesson instead of showing what changed."
        : endsWithChange
          ? " The ending registers a change, which gives the shape a payoff."
          : " The ending doesn't yet show what changed."
    }`,
  };

  const openerGeneric = hits(firstSentence, GENERIC_OPENERS).length > 0;
  const firstWords = words(firstSentence).length;
  const openingSignals =
    hits(firstSentence, STRONG_CONFLICT).length +
    hits(firstSentence, LEXICON.stakes).length * 0.5 +
    hits(firstSentence, LEXICON.emotion).length +
    (firstSentence.includes("?") ? 1 : 0) +
    Math.min(specificityMarkers(firstSentence), 2) +
    hits(firstSentence, LEXICON.sensory).length * 0.5;
  const hookScore = clampScore(scale(openingSignals, 0, 4, 30, 88) + (firstWords <= 22 ? 4 : -4) - (openerGeneric ? 14 : 0));
  const hook: SkillScore = {
    skill: "hook",
    score: hookScore,
    comment: openerGeneric
      ? `"${truncateWords(stripEnd(firstSentence), 14)}" announces the story instead of starting it. Open on a moment already in motion.`
      : hookScore >= 70
        ? `"${truncateWords(stripEnd(firstSentence), 14)}" drops us into something specific and raises a question — a good first pull.`
        : `"${truncateWords(stripEnd(firstSentence), 14)}" is a calm start. Open closer to the disruption, or with a detail that raises a question.`,
  };

  const desireSentence = bestSentence(map, STORY_DESIRE);
  const desireHits = hits(text, STORY_DESIRE).length;
  const changeHits = hits(text, LEXICON.change).length;
  const characterRaw = desireHits * 1.2 + changeHits + Math.min(specificityMarkers(text), 6) * 0.4 + Math.min(hits(text, LEXICON.emotion).length, 3) * 0.5;
  const characterScore = clampScore(scale(characterRaw, 0.5, 9, 28, 88));
  const character: SkillScore = {
    skill: "character",
    score: characterScore,
    comment: desireSentence
      ? `The want surfaces in "${truncateWords(stripEnd(desireSentence.text), 14)}".${changeHits > 0 ? " And there's evidence of change by the end." : " Make sure we see how that want changes them by the end."}`
      : "I can't find a clear statement of what the protagonist wants. Name the desire early — it's the line the audience follows.",
  };

  // Conflict: weighted occurrences per 100 words. Stakes words ("home", "family", "life") only count in a sentence that
  // also has real opposition or desire, and without at least two distinct real-conflict words the score stays below 60.
  const strongConflict = hits(text, STRONG_CONFLICT);
  const stakesInContext = map.reduce(
    (n, s) => (hitsIn(s.hay, STRONG_CONFLICT).length + hitsIn(s.hay, STORY_DESIRE).length > 0 ? n + occurrences(s.text, LEXICON.stakes) * 0.5 : n),
    0,
  );
  const conflictDensity = per100(occurrences(text, STORY_CONFLICT, conflictWeight) + stakesInContext);
  let conflictScore = clampScore(scale(conflictDensity, CONFLICT_DENSITY.low, CONFLICT_DENSITY.high, 26, 90));
  if (strongConflict.length < 2) conflictScore = Math.min(conflictScore, 52);
  const conflictReal = conflictScore >= 60;
  const conflictSentence = bestSentence(map, STRONG_CONFLICT);
  const contrastFramework = req.framework === "kishotenketsu";
  const conflict: SkillScore = {
    skill: "conflict",
    score: conflictScore,
    comment: contrastFramework && conflictScore < 65
      ? "Kishōtenketsu doesn't need a villain — tension here comes from contrast and juxtaposition. Make sure the twist reframes what we've seen."
      : conflictSentence
        ? `Pressure peaks at "${truncateWords(stripEnd(conflictSentence.text), 14)}".${conflictReal ? " The opposition feels real." : " Elsewhere the opposition is implied rather than felt — make it active."}`
        : "The draft is short on opposition: nothing actively resists the protagonist. Give the obstacle a face and a cost.",
  };

  const lengths = map.map((s) => s.wordCount);
  const avgLen = lengths.length > 0 ? sum(lengths) / lengths.length : 0;
  const variance = lengths.length < 2 ? 0 : Math.sqrt(sum(lengths.map((l) => (l - avgLen) ** 2)) / lengths.length);
  const paras = draft.paragraphs;
  let pacingRaw = scale(variance, 2, 11, 35, 88);
  if (avgLen > 26) pacingRaw -= 10;
  if (avgLen < 7 && !draft.screenplay) pacingRaw -= 6;
  if (totalWords > 350 && paras <= 1) pacingRaw -= 10;
  const pacingScore = clampScore(pacingRaw);
  // "Short lines land the big moments" is only true of a draft that has short lines among long ones.
  const shortest = lengths.reduce((min, l) => Math.min(min, l), lengths[0] ?? 0);
  const rhythmEarned = pacingScore >= 70 || (variance >= HIGH_RHYTHM_VARIANCE && shortest <= 6 && !(totalWords > 350 && paras <= 1));
  const pacing: SkillScore = {
    skill: "pacing",
    score: pacingScore,
    comment:
      totalWords > 350 && paras <= 1
        ? `One ${totalWords}-word block gives the reader nowhere to breathe. Paragraph breaks are pacing tools — use them to land beats.`
        : variance < 4
          ? `Sentences run at a steady ~${Math.round(avgLen)} words each. Vary the rhythm: a short line after a long one makes a moment hit.`
          : rhythmEarned
            ? `Good rhythmic range (sentences average ~${Math.round(avgLen)} words, with real variety) — short lines land where they should.`
            : `Some rhythmic range (sentences average ~${Math.round(avgLen)} words). Save your shortest sentences for the biggest moments.`,
  };

  const skillScores: SkillScore[] = [structure, character, conflict, hook, pacing];

  const sensoryHits = hits(text, STORY_SENSORY).length;
  const sensorySentence = bestSentence(map, STORY_SENSORY, 4);
  const visualFormats: StoryFormat[] = ["scene", "short-film", "feature", "tv-episode"];
  let visualScore = 0;
  if (sensoryHits >= 2 || visualFormats.includes(format)) {
    visualScore = clampScore(scale(per100(occurrences(text, STORY_SENSORY)), SENSORY_DENSITY.low, SENSORY_DENSITY.high, 28, 90));
    skillScores.push({
      skill: "visual",
      score: visualScore,
      comment: sensorySentence
        ? `"${truncateWords(stripEnd(sensorySentence.text), 14)}" is the kind of image a camera can hold.${visualScore < 65 ? " More of the draft needs to work this way." : ""}`
        : "There's little the audience could see or hear. Anchor each beat in one concrete image.",
    });
  }

  const dialogueCount = draft.dialogue.length;
  const onTheNose = draft.dialogue.filter((q) => TELLING_RE.test(q) || /\bi (love|hate|feel|am afraid)\b/i.test(q));
  if (dialogueCount >= 1 || format === "scene") {
    const dialogueScore = clampScore(scale(Math.min(dialogueCount, 8), 0, 6, 30, 86) - onTheNose.length * 8);
    skillScores.push({
      skill: "dialogue",
      score: dialogueScore,
      comment:
        onTheNose.length > 0
          ? `"${truncateWords(onTheNose[0], 16)}" says the feeling out loud. Let characters talk around what they mean — subtext is where the tension lives.`
          : dialogueCount > 0
            ? `${plural(dialogueCount, "line", "lines")} of dialogue, none spelling out emotions — good instinct. Make sure each line is someone trying to get something.`
            : "No dialogue yet. Even in a scene built on silence, one line where someone wants something can carry it.",
    });
  }

  // --- Overall ------------------------------------------------------------
  const weights: Partial<Record<SkillId, number>> = {
    structure: 1.4,
    hook: 1,
    character: 1.1,
    conflict: contrastFramework ? 0.4 : 1.1,
    pacing: 0.8,
    visual: 0.7,
    dialogue: 0.7,
  };
  const weightTotal = sum(skillScores.map((s) => weights[s.skill] ?? 1));
  let overall = sum(skillScores.map((s) => s.score * (weights[s.skill] ?? 1))) / weightTotal;
  if (totalWords < 120) overall -= 5;
  overall = clampScore(clamp(overall, 15, 95));

  const ranked = [...skillScores].sort((a, b) => b.score - a.score);
  // A headline only leads with a strength the notes below back up: "A clear shape" needs a structure score of 65+,
  // "Confident rhythm" the same rhythm the pacing strength needs.
  const headlineWorthy = (s: SkillScore) =>
    s.skill === "structure" ? s.score >= 65 : s.skill === "pacing" ? rhythmEarned : s.score >= 50;
  const top = ranked.find(headlineWorthy) ?? ranked[0];
  const gapCandidates = contrastFramework ? ranked.filter((r) => r.skill !== "conflict") : ranked;
  const bottom = gapCandidates[gapCandidates.length - 1];
  const gapText = (skill: SkillId) =>
    skill === "dialogue"
      ? dialogueCount === 0
        ? "there's no dialogue yet"
        : onTheNose.length > 0
          ? "the dialogue says too much out loud"
          : "the dialogue could work harder"
      : SKILL_GAP[skill];
  const headline =
    bottom.score >= 70
      ? `${SKILL_PRAISE[top.skill]} — this draft is close; the notes below are polish.`
      : top.score < 50 || !headlineWorthy(top)
        ? "The raw material is here — now it needs a spine."
        : `${SKILL_PRAISE[top.skill]}, but ${gapText(bottom.skill)}.`;

  const title = req.title?.trim();
  const needWork = weak + missing;
  const summary = [
    `${title ? `"${title}" is a` : "A"} ${totalWords}-word ${formatInfo.label.toLowerCase()} mapped against ${framework.name}: ${plural(strong, "beat lands", "beats land")} strongly, ${present} ${present === 1 ? "is" : "are"} present, and ${needWork === 0 ? "none are weak or missing" : `${needWork} ${needWork === 1 ? "needs" : "need"} work`}.`,
    formatInfo.note,
    weakestBeat.status === "strong"
      ? "Every beat is doing its job — the opportunity now is in the line-level craft."
      : `The biggest opportunity is ${weakestBeat.status === "missing" ? `the missing "${weakestBeat.beat}" beat` : `"${weakestBeat.beat}"`}.`,
  ].join(" ");

  // --- Strengths ------------------------------------------------------------
  // Each strength quotes a different line: one sentence shouldn't be praised three ways.
  const praise: Partial<Record<SkillId, { line: string; source: string | null } | null>> = {
    structure: structureScore >= 65 ? { line: `A shape you can feel: ${landed} of ${beats.length} ${framework.name} beats land.`, source: null } : null,
    character: desireSentence ? { line: `A clear, active want: "${truncateWords(stripEnd(desireSentence.text), 18)}"`, source: desireSentence.text } : null,
    conflict: conflictSentence && conflictReal ? { line: `Real pressure on the page: "${truncateWords(stripEnd(conflictSentence.text), 18)}"`, source: conflictSentence.text } : null,
    hook: hookScore >= 50 ? { line: `A first line that earns the second: "${truncateWords(stripEnd(firstSentence), 18)}"`, source: firstSentence } : null,
    pacing: rhythmEarned
      ? { line: "Rhythm with range — your short sentences land the big moments.", source: null }
      : pacingScore >= 60 && variance >= 4 && shortest <= 6
        ? { line: "Some rhythmic range already: a few short sentences break up the longer ones.", source: null }
        : null,
    visual: sensorySentence ? { line: `Filmable, sensory detail: "${truncateWords(stripEnd(sensorySentence.text), 18)}"`, source: sensorySentence.text } : null,
    dialogue: onTheNose.length === 0 && dialogueCount > 0 ? { line: "Dialogue that talks around feelings instead of naming them.", source: null } : null,
  };
  const strengths: string[] = [];
  const praisedSources = new Set<string>();
  const strongBeat = beats.find((b) => b.status === "strong");
  if (strongBeat) {
    strengths.push(`Your "${strongBeat.beat}" beat lands: "${truncateWords(stripEnd(strongBeat.evidence), 18)}"`);
    praisedSources.add(strongBeat.evidence.replace(/…$/, ""));
  }
  const alreadyQuoted = (source: string | null) =>
    source !== null && [...praisedSources].some((p) => p.length > 0 && (source.startsWith(p) || p.startsWith(source)));
  for (const s of ranked) {
    if (strengths.length >= 4) break;
    const item = praise[s.skill];
    if (!item || alreadyQuoted(item.source)) continue;
    if (s.score >= 60 || (strengths.length < 2 && s.score >= 50)) {
      strengths.push(item.line);
      if (item.source) praisedSources.add(item.source);
    }
  }
  if (strengths.length === 0) strengths.push(`You've got a complete draft of ${totalWords} words on the page — the hardest part. Now it's revision.`);

  // --- Line notes -----------------------------------------------------------
  const lineNotes: { quote: string; note: string }[] = [];
  const usedQuotes = new Set<string>();
  const addNote = (quote: string, note: string) => {
    if (lineNotes.length >= 6 || usedQuotes.has(quote)) return;
    usedQuotes.add(quote);
    lineNotes.push({ quote, note });
  };

  if (openerGeneric) addNote(firstSentence, "This line announces that a story is coming. Cut it and start with the first moment that actually happens.");
  const tellingSentence = map.find((s) => TELLING_RE.test(s.text));
  const tellingMatch = tellingSentence?.text.match(TELLING_RE) ?? null;
  const tellingCue = tellingMatch ? EMOTION_CUE[tellingMatch[3].toLowerCase()] : undefined;
  if (tellingSentence && tellingMatch) {
    addNote(tellingSentence.text, `This names the emotion ("${tellingMatch[0]}"). Show it through behaviour instead${tellingCue ? ` — something like "${tellingCue}."` : "."}`);
  }
  if (lessonEnding) {
    addNote(lastSentence, "The ending explains the lesson. Trust the audience: end on an image or action that proves it instead.");
  }
  for (const s of map) {
    const hedges = hitsIn(s.hay, HEDGE_TERMS);
    if (hedges.length > 0 && s.wordCount >= 6 && !usedQuotes.has(s.text)) {
      addNote(s.text, `Hedge words (${hedges.map((h) => `"${h}"`).join(", ")}) soften the moment. Without them: "${truncateWords(cleanHedges(s.text), 30)}"`);
      break;
    }
  }
  const longest = [...map].sort((a, b) => b.wordCount - a.wordCount)[0];
  if (longest && longest.wordCount > 35) {
    const split = splitLongSentence(longest.text);
    addNote(longest.text, `At ${longest.wordCount} words this sentence buries its best image. Split it where the action turns${split ? `: "${truncateWords(split, 30)}"` : "."}`);
  }
  const passive = map.find((s) => PASSIVE_RE.test(s.text));
  if (passive) addNote(passive.text, "Passive voice hides who's acting. Put the doer first and the line gets its energy back.");
  const vivid = bestSentence(map, STORY_SENSORY, 6);
  if (vivid && hitsIn(vivid.hay, STORY_SENSORY).length >= 2) {
    addNote(vivid.text, "This is the texture that makes a story feel lived-in — concrete, sensory, filmable. Let more lines work this way.");
  }
  if (endsWithChange && !lessonEnding) {
    addNote(lastSentence, "A good closing note — it registers change without over-explaining. Consider echoing an image from your opening.");
  }
  if (lineNotes.length < 3) {
    addNote(firstSentence, hookScore >= 70 ? "A confident first line — it raises a question and earns the next sentence." : "Your first line sets the contract with the audience. Make it raise a question only the story can answer.");
  }
  if (lineNotes.length < 3) addNote(lastSentence, "Your last line is what the audience walks away with. Does it land on the change, or trail off?");
  for (const s of map) {
    if (lineNotes.length >= 3) break;
    if (s.wordCount >= 4) {
      addNote(
        s.text,
        conflictSentence && s.text === conflictSentence.text
          ? "This is where the pressure peaks — slow down here and give it more room on the page."
          : "Ask of this line: does it move the story forward, or reveal character? If neither, compress it.",
      );
    }
  }

  // --- Improvements ---------------------------------------------------------
  const improvements: Improvement[] = [];
  if (hookScore < 70) {
    // Suggest a later line to open on only if it actually carries pressure or feeling.
    const earlyHalf = map.slice(1, Math.max(2, Math.ceil(map.length * 0.6)));
    const opener = bestSentence(earlyHalf, OPENER_TERMS);
    improvements.push({
      title: "Open closer to the disruption",
      detail: `Your first line — "${truncateWords(stripEnd(firstSentence), 14)}" — ${openerGeneric ? "announces the story rather than starting it" : "takes its time"}. Audiences commit in the first few seconds; start where something is already at stake.`,
      example: opener ? `Try starting here instead: "${truncateWords(opener.text, 30)}"` : "",
    });
  }
  if (tellingSentence) {
    improvements.push({
      title: "Show the feeling, don't name it",
      detail: `"${truncateWords(stripEnd(tellingSentence.text), 16)}" tells us the emotion. Let a physical action or image carry it and the audience will feel it themselves.`,
      example: tellingCue ? `Replace the named feeling with a behaviour: "${capitalize(tellingCue)}."` : "",
    });
  }
  const gapBeat = beats.find((b) => b.status === "missing") ?? beats.find((b) => b.status === "weak");
  if (gapBeat) {
    improvements.push({
      title: `Build out "${gapBeat.beat}"`,
      detail:
        gapBeat.status === "missing"
          ? `Nothing in the draft does this job yet: ${lowerFirst(FRAMEWORKS[req.framework].beats[beats.indexOf(gapBeat)]?.description ?? "")} ${gapBeat.suggestion}`
          : gapBeat.suggestion,
      example: gapBeat.evidence ? `The closest passage right now: "${truncateWords(gapBeat.evidence, 20)}" — rework it so it does this job.` : "",
    });
  }
  if (conflictScore < 60 && improvements.length < 4 && !contrastFramework) {
    improvements.push({
      title: "Make the opposition concrete",
      detail: "The story tells us things are hard without showing who or what is making them hard. Give the obstacle a face, a voice, or a deadline.",
      example: "",
    });
  }
  if (longest && longest.wordCount > 35 && improvements.length < 4) {
    const split = splitLongSentence(longest.text);
    improvements.push({
      title: "Break up the longest sentence",
      detail: `A ${longest.wordCount}-word sentence makes the reader hold too much at once. Split it so the key image gets its own beat.`,
      example: split ? truncateWords(split, 40) : "",
    });
  }
  if (improvements.length < 2) {
    improvements.push({
      title: "Slow down at the turning point",
      detail: "Give the story's key moment more room: shorter sentences, one image per line. Speed through the connective tissue around it.",
      example: conflictSentence ? `Break "${truncateWords(stripEnd(conflictSentence.text), 16)}" into two or three short lines.` : "",
    });
  }

  // --- Revision plan --------------------------------------------------------
  const plan: string[] = [];
  for (const b of beats.filter((x) => x.status === "missing" || x.status === "weak").slice(0, 2)) {
    plan.push(`Rewrite "${b.beat}": ${KIND_TIP[b.kind]}`);
  }
  if (hookScore < 70) plan.push("Draft three alternative opening lines that start inside the disruption; keep the one that raises the sharpest question.");
  if (tellingSentence) plan.push("Do a show-don't-tell pass: replace every named emotion with a physical action or image.");
  if (pacingScore < 65) plan.push("Read the draft aloud and mark where your attention drifts; compress those passages by a third.");
  if (!endsWithChange || lessonEnding) plan.push("Rework the ending so a final image or action proves how the protagonist has changed.");
  const revisionPlan = plan.slice(0, 5);
  const fillers = [
    "Give the protagonist one more active choice in the middle of the story.",
    "Cut 10% of the words: every sentence should move the story or reveal character.",
  ];
  for (const f of fillers) if (revisionPlan.length < 2) revisionPlan.push(f);
  revisionPlan.push(`Run the Story Doctor on the revision with ${framework.name} again and compare the beat maps.`);

  return {
    overall,
    headline,
    summary,
    framework: req.framework,
    beats: beats.map(({ beat, status, evidence, suggestion }) => ({ beat, status, evidence, suggestion })),
    skillScores,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    lineNotes,
    revisionPlan,
  };
}

// ---------------------------------------------------------------------------
// Shot Planner
// ---------------------------------------------------------------------------

interface SceneUnit {
  kind: "action" | "dialogue";
  text: string;
  speaker?: string;
  /** Prose dialogue only: who the sentence says spoke ("Sam said", "she asked"), resolved later. */
  speakerHint?: string;
}

interface ParsedScene {
  /** Title-case label, e.g. "Lighthouse Kitchen". */
  location: string | null;
  /** For use mid-sentence, e.g. "the lighthouse kitchen". */
  place: string;
  time: string | null;
  exterior: boolean;
  characters: string[];
  /** Characters' pronouns where the scene makes them clear ("her father" → he; "Nadia… She…" → she). */
  genders: Map<string, "she" | "he">;
  units: SceneUnit[];
}

const SLUG_RE = /^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E\.?|INT\.|EXT\.|INT |EXT |EST\.)\s*(.+)$/i;
const TRANSITION_RE = /^(FADE IN:?|FADE OUT\.?|FADE TO BLACK\.?|CUT TO:?|SMASH CUT TO:?|DISSOLVE TO:?|MATCH CUT TO:?|CUT TO BLACK\.?|THE END\.?)$/i;
const CUE_RE = /^([A-Z][A-Z0-9 .'’-]{1,28}?)(\s*\((?:V\.O\.|O\.S\.|O\.C\.|CONT'D|CONT’D|CONTINUING)\))*\s*$/;
/** "NADIA: You sold it." — a speaker and their line on one line. */
const INLINE_CUE_RE = /^([A-Z][A-Z0-9 .'’-]{1,28}?)(?:\s*\((?:V\.O\.|O\.S\.|O\.C\.|CONT'D|CONT’D)\))?:\s+(.*[a-z].*)$/;
const PARENTHETICAL_RE = /^\(.*\)$/;
/** Caps lines that head a section of a treatment or outline rather than name a speaker. */
const SECTION_HEADING_RE =
  /^(?:(?:ACT|PART|CHAPTER|SCENE|SEQUENCE|EPISODE|BOOK|REEL)\b.*|PROLOGUE|EPILOGUE|TEASER|COLD OPEN|TAG|INTRODUCTION|CONCLUSION|LOGLINE|SYNOPSIS|TREATMENT|OUTLINE|TITLE|NOTES?|BACKGROUND|CHARACTERS?|SETTING|THEME|ENDING|BEGINNING|MIDDLE)[.:]?$/;
const TIME_OF_DAY = "DAY|NIGHT|MORNING|EVENING|AFTERNOON|DAWN|DUSK|SUNRISE|SUNSET|TWILIGHT|MIDNIGHT|NOON|CONTINUOUS|MOMENTS LATER|LATER|SAME TIME|SAME|MAGIC HOUR";
/** "KITCHEN - NIGHT. Maria stares…": a heading with the first action line run into it. */
const INLINE_SLUG_RE = new RegExp(String.raw`^(.*?\s[-–—]\s*(?:(?:${TIME_OF_DAY})\b\.?|\d{1,2}(?::\d{2})?\s?[AP]\.?M\.?))\s+(?=.*[a-z])(\S.*)$`, "i");
/** "ROOFTOP. Rain hammers…": an all-caps heading followed by a mixed-case sentence. */
const CAPS_HEADING_RE = /^([^a-z]*?[A-Z][^a-z]*?)[.:]\s+(\S*[a-z].*)$/;

const NAME_STOPWORDS = new Set([
  "The", "When", "Then", "She", "He", "They", "It", "Her", "His", "Their", "We", "You", "And", "But", "Int", "Ext", "Night",
  "Day", "Morning", "Evening", "Later", "Continuous", "Suddenly", "Outside", "Inside", "Finally", "After", "Before", "As",
  "In", "On", "At", "A", "An", "This", "That", "There", "Here", "What", "Who", "Why", "How", "No", "Yes", "Okay", "Oh",
  "Now", "Just", "Still", "Even", "Nothing", "Everything", "Someone", "Something", "I", "Mom", "Dad", "God", "Sorry", "Hey",
  "Please", "Thanks", "Well", "So", "If", "Our", "My", "Your", "Its", "One", "Two", "Three", "Beat", "Silence", "Close",
  "Rain", "Behind", "Across", "Somewhere", "Everyone", "Nobody", "Only", "Without", "With", "From", "Into", "Over", "Under",
  "Where", "For", "While", "Because", "Though", "Although", "Until", "Once", "Every", "Each", "Some", "Many", "Most", "All",
  "Both", "Neither", "Either", "None", "Not", "Never", "Always", "Sometimes", "Maybe", "Perhaps", "Thank", "Good", "Goodbye",
  "Hello", "Let", "Don't", "Can't", "Won't", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "Christmas", "Easter", "Mister", "Miss", "Sir", "Madam", "Ma'am", "Grandma", "Grandpa", "Mum", "Mama", "Papa", "Love",
  "Honey", "Baby", "Darling", "Cut", "Fade", "Title", "Scene", "Pause", "Meanwhile", "Again", "Soon", "Too", "Very",
  "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth", "Last", "Next", "North", "South",
  "East", "West", "Old", "New", "Upper", "Lower", "Central", "Downtown", "Uptown", "Detective", "Officer", "Doctor", "Captain",
  "Agent", "Sergeant", "Professor", "Judge", "Sheriff", "Aunt", "Uncle", "Nurse", "Coach", "Mrs", "Lady", "Lord", "Father",
  "Sister", "Brother", "Saint",
]);

const ROLE_NOUNS =
  "woman|man|girl|boy|kid|child|stranger|driver|waitress|waiter|bartender|nurse|doctor|officer|cop|soldier|mother|father|teenager|couple|figure|guard|clerk|priest|pilot|captain|detective|widow|grandmother|grandfather|aunt|uncle|son|daughter|brother|sister|husband|wife|boyfriend|girlfriend|boss|landlord|landlady|neighbour|neighbor|teacher|coach|manager|receptionist|cook|chef|customer|patient|mechanic|janitor|cashier|stepfather|stepmother|" +
  "suspect|witness|prisoner|inmate|victim|killer|thief|gunman|intruder|visitor|guest|passenger|reporter|journalist|lawyer|judge|agent|sergeant|lieutenant|sheriff|deputy|bouncer|singer|dancer|student|baby|toddler|hunter|farmer|fisherman|sailor|maid|butler|nanny|surgeon|paramedic|vendor|shopkeeper|bride|groom|widower|interrogator|informant|hostage|kidnapper|soldiers?";
const ROLE_NOUN_RE = new RegExp(String.raw`\b(?:a|an|the|her|his|their|my|our)\s+((?:young|old|older|elderly|tired|lone|small|tall|little|teenage|younger|estranged)\s+)?(${ROLE_NOUNS})\b`, "gi");
/** Roles that usually describe a named character ("Maria, a woman in her forties") rather than someone new. */
const GENERIC_ROLES = new Set(["woman", "man", "girl", "boy", "kid", "child", "figure", "couple", "teenager"]);

function titleCase(name: string): string {
  return name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`);
}

/** Split a slugline's text into heading and any action run into it on the same line. */
function splitSlug(text: string): { heading: string; remainder: string } {
  const timed = text.match(INLINE_SLUG_RE);
  if (timed) return { heading: timed[1], remainder: timed[2] };
  const caps = text.match(CAPS_HEADING_RE);
  if (caps) return { heading: caps[1], remainder: caps[2] };
  return { heading: text, remainder: "" };
}

const SPEECH_VERBS = "said|says|asks|asked|replies|replied|whispers|whispered|shouts|shouted|tells|told|mutters|muttered|snaps|snapped|calls|called|answers|answered|adds|added|cries|cried";
const SPEAKER_BEFORE_RE = new RegExp(String.raw`\b([A-Z][a-z]+|she|he|they)\s+(?:${SPEECH_VERBS})\b`, "i");
const SPEAKER_AFTER_RE = new RegExp(String.raw`\b(?:${SPEECH_VERBS})\s+([A-Z][a-z]+)\b`);

interface ScreenplayRead {
  /** True once a slugline or a character cue has been seen. */
  screenplay: boolean;
  slugs: number;
  /** Speeches introduced by a character cue. */
  cues: number;
  location: string | null;
  time: string | null;
  exterior: boolean;
  cueNames: string[];
  units: SceneUnit[];
}

/**
 * Read a scene line by line: sluglines (including a heading with action run
 * into it), transitions, character cues with their parentheticals and
 * speeches, and action or prose split into sentences — lifting quoted
 * speech out of prose.
 */
function readScreenplay(scene: string): ScreenplayRead {
  const lines = scene.replace(/\r/g, "").split("\n").map((l) => l.trim());
  let location: string | null = null;
  let time: string | null = null;
  let exterior = false;
  const units: SceneUnit[] = [];
  const cueNames: string[] = [];
  let screenplay = false;
  let slugs = 0;
  let cues = 0;

  const addSpeech = (name: string, spoken: string[]) => {
    const speaker = titleCase(name.trim());
    if (!cueNames.includes(speaker)) cueNames.push(speaker);
    if (spoken.length > 0) units.push({ kind: "dialogue", text: spoken.join(" "), speaker });
  };

  const addAction = (line: string) => {
    for (const s of proseSentences(line)) {
      const quote = s.match(/["“]([^"”]{2,})["”]/);
      const action = s.replace(/["“][^"”]{2,}["”]/g, "").replace(/\s+,/g, ",").trim();
      if (quote && !screenplay) {
        const hint = action.match(SPEAKER_BEFORE_RE)?.[1] ?? action.match(SPEAKER_AFTER_RE)?.[1];
        units.push({ kind: "dialogue", text: quote[1].trim(), ...(hint ? { speakerHint: hint } : {}) });
        // "she said" alone is attribution, not action.
        if (words(action.replace(SPEAKER_BEFORE_RE, "").replace(SPEAKER_AFTER_RE, "")).length < 3) continue;
      }
      // Short lines stay: "He leaps." or "Dead end." is often the beat the whole scene builds to.
      if (words(action).length > 0) units.push({ kind: "action", text: action });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || TRANSITION_RE.test(line)) continue;
    const slug = line.match(SLUG_RE);
    if (slug) {
      screenplay = true;
      slugs++;
      const { heading, remainder } = splitSlug(slug[2]);
      if (!location) {
        const prefix = slug[1].toUpperCase();
        exterior = prefix.startsWith("EXT") || prefix.startsWith("EST");
        const [where, when] = heading.split(/\s+[-–—]\s+/);
        location = where ? titleCase(where.replace(/[.]+$/, "")) : null;
        time = when ? when.toLowerCase().trim().replace(/(?<![ap]\.m)\.+$/, "") : null;
      }
      if (remainder) addAction(remainder);
      continue;
    }
    const inline = line.match(INLINE_CUE_RE);
    if (inline && inline[1] === inline[1].toUpperCase() && !/^(INT|EXT|EST|FADE|CUT|NOTE|TITLE|SUPER)\b/.test(inline[1])) {
      screenplay = true;
      cues++;
      addSpeech(inline[1], [inline[2]]);
      continue;
    }
    if (SECTION_HEADING_RE.test(line) && line === line.toUpperCase()) continue;
    const next = lines[i + 1] ?? "";
    const cue = line.match(CUE_RE);
    const isCue = cue !== null && line === line.toUpperCase() && /[A-Z]/.test(line) && next !== "" && next !== next.toUpperCase();
    if (isCue && cue) {
      const spoken: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j]) {
        if (!PARENTHETICAL_RE.test(lines[j])) spoken.push(lines[j]);
        j++;
      }
      // A speech is a few lines; a caps line over a long paragraph is a heading in a treatment.
      if (words(spoken.join(" ")).length <= 90) {
        screenplay = true;
        cues++;
        addSpeech(cue[1], spoken);
        i = j;
        continue;
      }
      continue;
    }
    if (PARENTHETICAL_RE.test(line)) continue;
    addAction(line);
  }
  return { screenplay, slugs, cues, location, time, exterior, cueNames, units };
}

const QUOTE_SPAN_RE = /"[^"\n]{1,600}"|“[^”\n]{1,600}”/g;
const HELD = { ".": "\uE000", "!": "\uE001", "?": "\uE002" } as const;

/**
 * Sentences that keep quoted speech whole: `"Florida. Your aunt has a room."`
 * stays one unit, and an attribution that follows a quote ("…go?" he asks.)
 * stays with it. The text itself is unchanged, so units can be quoted back.
 */
function proseSentences(text: string): string[] {
  const held = text.replace(QUOTE_SPAN_RE, (span) => {
    const inner = span.slice(1, -1);
    // Keep the quote's final terminator live, so the quote can still end a sentence.
    const body = inner.replace(/[.!?]+$/, "");
    const tail = inner.slice(body.length);
    return `${span[0]}${body.replace(/[.!?]/g, (c) => HELD[c as keyof typeof HELD])}${tail}${span[span.length - 1]}`;
  });
  const restored = sentences(held).map((s) => s.replace(/[\uE000-\uE002]/g, (c) => (c === HELD["."] ? "." : c === HELD["!"] ? "!" : "?")));
  const merged: string[] = [];
  for (const s of restored) {
    // Lower case straight after a closed quote is its attribution ("Where will you go?" he asks.).
    if (merged.length > 0 && /^[a-z]/.test(s) && /[.!?,]["”]$/.test(merged[merged.length - 1])) merged[merged.length - 1] += ` ${s}`;
    else merged.push(s);
  }
  return merged;
}

/** Common nouns that open scene description ("Steam rises", "Traffic crawls") and so look like names. */
const SCENE_NOUNS = new Set([
  "Rain", "Snow", "Wind", "Steam", "Smoke", "Fog", "Mist", "Traffic", "Thunder", "Lightning", "Light", "Lights", "Darkness",
  "Shadows", "Music", "Water", "Waves", "Sirens", "Fire", "Flames", "Dust", "Glass", "Blood", "Sunlight", "Moonlight",
  "Headlights", "Footsteps", "Voices", "People", "Cars", "Birds", "Dogs", "Leaves", "Trees", "Noise", "Laughter", "Applause",
  "Children", "Kids", "Men", "Women", "Police", "Guards", "Soldiers", "Tears", "Sweat", "Time", "Hours", "Minutes", "Seconds",
  "Days", "Years", "Upstairs", "Downstairs", "Nearby", "Slowly", "Quietly", "Silently", "Somewhere", "Nothing", "Everything",
  "Static", "Gravel", "Sand", "Ice", "Heat", "Sweat", "Ash", "Ashes", "Paper", "Papers", "Plates", "Bottles", "Pigeons", "Crowds",
  "Passengers", "Dishes", "Keys", "Coffee", "Bells", "Engines", "Horns", "Neon", "Snowflakes", "Raindrops", "Droplets",
]);

/** True when the capitalised word at `index` starts a sentence, a line or a quotation. */
function sentenceInitial(text: string, index: number): boolean {
  const start = text.search(/\S/);
  if (start < 0 || index <= start) return true;
  return /(?:[.!?…:]["”’)\]]*\s+|["“‘(]\s*|\n\s*|[—–]\s+)$/.test(text.slice(Math.max(0, index - 8), index));
}

/** Last words that make a capitalised run a place rather than a person: "Fifth Avenue", "Grace Cathedral", "Union Station". */
const PLACE_SUFFIXES = new Set([
  "Avenue", "Ave", "Street", "St", "Road", "Rd", "Lane", "Boulevard", "Blvd", "Drive", "Way", "Place", "Square", "Plaza", "Park",
  "Bridge", "River", "Lake", "Bay", "Beach", "Island", "Hill", "Hills", "Mountain", "Mountains", "Valley", "Station", "Terminal",
  "Airport", "Hotel", "Motel", "Inn", "Church", "Chapel", "Cathedral", "Temple", "Mosque", "Synagogue", "Hall", "Tower", "Towers",
  "Building", "Center", "Centre", "Hospital", "School", "Academy", "College", "University", "Market", "Mall", "Club", "Bar",
  "Diner", "Cafe", "Café", "Restaurant", "Theatre", "Theater", "Museum", "Library", "Prison", "Garden", "Gardens", "Heights",
  "Harbor", "Harbour", "Pier", "Port", "County", "City", "Town", "Village", "Court", "Crescent", "Row", "Alley", "Highway",
]);
/** Words that follow a verb rather than a noun: "lights a cigarette", "hands her the keys", "heads out". */
const VERB_FOLLOWERS = new Set([
  "a", "an", "the", "his", "her", "their", "its", "my", "our", "your", "him", "them", "it", "me", "us", "this", "that", "up",
  "down", "out", "off", "on", "in", "into", "to", "at", "back", "away", "over", "through", "across", "toward", "towards", "around",
  "one", "two", "another", "some",
]);
/** Place-name endings that are also common surnames. */
const SURNAME_SUFFIXES = new Set(["Park", "Hall", "Church", "Bay", "Hill", "Lake", "Court", "Way", "Place", "Row", "Town", "Port", "Garden"]);
/** Mid-sentence capitals after these are places ("down Fifth", "past Denver", "in Florida"), not people. */
const PLACE_PREPOSITION_RE =
  /\b(?:in|from|at|near|across|through|into|toward|towards|outside|inside|of|down|up|along|on|past|by|over|around|onto|beyond|behind|under|beneath|off)\s+$/i;
/**
 * Plural nouns that could be read as a verb's "-s" ("Nora lights…" vs "Brake lights glow") or that make the word
 * before them a modifier ("church bells", "car keys") rather than a name or a location.
 */
const PLURAL_NOUNS = new Set([
  "bells", "lights", "doors", "windows", "horns", "sirens", "leaves", "waves", "wheels", "engines", "heads", "eyes", "hands",
  "footsteps", "voices", "shadows", "clouds", "birds", "dogs", "cars", "trucks", "drums", "pipes", "tires", "tyres", "glasses",
  "plates", "cups", "keys", "papers", "curtains", "blinds", "shutters", "boots", "shoes", "clocks", "phones", "alarms", "fans",
  "flames", "lamps", "candles", "walls", "floors", "stairs", "steps", "tables", "chairs", "benches", "stalls", "towers", "streets",
  "roofs", "gates", "fences", "trees", "flowers", "petals", "sheets", "pages", "letters", "bottles", "cans", "boxes", "crates",
]);

/**
 * Characters in a prose scene: names (the first word of a capitalised run,
 * seen mid-sentence or acting like a person), plus people named by role
 * ("her father" → "the father"). Capitalised runs that are places ("Fifth
 * Avenue"), capitals after a place preposition ("down Broadway"), quoted
 * words and sentence-opening common nouns ("Church bells ring", "Steam
 * rises") are not characters.
 */
function proseCharacters(scene: string): string[] {
  const counts = new Map<string, { count: number; evidence: boolean; first: number }>();
  for (const run of scene.matchAll(/\b[A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*\b/g)) {
    const parts = [...run[0].matchAll(/[A-Z][a-z]+/g)];
    // "Fifth Avenue" is a place; "Jin Park" or "Tom Hall" is a person with a surname that can also end a place name.
    const knownFirstName = FEMALE_NAMES.has(parts[0][0]) || MALE_NAMES.has(parts[0][0]);
    if (parts.some((w) => PLACE_SUFFIXES.has(w[0]) && !(knownFirstName && SURNAME_SUFFIXES.has(w[0])))) continue;
    // "Then Maya…" → "Maya"; in "Maya Okafor" only the first name is counted.
    const first = parts.find((w) => !NAME_STOPWORDS.has(w[0]) && !SCENE_NOUNS.has(w[0]));
    if (!first || first[0].length < 3) continue;
    const name = first[0];
    const index = (run.index ?? 0) + (first.index ?? 0);
    const entry = counts.get(name) ?? { count: 0, evidence: false, first: index };
    entry.count++;
    const after = scene.slice(index + name.length, index + name.length + 32);
    if (!sentenceInitial(scene, index)) {
      // Mid-sentence capitals are names — except places ("in Florida", "down Fifth").
      if (!PLACE_PREPOSITION_RE.test(scene.slice(Math.max(0, index - 12), index))) entry.evidence = true;
    } else if (/^['’]s\b|^,\s/.test(after)) {
      entry.evidence = true; // "Maria's hands", "Maria, soaked, …"
    } else {
      // Sentence-initial and acting like a person ("Kai sprints"), unless it's a common noun ("Church bells ring")
      // or also used in lower case elsewhere.
      const m = after.match(/^(?:\s*\([^)]*\))?\s+([a-z]+)\b(?:\s+([a-z]+))?/);
      const next = m?.[1];
      const lower = name.toLowerCase();
      // "Nora lights a cigarette" acts; "Brake lights glow" is a compound noun: an "-s" word that can be a plural
      // noun only counts as a verb when an object, particle or the end of the sentence follows it.
      const verb = next !== undefined && /(?:s|ed)$/.test(next) && (!PLURAL_NOUNS.has(next) || m?.[2] === undefined || VERB_FOLLOWERS.has(m[2]));
      if (verb && !COMMON_NOUNS.has(lower) && !new RegExp(`\\b${lower}\\b`).test(scene)) entry.evidence = true;
    }
    counts.set(name, entry);
  }
  const names = [...counts.entries()]
    .filter(([, e]) => e.evidence)
    .sort((a, b) => b[1].count - a[1].count || a[1].first - b[1].first)
    .map(([n]) => n)
    .slice(0, 3);

  const roles: string[] = [];
  for (const m of scene.matchAll(ROLE_NOUN_RE)) {
    const noun = m[2].toLowerCase();
    const index = m.index ?? 0;
    // A generic role usually describes a named character ("Maria, a woman in her forties") — unless it's the subject
    // of its own sentence ("A woman in a red coat stops at the crosswalk").
    if (names.length > 0 && GENERIC_ROLES.has(noun) && !sentenceInitial(scene, index)) continue;
    // "Tom, her father," describes a named character.
    const before = scene.slice(Math.max(0, index - 24), index);
    if (/\b[A-Z][a-z]+(?:\s*\([^)]*\))?,\s*$/.test(before)) continue;
    const role = `the ${noun}`;
    if (!roles.includes(role)) roles.push(role);
  }
  return [...names, ...roles].slice(0, 3);
}

/** Common, clearly gendered first names (unisex names like Sam, Alex or Jordan are left out on purpose). */
const FEMALE_NAMES = new Set(
  (
    "Mary Maria Mara Marie Anna Ana Anne Hannah Sarah Sara Emma Emily Olivia Sophia Sofia Isabella Mia Ava Amelia Charlotte Grace " +
    "Lily Chloe Zoe Ella Nora Leah Lucy Lena Nadia Maya Mira Nina Rosa Rose Clara Alice Helen Elena Eva Eve Julia Laura Linda Susan " +
    "Karen Lisa Nancy Margaret Martha Ruth Esther Rachel Rebecca Naomi Miriam Judith Diana Delia Irene Iris Ivy Jane Janet Jenny " +
    "Jennifer Jessica Kate Katie Claire Fiona Amy Beth Ellen Ingrid Greta Priya Aisha Fatima Yasmin Leila Layla Mei Yuki Keiko " +
    "Carmen Lucia Paula Monica Veronica Sylvia Tessa Vera Wendy Abby Abigail Ada Agnes Bella Carla Carol Cora Daisy Dora Edith " +
    "Elsa Freya Gwen Hazel Ida Isla Jade Joan June Lara Lila Mabel Maggie Megan Molly Nell Olga Penny Polly Ruby Sally Stella " +
    "Tara Viola Violet Yara Zara Elise Eliza Elizabeth Beatrice Harriet Imogen Josephine Louise Lydia Natalie Natasha Olive Phoebe " +
    "Sadie Talia Theresa Ursula Victoria Mariam Amara Ines Marta Magda Hana Noor Rania Sana Anya Katya Irina Svetlana"
  ).split(" "),
);
const MALE_NAMES = new Set(
  (
    "John James Jack Jacob Michael David Daniel Samuel Thomas Tom Tommy William Will Henry Harry George Charles Joseph Joe Leo " +
    "Liam Noah Oliver Ethan Lucas Mason Logan Owen Jonas Jonah Marco Mario Carlos Diego Juan Luis Miguel Pedro Pablo Rafael Omar " +
    "Ali Ahmed Hassan Ibrahim Karim Ravi Arjun Raj Hiro Kenji Takeshi Ivan Dmitri Sergei Pavel Anton Viktor Hans Klaus Peter Paul " +
    "Mark Luke Matthew Andrew Adam Ben Benjamin Frank Fred Gary Greg Harold Hugo Ian Isaac Jake Jason Jim Jimmy Joel Kevin Larry " +
    "Leon Martin Max Nathan Nick Oscar Patrick Ray Richard Rick Robert Bob Roger Ron Ryan Scott Sean Simon Steve Steven Ted Tim " +
    "Tony Victor Vincent Walter Arthur Albert Alfred Eddie Edward Elliot Felix Finn Gabriel Gus Hank Jasper Kurt Lars Milo Neil " +
    "Otto Rex Rory Seth Silas Theo Toby Tyler Wade Zach Caleb Eli Elijah Ezra Levi Malik Tariq Yusuf Dev Vikram Sanjay Tomas " +
    "Mateo Santiago Andre Bruno Emil Erik Fabio Luca Nico Stefan Sven Marcus Julian Adrian Dominic Hector Javier Kofi"
  ).split(" "),
);

/**
 * Which characters are "she" and which "he", from the scene itself: role
 * nouns ("the father"), appositives ("SAM (60s), her father") and a pronoun
 * opening the sentence after one that names a single character.
 */
function characterGenders(scene: string, units: SceneUnit[], characters: string[]): Map<string, "she" | "he"> {
  const votes = new Map<string, { she: number; he: number }>();
  const vote = (name: string, g: "she" | "he", weight = 1) => {
    const v = votes.get(name) ?? { she: 0, he: 0 };
    v[g] += weight;
    votes.set(name, v);
  };
  for (const c of characters) {
    const role = genderOf(c);
    if (role) vote(c, role, 10);
    const given = /^the\s/i.test(c) ? null : c.split(" ")[0];
    if (given && FEMALE_NAMES.has(given)) vote(c, "she", 4);
    else if (given && MALE_NAMES.has(given)) vote(c, "he", 4);
    const first = c.replace(/^the\s+/i, "").split(" ")[0];
    const appositive = scene.match(new RegExp(String.raw`\b${first}\b(?:\s*\([^)]*\))?,\s*(?:her|his|their|the|a|an)\s+(?:\w+\s+)?(\w+)`, "i"));
    const appositiveGender = appositive ? genderOf(appositive[1]) : null;
    if (appositiveGender) vote(c, appositiveGender, 5);
  }
  for (let i = 0; i < units.length; i++) {
    const named = namesIn(units[i].text, characters);
    const subject = named.length === 1 ? named[0] : null;
    if (!subject) continue;
    const next = units[i + 1];
    const pronoun = next && next.kind === "action" ? next.text.match(LEADING_PRONOUN_RE)?.[1].toLowerCase() : undefined;
    // "Nadia wipes the counter. She…" is a strong cue; after a role with no gender ("The suspect does not look up. He
    // slides a photo…") the pronoun is as likely to be the other person, so it only counts when there is no other.
    if (pronoun && namesIn(next.text, characters).length === 0 && (!/^the\s/i.test(subject) || characters.length === 1)) {
      vote(subject, pronoun as "she" | "he", 2);
    }
    // "Maria stares at her phone": a possessive after the only name in the sentence.
    const after = units[i].text.slice(units[i].text.search(new RegExp(`\\b${subject.replace(/^the\s+/i, "").split(" ")[0]}\\b`, "i")));
    if (/\b(her|herself)\b/i.test(after) && !/\b(his|him|himself)\b/i.test(after)) vote(subject, "she", 0.5);
    else if (/\b(his|him|himself)\b/i.test(after) && !/\b(her|herself)\b/i.test(after)) vote(subject, "he", 0.5);
  }
  const genders = new Map<string, "she" | "he">();
  for (const [name, v] of votes) if (v.she !== v.he) genders.set(name, v.she > v.he ? "she" : "he");
  return genders;
}

const PLACE_WORDS = [
  "kitchen", "living room", "bedroom", "bathroom", "hallway", "office", "diner", "bar", "car", "truck", "bus", "train", "station",
  "platform", "street", "alley", "rooftop", "roof", "beach", "shore", "forest", "woods", "field", "farm", "barn", "church",
  "hospital", "ward", "classroom", "school", "gym", "warehouse", "garage", "apartment", "motel", "hotel room", "elevator",
  "stairwell", "lighthouse", "boat", "ship", "deck", "harbour", "harbor", "dock", "cabin", "tent", "desert", "mountain", "lake",
  "river", "bridge", "parking lot", "restaurant", "cafe", "café", "library", "courtroom", "cell", "prison", "lab", "studio",
  "theatre", "theater", "backstage", "stage", "crosswalk", "corner", "sidewalk", "pavement", "intersection", "square", "plaza",
  "park", "subway", "market", "porch", "yard", "backyard", "garden", "cemetery", "graveyard", "airport", "terminal", "gas station",
  "supermarket", "laundromat", "pier", "boardwalk", "highway", "bus stop", "taxi", "cab", "interrogation room", "waiting room",
  "dining room", "hospital room", "motel room", "attic", "basement", "cellar",
];
// Longest first, so "bus stop" wins over "bus" and "hotel room" over "hotel".
const PLACE_RE = new RegExp(String.raw`\b(${[...PLACE_WORDS].sort((a, b) => b.length - a.length).join("|")})\b`, "gi");
const EXTERIOR_PLACE_RE =
  /street|alley|rooftop|roof|beach|shore|forest|woods|field|farm|desert|mountain|lake|river|bridge|parking lot|dock|harbou?r|deck|crosswalk|corner|sidewalk|pavement|intersection|square|plaza|park|porch|yard|garden|cemetery|graveyard|pier|boardwalk|highway|bus stop/i;

function parseScene(scene: string): ParsedScene {
  const read = readScreenplay(scene);
  let { location, time, exterior } = read;
  const { units, cueNames } = read;

  let characters: string[];
  if (cueNames.length > 0) {
    // Order by first appearance anywhere in the scene (action lines introduce people before they speak).
    const lower = scene.toLowerCase();
    characters = [...cueNames].sort((a, b) => lower.indexOf(a.toLowerCase()) - lower.indexOf(b.toLowerCase()));
  } else {
    characters = proseCharacters(scene);
  }
  if (characters.length === 0) {
    // "She walks into the kitchen…": nobody is named, but the pronouns still say who's there.
    for (const u of units) {
      const p = u.kind === "action" ? u.text.match(LEADING_PRONOUN_RE)?.[1].toLowerCase() : undefined;
      const who = p === "she" ? "the woman" : p === "he" ? "the man" : null;
      if (who && !characters.includes(who)) characters.push(who);
    }
  }

  if (!location) {
    // Prefer the place people are *in* ("at the crosswalk") over a landmark they pass ("past the church").
    let best: { word: string; score: number; index: number } | null = null;
    for (const m of scene.matchAll(PLACE_RE)) {
      const before = scene.slice(Math.max(0, (m.index ?? 0) - 16), m.index).toLowerCase();
      // "Church bells ring", "car keys": a place word modifying another noun isn't where the scene is.
      const next = scene.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 16).match(/^\s+([a-z]+)/i)?.[1]?.toLowerCase();
      if (next && PLURAL_NOUNS.has(next)) continue;
      const score = /\b(in|inside|into|at|on|across|through|onto|by|beside)\s+(the|a|an|his|her|their|our|my)?\s*$/.test(before)
        ? 2
        : /\b(past|near|beyond|toward|towards|behind|outside|from|of|above|below|over)\s+(the|a|an|his|her|their|our|my)?\s*$/.test(before)
          ? -1
          : 0;
      if (!best || score > best.score) best = { word: m[1], score, index: m.index ?? 0 };
    }
    if (best && best.score >= 0) {
      location = titleCase(best.word);
      exterior = EXTERIOR_PLACE_RE.test(best.word);
    }
  }
  if (!time) {
    const when = scene.match(/\b(night|midnight|dawn|dusk|sunset|sunrise|morning|afternoon|evening|twilight|\d{1,2}\s?(?:am|pm|a\.m\.|p\.m\.))\b/i);
    time = when ? when[1].toLowerCase() : null;
  }

  const genders = characterGenders(scene, units, characters);
  return { location, place: location ? `the ${location.toLowerCase()}` : "the location", time, exterior, characters, genders, units };
}

const OBJECT_TERMS = [
  "letter", "phone", "photo", "photograph", "ring", "key", "keys", "gun", "knife", "glass", "cup", "mug", "door", "clock",
  "watch", "note", "envelope", "bottle", "map", "box", "bag", "cigarette", "badge", "ticket", "necklace", "cards", "money",
  "cash", "blood", "book", "diary", "journal", "file", "folder", "pills", "wallet", "lighter", "candle", "window", "mirror",
  "suitcase", "camera", "tape", "screen", "laptop", "coin", "flower", "flowers", "plate", "table", "hand", "hands", "pen",
  "contract", "passport", "gift", "shoe", "shoes", "helmet", "radio", "lamp", "message", "text", "coffee", "photograph",
];
/** Object words that are also verbs ("bells ring", "they watch", "she notes"): they only count after a determiner. */
const VERBISH_OBJECTS = new Set(["ring", "watch", "note", "file", "tape", "text", "screen", "box", "bag", "map", "hand", "hands", "cards", "plate", "book", "lamp"]);
const verbishNounRe = new Map<string, RegExp>();

/** The props a line mentions, skipping object words used as verbs ("Church bells ring" has no ring in it). */
function objectsIn(text: string): string[] {
  return hits(text, OBJECT_TERMS).filter((o) => {
    if (!VERBISH_OBJECTS.has(o)) return true;
    let re = verbishNounRe.get(o);
    if (!re) {
      re = new RegExp(String.raw`\b(?:a|an|the|his|her|their|my|our|its|this|that|your|one|two|each|every|no)\s+(?:[a-z'’-]+\s+){0,2}${o}\b`, "i");
      verbishNounRe.set(o, re);
    }
    return re.test(text);
  });
}

/** Everyday nouns that open sentences in scene description; capitalised there, they still aren't names. */
const COMMON_NOUNS = new Set<string>([
  ...PLACE_WORDS.filter((w) => !w.includes(" ")),
  ...OBJECT_TERMS,
  ...ROLE_NOUNS.split("|").map((r) => r.replace(/\W/g, "")),
  ...[...SCENE_NOUNS].map((n) => n.toLowerCase()),
  "bells", "doors", "door", "engine", "sirens", "morning", "night", "evening", "dawn", "dusk", "sun", "moon", "sky", "wind",
]);
const HANDLING_TERMS = ["picks up", "holds", "reads", "opens", "slides", "places", "finds", "pulls out", "hands", "grips", "clutches", "unfolds", "drops", "pockets", "sets down", "turns over", "lights", "pours", "writes", "signs", "tears", "hides", "puts"];
const LOOK_TERMS = ["looks at", "sees", "watches", "stares at", "glances at", "notices", "spots", "studies"];
const TURN_STRONG = [
  "realizes", "realises", "understands", "decides", "recognizes", "recognises", "knows", "breaks down", "cries", "starts to cry",
  "begins to cry", "starts crying", "bursts into tears", "weeps", "sobs", "laughs", "starts to laugh", "smiles", "gasps",
];
/** A closing line with one of these ends on a face. */
const CLOSING_FACE_TERMS: readonly string[] = [...LEXICON.emotion, ...TURN_STRONG];
const TURN_WEAK = ["freezes", "stops", "hesitates", "stares", "silence", "beat", "pause", "tears", "swallows", "breath", "breathes", "finally", "slowly"];
const POWER_TERMS = ["towers", "looms", "stands over", "orders", "commands", "threatens", "grabs", "demands", "corners", "blocks", "steps closer", "leans in", "glares", "points the gun", "raises the gun"];
const VULNERABLE_TERMS = ["alone", "shrinks", "cowers", "collapses", "kneels", "sinks", "curls", "trembles", "slumps", "falls to"];
const CHAOS_TERMS = ["runs", "chase", "chases", "crash", "crashes", "fight", "fights", "struggle", "struggles", "explodes", "screams", "scrambles", "shoves", "bursts", "smashes", "races", "lunges", "flees", "tackles", "sprints"];
const MOVE_TERMS = ["walks", "crosses", "enters", "follows", "drives", "paces", "climbs", "approaches", "wanders", "arrives", "heads"];
const DISORIENT_TERMS = ["dizzy", "drunk", "spins", "nightmare", "blur", "blurs", "woozy", "reels", "sways"];
const READING_TERMS = ["reads", "writes", "signs"];
const PAUSE_TERMS = ["silence", "beat", "pause"];
const FOLLOW_TERMS = ["follows", "wanders", "paces"];
const DEPART_TERMS = ["leaves", "walks away", "walks out", "exits", "door closes", "drives off", "drives away", "is gone", "disappears", "shuts the door", "turns away", "storms out"];

const SOUND_CUES: { terms: string[]; sound: string; ambient: boolean }[] = [
  { terms: ["knock", "knocks", "knocking"], sound: "The knock — dry and a beat too loud, before we see who it is", ambient: false },
  { terms: ["slam", "slams"], sound: "The slam, hard and close, then a ringing silence", ambient: false },
  { terms: ["buzzes", "vibrates", "rings", "ringing"], sound: "The phone buzz, intrusive against the room tone", ambient: false },
  { terms: ["rain"], sound: "Rain on the glass — a steady bed that can swell or drop out", ambient: true },
  { terms: ["thunder", "storm"], sound: "Distant thunder, timed to the emotional peak", ambient: true },
  { terms: ["gunshot", "fires"], sound: "The shot, then a high-frequency ring as the world drops out", ambient: false },
  { terms: ["whisper", "whispers"], sound: "Whispered dialogue, miked close so we lean in", ambient: false },
  { terms: ["clock", "ticking"], sound: "The clock's tick, rising in the mix as tension builds", ambient: true },
  { terms: ["footsteps"], sound: "Footsteps, their rhythm matching the tension", ambient: false },
  { terms: ["shatters", "smashes"], sound: "Glass breaking, crisp and unmusical", ambient: false },
  { terms: ["engine", "traffic"], sound: "Engine idle, a low hum under the scene", ambient: true },
  { terms: ["waves", "surf", "ocean"], sound: "Surf and wind, pushed forward between lines", ambient: true },
  { terms: ["siren", "sirens"], sound: "A siren passing in the distance, unanswered", ambient: true },
  { terms: ["creak", "creaks"], sound: "A floorboard creak that tells us someone's there", ambient: false },
  { terms: ["music", "radio", "song", "jukebox"], sound: "Source music that cuts out on the turn", ambient: true },
  { terms: ["pours"], sound: "The pour, close and unhurried — the only sound in the room", ambient: false },
  { terms: ["silence", "silent", "quiet"], sound: "Near-silence: let the room tone carry it", ambient: false },
  { terms: ["scream", "screams"], sound: "The scream, clipped hard by the cut", ambient: false },
];

function soundFor(text: string, ambientOnly = false): string {
  for (const cue of SOUND_CUES) {
    if (ambientOnly && !cue.ambient) continue;
    if (hits(text, cue.terms).length > 0) return cue.sound;
  }
  return "";
}

function ambientFor(scene: ParsedScene, opening: string): string {
  const specific = soundFor(opening, true);
  if (specific) return specific;
  const loc = (scene.location ?? "").toLowerCase();
  if (/sea|beach|shore|lighthouse|harbou?r|dock|boat|ship|deck/.test(loc)) return "Surf and wind — the world outside pressing in";
  if (/street|alley|city|parking|rooftop/.test(loc)) return "Distant traffic and city hum";
  if (/forest|woods|field|farm|mountain|lake|river/.test(loc)) return "Wind through trees, insects, one distant bird";
  if (/kitchen/.test(loc)) return "Fridge hum and a dripping tap — domestic room tone";
  if (/car|truck|bus|train/.test(loc)) return "Road noise and the engine's low drone";
  if (/bar|diner|restaurant|cafe|café/.test(loc)) return "Fluorescent hum and a far-off kitchen clatter, kept low";
  if (scene.time && /night|midnight|\dam|\d am/.test(scene.time)) return "Night ambience — a far-off dog, the building settling";
  return "Room tone plus one specific sound that defines the place";
}

const LENS_FOR_SIZE: Record<ShotSize, string> = {
  "extreme-wide": "16mm wide",
  wide: "24mm",
  full: "28mm",
  "medium-wide": "32mm",
  medium: "35mm",
  "medium-close-up": "50mm",
  "close-up": "85mm portrait",
  "extreme-close-up": "100mm macro",
};

interface ShotDraft extends Omit<Shot, "number" | "lens"> {
  lens?: string;
}

/**
 * An action line that continues the previous subject without naming it:
 * "Kneels.", "Digs.", "Doesn't touch them." — a verb first, not a noun
 * ("Waves roll in", "Stalls explode").
 */
function continuesSubject(text: string): boolean {
  const first = text.match(/^(?:([Dd]oesn['’]t|[Dd]oes not|[Dd]idn['’]t|[Cc]an['’]t|[Ww]on['’]t)\b|([A-Z][a-z]+s)\b(?![',’]))/);
  if (!first) return false;
  if (first[1]) return true;
  const word = first[2].toLowerCase();
  return !COMMON_NOUNS.has(word) && !PLURAL_NOUNS.has(word) && !NAME_STOPWORDS.has(first[2]) && !SCENE_NOUNS.has(first[2]);
}

/** A subject pronoun opening an action, perhaps after a short lead-in: "She…", "For a moment he…", "Then, slowly, they…". */
const LEADING_PRONOUN_RE =
  /^(?:(?:for a (?:moment|second|beat|long moment)|then|now|slowly|suddenly|finally|still|again|at last|once more|without a word|then,? slowly)\s*,?\s+)?(she|he|they)\b/i;

function namesIn(text: string, characters: string[]): string[] {
  return characters.filter((c) => new RegExp(`\\b${c.replace(/^the\s+/i, "").split(" ")[0]}\\b`, "i").test(text));
}

function turnScore(unit: SceneUnit): number {
  return hits(unit.text, TURN_STRONG).length * 3 + hits(unit.text, TURN_WEAK).length + hits(unit.text, LEXICON.emotion).length;
}

function unitImportance(unit: SceneUnit): number {
  const t = unit.text;
  return (
    turnScore(unit) +
    objectsIn(t).length * (hits(t, HANDLING_TERMS).length > 0 ? 1.5 : 0.25) +
    hits(t, POWER_TERMS).length +
    hits(t, CHAOS_TERMS).length +
    hits(t, VULNERABLE_TERMS).length +
    hits(t, DEPART_TERMS).length * 1.5 +
    (unit.kind === "dialogue" && t.includes("?") ? 1 : 0) +
    (unit.kind === "dialogue" ? 0.75 : 0)
  );
}

interface CoverageState {
  twoShotDone: boolean;
  lastSubject: string;
  lastSpeaker: string | null;
  turnIndex: number;
  /** Characters by most recent mention, for resolving "she"/"he". */
  recent: string[];
  /** Who said the previous unit, when it was a line of dialogue (unattributed lines in prose alternate). */
  previousLineBy: string | null;
}

/**
 * Who "she"/"he" most likely is: the most recently mentioned character with
 * that pronoun; else, by elimination, the only character whose pronoun isn't
 * known (or the only character at all). When it's still ambiguous the subject
 * stays generic ("the woman") rather than guessing — pinning a line on the
 * wrong person is worse than not naming one.
 */
function resolvePronoun(pronoun: string, scene: ParsedScene, state: CoverageState, exclude: readonly string[] = []): string {
  const p = pronoun.toLowerCase();
  if (p !== "she" && p !== "he") return state.lastSubject;
  const pool = [...state.recent, ...scene.characters.filter((c) => !state.recent.includes(c))].filter((c) => !exclude.includes(c));
  const match = pool.find((c) => scene.genders.get(c) === p);
  if (match) return match;
  const unknown = scene.characters.filter((c) => !scene.genders.has(c) && !exclude.includes(c));
  if (unknown.length === 1) return unknown[0];
  return p === "she" ? "the woman" : "the man";
}

/** The character a unit is about: its speaker, the attributed speaker, the first name in it, or whoever its pronoun points to. */
function unitSubject(unit: SceneUnit, scene: ParsedScene, state: CoverageState): string {
  if (unit.speaker) return unit.speaker;
  const hint = unit.speakerHint;
  if (hint) {
    const known = scene.characters.find((c) => c.toLowerCase() === hint.toLowerCase());
    if (known) return known;
    if (/^(she|he)$/i.test(hint)) return resolvePronoun(hint, scene, state);
  }
  // An unattributed line straight after another is the other person's reply.
  if (unit.kind === "dialogue" && state.previousLineBy && scene.characters.length >= 2) {
    const reply = [...state.recent, ...scene.characters].find((c) => c !== state.previousLineBy && scene.characters.includes(c));
    if (reply) return reply;
  }
  const named = namesIn(unit.text, scene.characters);
  const pronoun = unit.text.match(LEADING_PRONOUN_RE)?.[1];
  // "She offers one to Beth": the pronoun is the subject, and it isn't Beth.
  if (pronoun && unit.kind === "action") return resolvePronoun(pronoun, scene, state, named);
  if (named.length > 0 && unit.kind === "action") return named[0];
  if (pronoun) return resolvePronoun(pronoun, scene, state);
  if (unit.kind === "action" && named.length === 0 && continuesSubject(unit.text)) return state.lastSubject;
  return named[0] ?? state.lastSubject;
}

/** Record who the unit was about, so the next "she"/"he" resolves to the right person. */
function noteMentions(unit: SceneUnit, subject: string, scene: ParsedScene, state: CoverageState) {
  const lower = unit.text.toLowerCase();
  const byLastMention = namesIn(unit.text, scene.characters).sort(
    (a, b) => lower.lastIndexOf(b.replace(/^the\s+/i, "").split(" ")[0].toLowerCase()) - lower.lastIndexOf(a.replace(/^the\s+/i, "").split(" ")[0].toLowerCase()),
  );
  const pronounLed = /^(?:she|he)$/i.test(unit.text.match(LEADING_PRONOUN_RE)?.[1] ?? "");
  const mentioned = unit.speaker || pronounLed ? [subject, ...byLastMention] : [...byLastMention, subject];
  state.recent = [...new Set([...mentioned, ...state.recent])];
  if (unit.speaker) state.lastSpeaker = unit.speaker;
  state.previousLineBy = unit.kind === "dialogue" ? subject : null;
  if (unit.speaker || byLastMention.length > 0 || pronounLed || unit.speakerHint) state.lastSubject = subject;
}

function shotForUnit(unit: SceneUnit, index: number, scene: ParsedScene, state: CoverageState): ShotDraft {
  const t = unit.text;
  const chars = scene.characters;
  const named = namesIn(t, chars);
  const pronounStart = LEADING_PRONOUN_RE.test(t) || (unit.kind === "action" && named.length === 0 && continuesSubject(t));
  const subject = unitSubject(unit, scene, state);
  const action = unit.kind === "dialogue" ? `${unit.speaker ? `${unit.speaker}: ` : ""}"${truncateWords(t, 18)}"` : truncateWords(t, 22);
  const objects = objectsIn(t).filter((o) => !["hand", "hands", "table", "text"].includes(o));
  const base = { subject, action, sound: unit.kind === "dialogue" ? "" : soundFor(t) };
  const isTurn = index === state.turnIndex;
  const other = chars.find((c) => c !== subject) ?? null;

  if (unit.kind === "action" && objects.length > 0 && hits(t, HANDLING_TERMS).length > 0 && !isTurn) {
    return {
      ...base,
      size: "extreme-close-up",
      framing: "insert",
      angle: hits(t, READING_TERMS).length > 0 ? "overhead" : "eye-level",
      movement: "static",
      subject: `The ${objects[0]}`,
      purpose: `Make the ${objects[0]} a character — the audience has to register it before it matters.`,
    };
  }
  if (isTurn) {
    return {
      ...base,
      size: "close-up",
      framing: "single",
      angle: "eye-level",
      movement: "push-in",
      lens: "85mm on a slow dolly",
      purpose: `The turn of the scene: push in on ${subject} as it lands. This is the shot the scene is built around — give it time.`,
    };
  }
  if (unit.kind === "action" && hits(t, LOOK_TERMS).length > 0) {
    return {
      ...base,
      size: objects.length > 0 ? "close-up" : "medium-close-up",
      framing: "pov",
      angle: "eye-level",
      movement: "static",
      subject: objects.length > 0 ? `The ${objects[0]}, from ${subject}'s eyeline` : `What ${subject} sees`,
      purpose: `Put us behind ${subject}'s eyes so we discover it at the same moment.`,
    };
  }
  if (hits(t, TURN_WEAK).length > 0 && (unit.kind === "dialogue" || named.length > 0 || pronounStart || hits(t, PAUSE_TERMS).length > 0)) {
    // A pause or hesitation: hold it on the face of whoever is absorbing the moment.
    const reactor =
      unit.kind === "action" && named.length === 0 && !pronounStart && state.lastSpeaker
        ? chars.find((c) => c !== state.lastSpeaker) ?? subject
        : subject;
    return {
      ...base,
      subject: reactor,
      size: "close-up",
      framing: "single",
      angle: "eye-level",
      movement: "static",
      purpose: `Hold the pause on ${reactor}'s face — what isn't said is the scene.`,
    };
  }
  if (unit.kind === "action" && named.length === 0 && !pronounStart) {
    // No character in the sentence: an atmospheric cutaway.
    const thing = objects[0];
    return {
      ...base,
      size: thing ? "close-up" : "medium-wide",
      framing: "insert",
      angle: "eye-level",
      movement: "static",
      subject: thing ? `The ${thing}` : "Cutaway",
      purpose: "A cutaway that builds atmosphere and gives the edit somewhere to breathe between faces.",
    };
  }
  if (unit.kind === "action" && hits(t, DISORIENT_TERMS).length > 0) {
    return { ...base, size: "medium-close-up", framing: "single", angle: "dutch", movement: "handheld", purpose: `Tilt the world off its axis — we feel ${subject}'s disorientation physically.` };
  }
  if (unit.kind === "action" && hits(t, CHAOS_TERMS).length > 0) {
    return { ...base, size: "medium-wide", framing: named.length > 1 ? "two-shot" : "single", angle: "eye-level", movement: "handheld", lens: "28mm handheld", purpose: "Break the scene's composure — handheld energy makes the chaos immediate." };
  }
  if (unit.kind === "action" && hits(t, POWER_TERMS).length > 0) {
    return { ...base, size: "medium", framing: "single", angle: "low", movement: "static", purpose: `Shoot up at ${subject} so the power shift registers before anyone names it.` };
  }
  if (unit.kind === "action" && hits(t, DEPART_TERMS).length > 0) {
    return { ...base, size: "full", framing: "single", angle: "eye-level", movement: "static", purpose: `Hold the frame and let ${subject} walk out of it — an exit the camera refuses to follow says as much as a line.` };
  }
  if (unit.kind === "action" && hits(t, VULNERABLE_TERMS).length > 0) {
    return { ...base, size: "medium-wide", framing: "single", angle: "high", movement: "static", purpose: `Look down on ${subject} — the frame itself makes them small.` };
  }
  if (unit.kind === "action" && hits(t, MOVE_TERMS).length > 0) {
    return { ...base, size: "full", framing: "single", angle: "eye-level", movement: hits(t, FOLLOW_TERMS).length > 0 ? "steadicam" : "tracking", lens: "32mm on a gimbal", purpose: `Move with ${subject} so the blocking carries the story — we travel the space with them.` };
  }
  if (unit.kind === "dialogue") {
    if (!state.twoShotDone && chars.length >= 2) {
      state.twoShotDone = true;
      return { ...base, size: "medium", framing: "two-shot", angle: "eye-level", movement: "static", subject: `${chars[0]} and ${chars[1]}`, purpose: "Establish the relationship and the distance between them before we isolate either one." };
    }
    if (other) {
      const tight = unitImportance(unit) >= 1.75;
      return {
        ...base,
        size: tight ? "close-up" : "medium-close-up",
        framing: tight ? "single" : "over-the-shoulder",
        angle: "eye-level",
        movement: "static",
        subject: tight ? subject : `${subject}, over ${other}'s shoulder`,
        purpose: tight
          ? `Tighter now: the words matter less than what ${subject}'s face does while saying them.`
          : `Keep both people connected in the frame while ${subject} pushes for what they want.`,
      };
    }
    return { ...base, size: "medium", framing: "single", angle: "eye-level", movement: "static", purpose: `Let ${subject}'s performance carry the line without the camera commenting.` };
  }
  return { ...base, size: "medium-wide", framing: "single", angle: "eye-level", movement: "static", purpose: `Hold on ${subject}'s behaviour in the space — let the action play in one piece.` };
}

/** Physical action: a chase, a fight, a fall. Two or more of these make a scene kinetic. */
const KINETIC_TERMS = [
  "runs", "run", "sprints", "sprint", "chase", "chases", "chased", "leaps", "leap", "jumps", "jump", "races", "bursts", "burst",
  "fight", "fights", "punches", "tackles", "lunges", "flees", "dives", "crashes", "explodes", "explosion", "gunfire", "shots",
  "scrambles", "vaults", "climbs", "falls", "slams", "smashes", "swerves", "speeds",
];
const KINETIC_INTENT_TERMS = ["kinetic", "action", "chase", "adrenaline", "frantic", "breathless", "propulsive", "urgent", "fast"];

/** How the audience should feel, by mood, when the director hasn't said. */
const DEFAULT_INTENT: Record<string, { lead: string; tail: string }> = {
  tense: { lead: "Rising dread", tail: "the audience should feel something is wrong before anyone names it" },
  eerie: { lead: "Unease", tail: "the audience should feel watched — the space itself is the threat" },
  melancholy: { lead: "Grief held back", tail: "the audience should feel the loss in what goes unsaid" },
  tender: { lead: "Tenderness", tail: "the audience should lean in and feel the closeness grow" },
  comic: { lead: "Comic timing", tail: "the audience should see the joke coming a beat before the characters do" },
  kinetic: { lead: "Momentum", tail: "the audience should feel the pace build, shot by shot, with no room to breathe" },
  restrained: { lead: "Quiet pressure", tail: "the audience should sense what's unspoken before anyone says it" },
};

const TENSE_MOOD = ["tense", "tension", "thriller", "paranoid", "suspense", "claustrophobic", "dread", "menace", "threat", "anxious", "secret"];
const EERIE_MOOD = ["horror", "creepy", "haunted", "eerie", "unsettling"];
const MELANCHOLY_MOOD = ["grief", "loss", "mourning", "sad", "melancholy", "funeral", "lonely", "alone"];
const TENDER_MOOD = ["tender", "warm", "nostalgic", "love", "intimate", "gentle", "romantic", "hopeful", "kindness"];
const COMIC_MOOD = ["comedy", "comic", "funny", "deadpan", "absurd", "farce"];
const MOOD_TERMS = [...TENSE_MOOD, ...EERIE_MOOD, ...MELANCHOLY_MOOD, ...TENDER_MOOD, ...COMIC_MOOD];

function visualConceptFor(scene: ParsedScene, intent: string, allText: string): { concept: string; mood: string } {
  // The director's stated intent outranks whatever the scene's words suggest.
  const probe = hits(intent, MOOD_TERMS).length > 0 ? intent : `${intent} ${allText}`;
  let palette = "natural, slightly desaturated tones with one warm accent";
  let lighting = "soft, motivated light from a single source";
  let mood = "restrained";
  if (hits(probe, TENSE_MOOD).length > 0) {
    palette = "cool steel blues and greens broken by sodium-orange practicals";
    lighting = "low-key and hard from the side, with deep shadows the audience can't see into";
    mood = "tense";
  } else if (hits(probe, EERIE_MOOD).length > 0) {
    palette = "sickly greens against crushed blacks";
    lighting = "under-lit, with pools of darkness at the frame edges";
    mood = "eerie";
  } else if (hits(intent, KINETIC_INTENT_TERMS).length > 0 || (hits(intent, MOOD_TERMS).length === 0 && hits(allText, KINETIC_TERMS).length >= 2)) {
    palette = "high-contrast night colour — hard practicals, wet reflections, deep blacks";
    lighting = "hard and directional, with light sources that move through frame";
    mood = "kinetic";
  } else if (hits(probe, MELANCHOLY_MOOD).length > 0) {
    palette = "desaturated greys and slate blues with a single warm object in frame";
    lighting = "flat, overcast window light — no glamour";
    mood = "melancholy";
  } else if (hits(probe, TENDER_MOOD).length > 0) {
    palette = "warm ambers and faded greens";
    lighting = "soft, wrapped key light, golden where the story allows it";
    mood = "tender";
  } else if (hits(probe, COMIC_MOOD).length > 0) {
    palette = "clean, bright, slightly saturated colours";
    lighting = "high-key and even, so nothing competes with the timing";
    mood = "comic";
  } else if (scene.time && /night|midnight|dusk|twilight|\dam|\d am/.test(scene.time)) {
    palette = "inky blues with warm pools from practical lamps";
    lighting = "low-key, motivated by practicals in the frame";
  }
  const camera =
    mood === "kinetic"
      ? "Handheld and close inside the action, cut against locked-off wides that keep the geography clear; let the speed come from the cutting, not shaky framing."
      : mood === "tense"
      ? "Start composed and wide, then tighten as the pressure builds; save the only unmotivated move for the turn."
      : mood === "comic"
        ? "Mostly locked-off, symmetrical frames; let the cut and the performance land the jokes."
        : mood === "tender" || mood === "melancholy"
          ? "Patient, mostly static frames with generous headroom; move only when a feeling moves."
          : "Observational at first, tightening toward the turn; every camera move should be motivated by a character.";
  return { concept: `Palette: ${palette}. Lighting: ${lighting}. Camera: ${camera}`, mood };
}

function parseUserShots(raw: string): string[] {
  return raw
    .split(/\n|;|(?:^|\s)(?=\d{1,2}[.)]\s)/)
    .map((s) => s.replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s*/, "").trim())
    .filter((s) => words(s).length >= 2)
    .slice(0, 8);
}

/** Film-grammar words that say nothing about *what* is in frame, so they can't show two shots cover the same moment. */
const SHOT_GRAMMAR_WORDS = new Set([
  "shot", "shots", "close", "closeup", "wide", "medium", "extreme", "over", "shoulder", "insert", "angle", "camera", "tracking",
  "track", "push", "pull", "dolly", "handheld", "drone", "zoom", "pan", "tilt", "static", "frame", "framing", "lens", "slow",
  "establishing", "full", "long", "two", "single", "point", "view", "overhead", "high", "low", "eye", "level", "then", "from",
  "into", "onto", "with", "while", "when", "they", "their", "them", "this", "that", "scene", "moment",
]);

/** Kinds of moment that different wording can share ("leaves" / "walks out"). */
const MOMENT_CONCEPTS: readonly (readonly string[])[] = [DEPART_TERMS, LOOK_TERMS, HANDLING_TERMS.filter((t) => t !== "hands"), CHAOS_TERMS, TURN_STRONG];

/** Objects too generic to say what a shot is of ("hands" are in half the inserts). */
const IGNORED_OBJECTS = new Set(["hand", "hands", "text"]);

type ShotIdeaSubject = { kind: "character" | "object" | "place"; term: string };

/**
 * What a shot idea puts in frame: the first character, object or location it
 * names ("Over-the-shoulder of Daniel at the door" → Daniel; "Close-up on the
 * envelope as Tom slides it" → the envelope).
 */
function shotIdeaSubject(shot: string, scene: ParsedScene): ShotIdeaSubject | null {
  let best: (ShotIdeaSubject & { at: number }) | null = null;
  const consider = (kind: ShotIdeaSubject["kind"], term: string, key: string) => {
    const at = shot.search(new RegExp(String.raw`\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\b`, "i"));
    if (at >= 0 && (!best || at < best.at)) best = { kind, term, at };
  };
  for (const c of scene.characters) consider("character", c, c.replace(/^the\s+/i, "").split(" ")[0]);
  for (const o of hits(shot, OBJECT_TERMS)) if (!IGNORED_OBJECTS.has(o)) consider("object", o, o);
  for (const w of words(scene.location ?? "")) if (w.length > 3) consider("place", w, w);
  if (!best) return null;
  const { kind, term } = best;
  return { kind, term };
}

/** A shot idea's framing, from its size words: "ots", "insert", "pov", "two-shot", "wide", "close" or "medium". */
function ideaFraming(size: string | null): string | null {
  if (!size) return null;
  if (/over[- ]the[- ]shoulder|ots/.test(size)) return "ots";
  if (/insert/.test(size)) return "insert";
  if (/pov/.test(size)) return "pov";
  if (/two[- ]shot/.test(size)) return "two-shot";
  if (/wide|ws|establishing|long shot|full shot/.test(size)) return "wide";
  if (/close|cu|ecu|tight/.test(size)) return "close";
  return "medium";
}

function planFraming(shot: Shot): string {
  if (shot.framing === "over-the-shoulder") return "ots";
  if (shot.framing === "insert") return "insert";
  if (shot.framing === "pov") return "pov";
  if (shot.framing === "two-shot") return "two-shot";
  if (shot.framing === "establishing" || shot.size === "wide" || shot.size === "extreme-wide" || shot.size === "full") return "wide";
  if (shot.size === "close-up" || shot.size === "extreme-close-up") return "close";
  return "medium";
}

/**
 * The plan shot a writer's idea duplicates, if any. The idea's subject has to
 * be the plan shot's subject — the character or object it frames, not a noun
 * that happens to appear in its action ("Daniel at the door" isn't the insert
 * of the open door). Then either the framing matches (an over-the-shoulder
 * of Daniel and the plan's over-the-shoulder with Daniel in it) or the moment
 * does (shared action words, or the same kind of beat — an exit, a look).
 * A matching framing outweighs a shared word.
 */
function samePlanShot(shot: string, size: string | null, subject: ShotIdeaSubject, plan: Shot[], scene: ParsedScene): { shot: Shot; sameMoment: boolean } | null {
  const framing = ideaFraming(size);
  const nameWords = new Set(scene.characters.flatMap((c) => words(c)));
  const subjectWords = new Set(words(subject.term));
  const terms = new Set(words(shot).filter((w) => w.length > 3 && !SHOT_GRAMMAR_WORDS.has(w) && !nameWords.has(w) && !subjectWords.has(w)));
  const concepts = MOMENT_CONCEPTS.filter((c) => hits(shot, c).length > 0);
  let best: { shot: Shot; sameMoment: boolean; score: number } | null = null;
  for (const p of plan) {
    const framed =
      subject.kind === "character"
        ? namesIn(p.subject, [subject.term]).length > 0
        : subject.kind === "object"
          ? hits(p.subject, [subject.term]).length > 0
          : p.framing === "establishing" && words(p.subject).includes(subject.term);
    if (!framed) continue;
    const kind = planFraming(p);
    const framingMatch =
      framing !== null && (framing === kind || (subject.kind === "object" && (framing === "close" || framing === "insert") && (kind === "insert" || kind === "close")));
    const shared = new Set(words(p.action).filter((w) => terms.has(w))).size + concepts.filter((c) => hits(p.action, c).length > 0).length * 2;
    if (!framingMatch && shared === 0) continue;
    const score = (framingMatch ? 2 : 0) + shared * 1.5;
    if (!best || score > best.score) best = { shot: p, sameMoment: shared > 0, score };
  }
  return best ? { shot: best.shot, sameMoment: best.sameMoment } : null;
}

/** A prompt for a shot with no stated purpose — varied, so a list of ideas doesn't get the same sentence each time. */
function purposePrompt(index: number): string {
  const prompts = [
    "What's its job? Tie it to a beat — for example, \u201cto catch the hesitation before the answer\u201d.",
    "Say what it should make the audience feel or notice; that decides how long you hold it.",
    "Name the beat it serves — a reveal, a reaction, a shift in power — so the editor knows when to cut to it.",
    "Give it a reason in one line (\u201cso we see she's already decided\u201d); a shot without one is the first to go in the edit.",
  ];
  return prompts[index % prompts.length];
}

function feedbackForUserShot(shot: string, index: number, plan: Shot[], scene: ParsedScene): string {
  const lower = shot.toLowerCase();
  const notes: string[] = [];
  const size = lower.match(/\b(extreme close[- ]?up|ecu|close[- ]?up|close on|tight on|cu|medium close[- ]?up|mcu|medium wide|medium|mid shot|ms|wide|ws|establishing|full shot|long shot|two[- ]shot|insert|pov|over[- ]the[- ]shoulder|ots)\b/);
  const hasPurpose = /\b(to show|so we|so that|because|reveal|reveals|emphasi[sz]e|feel|tension|isolat|as|while|when)\b/.test(lower);
  const drone = /\bdrone\b/.test(lower);
  if (drone) {
    notes.push("A drone move is a big statement — make sure it's motivated by scale or isolation, not just coverage. A high static wide can carry the same idea for far less.");
  } else if (/\bzoom\b/.test(lower)) {
    notes.push("A zoom reads as self-aware. If you want intensity without comment, a slow dolly push-in feels more organic.");
  } else if (/\bhandheld\b/.test(lower)) {
    notes.push("Handheld injects urgency — reserve it for the moment the scene breaks, so the change in camera language means something.");
  } else if (/\b(dolly|push)\b/.test(lower)) {
    notes.push("A push-in is a strong choice; time it to the exact beat of realisation so the move feels like the character's thought.");
  } else if (/\b(tracking|steadicam|follow)\b/.test(lower)) {
    notes.push("Moving with the character builds momentum; plan where the move ends, because the final frame is what the audience remembers.");
  }
  if (!size && !drone) {
    notes.push("Name the shot size — as written it could be anything from a wide to a close-up, and the size is where the meaning lives.");
  } else if (size && /\b(extreme close|ecu|close|tight|cu|insert)\b/.test(size[1])) {
    const object = hits(shot, OBJECT_TERMS)[0];
    notes.push(
      object
        ? `Good instinct to isolate the ${object}. Pair it with a reaction close-up so its meaning lands on a face.`
        : "A close shot is where emotion lives — save it for the moment that earns it rather than using it as default coverage.",
    );
  } else if (size && /\b(over[- ]the[- ]shoulder|ots)\b/.test(size[1])) {
    notes.push("An over-the-shoulder keeps both people in the conversation; shoot its mirror from the other side so the eyelines cut together.");
  } else if (size && /\b(wide|ws|establishing|long shot|full shot)\b/.test(size[1])) {
    notes.push("A wide gives geography; decide whether it's here to orient us or to make a character look small — framing and lens differ for each.");
  }

  const subject = shotIdeaSubject(shot, scene);
  const match = subject ? samePlanShot(shot, size?.[1] ?? null, subject, plan, scene) : null;
  const shotNames = namesIn(shot, scene.characters);
  const shotObjects = hits(shot, OBJECT_TERMS).filter((o) => !IGNORED_OBJECTS.has(o));
  const locationWords = words(scene.location ?? "").filter((w) => w.length > 3);
  const anchored = shotNames.length > 0 || shotObjects.length > 0 || locationWords.some((w) => words(shot).includes(w));
  if (!hasPurpose && notes.length < 2) notes.push(purposePrompt(index));
  if (match?.sameMoment) {
    notes.push(`It covers the same moment as shot ${match.shot.number} in the plan (${SHOT_SIZE_INFO[match.shot.size].label.toLowerCase()}, ${match.shot.movement.replace("-", " ")}) — compare the two and keep whichever tells the story more clearly.`);
  } else if (match) {
    notes.push(`The plan already has this set-up: shot ${match.shot.number}, ${inSentence(match.shot.subject)} in ${SHOT_SIZE_INFO[match.shot.size].label.toLowerCase()} — keep one, or give yours a different beat to cover.`);
  } else if (!anchored && !drone) {
    notes.push("Anchor it to someone or something in the scene so the crew knows exactly what's in frame.");
  }
  return notes.slice(0, 3).join(" ");
}

/** Offline Shot Planner. */
export function demoShots(req: Pick<ShotsRequest, "scene" | "intent" | "userShots">): ShotPlan {
  const scene = parseScene(req.scene);
  const intent = req.intent?.trim() ?? "";
  const units: SceneUnit[] = scene.units.length > 0 ? scene.units : sentences(req.scene).map((s) => ({ kind: "action" as const, text: s }));
  const allText = units.map((u) => u.text).join(" ");
  const { concept, mood } = visualConceptFor(scene, intent, allText);
  const chars = scene.characters;
  const protagonist = chars[0] ?? "the protagonist";

  // The first action line belongs to the establishing shot; the last unit to the closing shot.
  const openingIndex = units.findIndex((u) => u.kind === "action" && namesIn(u.text, chars).length === 0);
  const establishingIndex = openingIndex === 0 ? 0 : -1;
  const closingIndex = units.length > 2 ? units.length - 1 : -1;
  const middle = units.map((unit, index) => ({ unit, index })).filter((u) => u.index !== establishingIndex && u.index !== closingIndex);

  // The turn: the strongest realisation beat, preferring the back half of the scene. A punchy line after a longer
  // one there ("Dead end.", "He leaps.") is the writer marking a beat with rhythm, so it counts too.
  // Only after someone is on screen: a push-in on a character who hasn't appeared yet has nothing to land on.
  const firstPresence = units.findIndex((u) => u.kind === "dialogue" || namesIn(u.text, chars).length > 0 || LEADING_PRONOUN_RE.test(u.text));
  const turnCandidates = firstPresence < 0 ? middle : middle.filter((m) => m.index >= firstPresence);
  let turnIndex = -1;
  let bestTurn = 0;
  for (const { unit, index } of turnCandidates) {
    const backHalf = index >= units.length / 2;
    const punch = backHalf && unit.kind === "action" && words(unit.text).length <= 3 && index > 0 && words(units[index - 1].text).length >= 6 ? 1.5 : 0;
    const score = turnScore(unit) + (backHalf ? 0.5 : 0) + punch;
    if (score > bestTurn) {
      bestTurn = score;
      turnIndex = index;
    }
  }
  if (turnIndex < 0 && turnCandidates.length > 0) turnIndex = turnCandidates[Math.floor(turnCandidates.length * 0.66)].index;

  const target = clamp(Math.round(units.length * 0.8) + 2, 6, 14);
  const middleBudget = target - 2;
  let chosen = middle;
  if (chosen.length > middleBudget) {
    const keep = new Set<number>();
    if (turnIndex >= 0) keep.add(turnIndex);
    const firstDialogue = chosen.find((c) => c.unit.kind === "dialogue");
    if (firstDialogue) keep.add(firstDialogue.index);
    const ranked = [...chosen].sort((a, b) => unitImportance(b.unit) - unitImportance(a.unit) || a.index - b.index);
    for (const c of ranked) {
      if (keep.size >= middleBudget) break;
      keep.add(c.index);
    }
    chosen = chosen.filter((c) => keep.has(c.index));
  }

  const state: CoverageState = { twoShotDone: false, lastSubject: protagonist, lastSpeaker: null, turnIndex, recent: [], previousLineBy: null };
  const drafts: ShotDraft[] = [];

  // 1. Establishing.
  const opening = establishingIndex === 0 ? units[0].text : "";
  drafts.push({
    size: scene.exterior ? "extreme-wide" : "wide",
    framing: "establishing",
    angle: scene.exterior ? "high" : "eye-level",
    movement: mood === "tense" ? "push-in" : scene.exterior ? "crane" : "static",
    subject: scene.location ?? capitalize(scene.place),
    action: opening ? truncateWords(opening, 22) : `Establish ${scene.place}${scene.time ? ` at ${scene.time}` : ""}${chars.length > 0 ? ` with ${chars.slice(0, 2).join(" and ")} in frame` : ""}.`,
    purpose: `Orient us in ${scene.place}${scene.time ? ` at ${scene.time}` : ""} before anyone speaks${mood === "tense" ? " — a slow creep in says something is already wrong" : chars.length > 0 ? `, and place ${chars.slice(0, 2).join(" and ")} within it` : ""}.`,
    sound: ambientFor(scene, opening || allText),
  });

  // 2. Coverage for the chosen units, in story order. Every unit (shot or not) updates who's who.
  const chosenIndexes = new Set(chosen.map((c) => c.index));
  units.forEach((unit, index) => {
    const subject = unitSubject(unit, scene, state);
    if (chosenIndexes.has(index)) {
      const draft = shotForUnit(unit, index, scene, state);
      const prev = drafts[drafts.length - 1];
      if (prev && prev.size === draft.size && prev.framing === draft.framing && prev.movement === draft.movement && index !== turnIndex) {
        // Avoid two identical set-ups back to back: step the size.
        draft.size = draft.size === "medium-wide" ? "medium" : draft.size === "medium" ? "medium-close-up" : draft.size === "close-up" ? "medium-close-up" : draft.size;
      }
      drafts.push(draft);
    }
    noteMentions(unit, subject, scene, state);
  });

  // Pad thin scenes with reaction and relationship coverage.
  const other = chars[1];
  const fillers: ShotDraft[] = [
    {
      size: "close-up",
      framing: "single",
      angle: "eye-level",
      movement: "static",
      subject: other ?? protagonist,
      action: other ? `${other} listens — a reaction, not a line` : `${protagonist} alone with the moment`,
      purpose: "Reaction coverage: often the most important shot in a scene is the person not speaking.",
      sound: "",
    },
    {
      size: "medium",
      framing: other ? "two-shot" : "single",
      angle: "eye-level",
      movement: "static",
      subject: other ? `${protagonist} and ${other}` : protagonist,
      action: other ? "Both in frame, the space between them visible" : `${protagonist} in the middle of the space`,
      purpose: other ? "Show the distance between them — blocking is subtext you can photograph." : "A neutral master to cut back to, so the tighter shots have somewhere to return.",
      sound: "",
    },
    {
      size: "extreme-close-up",
      framing: "insert",
      angle: "eye-level",
      movement: "static",
      subject: `${protagonist}'s hands`,
      action: "What the hands do while the face holds still",
      purpose: "An insert that betrays what the character won't say out loud.",
      sound: "",
    },
  ];
  // Reaction right after the turn, the hands just before it, the relationship shot early.
  const placements = [
    (turnAt: number) => (turnAt > 0 ? turnAt + 1 : drafts.length),
    () => Math.min(2, drafts.length),
    (turnAt: number) => (turnAt > 0 ? turnAt : Math.max(1, drafts.length - 1)),
  ];
  for (let f = 0; drafts.length < target - 1 && f < fillers.length; f++) {
    const turnAt = drafts.findIndex((d) => d.movement === "push-in" && d.size === "close-up" && d.framing === "single");
    drafts.splice(placements[f](turnAt), 0, fillers[f]);
  }

  // 3. Closing.
  const last = closingIndex >= 0 ? units[closingIndex] : null;
  const lastText = last?.text ?? "";
  const closingSubject = last?.speaker ?? namesIn(lastText, chars)[0] ?? state.lastSubject;
  let closing: ShotDraft;
  if (last && hits(lastText, DEPART_TERMS).length > 0) {
    closing = {
      size: "wide", framing: "single", angle: "high", movement: "pull-out", subject: closingSubject, action: truncateWords(lastText, 18),
      purpose: "Pull away and let the space swallow the moment — the audience feels the absence left behind.",
      sound: "Let the ambience return, then a sound bridge into the next scene",
    };
  } else if (last && hits(lastText, VULNERABLE_TERMS).length > 0) {
    closing = {
      size: "wide", framing: "single", angle: "high", movement: "pull-out", subject: closingSubject, action: truncateWords(lastText, 18),
      purpose: `Pull back and leave ${closingSubject} alone in a frame that's suddenly too big for them.`,
      sound: soundFor(lastText) || ambientFor(scene, allText),
    };
  } else if (last && (last.kind === "dialogue" || hits(lastText, CLOSING_FACE_TERMS).length > 0)) {
    closing = {
      size: "close-up", framing: "single", angle: "eye-level", movement: "static", subject: closingSubject,
      action: last.kind === "dialogue" ? `${closingSubject}: "${truncateWords(lastText, 16)}"` : truncateWords(lastText, 18),
      purpose: "Hold on the face past the point of comfort; the scene's meaning settles in the silence after the last beat.",
      sound: "Drop everything but room tone",
    };
  } else {
    const inLast = namesIn(lastText, chars);
    const pair = inLast.length >= 2 || (inLast.length === 0 && chars.length >= 2);
    closing = {
      size: "wide", framing: pair ? "two-shot" : "single", angle: "eye-level", movement: "pull-out",
      subject: pair ? `${chars[0]} and ${chars[1]}` : closingSubject,
      action: last ? truncateWords(lastText, 18) : "The aftermath",
      purpose: "Return to the wide to show how the geography — and the relationship — has changed since the opening frame.",
      sound: soundFor(lastText) || "Ambience swells back in to close the scene",
    };
  }
  drafts.push(closing);

  const trimmed = drafts.length > 14 ? [...drafts.slice(0, 13), drafts[drafts.length - 1]] : drafts;
  const shots: Shot[] = trimmed.map((d, i) => ({
    number: i + 1,
    size: d.size,
    framing: d.framing,
    angle: d.angle,
    movement: d.movement,
    lens: d.lens ?? LENS_FOR_SIZE[d.size],
    subject: capitalize(d.subject),
    action: capitalize(d.action),
    purpose: d.purpose,
    sound: d.sound,
  }));

  // Coverage notes.
  const keyShot =
    shots.find((s) => s.movement === "push-in" && s.size === "close-up") ??
    shots.find((s) => s.size === "close-up" && s.number > 1) ??
    shots[Math.floor(shots.length / 2)];
  const overShoulders = shots.filter((s) => s.framing === "over-the-shoulder").map((s) => s.number);
  const inserts = shots.filter((s) => s.framing === "insert").map((s) => s.number);
  const list = (ns: number[]) => `shot${ns.length > 1 ? "s" : ""} ${ns.join(", ")}`;
  const coverageNotes: string[] = [
    `If the day runs long, protect shot ${keyShot.number} (${SHOT_SIZE_INFO[keyShot.size].label.toLowerCase()} on ${inSentence(keyShot.subject)}) — it carries the scene's turn and can't be picked up later.`,
    chars.length >= 2
      ? `Keep the camera on one side of the 180° line between ${chars[0]} and ${chars[1]}${overShoulders.length > 0 ? `; the over-the-shoulders (${list(overShoulders)}) must mirror each other so eyelines match` : " so eyelines match across the singles"}.`
      : `With one character, set the 180° line along ${protagonist}'s eyeline and keep screen direction consistent whenever they move.`,
    "Shoot the wide (shot 1) first to lock blocking and continuity, then turn around for the tighter set-ups — light each direction once to save time.",
  ];
  if (inserts.length > 0) {
    coverageNotes.push(`Inserts and cutaways (${list(inserts)}) can be picked up at the end of the day or by a second unit — photograph prop positions for continuity.`);
  }
  coverageNotes.push(`In the edit, stay wider until shot ${keyShot.number}; cutting to close-ups too early spends the intensity the turn needs.`);
  coverageNotes.push("Record 30 seconds of room tone before you wrap the location, plus wild lines for anything played off-screen.");

  // Emotional intent and summary.
  const emotionHits = hits(allText, LEXICON.emotion);
  const turnUnit = turnIndex >= 0 ? units[turnIndex] : null;
  const turnSubject = inSentence(keyShot.subject.split(",")[0]);
  const moodIntent = DEFAULT_INTENT[mood] ?? DEFAULT_INTENT.restrained;
  const emotionalIntent = intent
    ? `${capitalize(stripEnd(intent))}. The audience should feel it tighten shot by shot until ${turnSubject} reaches the turn in shot ${keyShot.number}.`
    : `${emotionHits.length > 0 ? `Built around ${emotionHits.slice(0, 2).join(" and ")}` : moodIntent.lead}: ${moodIntent.tail}, peaking at shot ${keyShot.number} on ${turnSubject}.`;
  const dialogueCount = units.filter((u) => u.kind === "dialogue").length;
  const openingLine = opening || units.find((u) => u.kind === "action")?.text || req.scene;
  const sceneSummary = [
    `${scene.location ?? capitalize(scene.place)}${scene.time ? `, ${scene.time}` : ""}`.replace(/\.?$/, "."),
    `${chars.length > 0 ? `${capitalize(chars.slice(0, 3).join(" and "))} — ` : ""}${chars.length > 0 ? lowerFirstWord(truncateWords(stripEnd(openingLine), 18), chars) : truncateWords(stripEnd(openingLine), 18)}`,
    dialogueCount > 0 || turnUnit
      ? `; ${dialogueCount > 0 ? `${plural(dialogueCount, "line", "lines")} of dialogue` : "the action"} building to ${turnUnit ? `"${truncateWords(stripEnd(turnUnit.text), 12)}"` : "the turn"}.`
      : ".",
  ].join(" ").replace(/\s+;/, ";").replace(/\s+\.$/, ".");

  const userShotList = req.userShots?.trim() ? parseUserShots(req.userShots) : [];
  const feedbackOnUserShots = userShotList.map((shot, i) => ({ shot, note: feedbackForUserShot(shot, i, shots, scene) }));

  return {
    sceneSummary,
    emotionalIntent,
    visualConcept: intent ? `${concept} Everything serves the intent: "${truncateWords(stripEnd(intent), 16)}".` : concept,
    shots,
    coverageNotes: coverageNotes.slice(0, 6),
    feedbackOnUserShots,
  };
}

/** "The woman" → "the woman" for use mid-sentence; names are left alone. */
function inSentence(subject: string): string {
  return /^The [a-z]/.test(subject) ? `t${subject.slice(1)}` : subject;
}

/** "Rain hammers" → "rain hammers" for use after a dash; names, "I" and screenplay caps stay as written. */
function lowerFirstWord(text: string, characters: string[]): string {
  const first = text.split(/\s+/)[0] ?? "";
  if (!/^[A-Z][a-z]+[,;:]?$/.test(first)) return text;
  const bare = first.replace(/[,;:]$/, "");
  if (characters.some((c) => c.replace(/^the\s+/i, "").split(" ")[0] === bare)) return text;
  return first.toLowerCase() + text.slice(first.length);
}
