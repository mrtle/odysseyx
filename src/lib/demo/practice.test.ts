import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "@/content/scenarios";
import { EvaluationSchema, type ChatMessageInput } from "@/lib/ai/schemas";
import type { Scenario } from "@/lib/types";
import {
  DEMO_SCRIPTS,
  classifyMove,
  demoEvaluate,
  demoPersonaReply,
  demoPersonaTurn,
  demoScriptFor,
  keyPhrase,
  stripHedges,
} from "./practice";

/** Specific, on-topic learner lines — enough of them to run past any scenario's wrap-up. */
const STRONG_LINES = [
  "It's about a seventy-year-old retired lifeguard named Doris who is the only one who believes something is living in the pool at Sunny Acres.",
  "Comps are Jaws meets Cocoon. Mid-budget, about twenty million, with a terrific role for an older actress.",
  "At the midpoint Doris proves the creature is real, but then she finds out the board knew all along, so now she's fighting her neighbours.",
  "If she fails she loses her independence — her daughter wants to move her into memory care, and this is her last chance.",
  "I'd push back on younger: the whole point is that nobody believes an old woman. I'd raise the heat through her grandson instead.",
  "It ends with Doris alone in the pool at midnight with a harpoon from the shed, and the whole community watching from the fence.",
  "My grandmother was a lifeguard in Coney Island for forty years. I grew up hearing her stories.",
  "Could I send you the script this week?",
  "The last image is her floating on her back under the stars, finally at peace.",
];

const WEAK_LINES = ["um I guess it's kind of like a story", "yeah", "I dunno, maybe", "it's basically just about stuff really"];

function transcript(scenario: Scenario, lines: string[]): ChatMessageInput[] {
  const messages: ChatMessageInput[] = [{ role: "persona", content: scenario.openingLine }];
  for (const line of lines) {
    messages.push({ role: "user", content: line });
    messages.push({ role: "persona", content: demoPersonaReply(scenario, messages) });
  }
  return messages;
}

/** Transcript ending on a learner line (the state the chat route replies to). */
function upToUserTurn(scenario: Scenario, lines: string[]): ChatMessageInput[] {
  const messages = transcript(scenario, lines.slice(0, -1));
  messages.push({ role: "user", content: lines[lines.length - 1] });
  return messages;
}

describe("demo scripts", () => {
  it("exist for every scenario", () => {
    for (const s of SCENARIOS) expect(DEMO_SCRIPTS[s.id], s.id).toBeDefined();
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s has enough pressure moves and clean banks", (_id, scenario) => {
    const script = demoScriptFor(scenario);
    expect(script.questions.length).toBeGreaterThanOrEqual(scenario.suggestedTurns - 1);
    for (const q of script.questions) expect((q.match(/\?/g) ?? []).length, q).toBeLessThanOrEqual(1);
    // Reactions are followed by a pressure question, so they must not ask one themselves.
    const reactions = [...script.strong, ...script.solid, ...script.long, ...script.hedge, ...script.deflect];
    if (script.onNose && !script.flatPresses) reactions.push(...script.onNose);
    for (const line of reactions) expect(line.includes("?"), line).toBe(false);
    // Every bank needs at least one line that works without a placeholder.
    for (const bank of [script.strong, script.solid, script.press, script.long, script.hedge, script.deflect, script.wrapGood, script.wrapMixed, script.after]) {
      expect(bank.length).toBeGreaterThan(0);
      expect(bank.some((l) => !l.includes("{"))).toBe(true);
    }
  });
});

