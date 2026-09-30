/**
 * Table-driven regression tests for the offline Story Lab heuristics: strong
 * vs weak vs edge-case inputs, asserting sensible orderings and the specific
 * misreadings reviewers found (pronoun protagonists, screenplay format,
 * sentence-initial capitals, length effects, broken rewrites).
 */
import { describe, expect, it } from "vitest";
import type { LoglineAnalysis, StoryAnalysis } from "@/lib/ai/schemas";
import { demoLogline, demoShots, demoStory, loglineRewriteCandidates } from "./lab";

const score = (a: LoglineAnalysis, key: LoglineAnalysis["components"][number]["key"]) => a.components.find((c) => c.key === key)!;
const skill = (a: StoryAnalysis, key: string) => a.skillScores.find((s) => s.skill === key);

// ---------------------------------------------------------------------------
// Logline Doctor
// ---------------------------------------------------------------------------

describe("demoLogline: a protagonist introduced in the incident", () => {
  const cases = [
    {
      logline: "When a disgraced ferry captain learns her crew is smuggling refugees, she must choose between her license and their lives before the coast guard boards at dawn.",
      who: "a disgraced ferry captain",
    },
    {
      logline: "After a burned-out paramedic discovers her partner is selling patients' organs, she must expose the ring before she becomes their next donor.",
      who: "a burned-out paramedic",
    },
    { logline: "When an aging jazz pianist goes deaf, he must relearn his craft by feel before his final concert.", who: "an aging jazz pianist" },
    {
      logline: "when a shy librarian finds a map in a returned book, she must follow it across Europe before the book's owner finds her.",
      who: "a shy librarian",
    },
  ];

  it.each(cases)("finds $who and never rewrites the protagonist as a pronoun", ({ logline, who }) => {
    const a = demoLogline({ logline });
    const protagonist = score(a, "protagonist");
    expect(protagonist.score).toBeGreaterThanOrEqual(7);
    expect(protagonist.note).toContain(who);
    expect(protagonist.note).not.toMatch(/placeholder/);
    expect(a.verdict).not.toMatch(/placeholder/);
    for (const r of Object.values(loglineRewriteCandidates(logline))) {
      expect(r).not.toMatch(/^(She|He|They) (must|has|have)\b/);
      expect(r).not.toMatch(/ — (she|he|they) — /);
      expect(r.toLowerCase()).not.toContain(`, ${who} must`); // never "When a captain…, a captain must"
    }
    expect(a.rewrites.some((r) => r.logline.toLowerCase().includes(who))).toBe(true);
  });

  it("doesn't lift an antagonist or someone else's relative out of the incident", () => {
    for (const logline of [
      "When a hurricane hits the island, she must get her kids to the mainland before the bridge floods.",
      "When her estranged father is framed for murder, she must find the real killer before the trial.",
    ]) {
      const a = demoLogline({ logline });
      expect(score(a, "protagonist").score).toBeLessThanOrEqual(3);
      // The rewrites ask for a protagonist rather than repeating the pronoun.
      expect(a.rewrites.every((r) => !/ — she — |^She must/.test(r.logline))).toBe(true);
      expect(a.rewrites.some((r) => r.logline.includes("[a specific, flawed protagonist]") || r.logline.includes("[A specific, flawed protagonist]"))).toBe(true);
    }
  });

  it("reads a 'What if…' premise, treating the discovery as the incident", () => {
    const logline = "What if a shy teenager discovered she could rewind time by ten seconds?";
    const a = demoLogline({ logline });
    expect(score(a, "protagonist").score).toBeGreaterThanOrEqual(6);
    expect(score(a, "goal").note).toMatch(/inciting event/);
    const { classic } = loglineRewriteCandidates(logline);
    expect(classic).toMatch(/^When a shy teenager discovers she could rewind time by ten seconds, she must \[a concrete goal\]/);
  });
});

