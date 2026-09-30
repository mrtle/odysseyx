/**
 * Held-out evaluation of the demo practice coach: for every scenario, new
 * thoughtful-specific, vague-jargon, lazy, rude/off-topic and
 * on-topic-own-project transcripts (HELD_OUT, written separately from the
 * fixtures and model answers) must rank in the right order by clear margins,
 * get headlines that match what happened, and never make the persona echo a
 * broken fragment or repeat itself.
 */
import { describe, expect, it } from "vitest";
import { SCENARIOS } from "@/content/scenarios";
import type { ChatMessageInput, Evaluation } from "@/lib/ai/schemas";
import { EvaluationSchema } from "@/lib/ai/schemas";
import type { Scenario } from "@/lib/types";
import { classifyMove, demoEvaluate, demoPersonaTurn, demoScriptFor, type DemoTurn } from "./practice";
import { HELD_OUT, type HeldOutKind } from "./practice-fixtures";

interface Run {
  messages: ChatMessageInput[];
  turns: { line: string; turn: DemoTurn }[];
  evaluation: Evaluation;
}

/** Play learner lines through the persona, then score the transcript. */
function run(scenario: Scenario, lines: string[]): Run {
  const messages: ChatMessageInput[] = [{ role: "persona", content: scenario.openingLine }];
  const turns: Run["turns"] = [];
  for (const line of lines) {
    messages.push({ role: "user", content: line });
    const turn = demoPersonaTurn(scenario, messages);
    turns.push({ line, turn });
    messages.push({ role: "persona", content: turn.text });
  }
  return { messages, turns, evaluation: EvaluationSchema.parse(demoEvaluate(scenario, messages)) };
}

const KINDS: HeldOutKind[] = ["specific", "jargon", "lazy", "rude", "own"];
const runs = new Map<string, Record<HeldOutKind, Run>>();
function runsFor(scenario: Scenario): Record<HeldOutKind, Run> {
  let found = runs.get(scenario.id);
  if (!found) {
    found = Object.fromEntries(KINDS.map((kind) => [kind, run(scenario, HELD_OUT[scenario.id][kind])])) as Record<HeldOutKind, Run>;
    runs.set(scenario.id, found);
  }
  return found;
}

/** Words an echo must never end on: prepositions, conjunctions, pronouns and adverbs ("clapping except", "blockade herself"). */
const BAD_ENDINGS = new Set(
  (
    "except besides despite of to in on at by for with from about into onto over under and or but so because than as " +
    "him her them it me us you herself himself themselves myself yourself itself ourselves forward away back up down out"
  ).split(" "),
);
/** Craft vocabulary and evaluative filler: a phrase made only of these is jargon, not something the learner specifically said. */
const CRAFT = new Set(
  (
    "hook stakes conflict irony protagonist hero heroine villain antagonist midpoint climax twist reversal arc journey theme plot " +
    "character characters story scene structure beat act logline premise strong huge big emotional compelling powerful great real " +
    "high massive unique fresh original commercial best"
  ).split(" "),
);
const PLEASANTRY = /^(?:fair|good|great|smart|nice|lovely)\s+(?:question|point|note|call|idea)s?$|\bthank/i;
const JOINERS = new Set(["of", "the", "and", "or", "by", "is", "in", "a", "an", "at", "on", "to", "for"]);