describe("demoPersonaReply", () => {
  it("is deterministic", () => {
    for (const scenario of SCENARIOS) {
      const messages = upToUserTurn(scenario, STRONG_LINES.slice(0, 3));
      expect(demoPersonaReply(scenario, messages)).toBe(demoPersonaReply(scenario, messages));
    }
  });

  it("never leaves an unfilled placeholder", () => {
    for (const scenario of SCENARIOS) {
      for (const lines of [STRONG_LINES, WEAK_LINES]) {
        const messages = transcript(scenario, lines);
        for (const m of messages) expect(m.content, `${scenario.id}: ${m.content}`).not.toMatch(/\{(phrase|hedge)\}/);
      }
    }
  });

  it("echoes something specific the learner said", () => {
    const scenario = getScenario("studio-pitch")!;
    const messages = upToUserTurn(scenario, [STRONG_LINES[0]]);
    const turn = demoPersonaTurn(scenario, messages);
    expect(turn.kind).toBe("reply");
    expect(turn.move).toBe("strong");
    const echoed = turn.text.match(/“([^”]+)”/)?.[1];
    expect(echoed, turn.text).toBeDefined();
    expect(STRONG_LINES[0].toLowerCase()).toContain(echoed!.toLowerCase());
  });

  it("asks at most one question per reply before the wrap-up", () => {
    for (const scenario of SCENARIOS) {
      for (let n = 1; n < scenario.suggestedTurns; n++) {
        const reply = demoPersonaReply(scenario, upToUserTurn(scenario, STRONG_LINES.slice(0, n)));
        expect((reply.match(/\?/g) ?? []).length, `${scenario.id} turn ${n}: ${reply}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("presses on a thin answer instead of moving on", () => {
    const scenario = getScenario("studio-pitch")!;
    const turn = demoPersonaTurn(scenario, upToUserTurn(scenario, ["yeah it's good"]));
    expect(turn.kind).toBe("press");
    expect(demoScriptFor(scenario).press).toContain(turn.text);
  });

  it("wraps up in character exactly at suggestedTurns, then only says goodbye", () => {
    for (const scenario of SCENARIOS) {
      const script = demoScriptFor(scenario);
      const before = demoPersonaTurn(scenario, upToUserTurn(scenario, STRONG_LINES.slice(0, scenario.suggestedTurns - 1)));
      expect(before.kind, scenario.id).not.toBe("wrap");

      const wrap = demoPersonaTurn(scenario, upToUserTurn(scenario, STRONG_LINES.slice(0, scenario.suggestedTurns)));
      expect(wrap.kind, scenario.id).toBe("wrap");
      expect(wrap.text.includes("?") && wrap.text.trim().endsWith("?"), `${scenario.id} wrap asks a question: ${wrap.text}`).toBe(false);
      const wrapCores = [...script.wrapGood, ...script.wrapMixed].map((l) => l.split("{phrase}")[0].slice(0, 20));
      expect(wrapCores.some((core) => wrap.text.startsWith(core.replace(/“$/, "")))).toBe(true);

      const after = demoPersonaTurn(scenario, upToUserTurn(scenario, STRONG_LINES.slice(0, scenario.suggestedTurns + 1)));
      expect(after.kind, scenario.id).toBe("after");
      expect(script.after).toContain(after.text);
    }
  });

  it("goes flat when the subtext drill turns on-the-nose", () => {
    const scenario = getScenario("subtext-sparring")!;
    expect(classifyMove(scenario, "I'm sorry, okay? I sold the boat.")).toBe("flat");
    expect(classifyMove(scenario, "Hand me the tape. We're never getting through this box.")).toBe("strong");
  });

  it("pushes back on result direction in the actor drill", () => {
    const scenario = getScenario("actor-motivation")!;
    const turn = demoPersonaTurn(scenario, upToUserTurn(scenario, ["Just be sadder. More emotional."]));
    expect(turn.kind).toBe("press");
    expect(classifyMove(scenario, "Bless her.")).toBe("strong");
  });
});

describe("demoEvaluate", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s returns a valid, complete scorecard", (_id, scenario) => {
    for (const lines of [STRONG_LINES.slice(0, scenario.suggestedTurns), WEAK_LINES, [STRONG_LINES[0]]]) {
      const evaluation = EvaluationSchema.parse(demoEvaluate(scenario, transcript(scenario, lines)));
      expect(evaluation.overall).toBeGreaterThanOrEqual(0);
      expect(evaluation.overall).toBeLessThanOrEqual(100);
      expect(Number.isInteger(evaluation.overall)).toBe(true);
      expect(evaluation.skillScores.map((s) => s.skill)).toEqual(scenario.skills);
      for (const s of evaluation.skillScores) {
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(s.comment.trim()).not.toBe("");
      }
      expect(evaluation.headline.trim()).not.toBe("");
      expect(evaluation.summary.trim()).not.toBe("");
      expect(evaluation.strengths.length).toBeGreaterThanOrEqual(1);
      expect(evaluation.improvements.length).toBeGreaterThanOrEqual(2);
      expect(evaluation.improvements.length).toBeLessThanOrEqual(4);
      for (const i of evaluation.improvements) {
        expect(i.title.trim()).not.toBe("");
        expect(i.detail.trim()).not.toBe("");
        expect(i.example.trim()).not.toBe("");
      }
      expect(evaluation.nextStep.title.trim()).not.toBe("");
      // No leaked internal markers.
      expect(JSON.stringify(evaluation)).not.toMatch(/․|\{phrase\}|\{hedge\}|undefined|NaN/);
    }
  });

  it("is deterministic", () => {
    const scenario = getScenario("campfire-story")!;
    const messages = transcript(scenario, STRONG_LINES.slice(0, 6));
    expect(demoEvaluate(scenario, messages)).toEqual(demoEvaluate(scenario, messages));
  });

  it("scores a specific, engaged transcript above a vague, thin one", () => {
    for (const scenario of SCENARIOS.filter((s) => s.category === "pitch")) {
      const strong = demoEvaluate(scenario, transcript(scenario, STRONG_LINES.slice(0, scenario.suggestedTurns)));
      const weak = demoEvaluate(scenario, transcript(scenario, WEAK_LINES));
      expect(strong.overall, scenario.id).toBeGreaterThan(weak.overall);
    }
  });

  it("quotes the learner's own words", () => {
    const scenario = getScenario("studio-pitch")!;
    const evaluation = demoEvaluate(scenario, transcript(scenario, STRONG_LINES.slice(0, 6)));
    const text = [...evaluation.skillScores.map((s) => s.comment), ...evaluation.strengths, evaluation.bestMoment].join(" ");
    expect(text).toMatch(/Doris|Sunny Acres|Jaws meets Cocoon|memory care/);
  });

  it("penalises confessing in the subtext drill", () => {
    const scenario = getScenario("subtext-sparring")!;
    const subtle = ["Tackle's mine. Dad gave it to me when I was twelve.", "Hand me the tape.", "You want the watch? Take the watch.", "Let's just get the shelves done."];
    const blunt = ["I feel guilty. I sold the boat to pay my debts.", "I'm sorry, the truth is I sold it.", "I feel terrible and I'm ashamed.", "I have to tell you, I sold the boat."];
    const subtleScore = demoEvaluate(scenario, transcript(scenario, subtle));
    const bluntScore = demoEvaluate(scenario, transcript(scenario, blunt));
    const dialogue = (e: typeof subtleScore) => e.skillScores.find((s) => s.skill === "dialogue")!.score;
    expect(dialogue(subtleScore)).toBeGreaterThan(dialogue(bluntScore) + 15);
  });

  it("handles a transcript with no learner lines without crashing", () => {
    const scenario = getScenario("elevator-pitch")!;
    const evaluation = EvaluationSchema.parse(demoEvaluate(scenario, [{ role: "persona", content: scenario.openingLine }]));
    expect(evaluation.overall).toBeLessThan(40);
    expect(evaluation.bestMoment).toBe("");
  });

  it("keeps abbreviations intact when quoting", () => {
    const scenario = getScenario("founder-story")!;
    const evaluation = demoEvaluate(
      scenario,
      transcript(scenario, ["It was 4 a.m. in my dad's pharmacy in Fresno, and I watched him hand-copy three hundred prescriptions because the software crashed."]),
    );
    expect(JSON.stringify(evaluation)).not.toMatch(/4 a\."/);
  });
});

describe("text helpers", () => {
  it("keyPhrase finds a distinctive phrase or nothing", () => {
    expect(keyPhrase("It's about a disgraced chess prodigy named Ada who must win back her title.")).toBe("disgraced chess prodigy");
    expect(keyPhrase("Comps are Whiplash meets Sound of Metal.")).toBe("Whiplash meets Sound of Metal");
    expect(keyPhrase("I think it's good.")).toBeNull();
  });

  it("stripHedges removes qualifiers", () => {
    expect(stripHedges("I think it's kind of a thriller, basically.")).toBe("It's a thriller.");
  });
});
