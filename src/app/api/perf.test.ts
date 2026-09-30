/**
 * Every AI route in demo mode, end to end (guard, parsing, rate limit,
 * offline coach, finalising), on maximum-size and degenerate input. The
 * budget is 400 ms per call on a dev machine; the threshold here is
 * generous so slower CI machines don't flake, but a regression to the
 * multi-second event-loop stalls this guards against still fails.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { resetRateLimits } from "@/lib/request";
import { POST as chat } from "./coach/chat/route";
import { POST as evaluate } from "./coach/evaluate/route";
import { POST as daily } from "./daily/route";
import { POST as logline } from "./lab/logline/route";
import { POST as shots } from "./lab/shots/route";
import { POST as story } from "./lab/story/route";

const THRESHOLD_MS = 1000;

const previousMode = process.env.ODYSSEUSX_MODE;
beforeAll(() => {
  process.env.ODYSSEUSX_MODE = "demo";
});
afterAll(() => {
  if (previousMode === undefined) delete process.env.ODYSSEUSX_MODE;
  else process.env.ODYSSEUSX_MODE = previousMode;
});
afterEach(() => resetRateLimits());

function post(body: unknown): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PROSE =
  "Mara found the letter on a Tuesday, folded twice and tucked under the lamp. She didn't open it; she wanted to, but her brother's handwriting stopped her cold. " +
  "\"You kept it,\" Joe said from the doorway. She turned. Rain hammered the window and the kettle began to scream. If she read it, she would lose the house, the farm, everything. ";

/** Text of exactly `length` characters built from `unit`. */
const fill = (unit: string, length: number) => unit.repeat(Math.ceil(length / unit.length)).slice(0, length).trim();

const SHAPES: [string, string][] = [
  ["prose", PROSE],
  ["'. ' repeated", ". "],
  ["'Hi. ' repeated", "Hi. "],
  ["'a. ' repeated", "a. "],
  ["unpunctuated", "and then the boat went out again "],
];

async function timed(call: () => Promise<Response>): Promise<{ ms: number; status: number }> {
  const start = performance.now();
  const res = await call();
  await res.text(); // include streaming and serialisation
  return { ms: performance.now() - start, status: res.status };
}

describe("demo routes stay fast on the largest valid input", () => {
  it.each(SHAPES)("story, logline, shots and daily: %s", async (_, unit) => {
    const results = [
      await timed(() => story(post({ text: fill(unit, 30_000), framework: "save-the-cat", format: "feature" }))),
      await timed(() => story(post({ text: fill(unit, 30_000), framework: "heros-journey", format: "short-film" }))),
      await timed(() => logline(post({ logline: fill(unit, 1200) }))),
      await timed(() => shots(post({ scene: fill(unit, 12_000), intent: fill(unit, 1000), userShots: fill(unit, 4000) }))),
      await timed(() => daily(post({ promptId: "six-word-story", response: fill(unit, 4000) }))),
    ];
    for (const r of results) {
      expect([200, 422]).toContain(r.status);
      expect(r.ms).toBeLessThan(THRESHOLD_MS);
    }
  });

  it.each(SHAPES)("practice chat and scorecard, 80 × 8,000 characters: %s", async (_, unit) => {
    const content = fill(unit, 8000);
    const messages = Array.from({ length: 80 }, (_, i) => ({ role: i % 2 === 0 ? "persona" : "user", content }));
    const body = { scenarioId: "elevator-pitch", messages };
    const scored = await timed(() => evaluate(post(body)));
    expect(scored.status).toBe(200);
    expect(scored.ms).toBeLessThan(THRESHOLD_MS);
    // Chat streams its reply with deliberate pauses between words, so time only the work before the first byte.
    const start = performance.now();
    const res = await chat(post(body));
    expect(res.status).toBe(200);
    expect(performance.now() - start).toBeLessThan(THRESHOLD_MS);
    await res.body?.cancel();
  });
});
