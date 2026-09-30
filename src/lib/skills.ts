/**
 * The eight storytelling skills OdysseusX measures. Every lesson, drill and
 * Story Lab analysis maps back onto these so progress rolls up into a single
 * skill profile.
 */
export const SKILL_IDS = [
  "hook",
  "structure",
  "character",
  "conflict",
  "dialogue",
  "visual",
  "pacing",
  "delivery",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface SkillDefinition {
  id: SkillId;
  name: string;
  short: string;
  description: string;
  /** What "good" looks like — used in coaching prompts and tooltips. */
  lookFor: string;
}

export const SKILLS: Record<SkillId, SkillDefinition> = {
  hook: {
    id: "hook",
    name: "Hook & Premise",
    short: "Hook",
    description: "Grabbing attention fast and promising a story worth following.",
    lookFor:
      "An opening that raises a question, a specific and intriguing premise, a clear promise of what kind of story this is.",
  },
  structure: {
    id: "structure",
    name: "Structure",
    short: "Structure",
    description: "Shaping events into a satisfying beginning, middle and end.",
    lookFor:
      "A clear setup, escalating complications, a turning point or crisis, and a climax/resolution that pays off the setup.",
  },
  character: {
    id: "character",
    name: "Character",
    short: "Character",
    description: "Protagonists with desire, flaws and change we can feel.",
    lookFor:
      "A protagonist who wants something specific, makes active choices, has an inner need or flaw, and changes (or tragically refuses to).",
  },
  conflict: {
    id: "conflict",
    name: "Conflict & Stakes",
    short: "Stakes",
    description: "Obstacles, opposition and consequences that make us care.",
    lookFor:
      "Meaningful obstacles, a worthy opposing force, and clear personal stakes — what is lost if the protagonist fails.",
  },
  dialogue: {
    id: "dialogue",
    name: "Dialogue & Subtext",
    short: "Dialogue",
    description: "Speech that reveals character and hides as much as it says.",
    lookFor:
      "Distinct voices, subtext over on-the-nose exposition, dialogue as action (people wanting things from each other).",
  },
  visual: {
    id: "visual",
    name: "Visual Storytelling",
    short: "Visual",
    description: "Show, don't tell — images, shots and details that carry meaning.",
    lookFor:
      "Concrete sensory detail, meaningful images, deliberate shot choices (size, angle, movement, light) that express emotion and theme.",
  },
  pacing: {
    id: "pacing",
    name: "Pacing & Rhythm",
    short: "Pacing",
    description: "Controlling tempo, tension and release across the story.",
    lookFor:
      "Scenes that enter late and leave early, varied rhythm, compression of the unimportant and expansion of the crucial moments.",
  },
  delivery: {
    id: "delivery",
    name: "Delivery & Pitch",
    short: "Delivery",
    description: "Telling it out loud — clarity, confidence and audience connection.",
    lookFor:
      "Clear, confident, concise delivery; reading and responding to the audience; answering questions directly; a memorable close.",
  },
};

export const SKILL_LIST: SkillDefinition[] = SKILL_IDS.map((id) => SKILLS[id]);

export function isSkillId(value: unknown): value is SkillId {
  return typeof value === "string" && (SKILL_IDS as readonly string[]).includes(value);
}