describe("demoLogline: rewrites stay grammatical and keep the right stakes", () => {
  const LOGLINES = [
    "The only surgeon who can save the president is the woman he had deported ten years ago.",
    "A reluctant lighthouse keeper on a remote Scottish island must keep the lamp burning through a week-long storm while a ship full of children drifts toward the rocks.",
    "A single mother must smuggle her son across the border before midnight — or lose her only child forever to the cartel that wants him.",
    "After a burned-out paramedic discovers her partner is selling patients' organs, she must expose the ring before she becomes their next donor.",
    "A widowed lighthouse keeper who drove her husband to his death must save a stranded ship before the storm peaks.",
    "A teenage chess prodigy must win the tournament spot her father sold to pay his gambling debts before the national finals.",
    "A bitter lighthouse keeper must relight the lamp she sabotaged years ago to guide her estranged son's trawler through a hurricane — before the rocks claim the only person who might forgive her.",
    "A washed-up stunt driver must win one last illegal street race to pay off his daughter's surgery, but the race is run by the cartel boss who crippled him.",
    "When her estranged father is framed for a cartel murder, a disgraced deep-sea diver must recover the evidence from a sunken ferry before a hurricane buries it — and him — forever.",
    "A retired cop who lands a job as a mall Santa discovers a heist planned for Christmas Eve.",
    "When a hurricane hits the island, she must get her kids to the mainland before the bridge floods.",
  ];

  it.each(LOGLINES)("no dangling words or broken clauses: %s", (logline) => {
    for (const [angle, r] of Object.entries(loglineRewriteCandidates(logline))) {
      expect(r, angle).not.toMatch(/\b(the|a|an|of|to|toward|towards|only|his|their|its|and|but|with|from|in|on|at|for|by|or|who|which)\.$/i);
      expect(r, angle).not.toMatch(/\b(must|to) who\b/);
      expect(r, angle).not.toMatch(/\bthey (discovers|learns|finds|goes)\b/);
      expect(r, angle).toMatch(/^[A-Z[]/);
      expect(r, angle).toMatch(/[.]$/);
    }
  });

  it("turns 'X who can… is Y' into a person with an implied goal, not 'must who can'", () => {
    const logline = LOGLINES[0];
    const a = demoLogline({ logline });
    expect(score(a, "goal").note).toContain("save the president");
    const all = Object.values(loglineRewriteCandidates(logline)).join("\n");
    expect(all).toContain("the woman he had deported ten years ago");
    expect(all).toContain("save the president");
    expect(all).toMatch(/if she fails|what she loses/);
  });

  it("tightens the protagonist at a preposition, not by keeping the last three words", () => {
    expect(loglineRewriteCandidates(LOGLINES[1]).tighter).toMatch(/^A reluctant lighthouse keeper must keep the lamp burning/);
    expect(loglineRewriteCandidates(LOGLINES[1]).tighter).toContain("drifts toward the rocks.");
  });

  it("never cuts a clause mid-phrase", () => {
    const tighter = loglineRewriteCandidates(LOGLINES[6]).tighter;
    expect(tighter).not.toMatch(/the only person\.$/);
    expect(tighter).toMatch(/the only person who might forgive her\.$/);
    expect(loglineRewriteCandidates(LOGLINES[2]).tighter).not.toMatch(/her only\.$/);
  });

  it("doesn't name a villain, a dead relative or a seller as the loss", () => {
    const lossOf = (logline: string) => Object.values(loglineRewriteCandidates(logline)).join("\n");
    expect(lossOf(LOGLINES[3])).not.toMatch(/loses her partner/);
    expect(lossOf(LOGLINES[4])).not.toMatch(/loses her husband/);
    expect(lossOf(LOGLINES[5])).not.toMatch(/loses her father/);
    // Still names a real loss when there is one.
    expect(lossOf(LOGLINES[7])).toMatch(/loses his daughter/);
  });

  it("doesn't add a second consequence when the logline already says 'or lose…'", () => {
    const { stakes } = loglineRewriteCandidates(LOGLINES[2]);
    expect(stakes).not.toMatch(/if she fails/);
    expect(stakes.match(/\blose/g)?.length ?? 0).toBe(1);
  });

  it("reads possessives: 'his daughter's surgery' counts as stakes", () => {
    const a = demoLogline({ logline: LOGLINES[7] });
    expect(score(a, "stakes").score).toBeGreaterThan(2);
    expect(score(a, "stakes").note).not.toMatch(/no stated stakes/);
  });
});

describe("demoLogline: length", () => {
  const IDEAL =
    "A reluctant lighthouse keeper on a remote Scottish island must keep the lamp burning through a week-long storm while a ship full of children drifts toward the rocks.";
  const LONG_60 = `${IDEAL} Her estranged brother, the harbourmaster, wants the light switched off for good, and the insurers will pay him handsomely if it fails.`;
  const SPRAWL = Array.from({ length: 7 }, () => IDEAL.replace(/\.$/, "")).join(", and ") + ".";

  it("penalises length progressively, and a pasted paragraph is never 'ready to pitch'", () => {
    const ideal = demoLogline({ logline: IDEAL });
    const long = demoLogline({ logline: LONG_60 });
    const sprawl = demoLogline({ logline: SPRAWL });
    expect(ideal.overall).toBeGreaterThan(long.overall);
    expect(long.overall).toBeGreaterThan(sprawl.overall);
    expect(sprawl.overall).toBeLessThanOrEqual(55);
    expect(sprawl.verdict).not.toMatch(/Strong bones|Pitch-ready|ready to pitch/);
    expect(sprawl.verdict).toMatch(/synopsis/);
    expect(score(sprawl, "specificity").score).toBeLessThanOrEqual(4);
    expect(score(sprawl, "specificity").note).toMatch(/sprawls/);
    expect(sprawl.rewrites[0].angle).toBe("Tighter");
  });
});

describe("demoLogline: overall ordering", () => {
  const table: { label: string; logline: string; min?: number; max?: number }[] = [
    {
      label: "strong",
      logline:
        "When her estranged father is framed for a cartel murder, a disgraced deep-sea diver must recover the evidence from a sunken ferry before a hurricane buries it — and him — forever.",
      min: 70,
    },
    {
      label: "pronoun-led but specific",
      logline:
        "When a disgraced ferry captain learns her crew is smuggling refugees, she must choose between her license and their lives before the coast guard boards at dawn.",
      min: 65,
    },
    { label: "premise without a goal", logline: "What if a shy teenager discovered she could rewind time by ten seconds?", max: 50 },
    { label: "vague", logline: "A man goes on a journey to find himself and learns what really matters.", max: 35 },
  ];

  it("ranks strong > specific > premise-only > vague", () => {
    const scores = table.map((row) => ({ ...row, overall: demoLogline({ logline: row.logline }).overall }));
    for (let i = 1; i < scores.length; i++) expect(scores[i - 1].overall, `${scores[i - 1].label} vs ${scores[i].label}`).toBeGreaterThan(scores[i].overall);
    for (const row of scores) {
      if (row.min !== undefined) expect(row.overall, row.label).toBeGreaterThanOrEqual(row.min);
      if (row.max !== undefined) expect(row.overall, row.label).toBeLessThanOrEqual(row.max);
    }
  });
});

// ---------------------------------------------------------------------------
// Story Doctor
// ---------------------------------------------------------------------------

const SCREENPLAY = `INT. DINER - NIGHT

Rain streaks the window. NADIA (30s) slides into the booth across from SAM (60s), her father. He doesn't look up from his coffee.

NADIA
You sold it.

SAM
(not looking up)
I sold the truck. Not it.

NADIA
It was Mom's truck. You promised her.

Sam pushes an envelope across the table. Nadia doesn't touch it.

SAM
That's the money. All of it. Take it and go.

NADIA
I don't want your money. I want the truck back.

SAM
The buyer leaves for Denver at dawn.

Nadia grabs the envelope and stands. She leaves the money on the counter on her way out. The bell over the door rings. Sam finally looks up.`;

const PROSE_VERSION = `Rain streaked the diner window. Nadia slid into the booth across from her father. He didn't look up from his coffee. "You sold it," she said. "I sold the truck," Sam said. "Not it." "It was Mom's truck. You promised her." He pushed an envelope across the table. "That's the money. All of it. Take it and go." "I don't want your money. I want the truck back." "The buyer leaves for Denver at dawn." Nadia grabbed the envelope and stood. She left the money on the counter on her way out. The bell over the door rang. Sam finally looked up.`;

const FLAT =
  "This is a story about my summer. It was a nice summer and I did a lot of things. I went to the beach with my friends and we had fun. We ate ice cream and played volleyball. Then we went home and ate dinner. The next day we went to the mall and bought some clothes. It was a good summer. I learned that friends are important and that you should enjoy life.";

const TENSE = `Every night for eleven years, Delia has piloted the last ferry across the harbour. Tonight a boy is hiding under the benches, soaked and shaking. The radio crackles: the harbour police are searching for a missing child. He begs her not to turn him in. She is afraid of losing her license, afraid of the men who are hunting him. Halfway across, the engine fails and the fog closes in. The police boat is gaining on them. She has one choice left: hide him in the engine room and lie to their faces, or hand him over and keep her job. She lies. When the ferry docks, a police car is waiting, blue lights washing the pier. She walks the boy past it, holding his hand, and never looks back.`;

const UNPUNCTUATED =
  "every morning my grandmother fed the crows on the fence behind our house and she gave each one a name and one day the biggest crow brought her a silver button and after that they brought her things every day bottle caps and keys and a ring and then she got sick and went to the hospital and the crows kept coming but nobody fed them so i started feeding them and they started bringing things to me and when she came home she saw the pile of treasures on the windowsill and she cried and said they had been waiting for her and now we feed them together every morning";

describe("demoStory: screenplay format", () => {
  const a = demoStory({ text: SCREENPLAY, framework: "three-act", format: "scene" });

  it("never quotes sluglines, cues or parentheticals as prose", () => {
    const quoted = [
      ...a.beats.map((b) => b.evidence),
      ...a.lineNotes.map((n) => n.quote),
      ...a.skillScores.map((s) => s.comment),
      ...a.strengths,
      ...a.improvements.map((i) => `${i.detail} ${i.example}`),
    ].join("\n");
    expect(quoted).not.toMatch(/\bINT\b|DINER - NIGHT|\(not looking up\)/);
    expect(skill(a, "hook")!.comment).toContain("Rain streaks the window");
  });

  it("counts the speeches as dialogue and scores them like the prose version", () => {
    const dialogue = skill(a, "dialogue")!;
    expect(dialogue.comment).not.toMatch(/No dialogue yet/);
    expect(dialogue.score).toBeGreaterThanOrEqual(70);
    const prose = skill(demoStory({ text: PROSE_VERSION, framework: "three-act", format: "scene" }), "dialogue")!;
    expect(Math.abs(prose.score - dialogue.score)).toBeLessThanOrEqual(10);
    expect(a.headline).not.toMatch(/says too much out loud/);
  });

  it("reads 'NAME: line' speeches too", () => {
    const inline = demoStory({
      text: "INT. KITCHEN - NIGHT. Rain on the glass.\n\nMARA: You came back.\nTOM: You wrote.\nMARA: Is it true, what they're saying about the boat?",
      framework: "three-act",
      format: "scene",
    });
    expect(skill(inline, "dialogue")!.comment).toMatch(/3 lines of dialogue/);
  });
});

describe("demoStory: conflict", () => {
  it("scores a conflict-free story low, and never praises its 'pressure'", () => {
    const flat = demoStory({ text: FLAT, framework: "three-act", format: "personal-story" });
    const c = skill(flat, "conflict")!;
    expect(c.score).toBeLessThan(45);
    expect(c.comment).not.toMatch(/feels real/);
    expect(flat.strengths.join(" ")).not.toMatch(/Real pressure/);
    expect(flat.headline).not.toMatch(/Real pressure/);
  });

  it("orders tense > screenplay argument > flat", () => {
    const tense = skill(demoStory({ text: TENSE, framework: "three-act", format: "short-film" }), "conflict")!.score;
    const argument = skill(demoStory({ text: SCREENPLAY, framework: "three-act", format: "scene" }), "conflict")!.score;
    const flat = skill(demoStory({ text: FLAT, framework: "three-act", format: "personal-story" }), "conflict")!.score;
    expect(tense).toBeGreaterThanOrEqual(70);
    expect(tense).toBeGreaterThan(argument);
    expect(argument).toBeGreaterThan(flat);
  });
});

describe("demoStory: length doesn't collapse the density scores", () => {
  it("keeps conflict and visual scores for the same story at 30,000 characters", () => {
    let long = TENSE;
    while (long.length < 29000) long += `\n\n${TENSE}`;
    const single = demoStory({ text: TENSE, framework: "three-act", format: "feature" });
    const repeated = demoStory({ text: long.slice(0, 30000), framework: "three-act", format: "feature" });
    for (const key of ["conflict", "visual"]) {
      expect(Math.abs(skill(repeated, key)!.score - skill(single, key)!.score), key).toBeLessThanOrEqual(5);
    }
    expect(repeated.overall).toBeGreaterThanOrEqual(single.overall - 5);
  });
});

describe("demoStory: unpunctuated text", () => {
  it("finds several beats and doesn't praise the same run-on three times", () => {
    const a = demoStory({ text: UNPUNCTUATED, framework: "three-act", format: "short-film" });
    expect(a.beats.filter((b) => b.status !== "missing").length).toBeGreaterThanOrEqual(3);
    const quotes = a.strengths.map((s) => s.match(/"([^"]{20,})/)?.[1]?.slice(0, 40)).filter(Boolean);
    expect(new Set(quotes).size).toBe(quotes.length);
    for (const n of a.lineNotes) expect(n.note.length).toBeLessThan(400);
  });
});

