/**
 * Performance guard for the offline Story Lab coaches. The budget is 400 ms
 * per call on max-size valid input (story 30,000 chars, scene 12,000 with a
 * 1,000-char intent and 4,000 chars of shot ideas, logline 1,200), including
 * degenerate text. Measured worst cases on a dev machine are well under
 * 150 ms; the threshold here is generous so a slow CI runner doesn't flake,
 * while a return to per-sentence lexicon normalisation or quadratic scans
 * still fails.
 */
import { describe, expect, it } from "vitest";
import { FRAMEWORK_IDS } from "@/lib/frameworks";
import { demoLogline, demoShots, demoStory } from "./lab";

const THRESHOLD_MS = 1000;

/** Text of exactly `length` characters built from `unit`. */
const fill = (unit: string, length: number) => unit.repeat(Math.ceil(length / unit.length)).slice(0, length);

const PROSE =
  "Every night for eleven years, Delia has piloted the last ferry across the harbour. Tonight a boy is hiding under the benches, soaked and shaking. " +
  "The radio crackles: the harbour police are searching for a missing child. \"Please don't,\" he says. She is afraid of losing her license. She lies. ";
const SCREENPLAY = "INT. DINER - NIGHT\n\nRain streaks the window. NADIA (30s) wipes the counter.\n\nNADIA\nYou sold it.\n\nSAM\n(not looking up)\nI sold the truck.\n\nShe slams the coffee pot down. He leaps.\n\n";

const SHAPES: [string, string][] = [
  ["prose", PROSE],
  ["screenplay", SCREENPLAY],
  ["'. ' repeated", ". "],
  ["'Hi. ' repeated", "Hi. "],
  ["unpunctuated", "every morning my grandmother fed the crows and she gave each one a name and then "],
  ["capitalised names", "Maria Okafor Sam Leo Kai "],
  ["short cues", "SAM\nHi\n\n"],
  ["inline cues", "SAM: Hi.\n"],
  ["role subjects", "A woman in a red coat stops. She cries. The suspect laughs. Dead end. "],
  ["quoted speech", '"Hi," she said. '],
];

function worst(call: () => unknown, runs = 2): number {
  let max = 0;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    call();
    max = Math.max(max, performance.now() - start);
  }
  return max;
}

describe("offline Story Lab stays fast on the largest valid input", () => {
  it.each(SHAPES)("Story Doctor: %s", (_, unit) => {
    const text = fill(unit, 30_000);
    for (const framework of FRAMEWORK_IDS) {
      const ms = worst(() => demoStory({ text, framework, format: "feature" }));
      expect(ms, `${framework}: ${ms.toFixed(0)} ms`).toBeLessThan(THRESHOLD_MS);
    }
  });

  it.each(SHAPES)("Shot Planner: %s", (_, unit) => {
    const userShots = fill("Over-the-shoulder of Sam at the door as she leaves with the keys\n", 4000);
    const ms = worst(() => demoShots({ scene: fill(unit, 12_000), intent: fill("tense, quiet dread ", 1000), userShots }));
    expect(ms, `${ms.toFixed(0)} ms`).toBeLessThan(THRESHOLD_MS);
  });

  it.each([...SHAPES, ["commas", ", "], ["appositives", "When Maya Okafor, a disgraced ferry captain, learns her crew is smuggling refugees, "]] as [string, string][])(
    "Logline Doctor: %s",
    (_, unit) => {
      const ms = worst(() => demoLogline({ logline: fill(unit, 1200) }), 3);
      expect(ms, `${ms.toFixed(0)} ms`).toBeLessThan(THRESHOLD_MS);
    },
  );
});