/** Why an echoed phrase is broken, or null when it's a clean noun phrase from the learner's line. */
function echoProblem(phrase: string, source: string): string | null {
  const w = phrase.toLowerCase().replace(/[.,!?]+$/, "").split(/\s+/);
  if (BAD_ENDINGS.has(w[w.length - 1])) return "ends on a function word";
  if (w.every((x) => CRAFT.has(x.replace(/'s$/, "")))) return "craft jargon";
  if (PLEASANTRY.test(phrase)) return "pleasantry";
  // A span that starts or ends inside a longer capitalised title ("Lost meets Manchester" from "All Is Lost meets Manchester by the Sea").
  const tokens = source.split(/\s+/).map((t) => t.replace(/^[“"‘'(]+|[”"’'),.;:!?—–]+$/g, ""));
  const first = phrase.split(/\s+/)[0].replace(/[.,!?]+$/, "");
  const last = phrase.split(/\s+/).slice(-1)[0].replace(/[.,!?]+$/, "");
  const cap = (t: string | undefined) => !!t && /^[A-Z]/.test(t) && t !== "I";
  // Capitalisation is read from the learner's words: the persona capitalises an echo that opens its sentence.
  const start = tokens.findIndex((t) => t.toLowerCase() === first.toLowerCase());
  if (start > 0 && cap(tokens[start]) && (cap(tokens[start - 1]) || (JOINERS.has(tokens[start - 1]?.toLowerCase() ?? "") && cap(tokens[start - 2])))) {
    if (!/[.!?]$/.test(source.split(/\s+/)[start - 1] ?? "")) return "starts inside a title";
  }
  const end = tokens.findIndex((t, i) => i >= Math.max(0, start) && t.toLowerCase() === last.toLowerCase());
  if (end >= 0 && cap(tokens[end]) && (cap(tokens[end + 1]) || (JOINERS.has(tokens[end + 1]?.toLowerCase() ?? "") && cap(tokens[end + 2])))) return "ends inside a title";
  return null;
}

/** Quoted spans in a persona reply that come from the learner's own line (not the script's own quotes or a hedge/buzzword echo). */
function echoesIn(reply: string, line: string): string[] {
  const hedgeOrBuzz = /^(?:kind of|sort of|i guess|maybe|i think|basically|probably|actually|literally|revolutionize|revolutionise|disrupt|platform|synergy|leverage|scalable|ecosystem|innovative|paradigm)$/i;
  return [...reply.matchAll(/“([^”]+)”/g)]
    .map((m) => m[1].replace(/[.,!?]+$/, ""))
    .filter((span) => !hedgeOrBuzz.test(span) && line.toLowerCase().includes(span.toLowerCase()));
}

const isNudge = (text: string) => /^\(.*the scene's over/.test(text);

describe("held-out evaluation: ranking", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s ranks specific > jargon ≥ lazy > rude, and own-project runs with specific ones", (_id, scenario) => {
    const r = runsFor(scenario);
    const score = (kind: HeldOutKind) => r[kind].evaluation.overall;
    const report = KINDS.map((k) => `${k}=${score(k)}`).join(" ");
    expect(score("specific"), report).toBeGreaterThanOrEqual(70);
    expect(score("own"), report).toBeGreaterThanOrEqual(65);
    expect(score("specific") - score("jargon"), report).toBeGreaterThanOrEqual(15);
    expect(score("own") - score("jargon"), report).toBeGreaterThanOrEqual(15);
    expect(score("jargon"), report).toBeGreaterThanOrEqual(score("lazy"));
    expect(score("lazy") - score("rude"), report).toBeGreaterThanOrEqual(5);
    // Craft jargon never reaches the strong band on any skill.
    for (const s of r.jargon.evaluation.skillScores) expect(s.score, `${scenario.id} jargon ${s.skill}`).toBeLessThan(60);
  });
});

describe("held-out evaluation: the scorecard matches the transcript", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s never calls an on-topic run off-topic, and names what went wrong in the others", (_id, scenario) => {
    const r = runsFor(scenario);
    for (const kind of ["specific", "own"] as const) {
      const { evaluation, turns } = r[kind];
      for (const { line } of turns) expect(classifyMove(scenario, line), `${scenario.id} ${kind}: ${line}`).not.toMatch(/offtopic|rude|vague/);
      expect(evaluation.headline, `${scenario.id} ${kind}`).not.toMatch(/drifting|pushing|craft talk|too thin|out loud|deck-speak|results to play/i);
      expect(evaluation.summary, `${scenario.id} ${kind}`).not.toMatch(/wandered off topic|pushed back/);
      expect(evaluation.improvements.map((i) => i.title), `${scenario.id} ${kind}`).not.toContain("Stay in the scene");
      expect(evaluation.bestMoment, `${scenario.id} ${kind}`).not.toBe("");
    }
    expect(r.rude.evaluation.headline, scenario.id).toMatch(/pushing|drifting/);
    expect(r.jargon.evaluation.headline, scenario.id).toMatch(/craft talk|out loud|deck-speak|results to play/i);
    expect(r.jargon.evaluation.bestMoment, scenario.id).toBe("");
    for (const kind of ["jargon", "lazy", "rude"] as const) {
      expect(r[kind].evaluation.strengths.join(" "), `${scenario.id} ${kind}`).not.toMatch(/stayed in the scene|Almost no hedging|stakes had teeth/);
    }
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s never praises jargon or wraps a jargon run up as a win", (_id, scenario) => {
    const script = demoScriptFor(scenario);
    const { turns } = runsFor(scenario).jargon;
    const strongCores = script.strong.map((line) => line.replace(/“?\{phrase\}\.?”?/g, "").replace(/^[\s.,—-]+|[\s.,—-]+$/g, "")).filter((core) => core.length > 8);
    for (const { line, turn } of turns) {
      if (turn.kind === "wrap") {
        const good = script.wrapGood.map((w) => w.split("{phrase}")[0].slice(0, 24));
        expect(good.some((start) => turn.text.startsWith(start)), `${scenario.id} wrap: ${turn.text}`).toBe(false);
        continue;
      }
      if (classifyMove(scenario, line) !== "vague") continue;
      expect(echoesIn(turn.text, line), `${scenario.id}: ${turn.text}`).toEqual([]);
      for (const core of strongCores) expect(turn.text, `${scenario.id}: ${turn.text}`).not.toContain(core);
    }
  });
});

describe("held-out evaluation: the persona", () => {
  it("the echo checker itself flags the broken echoes from the field reports", () => {
    expect(echoProblem("Lost meets Manchester", "Comps are All Is Lost meets Manchester by the Sea.")).not.toBeNull();
    expect(echoProblem("Clapping except", "everyone was clapping except him")).not.toBeNull();
    expect(echoProblem("Blockade herself", "past the navy blockade herself")).not.toBeNull();
    expect(echoProblem("Fair question", "That's a fair question, and thank you for it.")).not.toBeNull();
    expect(echoProblem("Strong hook", "It has a strong hook.")).not.toBeNull();
    expect(echoProblem("Stakes conflict hook irony", "stakes conflict hook irony protagonist")).not.toBeNull();
    expect(echoProblem("navy blockade", "past the navy blockade she used to command")).toBeNull();
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s only echoes clean noun phrases from the learner's own line", (_id, scenario) => {
    for (const kind of KINDS) {
      for (const { line, turn } of runsFor(scenario)[kind].turns) {
        for (const echo of echoesIn(turn.text, line)) {
          expect(echoProblem(echo, line), `${scenario.id} ${kind}: “${echo}” from “${line}”`).toBeNull();
        }
      }
    }
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s never repeats a line verbatim, and after the wrap-up says one goodbye and then points to the scorecard", (_id, scenario) => {
    for (const kind of KINDS) {
      const lines = HELD_OUT[scenario.id][kind];
      const extra = HELD_OUT[scenario.id].specific.slice(0, 3);
      const { turns } = run(scenario, [...lines, ...extra]);
      const spoken = turns.map((t) => t.turn.text).filter((text) => !isNudge(text));
      expect(new Set(spoken).size, `${scenario.id} ${kind}: ${spoken.join(" / ")}`).toBe(spoken.length);
      const after = turns.filter((t) => t.turn.kind === "after");
      expect(after.length, `${scenario.id} ${kind}`).toBe(extra.length);
      expect(isNudge(after[0].turn.text), after[0].turn.text).toBe(false);
      expect(demoScriptFor(scenario).after).toContain(after[0].turn.text);
      for (const t of after.slice(1)) expect(isNudge(t.turn.text), t.turn.text).toBe(true);
    }
  });
});