describe("demoStory: missing beats", () => {
  it("doesn't open a missing beat's suggestion with the sentence the beat map already shows", () => {
    const a = demoStory({ text: FLAT, framework: "save-the-cat", format: "personal-story" });
    const missing = a.beats.filter((b) => b.status === "missing");
    expect(missing.length).toBeGreaterThan(0);
    for (const b of missing) expect(b.suggestion).not.toMatch(/^Nothing in the draft lands here yet/);
  });
});

// ---------------------------------------------------------------------------
// Shot Planner
// ---------------------------------------------------------------------------

describe("demoShots: sluglines on the same line as the action", () => {
  it.each([
    {
      scene: "INT. KITCHEN - NIGHT. Maria stares at the letter on the table while the kettle screams. Leo enters, sees the letter, freezes.",
      place: "Kitchen, night.",
      names: ["Maria", "Leo"],
    },
    {
      scene:
        "EXT. ROOFTOP - NIGHT. Rain hammers the gravel. Kai sprints across the roof, a bag of stolen diamonds clutched to his chest. Behind him, two guards burst through the stairwell door. Kai reaches the edge. For a moment he hangs there, looking down at the alley. He leaps.",
      place: "Rooftop, night.",
      names: ["Kai"],
    },
  ])("keeps the heading out of the shots and the names capitalised ($place)", ({ scene, place, names }) => {
    const plan = demoShots({ scene });
    expect(plan.sceneSummary.startsWith(place)).toBe(true);
    for (const name of names) {
      expect(plan.sceneSummary).toContain(name);
      expect(plan.sceneSummary).not.toContain(` ${name.toLowerCase()} `);
    }
    for (const s of plan.shots) {
      expect(s.action).not.toMatch(/^(INT|EXT)\.?$|^(KITCHEN|ROOFTOP) - NIGHT/);
      expect(s.subject).not.toMatch(/^(Int|Ext|For)\b/);
    }
  });

  it("reads a chase as kinetic, not 'quiet pressure'", () => {
    const plan = demoShots({
      scene:
        "EXT. ROOFTOP - NIGHT. Rain hammers the gravel. Kai sprints across the roof, a bag of stolen diamonds clutched to his chest. Behind him, two guards burst through the stairwell door. Kai reaches the edge. He leaps.",
    });
    expect(plan.emotionalIntent).not.toMatch(/Quiet pressure/);
    expect(plan.visualConcept).toMatch(/Handheld/);
  });
});

