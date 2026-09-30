/**
 * Regression tests for the daily coach's final review findings: emotion
 * words that are really titles, labels or compounds, praise that must never
 * contradict the nudge beside it, and the shared English check. Tables mix
 * the reviewers' evidence with held-out responses written for these tests.
 */
import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS, getDailyPrompt, type DailyChallenge } from "@/content/daily-prompts";
import { checkConstraints, findTerms } from "@/lib/daily";
import * as language from "./language";
import { DEMO_ENGLISH_ONLY, demoCanRead, demoDailyFeedback, namedEmotions } from "./daily";

const prompt = (id: string): DailyChallenge => {
  const p = getDailyPrompt(id);
  if (!p) throw new Error(`missing prompt ${id}`);
  return p;
};

/** The first quoted fragment in the praise, without the curly quotes or a trailing ellipsis. */
const praisedLine = (praise: string): string | null => praise.match(/“([^”]+)”/)?.[1].replace(/…$/, "") ?? null;

describe("namedEmotions: only feelings named as feelings", () => {
  it.each([
    // Evidence: the room was scolded for naming "grief".
    ["A self-help book called Grief Is a Journey, spine uncracked.", []],
    ["Forty paperbacks on grief counselling, spines uncracked.", []],
    // Held out.
    ["A book on grief under the lamp. A pamphlet about anger on the fridge.", []],
    ["A love letter under the kettle, unopened. Hate mail in the recycling.", []],
    ["A mug that says “Joy” in gold letters. A photo of a girl named Hope.", []],
    ["She keeps a sign that reads 'FEAR' above the door.", []],
    ["Grief Is a Journey sits on the shelf, spine uncracked.", []],
    // Real uses still count.
    ["She is so lonely that she talks to the plants.", ["lonely"]],
    ["Grief sits at the table like a guest who won't leave.", ["grief"]],
    ["He felt the old fear and shame come back.", ["fear", "shame"]],
    ["They were grief-stricken for years.", ["grief"]],
  ] as [string, string[]][])("%s", (text, expected) => {
    expect(namedEmotions(text).sort()).toEqual([...expected].sort());
  });
});

describe("demoDailyFeedback: Who Lives Here and objects with emotional names", () => {
  it.each([
    "A single mug in the sink, rinsed but not washed. Forty paperbacks on grief counselling, spines uncracked. A calendar stuck on March. Two pairs of boots by the door, one pair dusty.",
    "Three alarm clocks on the nightstand, all set to 5:10. A self-help book called Grief Is a Journey, spine uncracked. Dog bowls by the door, washed and stacked. A single mug in the sink.",
  ])("doesn't say the room names an emotion: %s", (response) => {
    const feedback = demoDailyFeedback(prompt("who-lives-here"), { response });
    expect(feedback.nudge).not.toMatch(/name the emotion/i);
    expect(feedback.praise).not.toMatch(/raw material/);
  });

  it("still catches a named emotion, and scores the shown room above it", () => {
    const told = demoDailyFeedback(prompt("who-lives-here"), { response: "The bed is unmade. She is so lonely that she talks to the plants. A mug in the sink." });
    expect(told.nudge).toMatch(/“lonely”/);
    expect(praisedLine(told.praise)).not.toMatch(/lonely/);
    const shown = demoDailyFeedback(prompt("who-lives-here"), {
      response: "The bed is made on one side only. Forty paperbacks on grief counselling, spines uncracked. A single mug in the sink. Two pairs of boots by the door, one pair dusty.",
    });
    expect(shown.score).toBeGreaterThan(told.score);
  });
});

