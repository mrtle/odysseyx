import { describe, expect, it } from "vitest";
import {
  LEXICON,
  MAX_SENTENCES,
  averageSentenceLength,
  countTerms,
  countTermsInContext,
  countTermsNormalized,
  firstLine,
  hasAny,
  latinShare,
  lexicalVariety,
  matchedTerms,
  normalizeForMatch,
  normalizedTerms,
  sentenceLengthVariance,
  sentences,
  words,
} from "./text";

describe("words", () => {
  it("counts words in non-Latin scripts", () => {
    expect(words("Мальчик нашёл старый ключ").length).toBe(4);
    expect(words("Ο ψαράς έχασε το δίχτυ").length).toBe(5);
    expect(words("女性がカフェに入る。").length).toBeGreaterThan(1);
    expect(words("売ります。赤ちゃんの靴、未使用。").length).toBeGreaterThanOrEqual(4);
  });

  it("reduces possessives but keeps contractions", () => {
    expect(words("His daughter's surgery")).toEqual(["his", "daughter", "surgery"]);
    expect(words("the killers’ van")).toEqual(["the", "killers", "van"]);
    expect(words("She can't stop")).toEqual(["she", "can't", "stop"]);
  });
});

describe("countTerms", () => {
  it("matches lexicon terms through possessives", () => {
    const logline =
      "A washed-up stunt driver must win one last illegal street race to pay off his daughter's surgery, but the race is run by the cartel boss who crippled him.";
    expect(countTerms(logline, ["daughter", "surgery"])).toBe(2);
    expect(countTerms("the family’s farm", ["family"])).toBe(1);
  });

  it("matches hyphenated and multi-word terms", () => {
    expect(countTerms("A slow close-up on her hands.", LEXICON.visual)).toBeGreaterThan(0);
    expect(countTerms("Pay up or else.", ["or else"])).toBe(1);
  });

  it("matches terms in other scripts", () => {
    expect(countTerms("Он боится темноты", ["боится"])).toBe(1);
  });
});

describe("countTermsInContext", () => {
  it("only counts stakes words in sentences with conflict or desire", () => {
    const bland = "We went home and ate dinner. I learned that you should enjoy life.";
    expect(countTermsInContext(bland, LEXICON.stakes, [...LEXICON.conflict, ...LEXICON.desire])).toBe(0);
    const tense = "She must get home before the storm, or lose the farm for good.";
    expect(countTermsInContext(tense, LEXICON.stakes, [...LEXICON.conflict, ...LEXICON.desire])).toBeGreaterThan(1);
  });
});

describe("sentences", () => {
  it("still splits normal prose and keeps abbreviations", () => {
    expect(sentences("Dr. Reyes arrived at 4 a.m. Nobody spoke. Why?")).toEqual(["Dr. Reyes arrived at 4 a.m. Nobody spoke.", "Why?"]);
  });

  it("splits CJK full stops", () => {
    expect(sentences("売ります。赤ちゃんの靴、未使用。")).toHaveLength(2);
  });

  it("cuts an unpunctuated run-on into clause-sized pieces", () => {
    const dictated =
      "every morning my grandmother fed the crows on the fence behind our house and I thought it was strange but she said they remembered faces and one day when she was sick the crows came to her window and left small gifts like buttons and bottle caps and then when she died they sat on the roof all afternoon and I understood that she had been right all along about them";
    const parts = sentences(dictated);
    expect(parts.length).toBeGreaterThanOrEqual(3);
    for (const part of parts) expect(words(part).length).toBeLessThanOrEqual(40);
    expect(parts.join(" ")).toBe(dictated);
  });
});

describe("helpers", () => {
  it("measures the Latin share of letters", () => {
    expect(latinShare("A plain English line")).toBe(1);
    expect(latinShare("女性がカフェに入る")).toBe(0);
  });

  it("normalises text for phrase matching", () => {
    expect(normalizeForMatch("Her father’s “last” chance!")).toBe(" her father last chance ");
  });
});

