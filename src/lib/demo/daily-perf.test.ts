/**
 * Performance guard for the offline daily coach: every prompt, on a
 * 4,000-character response (the schema's maximum), including degenerate
 * text. The budget is 400 ms per call; measured worst cases on a dev machine
 * are around 10 ms. The threshold is generous so a slow CI runner doesn't
 * flake, while a quadratic regression still fails.
 */
import { describe, expect, it } from "vitest";
import { DAILY_PROMPTS } from "@/content/daily-prompts";
import { demoDailyFeedback } from "./daily";

const THRESHOLD_MS = 1000;

const fill = (unit: string, length: number) => unit.repeat(Math.ceil(length / unit.length)).slice(0, length);

const SHAPES: [string, string][] = [
  ["prose", "Rain on the kitchen window all week. Her father's mug stays on the drying rack, upside down, dry. \"You kept it,\" she says. The kettle clicks off. "],
  ["'. ' repeated", ". "],
  ["'Hi. ' repeated", "Hi. "],
  ["dialogue lines", "A: I need you to stay.\nB: Why?\n"],
  ["emotion words", "grief love Hope Called Grief counselling "],
  ["unpunctuated", "and then the boat went out again "],
];

describe("offline daily coach stays fast on the largest valid response", () => {
  it.each(SHAPES)("%s", (_, unit) => {
    const response = fill(unit, 4000);
    let worst = 0;
    let worstId = "";
    for (const p of DAILY_PROMPTS) {
      const start = performance.now();
      demoDailyFeedback(p, { response });
      const ms = performance.now() - start;
      if (ms > worst) {
        worst = ms;
        worstId = p.id;
      }
    }
    expect(worst, `${worstId}: ${worst.toFixed(0)} ms`).toBeLessThan(THRESHOLD_MS);
  });
});
