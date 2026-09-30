/**
 * Story structure frameworks. Used by the Story Lab (beat mapping), the AI
 * prompts, the offline demo coach and the lessons.
 */
export const FRAMEWORK_IDS = [
  "three-act",
  "heros-journey",
  "save-the-cat",
  "story-circle",
  "kishotenketsu",
  "story-spine",
] as const;

export type FrameworkId = (typeof FRAMEWORK_IDS)[number];

export interface FrameworkBeat {
  name: string;
  /** Rough position in the story, 0–1. */
  position: number;
  description: string;
}

export interface Framework {
  id: FrameworkId;
  name: string;
  origin: string;
  bestFor: string;
  summary: string;
  beats: FrameworkBeat[];
}

export const FRAMEWORKS: Record<FrameworkId, Framework> = {
  "three-act": {
    id: "three-act",
    name: "Three-Act Structure",
    origin: "Aristotle's beginning–middle–end, formalised for screen by Syd Field",
    bestFor: "Feature films, short films, almost anything",
    summary:
      "Setup, confrontation, resolution. Two major turning points push the story from one act into the next.",
    beats: [
      { name: "Setup", position: 0.05, description: "Introduce the protagonist, their world and what's missing." },
      { name: "Inciting Incident", position: 0.12, description: "An event disrupts the status quo and poses the story's central question." },
      { name: "Plot Point One", position: 0.25, description: "The protagonist commits to a goal and crosses into the conflict of Act Two." },
      { name: "Rising Action", position: 0.4, description: "Escalating obstacles and complications; the protagonist tries and adapts." },
      { name: "Midpoint", position: 0.5, description: "A reversal or revelation that raises the stakes and changes the approach." },
      { name: "Crisis / Plot Point Two", position: 0.75, description: "The lowest point — the protagonist faces their hardest choice." },
      { name: "Climax", position: 0.9, description: "The final confrontation where the central question is answered." },
      { name: "Resolution", position: 0.98, description: "The new normal; we see how the protagonist and world have changed." },
    ],
  },
  "heros-journey": {
    id: "heros-journey",
    name: "The Hero's Journey",
    origin: "Joseph Campbell's monomyth, adapted by Christopher Vogler — the shape of the Odyssey itself",
    bestFor: "Adventure, fantasy, transformation stories, epic arcs",
    summary:
      "A hero leaves the ordinary world, is tested in a special world, is transformed, and returns with something to share.",
    beats: [
      { name: "Ordinary World", position: 0.03, description: "The hero's normal life, before the adventure." },
      { name: "Call to Adventure", position: 0.1, description: "A challenge or opportunity appears." },
      { name: "Refusal of the Call", position: 0.14, description: "Fear or duty makes the hero hesitate." },
      { name: "Meeting the Mentor", position: 0.18, description: "A guide offers advice, training or a gift." },
      { name: "Crossing the Threshold", position: 0.25, description: "The hero commits and enters the special world." },
      { name: "Tests, Allies, Enemies", position: 0.4, description: "The hero learns the rules of the new world." },
      { name: "Approach to the Inmost Cave", position: 0.5, description: "Preparation for the central ordeal." },
      { name: "The Ordeal", position: 0.6, description: "A life-or-death crisis; the hero faces their greatest fear." },
      { name: "Reward", position: 0.7, description: "Having survived, the hero seizes the prize." },
      { name: "The Road Back", position: 0.8, description: "Consequences chase the hero home." },
      { name: "Resurrection", position: 0.9, description: "A final test where the hero is transformed." },
      { name: "Return with the Elixir", position: 0.98, description: "The hero comes home changed, carrying something of value." },
    ],
  },
  "save-the-cat": {
    id: "save-the-cat",
    name: "Save the Cat! Beat Sheet",
    origin: "Blake Snyder's screenwriting beat sheet",
    bestFor: "Commercial features, genre films, tight pacing",
    summary:
      "Fifteen beats that map a protagonist's external quest and internal transformation onto precise page targets.",
    beats: [
      { name: "Opening Image", position: 0.01, description: "A snapshot of the 'before' world and the hero's problem." },
      { name: "Theme Stated", position: 0.05, description: "Someone hints at the lesson the hero must learn." },
      { name: "Set-Up", position: 0.08, description: "The hero's world, flaws and what needs fixing." },
      { name: "Catalyst", position: 0.1, description: "The life-changing event." },
      { name: "Debate", position: 0.18, description: "Should I go? The hero resists." },
      { name: "Break into Two", position: 0.23, description: "The hero chooses to act and enters an upside-down world." },
      { name: "B Story", position: 0.27, description: "A secondary relationship that carries the theme." },
      { name: "Fun and Games", position: 0.4, description: "The promise of the premise — the trailer moments." },
      { name: "Midpoint", position: 0.5, description: "False victory or false defeat; stakes rise." },
      { name: "Bad Guys Close In", position: 0.62, description: "External pressure and internal doubt tighten." },
      { name: "All Is Lost", position: 0.75, description: "The opposite of the midpoint — a 'whiff of death'." },
      { name: "Dark Night of the Soul", position: 0.8, description: "The hero wallows, then finds the lesson." },
      { name: "Break into Three", position: 0.83, description: "A new idea, born from the theme, points the way." },
      { name: "Finale", position: 0.92, description: "The hero applies the lesson and wins (or loses meaningfully)." },
      { name: "Final Image", position: 0.99, description: "The mirror of the opening image, showing change." },
    ],
  },
  "story-circle": {
    id: "story-circle",
    name: "Story Circle",
    origin: "Dan Harmon's eight-step distillation of the Hero's Journey",
    bestFor: "TV episodes, short films, sketches, personal stories",
    summary:
      "A character in a zone of comfort wants something, enters an unfamiliar situation, adapts, gets what they wanted, pays a heavy price, and returns having changed.",
    beats: [
      { name: "You", position: 0.03, description: "A character in a zone of comfort." },
      { name: "Need", position: 0.12, description: "But they want something." },
      { name: "Go", position: 0.25, description: "They enter an unfamiliar situation." },
      { name: "Search", position: 0.38, description: "They adapt to it." },
      { name: "Find", position: 0.5, description: "They get what they wanted." },
      { name: "Take", position: 0.63, description: "They pay a heavy price for it." },
      { name: "Return", position: 0.8, description: "They return to their familiar situation." },
      { name: "Change", position: 0.95, description: "Having changed." },
    ],
  },
  kishotenketsu: {
    id: "kishotenketsu",
    name: "Kishōtenketsu",
    origin: "Classical Chinese and Japanese four-part structure",
    bestFor: "Slice-of-life, contemplative films, stories without a villain",
    summary:
      "Introduction, development, twist, reconciliation — drama from contrast and juxtaposition rather than conflict.",
    beats: [
      { name: "Ki — Introduction", position: 0.1, description: "Introduce characters and setting." },
      { name: "Shō — Development", position: 0.35, description: "Deepen what we know; no major change yet." },
      { name: "Ten — Twist", position: 0.65, description: "An unexpected development or new perspective." },
      { name: "Ketsu — Reconciliation", position: 0.9, description: "Bring the elements together into a new harmony." },
    ],
  },
  "story-spine": {
    id: "story-spine",
    name: "Story Spine",
    origin: "Kenn Adams' improv exercise, popularised by Pixar storytellers",
    bestFor: "Pitches, oral storytelling, quick outlines, brand stories",
    summary:
      "Once upon a time… Every day… Until one day… Because of that… Because of that… Until finally… And ever since then…",
    beats: [
      { name: "Once upon a time…", position: 0.03, description: "Establish the world and the character." },
      { name: "Every day…", position: 0.12, description: "The routine — the status quo." },
      { name: "Until one day…", position: 0.25, description: "The event that breaks the routine." },
      { name: "Because of that…", position: 0.45, description: "The first consequence." },
      { name: "Because of that…", position: 0.65, description: "Consequences escalate (repeat as needed)." },
      { name: "Until finally…", position: 0.85, description: "The climax — the story's decisive moment." },
      { name: "And ever since then…", position: 0.97, description: "The new normal; what it all meant." },
    ],
  },
};

export const FRAMEWORK_LIST: Framework[] = FRAMEWORK_IDS.map((id) => FRAMEWORKS[id]);

export function isFrameworkId(value: unknown): value is FrameworkId {
  return typeof value === "string" && (FRAMEWORK_IDS as readonly string[]).includes(value);
}
