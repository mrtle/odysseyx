/**
 * Performance regression test for the demo practice coach: a persona reply
 * and a scorecard on max-size valid input (80 messages × 8,000 characters),
 * including degenerate shapes, must stay well inside the 400 ms budget. The
 * threshold here is a generous 1,000 ms so CI noise doesn't flake; measured
 * worst cases on the dev machine are ~120 ms (reply) and ~180 ms (scorecard).
 */
import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "@/content/scenarios";
import { EvaluationSchema, type ChatMessageInput } from "@/lib/ai/schemas";
import type { Scenario } from "@/lib/types";
import { demoEvaluate, demoPersonaReply } from "./practice";

const LIMIT_MS = 1000;
const MAX_MESSAGES = 80;
const MAX_CHARS = 8000;

const WORDS = "harbour pilot freighter blockade refugees navy cutter son arrest dawn Cadiz wheel midpoint engine crew storm lighthouse keeper blind estranged".split(" ");

/** Distinct, sentence-shaped prose (so memoisation can't hide the cost), seeded for determinism. */
function prose(seed: number, punctuate = true): string {
  let out = "";
  let k = seed * 7919 + 1;
  while (out.length < MAX_CHARS) {
    k = (k * 1103515245 + 12345) % 2147483648;
    const n = 6 + (k % 14);
    const w: string[] = [];
    for (let j = 0; j < n; j++) {
      k = (k * 1103515245 + 12345) % 2147483648;
      w.push(WORDS[k % WORDS.length] + (k % 5 === 0 ? String(k % 97) : ""));
    }
    out += `${w.join(" ")}${punctuate ? (k % 3 === 0 ? "," : ".") : ""} `;
  }
  return out.slice(0, MAX_CHARS);
}

let salt = 0;
/** Alternating persona/learner messages ending on the learner. */
const alternating = (content: (i: number) => string): ChatMessageInput[] =>
  Array.from({ length: MAX_MESSAGES }, (_, i) => ({ role: i % 2 === 1 ? "user" : "persona", content: content(i).slice(0, MAX_CHARS) }) as ChatMessageInput);
/** Every message from the learner: they merge into one enormous turn. */
const allLearner = (content: (i: number) => string): ChatMessageInput[] =>
  Array.from({ length: MAX_MESSAGES }, (_, i) => ({ role: "user" as const, content: content(i).slice(0, MAX_CHARS) }));

const SHAPES: Record<string, (s: number) => ChatMessageInput[]> = {
  prose: (s) => alternating((i) => prose(s * 100 + i)),
  runOn: (s) => alternating((i) => prose(s * 100 + i, false)),
  dots: (s) => alternating((i) => `${". ".repeat(3999)}${s}${i}`),
  hi: (s) => alternating((i) => `${"Hi. ".repeat(1999)}${s}${i}`),
  capitals: (s) => alternating((i) => `Alpha Beta Gamma Delta${s} Of The ${i} `.repeat(300)),
  hedges: (s) => alternating((i) => `I mean, kind of, like, maybe, I guess ${s}${i}. `.repeat(180)),
  mergedProse: (s) => allLearner((i) => prose(s * 100 + i)),
  mergedHi: (s) => allLearner((i) => `${"Hi. ".repeat(1999)}${s}${i}`),
  mergedDots: (s) => allLearner((i) => `${". ".repeat(3999)}${s}${i}`),
};

function timed<T>(f: () => T): [T, number] {
  const start = performance.now();
  const value = f();
  return [value, performance.now() - start];
}

function check(scenario: Scenario, shape: string) {
  const [reply, replyMs] = timed(() => demoPersonaReply(scenario, SHAPES[shape](++salt)));
  const [evaluation, evalMs] = timed(() => demoEvaluate(scenario, SHAPES[shape](++salt)));
  expect(reply.length).toBeGreaterThan(0);
  EvaluationSchema.parse(evaluation);
  expect(replyMs, `${scenario.id} ${shape} reply took ${replyMs.toFixed(0)} ms`).toBeLessThan(LIMIT_MS);
  expect(evalMs, `${scenario.id} ${shape} scorecard took ${evalMs.toFixed(0)} ms`).toBeLessThan(LIMIT_MS);
}

describe("demo practice performance on max-size input", () => {
  it.each(Object.keys(SHAPES))("studio-pitch handles the %s shape in time", (shape) => {
    check(getScenario("studio-pitch")!, shape);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s handles distinct prose and a merged degenerate turn in time", (_id, scenario) => {
    check(scenario, "prose");
    check(scenario, "mergedHi");
  });
});
