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
  lineSimilarity,
  stripHedges,
  stripTitles,
} from "./practice";
import { GOOD_LINES, HEDGY_LINES, LAZY_LINES, OFF_TOPIC_LINES, RUDE_LINES } from "./practice-fixtures";

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
    const reactions = [...script.strong, ...script.solid, ...script.long, ...script.hedge, ...script.deflect, ...script.rude, ...script.offTopic];
    if (script.onNose && !script.flatPresses) reactions.push(...script.onNose);
    // Press leads are followed by the pending question (unless the persona is an in-scene character).
    if (script.pressRepeats !== false) reactions.push(...script.press);
    for (const line of reactions) expect(line.includes("?"), line).toBe(false);
    // Every bank needs at least one line that works without a placeholder.
    for (const bank of [
      script.strong,
      script.solid,
      script.press,
      script.rude,
      script.offTopic,
      script.long,
      script.hedge,
      script.deflect,
      script.wrapGood,
      script.wrapMixed,
      script.wrapPoor,
      script.after,
    ]) {
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

  it("presses on a thin answer by restating the pending question", () => {
    const scenario = getScenario("studio-pitch")!;
    const script = demoScriptFor(scenario);
    const turn = demoPersonaTurn(scenario, upToUserTurn(scenario, ["yeah it's good"]));
    expect(turn.kind).toBe("press");
    expect(script.press.some((lead) => turn.text.startsWith(lead)), turn.text).toBe(true);
    expect(turn.text.endsWith(script.opener)).toBe(true);
    // Later in the scene, the press restates the question actually on the table.
    const later = demoPersonaTurn(scenario, upToUserTurn(scenario, [GOOD_LINES["studio-pitch"][0], "yeah"]));
    expect(later.kind).toBe("press");
    expect(later.text).toContain(script.questions[0]);
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
        // An example is optional, but never the learner's own line handed back (the hedge fix is their line, confidently).
        if (i.title === "Cut the hedges") continue;
        for (const line of lines) expect(lineSimilarity(line, i.example), `${scenario.id}: ${i.example}`).toBeLessThanOrEqual(0.6);
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
    expect(keyPhrase("It's about a seventy-year-old retired lifeguard at Sunny Acres.")).toMatch(/lifeguard|Sunny Acres/);
  });

  it("keyPhrase never echoes verb fragments, bare numbers or grief", () => {
    const cases = [
      "Right before, it's their first Christmas since her mother died.",
      "Her mom died last spring.",
      "The recipe serves five.",
      "The station smelled like burnt coffee.",
      "She'd forgive him eventually.",
      "It's about a developer who'll tear down the motel.",
      "What I believe is that independent pharmacies deserve better.",
      "I missed my grandmother's funeral.",
      "That's the whole point.",
      "Because she hasn't decided either.",
      "And the camera has to break open.",
    ];
    for (const text of cases) {
      const phrase = keyPhrase(text);
      if (phrase === null) continue;
      expect(phrase, text).not.toMatch(/\b(died|funeral|smelled|serves|five|she'd|who'll|believe|whole|point|decided|break)\b/i);
    }
    expect(keyPhrase("The station smelled like burnt coffee.")).toBe("burnt coffee");
  });

  it("stripHedges removes qualifiers", () => {
    expect(stripHedges("I think it's kind of a thriller, basically.")).toBe("It's a thriller.");
  });
});

/** Play a list of learner lines through the demo persona. */
function play(scenario: Scenario, lines: string[]): ChatMessageInput[] {
  return transcript(scenario, lines);
}

const personaLines = (messages: ChatMessageInput[]) => messages.filter((m) => m.role === "persona").slice(1).map((m) => m.content);