describe("demoDailyFeedback: praise never contradicts the nudge", () => {
  it.each([
    // Evidence: "…you're thinking in turns… a clear shift" above "We get the situation but not the turn."
    ["three-acts", "A man sat in a cafe near the station. He drank his coffee and read the paper. He paid and went home."],
    ["kishotenketsu", "A cat sat on a wall.\n\nThe wall was warm in the sun.\n\nA dog walked past the wall.\n\nThe cat watched the dog go by."],
  ])("structure praise only with a turn (%s)", (id, response) => {
    const feedback = demoDailyFeedback(prompt(id), { response });
    expect(feedback.nudge).toMatch(/not the turn/);
    expect(feedback.praise).not.toMatch(/turns|shift|spine/);
  });

  it.each([
    [
      "kishotenketsu",
      "A vending machine stood in a quiet station.\n\nEvery night it hummed and glowed for no one.\n\nOne night it dispensed a warm can of soup that nobody had ordered.\n\nThe night guard drank it and left a coin on top, every night after.",
    ],
    [
      "three-acts",
      "Tom promised his daughter he would come to her recital. On the night, he chose the late meeting and watched the video in a taxi. The next year he sat in the front row, phone off, and she played the piece again just for him.",
    ],
  ])("recognises the turn in the reported pieces and praises the line where it happens (%s)", (id, response) => {
    const feedback = demoDailyFeedback(prompt(id), { response });
    expect(feedback.nudge).not.toMatch(/not the turn/);
    expect(feedback.praise).toMatch(/turns|shift|spine/);
    expect(praisedLine(feedback.praise)).toMatch(/One night|every night after|The next year/);
  });

  it.each([
    // Evidence: the banned words sat in the praised line.
    ["weather-report", "She is full of despair and anguish, mourning him as the rain falls on his old coat hanging by the door."],
    ["weather-report", "Rain for a week. She is full of despair and anguish, mourning him. His umbrella stays by the door, furled."],
    ["say-it-without-saying-it", "A: Are you wanting the car tonight?\nB: I am needing it, yes.\nA: Your feelings about Dad are showing.\nB: Pass the salt.\nA: It's by you.\nB: So it is."],
    // Held out.
    ["weather-report", "Fog for days, heavy with sorrow. Her grief sits in his chair by the window. The kettle boils dry."],
    ["campfire-opener", "Okay so basically I was nine and my grandmother hands me a knife and says the fish won't gut itself."],
  ])("never quotes a banned word back as the best line (%s)", (id, response) => {
    const p = prompt(id);
    const feedback = demoDailyFeedback(p, { response });
    const line = praisedLine(feedback.praise);
    if (line !== null) expect(findTerms(line, p.rule?.forbidden ?? [])).toEqual([]);
    if (p.skill === "visual") expect(line === null ? [] : namedEmotions(line)).toEqual([]);
  });

  /** Nudges and the praise claims they rule out. */
  const CONTRADICTIONS: [RegExp, RegExp][] = [
    [/not the turn/, /thinking in turns|clear shift|gives the piece a spine/],
    [/rhythm flattens/, /rhythm lands|control time/],
    [/What's lost if they fail/, /stakes in that line|where the pressure lives/],
    [/name the emotion|named the feeling|tell us they're feeling/i, /image a camera could shoot|concrete and sensory|without anyone announcing/],
    [/takes \d+ words to arrive/, /raises a question before|specific promise/],
  ];

  const RESPONSES = [
    "Mara searched the flat for the key all morning: coat pockets, the fruit bowl, the cold grey ashtray he never used. By noon she stopped looking and sat on the bed they had shared for thirty years. The key had never been lost. She simply could not bring herself to open his door.",
    '"You kept the ticket stub."\n"It was in a pocket."\n"For four years?"\n"I don\'t wash that coat."\n"You wore it Tuesday."\n"Did I?"',
    "Rain on the kitchen window all week. Her father's mug stays on the drying rack, upside down, dry. The kettle clicks off. Nobody pours.",
    "honestly i kind of think it was basically fine and stuff happened and then it was over i guess",
    "She was so sad. She was sad for a long time and she felt really sad about it all.",
    "A man sat in a cafe near the station. He drank his coffee and read the paper. He paid and went home.",
    "My grandfather, a quiet and careful man who had spent his whole working life driving the same city bus route through the same seven neighbourhoods, once stopped the bus.",
    "The nurse checks the chart. The nurse checks it again. The nurse checks the clock. The nurse checks the chart.",
  ];

  it("holds for every prompt and a spread of responses", () => {
    for (const p of DAILY_PROMPTS) {
      for (const response of RESPONSES) {
        const feedback = demoDailyFeedback(p, { response });
        for (const [nudge, claim] of CONTRADICTIONS) {
          if (nudge.test(feedback.nudge)) expect(feedback.praise, `${p.id}: ${feedback.nudge}`).not.toMatch(claim);
        }
        const line = praisedLine(feedback.praise);
        const failed = checkConstraints(p.rule, response).filter((c) => !c.met);
        if (line !== null && failed.some((c) => c.id === "forbidden")) expect(findTerms(line, p.rule?.forbidden ?? []), p.id).toEqual([]);
        if (line !== null && (p.skill === "visual" || p.skill === "character")) expect(namedEmotions(line), p.id).toEqual([]);
      }
    }
  });

  it("still rewards the stronger piece", () => {
    const weather = prompt("weather-report");
    const shown = demoDailyFeedback(weather, {
      response: "Rain on the window for the third day. His coat still hangs by the door, one sleeve damp where the roof leaks. She moves the bucket under it and leaves the coat where it is.",
    });
    const told = demoDailyFeedback(weather, { response: "She is full of despair and anguish, mourning him as the rain falls on his old coat hanging by the door." });
    expect(shown.score).toBeGreaterThan(told.score + 10);
  });
});

describe("demoCanRead / DEMO_ENGLISH_ONLY", () => {
  it("are the shared language module's, so every demo route refuses the same text", () => {
    expect(demoCanRead).toBe(language.demoCanRead);
    expect(DEMO_ENGLISH_ONLY).toBe(language.DEMO_ENGLISH_ONLY);
    expect(demoCanRead("Vendo zapatos de bebé, nunca usados. Mi madre los compró para mi hermano, que no llegó a nacer.")).toBe(false);
    expect(demoCanRead("Rain on the window all week. His mug stays on the drying rack.")).toBe(true);
  });
});