describe("demoShots: who's in the scene", () => {
  const MARIA = `Maria sits at the kitchen table, packing a small suitcase. Her father stands in the doorway. "Where will you go?" he asks. "Florida. Your aunt has a room." He pushes a set of keys across the table. She stares at them. "Take the car," he says. She shakes her head, then picks up the keys.`;
  const CITY =
    "Steam rises from the grates. Traffic crawls past the church. A woman in a red coat waits at the crosswalk, holding a paper cup. The light changes. She doesn't move. Traffic flows around her.";

  it("doesn't turn sentence-initial or quoted capitals into characters", () => {
    const subjects = [...demoShots({ scene: MARIA }).shots, ...demoShots({ scene: CITY }).shots].map((s) => s.subject);
    for (const bogus of ["Where", "Florida", "Steam", "Traffic", "Take"]) {
      expect(subjects.some((s) => s.startsWith(bogus))).toBe(false);
    }
  });

  it("includes people named by role and resolves 'he'/'she' to them", () => {
    const plan = demoShots({ scene: MARIA });
    expect(plan.sceneSummary).toMatch(/Maria and the father/);
    const keys = plan.shots.find((s) => s.action.startsWith("He pushes a set of keys"));
    if (keys) expect(keys.subject).toBe("The father");
    const stares = plan.shots.find((s) => s.action.startsWith("She stares"));
    expect(stares?.subject).toBe("Maria");
  });

  it("resolves 'She' in a screenplay to the character who is a she", () => {
    const plan = demoShots({ scene: SCREENPLAY });
    const exit = plan.shots.find((s) => s.action.startsWith("She leaves the money"));
    expect(exit?.subject).toBe("Nadia");
  });

  it("prefers the place people are in over a landmark they pass", () => {
    expect(demoShots({ scene: CITY }).shots[0].subject).not.toBe("Church");
  });

  it("doesn't treat a line of dialogue about leaving as an exit", () => {
    const plan = demoShots({ scene: SCREENPLAY });
    const line = plan.shots.find((s) => s.action.includes("The buyer leaves for Denver"));
    if (line) expect(line.purpose).not.toMatch(/walk out of it/);
  });
});