describe("demo coach: thoughtful vs lazy, rude and off-topic runs", () => {
  const RUNS = {
    lazy: LAZY_LINES,
    rude: RUDE_LINES,
    "off-topic": OFF_TOPIC_LINES,
  } as const;

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s scores a thoughtful run clearly above lazy, rude and off-topic ones", (_id, scenario) => {
    const good = demoEvaluate(scenario, play(scenario, GOOD_LINES[scenario.id]));
    expect(good.overall, `${scenario.id} good`).toBeGreaterThanOrEqual(70);
    for (const [kind, pool] of Object.entries(RUNS)) {
      const lines = pool.slice(0, scenario.suggestedTurns);
      const weak = demoEvaluate(scenario, play(scenario, lines));
      expect(weak.overall, `${scenario.id} ${kind}`).toBeLessThanOrEqual(45);
      expect(good.overall - weak.overall, `${scenario.id} ${kind}`).toBeGreaterThanOrEqual(30);
      for (const skill of scenario.skills) {
        const g = good.skillScores.find((s) => s.skill === skill)!.score;
        const w = weak.skillScores.find((s) => s.skill === skill)!.score;
        expect(g, `${scenario.id} ${kind} ${skill}`).toBeGreaterThan(w + 15);
      }
      // Nothing from a run like that is a highlight, and nobody gets praised for "staying in the scene".
      expect(weak.bestMoment, `${scenario.id} ${kind}`).toBe("");
      expect(weak.strengths.join(" "), `${scenario.id} ${kind}`).not.toMatch(/stayed in the scene|Almost no hedging|real material/);
    }
  });

  it("names the cause when a run was rude or off-topic", () => {
    const scenario = getScenario("studio-pitch")!;
    const rude = demoEvaluate(scenario, play(scenario, RUDE_LINES.slice(0, 6)));
    expect(rude.headline).toMatch(/pushing Renata away/);
    expect(rude.improvements[0].title).toBe("Stay in the scene");
    const off = demoEvaluate(scenario, play(scenario, OFF_TOPIC_LINES.slice(0, 6)));
    expect(off.headline).toMatch(/drifting away from the scene/);
    const lazy = demoEvaluate(scenario, play(scenario, LAZY_LINES.slice(0, 6)));
    // Thin answers are blamed on thinness, not on "hedges and long answers".
    expect(lazy.skillScores.find((s) => s.skill === "delivery")!.comment).toMatch(/too thin/);
    expect(JSON.stringify(lazy)).not.toMatch(/Hedges and long answers/);
  });

  it("doesn't reward off-topic questions in the subtext drill", () => {
    const scenario = getScenario("subtext-sparring")!;
    const off = demoEvaluate(scenario, play(scenario, OFF_TOPIC_LINES.slice(0, 7)));
    expect(off.headline).not.toMatch(/Subtext that crackles/);
    expect(off.skillScores.find((s) => s.skill === "dialogue")!.comment).not.toMatch(/Marvel|pizza|weather/);
  });
});