describe("sentences: degenerate input", () => {
  it.each([
    ["dots", ". ".repeat(15_000)],
    ["ellipses", "… ".repeat(5_000)],
    ["dashes", "— ".repeat(5_000)],
    ["question marks", "? ! ".repeat(5_000)],
  ])("finds no sentences in punctuation-only %s", (_, text) => {
    expect(sentences(text)).toEqual([]);
  });

  it("drops punctuation-only fragments between real sentences", () => {
    expect(sentences("Wait. . . What?")).toEqual(["Wait.", "What?"]);
    expect(sentences("Thirty-one, thanks. ...You've got the look of someone with a project.")).toEqual([
      "Thirty-one, thanks.",
      "You've got the look of someone with a project.",
    ]);
    expect(sentences("She left. — ! He stayed.")).toEqual(["She left.", "He stayed."]);
    // Numbers and symbols are content.
    expect(sentences("Chapter 1. 🎬. The end.")).toEqual(["Chapter 1.", "🎬.", "The end."]);
  });

  it(`never returns more than ${MAX_SENTENCES} units, and still covers the whole text in order`, () => {
    const hi = "Hi. ".repeat(2000);
    const units = sentences(hi);
    expect(units.length).toBeLessThanOrEqual(MAX_SENTENCES);
    expect(units.join(" ").match(/Hi\./g)).toHaveLength(2000);

    const numbered = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1} lands.`).join(" ");
    const parts = sentences(numbered);
    expect(parts.length).toBe(MAX_SENTENCES);
    // Openings and endings stay single sentences, so they can be quoted exactly.
    expect(parts.slice(0, 3)).toEqual(["Line 1 lands.", "Line 2 lands.", "Line 3 lands."]);
    expect(parts[parts.length - 1]).toBe("Line 1500 lands.");
    expect(parts.join(" ")).toBe(numbered);
  });

  it("leaves ordinary prose alone (under the cap)", () => {
    const prose = "The keeper lit the lamp. A ship went dark. Nobody came. ".repeat(60);
    expect(sentences(prose)).toHaveLength(180);
  });

  it("returns a fresh array each time, even for a remembered text", () => {
    const text = "One sentence here. Another one there. ".repeat(30);
    const first = sentences(text);
    first.length = 0;
    expect(sentences(text)).toHaveLength(60);
    const w = words(text);
    w.length = 0;
    expect(words(text).length).toBeGreaterThan(100);
  });
});

describe("term matching", () => {
  it("caches normalised term lists but notices when a list changes", () => {
    const terms = ["storm", "harbour"];
    expect(countTerms("The storm hit the harbour.", terms)).toBe(2);
    terms[0] = "lighthouse";
    expect(countTerms("The storm hit the harbour.", terms)).toBe(1);
    terms.push("storm");
    expect(countTerms("The storm hit the harbour.", terms)).toBe(2);
  });

  it("exposes index-aligned needles, empty for terms with nothing to match", () => {
    expect(normalizedTerms(["Close-up", "!!", "his daughter's"])).toEqual([" close up ", "", " his daughter "]);
  });

  it("matches pre-normalised text and lists the matched terms once each, in order", () => {
    const hay = normalizeForMatch("She must get home before the storm, or lose the farm.");
    expect(countTermsNormalized(hay, LEXICON.stakes)).toBe(countTerms("She must get home before the storm, or lose the farm.", LEXICON.stakes));
    expect(matchedTerms("Lose it, lose all: before dawn.", ["before", "lose", "lose", "never"])).toEqual(["before", "lose"]);
    expect(hasAny("Nothing here.", [])).toBe(false);
    expect(hasAny("A dark night.", LEXICON.sensory)).toBe(true);
  });

  it("gives the same answers as normalising each term by hand", () => {
    const text = "Her father’s last chance: a close-up of the rain, or else the family loses everything.";
    for (const list of Object.values(LEXICON)) {
      const hay = normalizeForMatch(text);
      const expected = list.filter((t) => normalizeForMatch(t).trim() && hay.includes(normalizeForMatch(t))).length;
      expect(countTerms(text, list)).toBe(expected);
    }
  });
});

describe("performance on max-size and degenerate input", () => {
  const prose = (() => {
    const base =
      "Mara found the letter on a Tuesday, folded twice and tucked under the lamp. She didn't open it. Her brother's handwriting, the looping capitals, the ink that always smudged. ";
    return base.repeat(Math.ceil(30_000 / base.length)).slice(0, 30_000);
  })();
  const inputs: [string, string][] = [
    ["prose 30k", prose],
    ["'. ' x 15000", ". ".repeat(15_000)],
    ["'Hi. ' x 2000", "Hi. ".repeat(2000)],
    ["'a. ' x 10000", "a. ".repeat(10_000)],
    ["unpunctuated 30k", "and then the boat went out and ".repeat(1000)],
    ["CJK 30k", "女性がカフェに入る。".repeat(3000)],
  ];
  const context = [...LEXICON.conflict, ...LEXICON.desire];

  it.each(inputs)("every helper on %s stays well inside the budget", (_, text) => {
    const start = performance.now();
    sentences(text);
    words(text);
    for (const list of Object.values(LEXICON)) countTerms(text, list);
    countTermsInContext(text, LEXICON.stakes, context);
    averageSentenceLength(text);
    sentenceLengthVariance(text);
    lexicalVariety(text);
    firstLine(text);
    for (const sentence of sentences(text)) {
      for (const list of Object.values(LEXICON)) countTerms(sentence, list);
    }
    const ms = performance.now() - start;
    // Budget per demo call is 400 ms on the dev machine; this is one slice of it, with CI headroom.
    expect(ms).toBeLessThan(1000);
  });
});
