import { describe, expect, it } from "vitest";
import { LEXICON, countTerms, countTermsInContext, latinShare, normalizeForMatch, sentences, words } from "./text";

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