describe("demo coach: model answers", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s scores its own model answers in the strong band and never offers them back", (_id, scenario) => {
    const script = demoScriptFor(scenario);
    const lines = GOOD_LINES[scenario.id];
    const evaluation = demoEvaluate(scenario, play(scenario, lines));
    for (const [skill, example] of Object.entries(script.examples)) {
      // The fixture plays the scene's own model lines (or near-copies); they must read as strong work.
      if (!lines.some((line) => lineSimilarity(line, example) > 0.6)) continue;
      expect(evaluation.skillScores.find((s) => s.skill === skill)!.score, `${scenario.id} ${skill}`).toBeGreaterThanOrEqual(70);
    }
    for (const improvement of evaluation.improvements) {
      for (const line of lines) {
        expect(lineSimilarity(line, improvement.example), `${scenario.id}: “${improvement.example}”`).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it("never turns a hedged confession or result direction into a model line", () => {
    const subtext = getScenario("subtext-sparring")!;
    const confession = demoEvaluate(
      subtext,
      play(subtext, [
        "I think I just really feel so guilty, I basically sold Dad's boat to pay my debts, I guess.",
        "Hand me the tape.",
        "You want the watch? Take the watch.",
        "Let's get the shelves done.",
      ]),
    );
    for (const i of confession.improvements) {
      expect(i.example).not.toMatch(/guilty|sold Dad's boat/);
    }
    const actor = getScenario("actor-motivation")!;
    const result = demoEvaluate(
      actor,
      play(actor, [
        "I think he's kind of sad, you know, really sad.",
        "Just be sadder when you say it, really make it land.",
        "He wants her to go.",
        "Maybe be more emotional, I guess.",
      ]),
    );
    for (const i of result.improvements) {
      expect(i.example).not.toMatch(/sadder|make it land|more emotional/i);
    }
  });
});

describe("demo coach: evidence", () => {
  it("quotes the real stakes line, not a comp title that happens to contain a stakes word", () => {
    const scenario = getScenario("studio-pitch")!;
    const evaluation = demoEvaluate(
      scenario,
      play(scenario, [
        "It's about a lighthouse keeper's widow who has to relight the lamp herself when her son's boat goes missing in a storm.",
        "Comps would be All Is Lost meets Manchester by the Sea.",
        "Act one she's alone in the house. Midpoint: the lamp fails and she realises she has to climb the tower half-blind. The ending: she climbs it.",
        "If she fails, her son drowns within sight of the house he fled.",
        "I'd keep her age. Her age is why nobody believes her.",
        "It ends with the light coming on and the boat turning for home.",
      ]),
    );
    const conflict = evaluation.skillScores.find((s) => s.skill === "conflict")!.comment;
    expect(conflict).toMatch(/If she fails, her son drowns/);
    expect(conflict).not.toMatch(/All Is Lost/);
    expect(evaluation.bestMoment).not.toMatch(/All Is Lost|meets/);
    expect(JSON.stringify(evaluation.strengths)).not.toMatch(/All Is Lost/);
  });

  it("doesn't pin every skill on the same sentence", () => {
    const scenario = getScenario("subtext-sparring")!;
    const evaluation = demoEvaluate(scenario, play(scenario, GOOD_LINES["subtext-sparring"]));
    const quotes = evaluation.skillScores.map((s) => s.comment.match(/“([^”]+)”/)?.[1]).filter(Boolean);
    expect(new Set(quotes).size).toBe(quotes.length);
  });

  it("strips multi-word titles before reading story vocabulary", () => {
    expect(stripTitles("Comps would be All Is Lost meets Manchester by the Sea.")).not.toMatch(/Lost|Sea/);
    expect(stripTitles("On Monday I'd call Maria.")).toContain("Monday I'd call Maria");
  });
});

describe("demo persona: listening", () => {
  it("doesn't ask about something the learner just covered", () => {
    const scenario = getScenario("studio-pitch")!;
    const reply = demoPersonaReply(
      scenario,
      upToUserTurn(scenario, [
        "It's about a lighthouse keeper's widow who has to relight the lamp herself when her son's boat goes missing.",
        "Comps are The Lighthouse meets Cast Away. Act one she's alone. Midpoint: the lamp fails and she has to climb the tower half-blind. The ending: she climbs it.",
      ]),
    );
    expect(reply).not.toMatch(/midpoint/i);
    expect(reply).not.toMatch(/How does it end/);
  });

  it("presses without presupposing what the learner said", () => {
    const elevator = getScenario("elevator-pitch")!;
    expect(demoPersonaReply(elevator, upToUserTurn(elevator, ["hi"]))).not.toMatch(/Sounds personal/);
    const founder = getScenario("founder-story")!;
    expect(demoPersonaReply(founder, upToUserTurn(founder, ["🎬🎬🎬 😀 رمز"]))).not.toMatch(/platform/i);
    // …and names the buzzword they actually used.
    const buzz = demoPersonaReply(founder, upToUserTurn(founder, ["We're building a scalable ecosystem to revolutionize pharmacy."]));
    expect(buzz).toMatch(/“(revolutionize|scalable|ecosystem)\.?”/);
    const dp = getScenario("dp-shot-planning")!;
    expect(demoPersonaReply(dp, upToUserTurn(dp, ["This is a waste of my time."]))).not.toMatch(/coverage/i);
  });

  it("answers rudeness in character instead of pretending to follow", () => {
    const scenario = getScenario("studio-pitch")!;
    const turn = demoPersonaTurn(scenario, upToUserTurn(scenario, [GOOD_LINES["studio-pitch"][0], "Whatever, I don't care what you think."]));
    expect(turn.move).toBe("rude");
    expect(demoScriptFor(scenario).rude.some((line) => turn.text.startsWith(line))).toBe(true);
    expect(turn.text).not.toMatch(/I'm following/);
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s never repeats itself or echoes a broken fragment", (_id, scenario) => {
    for (const lines of [GOOD_LINES[scenario.id], LAZY_LINES, RUDE_LINES, OFF_TOPIC_LINES, HEDGY_LINES]) {
      const run = [...lines.slice(0, scenario.suggestedTurns), ...GOOD_LINES[scenario.id].slice(0, 3)];
      const replies = personaLines(play(scenario, run));
      // Restating a question after a thin answer is a press, not a repeat — compare what the persona says around it.
      const script = demoScriptFor(scenario);
      const reaction = (reply: string) => [script.opener, ...script.questions].reduce((text, q) => text.replace(q, ""), reply).trim();
      for (let i = 0; i < replies.length; i++) {
        for (let j = i + 1; j < replies.length; j++) {
          expect(replies[i], `${scenario.id}: repeated reply`).not.toBe(replies[j]);
          const [a, b] = [reaction(replies[i]), reaction(replies[j])];
          if (j - i > 2 || !a || !b) continue;
          expect(a.toLowerCase(), `${scenario.id}: “${replies[i]}” / “${replies[j]}”`).not.toBe(b.toLowerCase());
          // Near-copies ("Okay, that's a reason. I like it." twice) — judged on reactions with enough words to compare.
          if (a.split(/\s+/).length >= 5 && b.split(/\s+/).length >= 5) {
            expect(lineSimilarity(a, b), `${scenario.id}: “${replies[i]}” / “${replies[j]}”`).toBeLessThan(0.75);
          }
        }
      }
      for (const reply of replies) {
        const echoed = reply.match(/“([^”]+)”/)?.[1];
        if (!echoed) continue;
        expect(echoed, `${scenario.id}: ${reply}`).not.toMatch(/\b(died|dies|death|funeral|killed)\b/i);
        expect(echoed, `${scenario.id}: ${reply}`).not.toMatch(/\b(smelled|who'll|she'd|serves|whole)\b/i);
      }
    }
  });
});
