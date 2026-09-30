/**
 * Daily micro-story challenges. One is chosen per calendar day (see
 * `dailyPromptFor` in `@/lib/daily`), cycling through all of them.
 *
 * Each prompt trains one skill. `rule` holds the machine-checkable part of
 * the constraint — shown live while the learner writes and used by the demo
 * coach — while `constraint` is the full brief in plain English.
 */
import type { DailyRule } from "@/lib/daily";
import type { DailyPrompt } from "@/lib/types";

export interface DailyChallenge extends DailyPrompt {
  rule?: DailyRule;
}

const EMOTION_WORDS = [
  "sad",
  "sadness",
  "grief",
  "grieving",
  "grieved",
  "sorrow",
  "heartbroken",
  "lonely",
  "loneliness",
  "depressed",
  "upset",
  "miserable",
  "devastated",
];

export const DAILY_PROMPTS: DailyChallenge[] = [
  // -------------------------------------------------------------------------
  // Hook & premise
  // -------------------------------------------------------------------------
  {
    id: "six-word-story",
    title: "Six Words",
    prompt: "Write a complete story — a situation, a turn and an ending — in six words.",
    constraint: "Exactly six words. It has to feel like a whole story, not a slogan.",
    skill: "hook",
    rule: { words: { min: 6, max: 6 } },
  },
  {
    id: "first-line",
    title: "The First Line",
    prompt: "Write the first line of a novel that makes it impossible not to read the second.",
    constraint: "One sentence, 30 words max. Raise a question the reader needs answered.",
    skill: "hook",
    rule: { sentences: { max: 1 }, words: { max: 30 } },
  },
  {
    id: "commute-pitch",
    title: "Pitch Your Commute",
    prompt: "Pitch a movie about your morning commute as if it's this summer's biggest thriller.",
    constraint: "A one-sentence logline plus a tagline, 60 words max. Keep the facts true; make the stakes feel huge.",
    skill: "hook",
    rule: { words: { max: 60 } },
  },
  {
    id: "cold-open",
    title: "Cold Open",
    prompt: "Write the first thirty seconds of a TV cold open that ends before the audience gets an answer.",
    constraint: "120 words max. End on an unanswered question — without using a question mark.",
    skill: "hook",
    rule: { words: { max: 120 } },
  },
  {
    id: "back-cover",
    title: "The Back Cover",
    prompt:
      "Write the back-cover blurb for a book about someone you actually know — a grandparent, a neighbour, your first boss.",
    constraint: "80 words max. The reader should know what's at stake by the second sentence.",
    skill: "hook",
    rule: { words: { max: 80 } },
  },

  // -------------------------------------------------------------------------
  // Structure
  // -------------------------------------------------------------------------
  {
    id: "lost-key",
    title: "The Lost Key",
    prompt: "Tell a story about a lost key where the last line changes the meaning of the first.",
    constraint: "Exactly 50 words. The final line must recast the opening line.",
    skill: "structure",
    rule: { words: { min: 50, max: 50 } },
  },
  {
    id: "story-spine",
    title: "Once Upon a Time",
    prompt:
      "Tell a whole story on the Story Spine: Once upon a time… Every day… One day… Because of that… Because of that… Until finally… Ever since then…",
    constraint: "Use every Story Spine opening, in order. 150 words max.",
    skill: "structure",
    rule: {
      words: { max: 150 },
      required: ["once upon a time", "every day", "one day", "because of that", "until finally", "ever since"],
      requiredInOrder: true,
    },
  },
  {
    id: "backwards",
    title: "Backwards",
    prompt: "Tell the story of a breakup in reverse order, ending at the moment they first met.",
    constraint: "Four to six sentences, told last-to-first. The ending should hurt because we know what's coming.",
    skill: "structure",
    rule: { sentences: { min: 4, max: 6 } },
  },
  {
    id: "three-acts",
    title: "Three Sentences, Three Acts",
    prompt: "Tell the story of someone who breaks a promise — setup, confrontation, resolution.",
    constraint: "Exactly three sentences, one per act.",
    skill: "structure",
    rule: { sentences: { min: 3, max: 3 } },
  },
  {
    id: "midpoint-flip",
    title: "The Midpoint",
    prompt: "Halfway through a heist, everything goes wrong. Write the moment the crew's goal changes.",
    constraint: "100 words max. The goal at the end must be different from the goal at the start.",
    skill: "structure",
    rule: { words: { max: 100 } },
  },
  {
    id: "kishotenketsu",
    title: "A Twist Without a Fight",
    prompt: "Tell a four-part kishōtenketsu story — introduction, development, twist, reconciliation — about a vending machine.",
    constraint: "Four short paragraphs. No villain, no fight: the twist does the work.",
    skill: "structure",
    rule: { paragraphs: { min: 4, max: 4 }, words: { max: 160 } },
  },

  // -------------------------------------------------------------------------
  // Character
  // -------------------------------------------------------------------------
  {
    id: "who-lives-here",
    title: "Who Lives Here",
    prompt: "Describe a room so we know exactly who lives there — without describing them.",
    constraint: "100 words max. No people appear, and no adjectives about personality.",
    skill: "character",
    rule: { words: { max: 100 } },
  },
  {
    id: "want-vs-need",
    title: "Want vs. Need",
    prompt: "A character gets exactly what they wanted — and realises it isn't what they needed.",
    constraint: "120 words max. Show the realisation through an action, not a thought.",
    skill: "character",
    rule: { words: { max: 120 } },
  },
  {
    id: "the-choice",
    title: "The Choice",
    prompt: "Reveal who someone really is through one choice made under pressure. A wallet on a train seat, perhaps.",
    constraint: "80 words max. No inner monologue — only what they do.",
    skill: "character",
    rule: { words: { max: 80 } },
  },
  {
    id: "antagonists-case",
    title: "The Antagonist's Case",
    prompt: "Let the villain of a story explain, in their own words, why they're the hero of it.",
    constraint: "First person, 100 words max. Make us half-agree.",
    skill: "character",
    rule: { words: { max: 100 } },
  },
  {
    id: "the-contradiction",
    title: "The Contradiction",
    prompt: "Introduce a character with one detail that contradicts everything else about them.",
    constraint: "Two to four sentences. The contradiction should make us want to know more, not laugh.",
    skill: "character",
    rule: { sentences: { min: 2, max: 4 } },
  },

  // -------------------------------------------------------------------------
  // Conflict & stakes
  // -------------------------------------------------------------------------
  {
    id: "raise-the-stakes",
    title: "Raise the Stakes",
    prompt: "A teenager has to be home by midnight. Raise the stakes three times, each more personal than the last.",
    constraint: "Exactly three sentences, each one raising the cost of being late.",
    skill: "conflict",
    rule: { sentences: { min: 3, max: 3 } },
  },
  {
    id: "worst-moment",
    title: "The Worst Possible Moment",
    prompt: "Someone has to tell the truth at the worst possible moment. Write the moment just before they do.",
    constraint: "100 words max. Stop before the confession.",
    skill: "conflict",
    rule: { words: { max: 100 } },
  },
  {
    id: "ticking-clock",
    title: "Ticking Clock",
    prompt: "Put a ticking clock on an ordinary errand: returning a library book.",
    constraint: "90 words max. Name the deadline and what's lost if it's missed.",
    skill: "conflict",
    rule: { words: { max: 90 } },
  },
  {
    id: "two-rights",
    title: "Both Sides Are Right",
    prompt: "Write a conflict between two people where both of them are right.",
    constraint: "120 words max. Nobody is the villain.",
    skill: "conflict",
    rule: { words: { max: 120 } },
  },
  {
    id: "last-slice",
    title: "The Last Slice",
    prompt: "Make the last slice of birthday cake feel like life or death.",
    constraint: "80 words max. The stakes come from the people, so no hype words: “literally”, “epic”, “huge”.",
    skill: "conflict",
    rule: { words: { max: 80 }, forbidden: ["literally", "epic", "huge"], forbiddenLabel: "No hype words" },
  },

  // -------------------------------------------------------------------------
  // Dialogue & subtext
  // -------------------------------------------------------------------------
  {
    id: "say-it-without-saying-it",
    title: "Say It Without Saying It",
    prompt: "Write a scene in dialogue only where neither character says what they want.",
    constraint: "Dialogue only, 6–10 lines. The words “want”, “need” and “feel” are banned.",
    skill: "dialogue",
    rule: {
      dialogueOnly: true,
      lines: { min: 6, max: 10 },
      forbidden: ["want", "wants", "wanted", "need", "needs", "needed", "feel", "feels", "feeling", "felt"],
      forbiddenLabel: "No “want”, “need” or “feel”",
    },
  },
  {
    id: "the-dishes",
    title: "It's Not About the Dishes",
    prompt: "A couple argues about the dishes. It is not about the dishes.",
    constraint: "Dialogue only, 120 words max. Never name the real problem.",
    skill: "dialogue",
    rule: { dialogueOnly: true, words: { max: 120 } },
  },
  {
    id: "one-word-answers",
    title: "One-Word Answers",
    prompt:
      "A parent tries to find out how a teenager's day went. The teenager answers in single words — and still tells us everything.",
    constraint: "Dialogue only, up to 12 lines. The teenager never says more than one word per line.",
    skill: "dialogue",
    rule: { dialogueOnly: true, lines: { max: 12 } },
  },
  {
    id: "the-voicemail",
    title: "The Voicemail",
    prompt: "Write a voicemail someone leaves — and regrets before they hang up.",
    constraint: "One speaker, 90 words max. Let us hear the exact moment they realise.",
    skill: "dialogue",
    rule: { words: { max: 90 } },
  },
  {
    id: "the-lie",
    title: "The Lie",
    prompt: "Write an exchange where one character lies, we can tell — and the other character can't.",
    constraint: "Dialogue only, 8 lines max.",
    skill: "dialogue",
    rule: { dialogueOnly: true, lines: { max: 8 } },
  },

  // -------------------------------------------------------------------------
  // Visual storytelling
  // -------------------------------------------------------------------------
  {
    id: "opening-shot",
    title: "The Opening Shot",
    prompt: "Write the opening shot of a film.",
    constraint: "Exactly three sentences. Only what the camera can see and the microphone can hear.",
    skill: "visual",
    rule: { sentences: { min: 3, max: 3 } },
  },
  {
    id: "silent-film",
    title: "Silent Film",
    prompt: "Tell the story of a breakup with no dialogue — only action and images.",
    constraint: "100 words max. No dialogue and no quotation marks.",
    skill: "visual",
    rule: { words: { max: 100 }, noDialogue: true },
  },
  {
    id: "weather-report",
    title: "Weather Report",
    prompt: "Show that a character is grieving using only the weather and a single object.",
    constraint: "80 words max. Don't name any emotion.",
    skill: "visual",
    rule: { words: { max: 80 }, forbidden: EMOTION_WORDS, forbiddenLabel: "Don't name the emotion" },
  },
  {
    id: "three-shots",
    title: "Three Shots",
    prompt: "Tell a complete story in three shots: a wide, a medium and a close-up.",
    constraint: "Three lines, one per shot, each naming its shot size.",
    skill: "visual",
    rule: { lines: { min: 3, max: 3 }, required: ["wide", "medium", "close"], requiredInOrder: true },
  },
  {
    id: "the-object",
    title: "Three Owners",
    prompt: "Follow a single object through three owners, so the object tells us who each of them is.",
    constraint: "120 words max. Describe the object's condition, not the owners' personalities.",
    skill: "visual",
    rule: { words: { max: 120 } },
  },

  // -------------------------------------------------------------------------
  // Pacing & rhythm
  // -------------------------------------------------------------------------
  {
    id: "stretch-the-moment",
    title: "Stretch the Moment",
    prompt: "Stretch one second — a glass falling from a table — across a full paragraph.",
    constraint: "One paragraph of 80–120 words covering exactly one second of time.",
    skill: "pacing",
    rule: { words: { min: 80, max: 120 }, paragraphs: { max: 1 } },
  },
  {
    id: "ten-years",
    title: "Ten Years in Five Sentences",
    prompt: "Compress ten years of a friendship into five sentences.",
    constraint: "Exactly five sentences. Choose the moments that carry the whole decade.",
    skill: "pacing",
    rule: { sentences: { min: 5, max: 5 } },
  },
  {
    id: "enter-late",
    title: "Enter Late, Leave Early",
    prompt: "Write a job interview scene that starts at the last possible moment and ends at the first possible one.",
    constraint: "100 words max. No greetings, no goodbyes.",
    skill: "pacing",
    rule: { words: { max: 100 } },
  },
  {
    id: "the-chase",
    title: "The Chase",
    prompt: "Write a chase and let sentence length be the engine: long, then short, then shorter.",
    constraint: "100 words max. The final sentence is three words or fewer.",
    skill: "pacing",
    rule: { words: { max: 100 }, lastSentenceMaxWords: 3 },
  },
  {
    id: "smash-cut",
    title: "Smash Cut",
    prompt: "Write two scenes joined by a smash cut that turns comedy into dread — or dread into comedy.",
    constraint: "120 words max. Mark the cut with CUT TO:",
    skill: "pacing",
    rule: { words: { max: 120 }, required: ["cut to"] },
  },

  // -------------------------------------------------------------------------
  // Delivery & pitch
  // -------------------------------------------------------------------------
  {
    id: "the-toast",
    title: "The Toast",
    prompt: "Write the first thirty seconds of a wedding toast for someone you've never met.",
    constraint: "Written to be spoken: 90 words max, and no sentence over 20 words.",
    skill: "delivery",
    rule: { words: { max: 90 }, maxSentenceWords: 20 },
  },
  {
    id: "going-up",
    title: "Going Up",
    prompt: "Pitch your current project — or your dream project — to a producer between the lobby and the twelfth floor.",
    constraint: "75 words max, about thirty seconds out loud. End with something they'll remember.",
    skill: "delivery",
    rule: { words: { max: 75 } },
  },
  {
    id: "explain-it-to-a-kid",
    title: "Explain It to a Ten-Year-Old",
    prompt: "Tell the plot of your favourite film to a ten-year-old so they beg to watch it.",
    constraint: "100 words max, no sentence over 18 words, no spoilers past the midpoint.",
    skill: "delivery",
    rule: { words: { max: 100 }, maxSentenceWords: 18 },
  },
  {
    id: "campfire-opener",
    title: "The Room Goes Quiet",
    prompt: "Open a true story at a storytelling night so the whole room goes quiet.",
    constraint: "First person, 60 words max. Drop us into a moment — no “So…”, no throat-clearing.",
    skill: "delivery",
    rule: { words: { max: 60 }, forbidden: ["basically", "um", "kind of", "sort of"], forbiddenLabel: "No throat-clearing" },
  },
];

export function getDailyPrompt(id: string): DailyChallenge | undefined {
  return DAILY_PROMPTS.find((p) => p.id === id);
}