describe("demoShots: notes on the writer's own shots", () => {
  const scene = `INT. LIGHTHOUSE KITCHEN - NIGHT

Rain hammers the windows. MARA (40s), soaked, stands at the stove. TOM (60s), her father, sits at the table with an unopened envelope.

TOM
You came back.

MARA
You wrote.

Tom slides the envelope across the table. Mara picks up the envelope and turns it over. She doesn't open it.

TOM
Your mother never knew.

Mara realizes what he means. She walks out into the rain. The door slams. Tom sits alone.`;

  it("varies its advice and only claims a duplicate when the same moment is shown", () => {
    const plan = demoShots({
      scene,
      userShots: "Over-the-shoulder of the son at the wheel\nThe door\nMara at the stove\nClose-up on the envelope as Tom slides it across\nHandheld on Mara as she leaves",
    });
    const notes = plan.feedbackOnUserShots.map((f) => f.note);
    expect(notes).toHaveLength(5);
    // The generic "what's its job?" prompt isn't repeated word for word.
    const sentencesUsed = notes.flatMap((n) => n.split(/(?<=[.!?])\s+/));
    const counts = new Map<string, number>();
    for (const s of sentencesUsed) if (/job|beat|reason|feel or notice/i.test(s)) counts.set(s, (counts.get(s) ?? 0) + 1);
    for (const [s, n] of counts) expect(n, s).toBe(1);
    expect(notes[0]).not.toMatch(/covers the same moment/);
    // "Mara at the stove" is only a duplicate if the plan really has a shot of her at the stove.
    const stove = plan.shots.find((s) => /stove/.test(s.action));
    if (stove) expect(notes[2]).toContain(`shot ${stove.number}`);
    else expect(notes[2]).not.toMatch(/covers the same moment/);
    const envelope = plan.shots.find((s) => s.action.startsWith("Tom slides the envelope"))!;
    expect(notes[3]).toContain(`shot ${envelope.number}`);
    const exit = plan.shots.find((s) => s.action.startsWith("She walks out"));
    if (exit) expect(notes[4]).toContain(`shot ${exit.number}`);
  });
});

describe("demoStory: treatments with caps headings stay prose", () => {
  it("doesn't mistake ACT headings or a caps title for character cues", () => {
    const treatment = `NIGHT FERRY

ACT ONE
${TENSE.split(". ").slice(0, 4).join(". ")}.

ACT TWO
${TENSE.split(". ").slice(4).join(". ")}`;
    const a = demoStory({ text: treatment, framework: "three-act", format: "feature" });
    const quoted = [...a.beats.map((b) => b.evidence), ...a.lineNotes.map((n) => n.quote)].join("\n");
    expect(quoted).not.toMatch(/Act One:|Act Two:|Night Ferry:|NIGHT FERRY|ACT ONE/);
    expect(a.skillScores.find((s) => s.skill === "dialogue")).toBeUndefined();
  });
});

describe("demoLogline: incidents about someone else", () => {
  it.each([
    "When a stranger saves him from drowning, he must repay the debt before the tide turns.",
    "When a mysterious woman hires him to find her sister, he must search the city before dawn.",
  ])("keeps the pronoun as the protagonist: %s", (logline) => {
    const a = demoLogline({ logline });
    expect(a.components.find((c) => c.key === "protagonist")!.note).not.toMatch(/stranger|mysterious woman/);
  });
});
