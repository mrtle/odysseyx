/**
 * Regression tests for field reports on the demo practice coach, built from
 * the reported inputs plus new lines of the same shape: off-topic false
 * positives, jargon outscoring specifics, scorecards contradicting the
 * transcript, broken echoes, repetition, and Subtext Sparring's model lines
 * and confession beat.
 */
import { describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "@/content/scenarios";
import type { ChatMessageInput } from "@/lib/ai/schemas";
import type { Scenario } from "@/lib/types";
import { classifyMove, concreteness, demoEvaluate, demoPersonaTurn, demoScriptFor, keyPhrase, lineSimilarity } from "./practice";
import { GOOD_LINES, HEDGY_LINES, OFF_TOPIC_LINES } from "./practice-fixtures";

const scenario = (id: string): Scenario => getScenario(id)!;

function play(s: Scenario, lines: string[]): ChatMessageInput[] {
  const messages: ChatMessageInput[] = [{ role: "persona", content: s.openingLine }];
  for (const line of lines) {
    messages.push({ role: "user", content: line });
    messages.push({ role: "persona", content: demoPersonaTurn(s, messages).text });
  }
  return messages;
}

function replyTo(s: Scenario, lines: string[]) {
  const messages = play(s, lines.slice(0, -1));
  messages.push({ role: "user", content: lines[lines.length - 1] });
  return demoPersonaTurn(s, messages);
}

const NON_SUBTEXT = SCENARIOS.filter((s) => s.id !== "subtext-sparring");

describe("off-topic needs a positive signal", () => {
  // On-topic lines that were flagged: the learner's own project, present tense, no story keywords.
  const ON_TOPIC: [string, string][] = [
    ["studio-pitch", "Picture Tom Hanks as a retired astronaut who has to go back up because he's the only one who remembers how the old station works."],
    ["campfire-story", "That was the last time I ever lied to my sister."],
    ["founder-story", "I'd keep going. I'd go back to the nurses on Ward 7 and ask them what broke this time."],
    ["campfire-story", "I'm a lifeguard now. Every summer I watch some kid freeze on that board."],
    ["studio-pitch", "Think Paddington, but the bear is a retired customs officer who smuggles marmalade back into Lima."],
    ["elevator-pitch", "My neighbour Oksana taught herself to fly a crop duster at sixty so she could reach her son's village."],
    ["festival-qa", "We found the house through a Craigslist ad, and the owner let us shoot there for the price of her roof."],
    ["dp-shot-planning", "Nadia never looks at the window until the last line, so neither does the camera."],
    ["writers-room-break", "Rudy spends the whole cold open trying to fix the ice machine with a butter knife."],
    ["logline-gauntlet", "A hotel night porter in Glasgow finds a baby in the lost-property cupboard and has until checkout to find the mother."],
  ];

  it.each(ON_TOPIC)("%s: “%s” is not off-topic", (id, line) => {
    expect(classifyMove(scenario(id), line)).not.toBe("offtopic");
  });

  it("a hedgy on-topic line is hedgy in every drill, and a hedgy run is headlined as hedging", () => {
    const line = "I mean, I kind of think it's maybe about, like, the sister, I guess.";
    for (const s of NON_SUBTEXT) {
      expect(classifyMove(s, line), s.id).toBe("hedgy");
      const evaluation = demoEvaluate(s, play(s, HEDGY_LINES.slice(0, s.suggestedTurns)));
      expect(evaluation.headline, s.id).not.toMatch(/drifting/);
      expect(evaluation.summary, s.id).not.toMatch(/wandered off topic/);
    }
  });

  it("still catches small talk and questions about the persona", () => {
    const extra = ["How was your weekend?", "Do you have kids?", "What's your favourite restaurant around here?", "Did you catch the game last night?"];
    for (const s of SCENARIOS) {
      for (const line of [...OFF_TOPIC_LINES, ...extra]) expect(classifyMove(s, line), `${s.id}: ${line}`).toBe("offtopic");
    }
  });

  it("the premise as a first line gets a reply to the premise, not a redirect", () => {
    const s = scenario("studio-pitch");
    const turn = replyTo(s, [ON_TOPIC[0][1]]);
    for (const redirect of demoScriptFor(s).offTopic) expect(turn.text).not.toContain(redirect);
  });
});

describe("concreteness gates the score", () => {
  /** Vague runs from the field report, and specific runs of the same scenes (not the fixtures). */
  const PAIRS: Record<string, { vague: string[]; specific: string[] }> = {
    "studio-pitch": {
      vague: [
        "It's a story about a hero with a strong hook and huge stakes.",
        "The comps are the biggest hits in the genre, really commercial.",
        "There's a big reversal at the midpoint that changes everything.",
        "If the hero fails they lose everything they care about, their family, their home, their whole life.",
        "The note is interesting but the journey is the heart of the story.",
        "It ends with an epic climax where everything pays off.",
      ],
      specific: [
        "A disgraced harbour pilot has one night to guide a stolen freighter full of refugees past the navy blockade she used to command.",
        "Comps are Captain Phillips meets Sicario, about thirty million.",
        "The midpoint turn is that she realises the refugees are a decoy — the real cargo is weapons.",
        "Her son, who's a navy officer on the lead cutter, is the one who has to arrest her.",
        "I'd keep her age. What that note is reaching for is heat, and the heat is her son.",
        "It ends with her running the freighter aground to save the refugees, and her son putting the cuffs on.",
      ],
    },
    "founder-story": {
      vague: [
        "We're on a mission to revolutionize how the world thinks about care.",
        "I've always been passionate about this space and its huge potential.",
        "Most people underestimate the market and the value of a platform like ours.",
        "The hardest thing has been scaling while keeping our core values.",
        "Our users love the experience because it's seamless and powerful.",
        "We'd keep pushing forward with our vision no matter what.",
      ],
      specific: [
        "It was 3 a.m. in the Kaiser ER in Oakland, and I watched a triage nurse named Rosa re-enter the same patient three times because the system froze.",
        "I was an ER nurse for eleven years before I wrote a line of code. I know which alarms get ignored.",
        "I believe the fix is fewer screens, not smarter ones — nurses chart standing up.",
        "In June our only hospital pilot almost cancelled. I spent two weeks on their night shift and we cut charting time from nine minutes to four.",
        "Rosa is still at Kaiser. She told me last month she clocked out on time for the first time in a year.",
        "On Monday I'd call Rosa's charge nurse and ask for two more units on a paid pilot.",
      ],
    },
    "campfire-story": {
      vague: [
        "It's a story about a big moment that changed my life forever.",
        "I wanted to be accepted and I was afraid of rejection.",
        "There was a turning point where I realized everything had shifted.",
        "It was a really powerful and emotional experience for me.",
        "The stakes were huge because I could have lost everything.",
        "Now I'm a different person and I've grown so much.",
      ],
      specific: [
        "I'm fourteen, in the back seat of my dad's Buick outside the Greyhound station in Reno, and he's just told me he isn't coming in.",
        "I wanted him to change his mind. I was scared that if I cried, he'd drive off faster.",
        "The moment the door shut, I knew I'd be the one telling my little sister.",
        "The car smelled like menthols and wet dog, and the radio was stuck on a Spanish ballgame.",
        "I could have lost my sister too — she didn't speak to me for a month.",
        "These days I drive her kids to school every Tuesday, and I never leave before they're inside.",
      ],
    },
    "writers-room-break": {
      vague: [
        "It's the protagonist's episode and they have a clear goal.",
        "The inciting incident sets everything in motion.",
        "The act one break is a huge reversal.",
        "The midpoint raises the stakes and twists the story.",
        "The B-story mirrors the A-story's theme.",
        "They're afraid of failure, which is their wound.",
        "The low point is when all is lost.",
        "We end on a powerful image that brings it full circle.",
      ],
      specific: [
        "It's Joanie's episode. She wants Rudy to sign the sale papers before his cardiologist appointment on Friday.",
        "In the teaser, a tow truck drops a dead Cadillac in the motel lot, and the driver is Rudy's estranged son, Wade.",
        "Act one break: Wade offers to buy the motel himself, with money Joanie knows he doesn't have.",
        "At the midpoint Joanie finds Wade's parole paperwork in room 4 — he isn't allowed to leave the county.",
        "The B-story is Nico teaching himself to fix the ice machine from YouTube. It rhymes because everybody's pretending they can fix what's broken.",
        "She's afraid that if Rudy picks Wade, she'll have given up her twenties for nothing.",
        "End of act four, Rudy collapses in the laundry room, and Wade is the one who drives him to the hospital.",
        "The last image is Joanie alone at the desk, tearing the sale papers into the trash can.",
      ],
    },
    "logline-gauntlet": {
      vague: [
        "It's a compelling story about a flawed hero on an emotional journey.",
        "The protagonist is relatable and complex.",
        "She wants to achieve her dream more than anything.",
        "The antagonist creates a lot of obstacles and conflict.",
        "If she fails, she'll lose everything that matters.",
        "It has a strong hook and a big twist.",
      ],
      specific: [
        "When her grandfather's orchard is seized, a teenage beekeeper has one summer to win it back at the county fair.",
        "She's a deaf beekeeper who's never competed in front of a crowd.",
        "She has to win the blue ribbon at the Yakima County Fair on August 30.",
        "The bank manager who seized the orchard judges the honey category.",
        "If she fails, her grandfather moves into a care home and the hives are burned.",
        "A deaf teenage beekeeper must win the county fair's honey prize — judged by the banker who seized her grandfather's orchard — or lose the hives forever.",
      ],
    },
  };

  it.each(Object.entries(PAIRS))("%s: a concrete run clearly outscores a jargon run", (id, { vague, specific }) => {
    const s = scenario(id);
    const v = demoEvaluate(s, play(s, vague));
    const sp = demoEvaluate(s, play(s, specific));
    expect(sp.overall - v.overall, `${id}: specific ${sp.overall}, vague ${v.overall}`).toBeGreaterThanOrEqual(15);
    for (const skill of s.skills) {
      const vs = v.skillScores.find((x) => x.skill === skill)!.score;
      expect(vs, `${id} vague ${skill}`).toBeLessThan(60);
    }
    expect(JSON.stringify(v)).not.toMatch(/stakes had teeth|Send me the data room|better ones this month|Send me pages/);
  });

  it("a keyword list never classifies as strong, never gets echoed, and scores low", () => {
    const soup = "stakes conflict hook irony protagonist want need fear midpoint climax twist";
    for (const s of SCENARIOS) {
      expect(classifyMove(s, soup), s.id).not.toMatch(/strong|solid/);
      const evaluation = demoEvaluate(s, play(s, Array.from({ length: s.suggestedTurns }, () => soup)));
      expect(evaluation.overall, s.id).toBeLessThan(50);
    }
    expect(keyPhrase(soup)).toBeNull();
    expect(keyPhrase("Strong hook, huge stakes, a big reversal at the midpoint.")).toBeNull();
    expect(keyPhrase("We're building a scalable, AI-powered platform to revolutionize healthcare.")).toBeNull();
  });

  it("personas never praise jargon as specific", () => {
    const s = scenario("studio-pitch");
    const turn = replyTo(s, ["It's got a strong hook, huge stakes and a big reversal at the midpoint."]);
    expect(turn.move).toBe("vague");
    expect(turn.text).not.toMatch(/specific sells|now I'm listening|I could repeat to Joel/);
    const founder = scenario("founder-story");
    const deck = replyTo(founder, ["Our customers love the solution because it adds so much value to their workflow."]);
    expect(deck.text).not.toMatch(/That's real|That I believe|not in the deck|Nobody put that/);
  });

  it("concreteness reads names, numbers, people and objects, not craft words", () => {
    const s = scenario("studio-pitch");
    expect(concreteness(s, "If the hero fails they lose everything they care about, their family, their home, their whole life.").grounded).toBe(false);
    expect(concreteness(s, "The B-story mirrors the A-story thematically.").grounded).toBe(false);
    expect(concreteness(s, "The low point is when all is lost and the hero hits rock bottom.").grounded).toBe(false);
    expect(concreteness(s, "It ends at dawn in the Bay of Cadiz, with Ines in handcuffs.").grounded).toBe(true);
    expect(concreteness(s, "The water smelled like chlorine and pennies.").grounded).toBe(true);
    expect(concreteness(s, "It ends with the light coming on and the boat turning for home.").vague).toBe(false);
  });
});

describe("the scorecard agrees with the transcript", () => {
  it("credits a hook that opens with a person and a goal, and never says it came too late", () => {
    for (const [id, first] of [
      ["elevator-pitch", "A lighthouse keeper going blind has one night to guide her estranged son through the storm she caused."],
      ["studio-pitch", "A disgraced harbour pilot has one night to guide a stolen freighter full of refugees past the navy blockade she used to command."],
      ["studio-pitch", "A widowed beekeeper has three days to find the queen before the whole valley's orchards fail."],
    ] as const) {
      const s = scenario(id);
      const rest = GOOD_LINES[id].slice(1, s.suggestedTurns);
      const evaluation = demoEvaluate(s, play(s, [first, ...rest]));
      const text = JSON.stringify(evaluation);
      expect(text, id).not.toMatch(/took too long to surface|Lead with the collision|You opened with/);
    }
  });

  it("names what the opening actually lacks", () => {
    const s = scenario("elevator-pitch");
    const noGoal = demoEvaluate(s, play(s, ["It's about my grandmother Rosa, who smuggled vinyl records into Havana in 1962.", "yeah", "ok", "sure"]));
    expect(JSON.stringify(noGoal)).not.toMatch(/took too long to surface/);
    const late = demoEvaluate(s, play(s, ["So, some background first. I grew up near the coast. A lighthouse keeper going blind has one night to guide her son home.", "ok", "yeah", "sure"]));
    expect(late.skillScores.find((x) => x.skill === "hook")!.comment).not.toMatch(/puts a specific person and a problem up front/);
  });

  it("credits explicit turn language and personal stakes instead of asking for them", () => {
    const s = scenario("studio-pitch");
    const evaluation = demoEvaluate(
      s,
      play(s, [
        "A disgraced harbour pilot has one night to guide a stolen freighter full of refugees past the navy blockade she used to command.",
        "Comps are Captain Phillips meets Sicario, about thirty million.",
        "The midpoint turn is that she realises the refugees are a decoy — the real cargo is weapons.",
        "Her son, who's a navy officer on the lead cutter, is the one who has to arrest her.",
        "I'd keep her age. What that note is reaching for is heat, and the heat is her son.",
        "It ends with her running the freighter aground to save the refugees, and her son putting the cuffs on.",
      ]),
    );
    const titles = evaluation.improvements.map((i) => i.title);
    expect(titles).not.toContain("Make the turns visible");
    expect(titles).not.toContain("Make the stakes personal");
    expect(titles).not.toContain("Lead with the collision");
    expect(evaluation.headline).not.toMatch(/took too long|shape stayed blurry|stakes stayed abstract/);
    expect(evaluation.nextStep.title).not.toBe("Make the stakes personal");
  });

  it("credits saying what's under the line in the actor drill", () => {
    const s = scenario("actor-motivation");
    const evaluation = demoEvaluate(
      s,
      play(s, [
        "He wants her to go without guilt.",
        "When he says “That's great, kiddo,” he means “please don't see how much this hurts.” The line is a shield.",
        "Right before, you were taping her mother's cookbooks into a box.",
        "The turn is when she says Lisbon.",
        "Keep the tape gun moving.",
        "Bless her.",
      ]),
    );
    expect(evaluation.headline).not.toMatch(/subtext under “great” stayed unexplored/);
    expect(evaluation.improvements.map((i) => i.title)).not.toContain("Know what's under the line");
    expect(evaluation.skillScores.find((x) => x.skill === "dialogue")!.comment).toMatch(/found what's under the line/);
  });

  it("quotes contiguous text in the best moment, or marks the gap", () => {
    const lines = [
      "It's about a lighthouse keeper's widow who has to relight the lamp herself when her son's boat goes missing in a storm.",
      "Comps would be All Is Lost meets Manchester by the Sea.",
      "Act one ends when she learns the lamp is dead. Midpoint: she climbs the tower half-blind. The ending: she guides him in and loses her sight.",
      "If she fails, her son drowns within sight of the house he fled.",
      "I'd keep her age. Her age is why nobody believes her.",
      "It ends with the light coming on and the boat turning for home.",
    ];
    for (const lineSet of [lines, ...Object.values(GOOD_LINES)]) {
      for (const sc of SCENARIOS) {
        const best = demoEvaluate(sc, play(sc, lineSet.slice(0, sc.suggestedTurns))).bestMoment;
        if (!best) continue;
        for (const part of best.replace(/…$/, "").split(" … ")) {
          expect(lineSet.some((line) => line.includes(part.trim())), `${sc.id}: “${part}”`).toBe(true);
        }
      }
    }
  });
});

describe("echoes are clean noun phrases", () => {
  const CASES: [string, RegExp | null][] = [
    ["Comps are All Is Lost meets Manchester by the Sea.", null],
    ["Comps are Captain Phillips meets Hell or High Water.", /^(?!Phillips meets Hell$)/],
    ["Everyone at the party was clapping except him.", /^(?!.*except)/],
    ["She sails the stolen freighter through the navy blockade herself.", /^(?!.*herself)/],
    ["That's a fair question, and thank you for it.", null],
    ["I spent six years writing alarm software.", /^alarm software$/],
    ["His granddaughter put his name forward.", /^(?!.*forward)/],
    ["Alarm fatigue is what actually kills patients.", /^(?!kills)/],
    ["It has a strong hook and a big twist.", null],
    ["The low point is when the hero hits rock bottom.", null],
    ["Your hands finish the job your voice can't.", /^(?!.*finish)/],
    ["We end with Joanie letting Nico take the blame.", /^(?!.*letting)/],
  ];
  it.each(CASES)("“%s”", (line, expected) => {
    const phrase = keyPhrase(line);
    if (expected === null) expect(phrase).toBeNull();
    else if (phrase !== null) expect(phrase).toMatch(expected);
  });

  it("the persona falls back to a reaction without a quote", () => {
    const s = scenario("elevator-pitch");
    const turn = replyTo(s, ["A lighthouse keeper going blind has one night to guide her son home.", "Comps are All Is Lost meets Manchester by the Sea."]);
    expect(turn.text).not.toMatch(/Lost meets Manchester/);
    const festival = scenario("festival-qa");
    expect(replyTo(festival, ["That's a fair question, and thank you for it."]).text).not.toMatch(/“Fair question/);
  });
});

describe("the persona listens and doesn't repeat itself", () => {
  it("skips a question the learner already answered anywhere in a turn", () => {
    const s = scenario("elevator-pitch");
    const turn = replyTo(s, ["A lighthouse keeper going blind has one night to guide her son home. I volunteered in a hospice for three years."]);
    expect(turn.text).not.toMatch(/why you/i);
  });

  it("takes a concrete, playable direction as a note, not a thin answer", () => {
    const s = scenario("actor-motivation");
    const script = demoScriptFor(s);
    const turn = replyTo(s, ["He wants her to go without guilt.", "Bless her. That's what he's doing.", "On the last line, look at the door, not at her."]);
    expect(turn.kind).toBe("reply");
    for (const press of script.press) expect(turn.text.startsWith(press)).toBe(false);
  });

  it("presses with a rephrased question, never the one just asked", () => {
    for (const s of SCENARIOS.filter((x) => demoScriptFor(x).pressRepeats !== false)) {
      const script = demoScriptFor(s);
      const turn = replyTo(s, [GOOD_LINES[s.id][0], "yeah"]);
      expect(turn.kind, s.id).toBe("press");
      const previous = demoPersonaTurn(s, [{ role: "persona", content: s.openingLine }, { role: "user", content: GOOD_LINES[s.id][0] }]).text;
      const asked = [script.opener, ...script.questions].find((q) => previous.includes(q));
      if (asked) expect(turn.text, s.id).not.toContain(asked);
    }
  });

  it("takes a sensory detail as an answer, not a reason to press", () => {
    const s = scenario("campfire-story");
    const turn = replyTo(s, ["I'm nineteen, standing in a bus station in Tulsa at 2 a.m.", "The water smelled like chlorine and pennies."]);
    expect(turn.kind).toBe("reply");
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s never reuses a reaction across the conversation", (_id, s) => {
    const script = demoScriptFor(s);
    const questions = [script.opener, script.openerAgain ?? "", ...script.questions, ...(script.rephrase ?? []), ...(script.more ?? []), ...(script.fallout ?? [])].filter(Boolean);
    const reactions = play(s, GOOD_LINES[s.id])
      .filter((m) => m.role === "persona")
      .slice(1, -1)
      .map((m) => questions.reduce((text, q) => text.replace(q, ""), m.content).replace(/“[^”]*”/g, "").trim());
    for (let i = 0; i < reactions.length; i++) {
      for (let j = i + 1; j < reactions.length; j++) {
        if (reactions[i].split(/\s+/).length < 5 || reactions[j].split(/\s+/).length < 5) continue;
        expect(lineSimilarity(reactions[i], reactions[j]), `${s.id}: “${reactions[i]}” / “${reactions[j]}”`).toBeLessThan(0.75);
      }
    }
  });
});

describe("Subtext Sparring", () => {
  const s = scenario("subtext-sparring");
  const confession = ["I think I just really feel so guilty, I basically sold Dad's boat to pay my debts, I guess.", "I mean, I kind of had to, honestly.", "I'm sorry, I really am. I didn't know what else to do."];

  it("offers only this scene's own model lines", () => {
    const script = demoScriptFor(s);
    const own = new Set([...Object.values(script.examples), ""]);
    for (const lines of [confession, ["idk", "whatever", "sure", "fine"], ["I mean, I kind of, like, maybe want the tackle, I guess, honestly.", "Sort of, I think, basically, maybe."]]) {
      for (const i of demoEvaluate(s, play(s, lines)).improvements) {
        if (i.title === "Cut the hedges" && !own.has(i.example)) {
          // The learner's own line, made confident.
          expect(lines.some((line) => lineSimilarity(line, i.example) > 0.5), i.example).toBe(true);
          continue;
        }
        expect(own.has(i.example), i.example).toBe(true);
      }
    }
  });

  it("headlines a confession as saying too much, not as drifting away", () => {
    const evaluation = demoEvaluate(s, play(s, confession));
    expect(evaluation.headline).not.toMatch(/drifting/);
    expect(evaluation.headline).toMatch(/out loud/);
    expect(evaluation.improvements.map((i) => i.title)).not.toContain("Stay in the scene");
  });

  it("Tess answers the confession with a hurt, angry beat, then drops the scripted pressure", () => {
    const script = demoScriptFor(s);
    const beat = replyTo(s, [confession[0]]);
    expect(script.confession).toContain(beat.text);
    const next = replyTo(s, confession.slice(0, 2));
    expect(script.questions.some((q) => next.text.includes(q))).toBe(false);
    expect(script.fallout!.some((f) => next.text.includes(f))).toBe(true);
    // Naming a feeling isn't the secret: no confession beat.
    expect(script.confession).not.toContain(replyTo(s, ["I feel like there's a lot of tension between us right now."]).text);
  });

  it("quotes a hedge the learner actually said, without inventing words around it", () => {
    const turn = replyTo(s, ["Keys are on the hook.", "I guess, maybe, sort of, I don't know."]);
    const quoted = turn.text.match(/“([^”]+)”/)?.[1];
    if (quoted) expect("I guess, maybe, sort of, I don't know.".toLowerCase()).toContain(quoted.replace(/\.$/, "").toLowerCase());
  });
});
