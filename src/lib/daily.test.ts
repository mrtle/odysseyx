import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS, getDailyPrompt } from "@/content/daily-prompts";
import { SKILL_IDS, isSkillId } from "@/lib/skills";
import type { DailyEntry } from "@/lib/types";
import {
  checkConstraints,
  countParagraphs,
  countWords,
  dailyEntryMode,
  dailyHistory,
  dailyPromptFor,
  dailyPromptIndex,
  dialogueShape,
  findTerms,
  formatCountdown,
  localDayNumber,
  msUntilNextDay,
  pickForDay,
  promptStride,
  type DailyEntryWithMode,
  type DailyRule,
} from "./daily";

const byId = (checks: ReturnType<typeof checkConstraints>, id: string) => {
  const check = checks.find((c) => c.id === id);
  if (!check) throw new Error(`missing check ${id}`);
  return check;
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

describe("DAILY_PROMPTS", () => {
  it("has at least 35 prompts with unique kebab-case ids", () => {
    expect(DAILY_PROMPTS.length).toBeGreaterThanOrEqual(35);
    const ids = DAILY_PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("fills every field with real copy", () => {
    for (const p of DAILY_PROMPTS) {
      expect(p.title.trim().length, p.id).toBeGreaterThan(3);
      expect(p.prompt.trim().length, p.id).toBeGreaterThan(20);
      expect(p.constraint.trim().length, p.id).toBeGreaterThan(8);
      expect(isSkillId(p.skill), p.id).toBe(true);
    }
  });

  it("trains every skill at least four times", () => {
    for (const skill of SKILL_IDS) {
      expect(DAILY_PROMPTS.filter((p) => p.skill === skill).length, skill).toBeGreaterThanOrEqual(4);
    }
  });

  it("has internally consistent rules", () => {
    for (const p of DAILY_PROMPTS) {
      const rule = p.rule;
      if (!rule) continue;
      for (const range of [rule.words, rule.sentences, rule.lines, rule.paragraphs]) {
        if (!range) continue;
        expect(range.min ?? 0, p.id).toBeGreaterThanOrEqual(0);
        if (range.min !== undefined && range.max !== undefined) expect(range.min, p.id).toBeLessThanOrEqual(range.max);
      }
      expect(rule.dialogueOnly && rule.noDialogue, p.id).toBeFalsy();
      // A rule's word ceiling must leave room for the API's 10-character minimum.
      if (rule.words?.max !== undefined) expect(rule.words.max, p.id).toBeGreaterThanOrEqual(6);
    }
  });

  it("looks prompts up by id", () => {
    expect(getDailyPrompt("six-word-story")?.title).toBe("Six Words");
    expect(getDailyPrompt("lost-key")?.rule?.words).toEqual({ min: 50, max: 50 });
    expect(getDailyPrompt("nope")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Counting helpers
// ---------------------------------------------------------------------------

describe("counting", () => {
  it("counts words like a writer: punctuation-only tokens don't count, hyphenations count once", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
    expect(countWords("Baby shoes for sale, never worn.")).toBe(6);
    expect(countWords("She ran — fast — into the dark.")).toBe(6);
    expect(countWords("A six-word story isn't easy.")).toBe(5);
    expect(countWords("Line one\nline two")).toBe(4);
    expect(countWords("Café 42 déjà-vu")).toBe(3);
  });

  it("counts paragraphs by blank lines, or by lines when there are none", () => {
    expect(countParagraphs("One.\n\nTwo.\n\nThree.")).toBe(3);
    expect(countParagraphs("One.\nTwo.\nThree.\nFour.")).toBe(4);
    expect(countParagraphs("Just one paragraph with a few words.")).toBe(1);
  });

  it("finds whole words and phrases only", () => {
    expect(findTerms("She needed the needle.", ["need", "needed"])).toEqual(["needed"]);
    expect(findTerms("I Feel fine", ["feel"])).toEqual(["feel"]);
    expect(findTerms("Once upon a time, a fox.", ["once upon a time", "one day"])).toEqual(["once upon a time"]);
    expect(findTerms("It’s over", ["it's"])).toEqual(["it's"]);
  });

  it("classifies dialogue lines", () => {
    expect(dialogueShape('"Hi."\n"Hello."')).toEqual({ speech: 2, narration: 0, parentheticals: 0 });
    expect(dialogueShape("“You kept it.”\n“It was in a pocket.”")).toMatchObject({ speech: 2 });
    expect(dialogueShape("MAYA: You're late.\nTOM: I'm early for tomorrow.\n(beat)")).toEqual({
      speech: 2,
      narration: 0,
      parentheticals: 1,
    });
    expect(dialogueShape("— Where were you?\n— Out.")).toMatchObject({ speech: 2, narration: 0 });
    expect(dialogueShape("MAYA (quietly): You kept it.\nTOM (V.O.): It was in a pocket.")).toMatchObject({
      speech: 2,
      narration: 0,
    });
    expect(dialogueShape('"Fine."\nShe slammed the door.')).toEqual({ speech: 1, narration: 1, parentheticals: 0 });
  });
});

// ---------------------------------------------------------------------------
// checkConstraints
// ---------------------------------------------------------------------------

describe("checkConstraints", () => {
  it("returns nothing without a rule", () => {
    expect(checkConstraints(undefined, "Anything at all.")).toEqual([]);
    expect(checkConstraints({}, "Anything at all.")).toEqual([]);
  });

  it("checks exact word counts", () => {
    const rule: DailyRule = { words: { min: 6, max: 6 } };
    const exact = byId(checkConstraints(rule, "Baby shoes for sale, never worn."), "words");
    expect(exact).toMatchObject({ met: true, label: "Exactly 6 words", detail: "6 of 6 words" });
    const long = byId(checkConstraints(rule, "Baby shoes for sale, never worn, sadly."), "words");
    expect(long).toMatchObject({ met: false, detail: "7 of 6 words" });
  });

  it("checks word ceilings and floors", () => {
    const max = byId(checkConstraints({ words: { max: 5 } }, "one two three four five six seven"), "words");
    expect(max).toMatchObject({ met: false, label: "5 words max", detail: "7 words — 2 over" });
    expect(byId(checkConstraints({ words: { max: 5 } }, "one two three"), "words").met).toBe(true);
    const range = byId(checkConstraints({ words: { min: 4, max: 8 } }, "one two"), "words");
    expect(range).toMatchObject({ met: false, label: "4–8 words", detail: "2 words — 2 to go" });
    expect(byId(checkConstraints({ words: { min: 2 } }, "one two"), "words")).toMatchObject({
      met: true,
      label: "At least 2 words",
    });
  });

  it("checks sentences, lines and paragraphs", () => {
    const text = "The door opens. Nobody enters. The lights go out.";
    expect(byId(checkConstraints({ sentences: { min: 3, max: 3 } }, text), "sentences").met).toBe(true);
    expect(byId(checkConstraints({ sentences: { max: 1 } }, text), "sentences").met).toBe(false);
    expect(byId(checkConstraints({ lines: { min: 3, max: 3 } }, "WIDE: a\nMEDIUM: b\nCLOSE: c"), "lines").met).toBe(true);
    expect(byId(checkConstraints({ lines: { max: 2 } }, "a\n\nb\n\nc"), "lines").met).toBe(false);
    expect(byId(checkConstraints({ paragraphs: { min: 4, max: 4 } }, "a.\n\nb.\n\nc.\n\nd."), "paragraphs").met).toBe(true);
  });

  it("checks the longest and the last sentence", () => {
    const toast =
      "Raise your glasses. I have known this couple for exactly eleven minutes and I already think they will be very happy together for many years.";
    expect(byId(checkConstraints({ maxSentenceWords: 20 }, toast), "max-sentence")).toMatchObject({
      met: false,
      detail: "Longest sentence: 22 words",
    });
    expect(byId(checkConstraints({ maxSentenceWords: 20 }, "Short. Sweet."), "max-sentence").met).toBe(true);
    expect(
      byId(checkConstraints({ lastSentenceMaxWords: 3 }, "She ran and ran through the market. Gone."), "last-sentence").met,
    ).toBe(true);
    expect(
      byId(checkConstraints({ lastSentenceMaxWords: 3 }, "She ran. Then she stopped running entirely."), "last-sentence").met,
    ).toBe(false);
    expect(byId(checkConstraints({ lastSentenceMaxWords: 3 }, ""), "last-sentence").met).toBe(false);
  });

  it("checks dialogue-only and no-dialogue", () => {
    expect(byId(checkConstraints({ dialogueOnly: true }, '"You kept it."\n"It was in a pocket."'), "dialogue-only").met).toBe(
      true,
    );
    const narrated = byId(
      checkConstraints({ dialogueOnly: true }, '"You kept it."\n"It was in a pocket."\nShe looked away.'),
      "dialogue-only",
    );
    expect(narrated).toMatchObject({ met: false, detail: "1 line of narration" });
    expect(byId(checkConstraints({ dialogueOnly: true }, '"Just one line."'), "dialogue-only").met).toBe(false);
    expect(byId(checkConstraints({ noDialogue: true }, "He folds her letter into a boat."), "no-dialogue").met).toBe(true);
    expect(byId(checkConstraints({ noDialogue: true }, 'He says "goodbye".'), "no-dialogue").met).toBe(false);
    // Apostrophes aren't dialogue.
    expect(byId(checkConstraints({ noDialogue: true }, "She doesn't look back."), "no-dialogue").met).toBe(true);
  });

  it("checks banned words, reporting which were used", () => {
    const rule: DailyRule = { forbidden: ["want", "wanted", "need"] };
    expect(byId(checkConstraints(rule, "You kept the ticket."), "forbidden")).toMatchObject({ met: true, detail: "None used" });
    expect(byId(checkConstraints(rule, "I wanted you to need me."), "forbidden")).toMatchObject({
      met: false,
      detail: "Used “wanted” and “need”",
    });
    expect(byId(checkConstraints({ ...rule, forbiddenLabel: "No wanting" }, "x"), "forbidden").label).toBe("No wanting");
  });

  it("checks required phrases, optionally in order", () => {
    const spine = getDailyPrompt("story-spine")!.rule!;
    const good =
      "Once upon a time there was a baker. Every day she burned the bread. One day a critic came. Because of that, she panicked. Because of that, she baked blind. Until finally the loaf was perfect. Ever since then she bakes with her eyes closed.";
    expect(byId(checkConstraints(spine, good), "required")).toMatchObject({ met: true, detail: "All 6 present" });
    const missing = good.replace("Until finally", "At last");
    expect(byId(checkConstraints(spine, missing), "required")).toMatchObject({ met: false, detail: "Missing “until finally”" });
    const shuffled = "One day it began. Once upon a time. Every day. Because of that. Until finally. Ever since.";
    expect(byId(checkConstraints(spine, shuffled), "required")).toMatchObject({
      met: false,
      detail: "All present, but out of order",
    });
    expect(byId(checkConstraints({ required: ["cut to"] }, "Laughter. CUT TO: silence."), "required").met).toBe(true);
  });

  it("returns checks in a stable order", () => {
    const rule: DailyRule = { forbidden: ["x"], words: { max: 10 }, dialogueOnly: true, sentences: { max: 3 } };
    expect(checkConstraints(rule, '"a"\n"b"').map((c) => c.id)).toEqual(["words", "sentences", "dialogue-only", "forbidden"]);
  });

  it("accepts a model answer for every prompt whose rule is purely about length", () => {
    // Sanity check that exact-count briefs are achievable with ordinary prose.
    const fifty = Array.from({ length: 50 }, (_, i) => (i === 49 ? "end." : "word")).join(" ");
    expect(checkConstraints(getDailyPrompt("lost-key")!.rule, fifty).every((c) => c.met)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Today's prompt
// ---------------------------------------------------------------------------

describe("dailyPromptFor", () => {
  const day = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);

  it("is stable for the whole local calendar day", () => {
    const early = dailyPromptFor(new Date(2026, 8, 30, 0, 0, 1));
    const late = dailyPromptFor(new Date(2026, 8, 30, 23, 59, 59));
    expect(early.id).toBe(late.id);
  });

  it("changes from one day to the next", () => {
    for (let d = 1; d <= 60; d++) {
      const today = dailyPromptFor(day(2026, 1, d));
      const tomorrow = dailyPromptFor(day(2026, 1, d + 1));
      expect(tomorrow.id).not.toBe(today.id);
    }
  });

  it("visits every prompt exactly once per cycle", () => {
    const seen = new Map<string, number>();
    for (let i = 0; i < DAILY_PROMPTS.length; i++) {
      const p = dailyPromptFor(day(2026, 9, 1 + i));
      seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
    }
    expect(seen.size).toBe(DAILY_PROMPTS.length);
    expect([...seen.values()].every((n) => n === 1)).toBe(true);
  });

  it("repeats the cycle after one full pass", () => {
    const start = day(2026, 3, 10);
    const later = day(2026, 3, 10 + DAILY_PROMPTS.length);
    expect(dailyPromptFor(later).id).toBe(dailyPromptFor(start).id);
  });

  it("keys on the local date, across month and year boundaries", () => {
    expect(localDayNumber(day(2026, 2, 1)) - localDayNumber(day(2026, 1, 31))).toBe(1);
    expect(localDayNumber(day(2027, 1, 1, 0, 5)) - localDayNumber(day(2026, 12, 31, 23, 55))).toBe(1);
    expect(localDayNumber(day(2028, 3, 1)) - localDayNumber(day(2028, 2, 28))).toBe(2); // leap day between
  });

  it("uses a stride coprime with the list length", () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (let n = 1; n <= 80; n++) expect(gcd(promptStride(n), n), `n=${n}`).toBe(1);
  });

  it("always returns an index inside the list, even for pre-epoch dates", () => {
    for (const date of [day(1969, 7, 20), day(1900, 1, 1), day(2100, 6, 15)]) {
      const i = dailyPromptIndex(date, 37);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(37);
    }
    expect(dailyPromptIndex(day(2026, 1, 1), 0)).toBe(0);
  });

  it("pickForDay works on any list and rejects empty ones", () => {
    expect(pickForDay(day(2026, 1, 1), ["only"])).toBe("only");
    expect(() => pickForDay(day(2026, 1, 1), [])).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Countdown and entries
// ---------------------------------------------------------------------------

describe("countdown", () => {
  it("measures time to the next local midnight", () => {
    expect(msUntilNextDay(new Date(2026, 8, 30, 23, 59, 30))).toBe(30_000);
    expect(msUntilNextDay(new Date(2026, 8, 30, 0, 0, 0))).toBe(24 * 3_600_000);
    expect(msUntilNextDay(new Date(2026, 11, 31, 18, 0, 0))).toBe(6 * 3_600_000);
  });

  it("formats compactly", () => {
    expect(formatCountdown(5 * 3_600_000 + 12 * 60_000 + 30_000)).toBe("5h 12m");
    expect(formatCountdown(3 * 3_600_000 + 5 * 60_000)).toBe("3h 05m");
    expect(formatCountdown(12 * 60_000 + 5_000)).toBe("12m 05s");
    expect(formatCountdown(42_000)).toBe("42s");
    expect(formatCountdown(-5)).toBe("0s");
  });
});

describe("daily entries", () => {
  const feedback = { score: 70, praise: "p", nudge: "n", tryThis: "t", skill: "hook" as const };

  it("reads the coach mode stored alongside an entry", () => {
    const withMode: DailyEntryWithMode = { promptId: "a", date: "2026-09-30", response: "r", feedback, mode: "demo" };
    expect(dailyEntryMode(withMode)).toBe("demo");
    expect(dailyEntryMode({ promptId: "a", date: "2026-09-30", response: "r" })).toBeUndefined();
    expect(dailyEntryMode({ promptId: "a", date: "2026-09-30", response: "r", mode: "bogus" } as unknown as DailyEntry)).toBeUndefined();
    expect(dailyEntryMode(undefined)).toBeUndefined();
  });

  it("lists entries with feedback, newest first", () => {
    const daily: Record<string, DailyEntry> = {
      "2026-09-28": { promptId: "a", date: "2026-09-28", response: "r", feedback },
      "2026-09-30": { promptId: "b", date: "2026-09-30", response: "r", feedback },
      "2026-09-29": { promptId: "c", date: "2026-09-29", response: "r" },
    };
    expect(dailyHistory(daily).map((e) => e.date)).toEqual(["2026-09-30", "2026-09-28"]);
  });
});
