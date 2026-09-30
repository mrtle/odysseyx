import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS, getDailyPrompt, type DailyChallenge } from "@/content/daily-prompts";
import { MicroFeedbackSchema } from "@/lib/ai/schemas";
import { findTerms } from "@/lib/daily";
import { demoCanRead, demoDailyFeedback, onTheNoseQuotes } from "./daily";
import { sentences } from "./text";

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
        if (fragments.length === 0) {
          // Only when every sentence holds a word the brief bans: praise then quotes none of them.
          const banned = p.rule?.forbidden ?? [];
          expect(sentences(response).every((x) => findTerms(x, banned).length > 0), `${p.id}: ${response}`).toBe(true);
          continue;
        }
        const flat = response.replace(/\s+/g, " ");
        expect(flat.includes(fragments[0]), `${p.id}: ${fragments[0]}`).toBe(true);
      }
    }
  });

  it("holds the learner to an exact word count", () => {
    const six = prompt("six-word-story");
    const exact = demoDailyFeedback(six, { response: "Baby shoes for sale, never worn." });
    expect(exact.nudge).not.toMatch(/brief/i);
    expect(exact.praise).toMatch(/every measurable part of the brief \(6 of 6 words\)/);

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

  it("never vouches for a brief whose defining rule was broken", () => {
    const cases: [string, string][] = [
      ["one-word-answers", "MUM: How was school?\nTEEN: It was honestly the worst day of my entire life and I never want to go back."],
      ["cold-open", "A basket on the step. Inside, a baby, asleep, and a note in a hand nobody recognises. Who left the baby here?"],
      ["campfire-opener", "So, I am nine years old and my grandmother hands me a knife and says the fish won't gut itself."],
      ["say-it-without-saying-it", "A: Are you wanting the car tonight?\nB: I am needing it, yes.\nA: Your feelings about Dad are showing.\nB: Pass the salt.\nA: It's by you.\nB: So it is."],
      ["weather-report", "Rain for a week. She is full of despair and anguish, mourning him. His umbrella stays by the door, furled."],
    ];
    for (const [id, response] of cases) {
      const feedback = demoDailyFeedback(prompt(id), { response });
      expect(feedback.praise, id).not.toMatch(/brief/);
      expect(feedback.praise, id).not.toMatch(/to the letter/);
    }
  });

  it("accepts the Visual track's shot-size abbreviations and any order for Three Shots", () => {
    const shots = prompt("three-shots");
    const abbreviated = demoDailyFeedback(shots, {
      response: "WS: A lighthouse on a black cliff.\nMS: An old keeper climbs the stairs.\nCU: The lamp flickers out.",
    });
    expect(abbreviated.nudge).not.toMatch(/Missing|out of order/);
    const reveal = demoDailyFeedback(shots, {
      response: "Close-up: a ring in the sand.\nMedium: a woman kneels to pick it up.\nWide: the empty beach, the tide coming in.",
    });
    expect(reveal.nudge).not.toMatch(/Missing|out of order/);
  });

  it("doesn't mark a correct Story Spine out of order when a beat's phrase appears earlier", () => {
    const feedback = demoDailyFeedback(prompt("story-spine"), {
      response:
        "Once upon a time there was a baker who hoped one day to win the county fair. Every day she baked the same plain loaf. One day a stranger asked for rye. Because of that she tried a new recipe. Because of that she burned six batches. Until finally the seventh rose perfectly. Ever since then she has baked something new every week.",
    });
    expect(feedback.nudge).not.toMatch(/out of order/);
    expect(feedback.praise).toMatch(/every measurable part of the brief/);
  });

  it("quotes on-the-nose lines in the learner's own words, and ignores 'I want to <do something>'", () => {
    expect(onTheNoseQuotes("Don't. Leave it. I want to see how long it sits there.")).toEqual([]);
    expect(onTheNoseQuotes("I need a minute.")).toEqual([]);
    expect(onTheNoseQuotes("Fine. I Want You To Stay, okay?")).toEqual(["I Want You To Stay, okay"]);
    expect(onTheNoseQuotes("You never listen. I’m scared, that's all.")).toEqual(["I’m scared, that's all"]);

    const dishes = prompt("the-dishes");
    const innocuous = demoDailyFeedback(dishes, {
      response: '"You left the pan."\n"I\'m soaking it."\n"Since Sunday?"\n"Don\'t. Leave it. I want to see how long it sits there."',
    });
    expect(innocuous.nudge).not.toMatch(/says the feeling out loud/);
    const nose = demoDailyFeedback(dishes, {
      response: '"You left the pan."\n"I\'m soaking it."\n"Since Sunday?"\n"I Need You To Notice Me, just once."',
    });
    expect(nose.nudge).toContain("“I Need You To Notice Me, just once” says the feeling out loud");
    expect(nose.nudge).not.toMatch(/“i need/);
  });

  it("only praises a first line's hook when it has one", () => {
    const first = prompt("first-line");
    const flat = demoDailyFeedback(first, { response: "This is a story about a boy who had a nice day and did some things." });
    expect(flat.praise).not.toMatch(/raises a question|specific promise/);
    const strong = demoDailyFeedback(first, {
      response: "The morning my mother sold our house, she forgot to mention I was still living in it.",
    });
    expect(strong.score - flat.score).toBeGreaterThanOrEqual(10);
    const milk = demoDailyFeedback(prompt("six-word-story"), { response: "I went to the store today and bought some milk." });
    expect(milk.praise).not.toMatch(/raises a question|specific promise/);
  });

  it("pluralises the missing-words nudge", () => {
    const fortyNine = Array.from({ length: 49 }, (_, i) => (i % 9 === 8 ? "door." : "key")).join(" ");
    const feedback = demoDailyFeedback(prompt("lost-key"), { response: fortyNine });
    expect(feedback.nudge).toMatch(/That missing word is a gift — spend it/);
    expect(feedback.nudge).not.toMatch(/Those 1/);
  });

  it("coaches the voicemail as delivery and the room as visual, not as two-hander dialogue or character", () => {
    const voicemail = demoDailyFeedback(prompt("the-voicemail"), {
      response:
        "Hey, it's me. I know it's late. I just wanted to say I found the photo of us at the lake, the one you said you lost. I'm not calling to fight. I'm calling because I kept it. I've had it the whole time. Oh. Oh no. You weren't the one who lost it, were you. I'm going to hang up now.",
    });
    expect(voicemail.skill).toBe("delivery");
    expect(`${voicemail.nudge} ${voicemail.tryThis}`).not.toMatch(/two different actors|one character a question/);
    const room = demoDailyFeedback(prompt("who-lives-here"), {
      response:
        "Three alarm clocks on the nightstand, all set to 5:10. A book on grief counselling, spine uncracked. Dog bowls by the door, washed and stacked. A single mug in the sink.",
    });
    expect(room.skill).toBe("visual");
    expect(`${room.nudge} ${room.tryThis}`).not.toMatch(/your character|with their hands/);
  });

  it("reads non-English text as unreadable rather than scoring it as empty", () => {
    expect(demoCanRead("売ります。赤ちゃんの靴、未使用。")).toBe(false);
    expect(demoCanRead("Продаются детские ботинки, неношеные.")).toBe(false);
    expect(demoCanRead("Baby shoes for sale — never worn. Café, déjà vu.")).toBe(true);
  });
});
