import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS, getDailyPrompt, type DailyChallenge } from "@/content/daily-prompts";
import { MicroFeedbackSchema } from "@/lib/ai/schemas";
import { demoDailyFeedback } from "./daily";

const prompt = (id: string): DailyChallenge => {
  const p = getDailyPrompt(id);
  if (!p) throw new Error(`missing prompt ${id}`);
  return p;
};

const SAMPLES = [
  "Mara searched the flat for the key all morning: coat pockets, the fruit bowl, the cold grey ashtray he never used. By noon she stopped looking and sat on the bed they had shared for thirty years. The key had never been lost. She simply could not bring herself to open his door.",
  '"You kept the ticket stub."\n"It was in a pocket."\n"For four years?"\n"I don\'t wash that coat."\n"You wore it Tuesday."\n"Did I?"',
  "Rain on the kitchen window all week. Her father's mug stays on the drying rack, upside down, dry. The kettle clicks off. Nobody pours.",
  "honestly i kind of think it was basically fine and stuff happened and then it was over i guess",
];

/** Every quoted fragment in a string, without the curly quotes or trailing ellipsis. */
function quotedFragments(text: string): string[] {
  return [...text.matchAll(/“([^”]+)”/g)].map((m) => m[1].replace(/…$/, ""));
}

describe("demoDailyFeedback", () => {
  it("returns schema-valid feedback for every prompt and sample", () => {
    for (const p of DAILY_PROMPTS) {
      for (const response of SAMPLES) {
        const feedback = demoDailyFeedback(p, { response });
        expect(() => MicroFeedbackSchema.parse(feedback)).not.toThrow();
        expect(Number.isInteger(feedback.score), p.id).toBe(true);
        expect(feedback.score).toBeGreaterThanOrEqual(0);
        expect(feedback.score).toBeLessThanOrEqual(100);
        expect(feedback.skill).toBe(p.skill);
        expect(feedback.praise.length).toBeGreaterThan(20);
        expect(feedback.nudge.length).toBeGreaterThan(20);
        expect(feedback.tryThis.length).toBeGreaterThan(20);
      }
    }
  });

  it("is deterministic", () => {
    for (const p of DAILY_PROMPTS.slice(0, 12)) {
      for (const response of SAMPLES) {
        expect(demoDailyFeedback(p, { response })).toEqual(demoDailyFeedback(p, { response }));
      }
    }
  });

  it("ignores surrounding whitespace", () => {
    const p = prompt("lost-key");
    expect(demoDailyFeedback(p, { response: `\n\n  ${SAMPLES[0]}  \n` })).toEqual(demoDailyFeedback(p, { response: SAMPLES[0] }));
  });

  it("quotes the learner's own words in its praise", () => {
    for (const p of DAILY_PROMPTS) {
      for (const response of SAMPLES) {
        const fragments = quotedFragments(demoDailyFeedback(p, { response }).praise);
        expect(fragments.length, p.id).toBeGreaterThan(0);
        const flat = response.replace(/\s+/g, " ");
        expect(flat.includes(fragments[0]), `${p.id}: ${fragments[0]}`).toBe(true);
      }
    }
  });

  it("holds the learner to an exact word count", () => {
    const six = prompt("six-word-story");
    const exact = demoDailyFeedback(six, { response: "Baby shoes for sale, never worn." });
    expect(exact.nudge).not.toMatch(/brief/i);
    expect(exact.praise).toMatch(/honoured the brief/);

    const over = demoDailyFeedback(six, { response: "Baby shoes for sale, never worn, sadly, today." });
    expect(over.nudge).toMatch(/exactly 6 words/);
    expect(over.nudge).toMatch(/8 words — 2 over/);
    expect(over.score).toBeLessThan(exact.score);
  });

  it("tells the learner how many words are missing on an exact brief", () => {
    const fortySeven = Array.from({ length: 47 }, (_, i) => (i % 9 === 8 ? "door." : "key")).join(" ");
    const feedback = demoDailyFeedback(prompt("lost-key"), { response: fortySeven });
    expect(feedback.nudge).toMatch(/you're at 47/);
    expect(feedback.nudge).toMatch(/3 missing words/);
  });

  it("flags narration in a dialogue-only piece by quoting it", () => {
    const response =
      '"You kept the ticket stub."\n"It was in a pocket."\nShe looked away from him.\n"For four years?"\n"I don\'t wash that coat."\n"You wore it Tuesday."';
    const feedback = demoDailyFeedback(prompt("say-it-without-saying-it"), { response });
    expect(feedback.nudge).toMatch(/dialogue only/);
    expect(feedback.nudge).toContain("She looked away from him.");
  });

  it("calls out banned words it finds", () => {
    const response = '"I need you to stay."\n"I want to."\n"Then stay."\n"I feel like I can\'t."\n"Why?"\n"You know why."';
    const feedback = demoDailyFeedback(prompt("say-it-without-saying-it"), { response });
    expect(feedback.nudge).toMatch(/“need”/);
    expect(feedback.nudge).toMatch(/“want”/);
    expect(feedback.nudge).toMatch(/“feel”/);
  });

  it("asks a visual piece to show rather than name the emotion", () => {
    const response = "Rain on the window all week. She is so sad she cannot move his mug. The kettle clicks off.";
    const feedback = demoDailyFeedback(prompt("weather-report"), { response });
    expect(feedback.nudge).toMatch(/“sad”/);
  });

  it("names a missing Story Spine phrase", () => {
    const response =
      "Once upon a time there was a baker. Every day she burned the bread. One day a critic came. Because of that, she panicked. Ever since then she bakes with her eyes closed.";
    const feedback = demoDailyFeedback(prompt("story-spine"), { response });
    expect(feedback.nudge).toMatch(/Missing/);
    expect(feedback.nudge).toMatch(/until finally/);
  });

  it("rewards a piece that meets its brief and uses the skill over one that doesn't", () => {
    const chase = prompt("the-chase");
    const strong = demoDailyFeedback(chase, {
      response:
        "She ran through the market, past the fishmongers and the stacked melons and the old men arguing over dominoes, her lungs burning with every stride. The alley narrowed. Footsteps behind. Closer. Gone.",
    });
    const weak = demoDailyFeedback(chase, {
      response:
        "She ran through the market and then she ran down an alley and then the man chased her for a while until she got away from him in the end.",
    });
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(weak.nudge).toMatch(/3 words or fewer/);
  });

  it("gives different feedback to different pieces", () => {
    const p = prompt("first-line");
    const a = demoDailyFeedback(p, { response: "The night my father sold our house, he bought a boat he could not sail." });
    const b = demoDailyFeedback(p, { response: "It was a normal day and nothing much happened at all really." });
    expect(a).not.toEqual(b);
    expect(a.score).toBeGreaterThan(b.score);
  });

  it("points delivery pieces at hedges", () => {
    const feedback = demoDailyFeedback(prompt("going-up"), {
      response:
        "So basically it's kind of a heist film. A retired locksmith has one night to break into her own old house. The new owners changed nothing but the locks.",
    });
    expect(feedback.nudge).toMatch(/hedge “(basically|kind of)”/);
  });
});
