/**
 * Regression tests for the final round of Story Lab review findings: logline
 * parsing (appositives, two-sentence loglines, "Once a…, now a…"), rewrite
 * stakes and obstacles, the Story Doctor's pacing and structure praise, and
 * the Shot Planner's cast, pronouns, short action lines and "same moment"
 * notes. Each table mixes the reviewers' evidence inputs with held-out ones
 * written for these tests.
 */
import { describe, expect, it } from "vitest";
import type { LoglineAnalysis, ShotPlan, StoryAnalysis } from "@/lib/ai/schemas";
import { demoLogline, demoShots, demoStory, loglineRewriteCandidates } from "./lab";

const component = (a: LoglineAnalysis, key: LoglineAnalysis["components"][number]["key"]) => a.components.find((c) => c.key === key)!;
const skill = (a: StoryAnalysis, key: string) => a.skillScores.find((s) => s.skill === key);
const allRewrites = (logline: string) => Object.values(loglineRewriteCandidates(logline));

// ---------------------------------------------------------------------------
// Logline Doctor: who the protagonist is
// ---------------------------------------------------------------------------

describe("demoLogline: a named protagonist with an appositive inside the incident", () => {
  const cases = [
    {
      // Evidence: the protagonist became "a disgraced ferry captain, learns her crew is smuggling refugees, she".
      logline:
        "When Maya Okafor, a disgraced ferry captain, learns her crew is smuggling refugees, she must choose between her license and their lives.",
      who: "Maya Okafor, a disgraced ferry captain",
      incident: "when she learns her crew is smuggling refugees",
    },
    {
      logline:
        "When Dr. Lena Park, a burned-out trauma surgeon, discovers her hospital is harvesting organs, she must expose the board before she becomes their next victim.",
      who: "Dr. Lena Park, a burned-out trauma surgeon",
      incident: "when she discovers her hospital is harvesting organs",
    },
    {
      logline: "After Jonah Reyes, an ex-con, inherits his brother's failing bar, he must keep it open for thirty days or lose it to the mob.",
      who: "Jonah Reyes, an ex-con",
      incident: "after he inherits his brother's failing bar",
    },
  ];

  it.each(cases)("reads $who as the protagonist", ({ logline, who, incident }) => {
    const a = demoLogline({ logline });
    const protagonist = component(a, "protagonist");
    expect(protagonist.note).toContain(`"${who}"`);
    expect(protagonist.score).toBeGreaterThanOrEqual(7);
    const { irony, stakes, tighter } = loglineRewriteCandidates(logline);
    expect(irony).toContain(`— ${who} — has no choice ${incident}`);
    expect(stakes.startsWith(`${who}, has one chance to`)).toBe(true);
    expect(tighter.startsWith(`${who}, must`)).toBe(true);
    for (const r of [irony, stakes, tighter]) {
      expect(r).not.toMatch(/, (she|he) (has|must)\b/); // never "A disgraced ferry captain, learns…, she has one chance"
      expect(r).not.toMatch(/has no choice (when|after) [A-Z]/); // never "has no choice when Maya Okafor"
    }
  });

  it("keeps a name with an appositive that sits in the main clause", () => {
    const logline = "When her father dies, Maya, a nurse, must sell the family farm before the bank takes it.";
    expect(component(demoLogline({ logline }), "protagonist").note).toContain('"Maya, a nurse"');
    expect(loglineRewriteCandidates(logline).classic).toBe(logline);
    // Her father is dead: he isn't the loss she's racing against.
    expect(allRewrites(logline).join("\n")).not.toMatch(/loses her father/);
  });

  it("closes an inserted phrase before the verb ('the town's only doctor, a recovering alcoholic, must')", () => {
    const logline = "When the storm hits, the town's only doctor, a recovering alcoholic, must keep the clinic running until the bridge reopens.";
    expect(component(demoLogline({ logline }), "protagonist").note).toContain("the town's only doctor, a recovering alcoholic");
    const { stakes, tighter } = loglineRewriteCandidates(logline);
    expect(stakes).toContain("a recovering alcoholic, has one chance");
    expect(tighter).toContain("a recovering alcoholic, must");
    expect(loglineRewriteCandidates("After years at sea, a sailor, now blind, must find his way home.").tighter).toBe(
      "A sailor, now blind, must find his way home.",
    );
  });

  it("lifts a protagonist whose incident verb or later clause used to block it", () => {
    for (const [logline, who] of [
      ["When a lonely lighthouse keeper rescues a mermaid, he must hide her from the villagers, but the mermaid wants to go home.", "a lonely lighthouse keeper"],
      ["When a hacker discovers her company is spying on its users, but nobody believes her, she must leak the files before she is framed.", "a hacker"],
    ]) {
      const note = component(demoLogline({ logline }), "protagonist").note;
      expect(note, logline).toContain(`"${who}"`);
      expect(note, logline).not.toMatch(/placeholder/);
    }
  });
});

describe("demoLogline: two-sentence loglines", () => {
  it.each([
    // Evidence: "The last person who should stop a bomber — Sarah is a cop. She — has to do it…"
    { logline: "Sarah is a cop. She must stop a bomber before the parade reaches the square.", who: "Sarah, a cop" },
    { logline: "Tom is a pacifist. He must lead the resistance against the invaders before winter.", who: "Tom, a pacifist" },
  ])("introduces $who from the first sentence", ({ logline, who }) => {
    expect(component(demoLogline({ logline }), "protagonist").note).toContain(`"${who}"`);
    const { irony, tighter } = loglineRewriteCandidates(logline);
    expect(irony).toContain(`— ${who} —`);
    expect(tighter.startsWith(`${who}, must`)).toBe(true);
    for (const r of allRewrites(logline)) expect(r).not.toMatch(/\bis an? \w+\. (She|He)\b/);
  });

  it("reads an action sentence before the goal as the incident that names the protagonist", () => {
    const logline = "A retired cop finds a bomb in her mailbox. She must find the bomber before noon.";
    expect(loglineRewriteCandidates(logline).classic).toBe("When a retired cop finds a bomb in her mailbox, she must find the bomber before noon.");
    expect(component(demoLogline({ logline }), "protagonist").note).toContain('"a retired cop"');
  });
});

describe("demoLogline: 'Once a…, now a…' openers", () => {
  it("reads a former self as part of the protagonist, not as the inciting incident", () => {
    // Evidence: "…has no choice once a celebrated chef", protagonist "now a prison cook, Marco".
    const logline = "Once a celebrated chef, now a prison cook, Marco must win a cooking contest behind bars to earn early parole.";
    const a = demoLogline({ logline });
    expect(component(a, "protagonist").note).toContain('"Marco, a celebrated chef turned prison cook"');
    expect(component(a, "hook").note).toContain("once a celebrated chef, now a prison cook");
    for (const r of allRewrites(logline)) {
      expect(r).not.toMatch(/once a celebrated chef\.$|no choice once/);
      expect(r).not.toMatch(/^Now a prison cook/);
    }
    expect(loglineRewriteCandidates(logline).irony).toContain("— Marco, a celebrated chef turned prison cook — must do it to earn early parole.");
  });

  it.each([
    ["Once a famous magician, now a broke children's entertainer, Leo must pull off one last trick to win back his daughter.", "Leo, a famous magician turned broke children's entertainer"],
    ["Once a champion, she must fight one last bout to save her gym.", "a former champion"],
  ])("held out: %s", (logline, who) => {
    expect(component(demoLogline({ logline }), "protagonist").note).toContain(`"${who}"`);
  });

  it("still treats 'Once a year' as a time, not a former self", () => {
    const logline = "Once a year, a lonely widow must host the family reunion she dreads.";
    expect(component(demoLogline({ logline }), "protagonist").note).toContain('"a lonely widow"');
    expect(loglineRewriteCandidates(logline).classic.startsWith("Once a year, a lonely widow must")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Logline Doctor: rewrites
// ---------------------------------------------------------------------------

describe("demoLogline: rewrites never double the consequence or the obstacle", () => {
  it.each([
    // Evidence: "…before she loses her father for good — and if she fails, she loses her father."
    "A chess prodigy must win back the tournament spot her father sold, before she loses her father for good.",
    "A grieving widower must rebuild his late wife's garden before the house is sold, before he loses the last piece of her.",
    "A disillusioned high school chemistry teacher who has just been diagnosed with terminal cancer must build a drug empire as fast as he can to secure his family's financial future before he dies, while hiding it from his DEA agent brother-in-law.",
  ])("a deadline that already names the loss gets no second one: %s", (logline) => {
    for (const r of allRewrites(logline)) {
      expect(r).not.toMatch(/if (she|he|they) fails?,/);
      expect(r).not.toMatch(/\[the one thing/);
    }
  });

  it("doesn't repeat an obstacle the incident already states", () => {
    // Evidence: Classic ended "…before she loses her mother for good — but every rewind erased one memory of her mother."
    // while its incident already said "…, but every rewind erased one memory of her mother".
    const logline = "What if a shy teenager discovered she could rewind time by ten seconds, but every rewind erased one memory of her mother?";
    const { classic, irony } = loglineRewriteCandidates(logline);
    expect(classic.match(/every rewind erased/g)).toHaveLength(1);
    expect(classic.startsWith("When a shy teenager discovers she could rewind time by ten seconds, she must")).toBe(true);
    expect(irony).not.toMatch(/, but every rewind/);
  });

  it("splits a deadline from an obstacle that follows it", () => {
    const logline =
      "A timid accountant must infiltrate the mob to rescue his kidnapped twin brother before the wedding, but the boss is his own father-in-law and the FBI is watching him.";
    const a = demoLogline({ logline });
    expect(component(a, "obstacle").note).toContain('"but the boss is his own father-in-law');
    const all = allRewrites(logline).join("\n");
    expect(all).not.toMatch(/loses his own father\b/); // "father-in-law" is not "his own father"
    expect(loglineRewriteCandidates(logline).tighter).toBe("A timid accountant must infiltrate the mob before the wedding.");
  });

  it("never names a loss the incident already took", () => {
    const logline = "When Maya, a single mom, loses her job, she must win a cooking contest to keep her apartment.";
    expect(allRewrites(logline).join("\n")).not.toMatch(/loses her job for good/);
  });

  it.each([
    {
      logline: "A cynical food critic must travel from Lisbon to Moscow in a stolen car with her estranged father and a bag of cash to deliver a wedding cake before the ceremony starts.",
      keeps: "travel from Lisbon to Moscow",
      never: /from Lisbon before|should travel from Lisbon —/,
    },
    {
      logline: LONG_BREAKING_BAD(),
      keeps: "as fast as he can",
      never: /must build a drug empire as fast\b(?! as he can)/,
    },
    {
      logline: "A bitter lighthouse keeper must relight the lamp she sabotaged years ago to guide her estranged son's trawler through a hurricane — before the rocks claim the only person who might forgive her.",
      keeps: "the only person who might forgive her",
      never: /the only person\.$/,
    },
  ])("the Tighter rewrite keeps whole phrases ($keeps)", ({ logline, keeps, never }) => {
    const { tighter, irony } = loglineRewriteCandidates(logline);
    expect(tighter).toContain(keeps);
    expect(`${tighter}\n${irony}`).not.toMatch(never);
    expect(tighter).not.toMatch(/\b(the|a|an|of|to|from|with|as|and|but|who)\.$/i);
  });
});

function LONG_BREAKING_BAD(): string {
  return "A disillusioned high school chemistry teacher who has just been diagnosed with terminal cancer must build a drug empire as fast as he can to secure his family's financial future before he dies, while hiding it from his DEA agent brother-in-law.";
}

describe("demoLogline: the new parses keep the ordering", () => {
  it("scores the fixed appositive and two-sentence loglines above a vague one, and a synopsis below the one-liner", () => {
    const vague = demoLogline({ logline: "A man goes on a journey to find himself and learns what really matters." }).overall;
    for (const logline of [
      "When Maya Okafor, a disgraced ferry captain, learns her crew is smuggling refugees, she must choose between her license and their lives before the coast guard boards at dawn.",
      "Sarah is a cop. She must stop a bomber before the parade reaches the square.",
      "Once a celebrated chef, now a prison cook, Marco must win a cooking contest behind bars to earn early parole.",
    ]) {
      expect(demoLogline({ logline }).overall, logline).toBeGreaterThan(vague + 15);
    }
  });
});

// ---------------------------------------------------------------------------
// Story Doctor
// ---------------------------------------------------------------------------

/** Evidence: pacing 59, yet "Rhythm with range — your short sentences land the big moments." */
const UNPUNCTUATED =
  "every morning my grandmother fed the crows on the fence behind her house and every morning they came back and one day she got sick and could not go outside and the crows came to the window and tapped on the glass and she laughed for the first time in weeks and my mother said it was silly but after that she started getting better and she said the crows had reminded her that someone was waiting for her and when she finally went back outside they were all there on the fence like nothing had happened and she cried and fed them double and i think about that every time i see a crow";
/** Evidence: pacing 61 and the same strength. */
const PITCH =
  "Every year, forty thousand small bakeries close because they can't predict demand. They bake too much and throw it away, or too little and turn customers away. I watched my mother lose her bakery in Lyon this way. So we built Crumb: an app that reads the weather, local events and past sales and tells a baker exactly how many loaves to make each morning. In our pilot with twelve bakeries, waste fell by forty percent and profits rose by eighteen percent. But the big chains are building the same tools, and if we don't sign two hundred bakeries by spring, they will own this market. We're raising one million euros to get there.";
/** Evidence: headlined "A clear shape, but the opening takes too long to grab us." */
const FLAT =
  "This is a story about my summer. It was a nice summer and I did a lot of things. I went to the beach with my friends and we had fun. We ate ice cream and played volleyball. Then we went home and ate dinner. The next day we went to the mall and bought some clothes. It was a good summer. I learned that friends are important and that you should enjoy life.";
/** Held out: every sentence 13–17 words — steady, with nothing short. */
const STEADY =
  "The bus left the depot at six every morning and my father drove it for thirty years. He knew every passenger by name and every pothole on the long road to the coast. One winter the company sold the route to a firm from the city that wanted younger drivers. He trained his replacement for a month and never once complained about the decision to anyone. On his last day the regular passengers filled the bus and sang to him all the way home. He keeps the ticket machine on a shelf in the garage and polishes it every Sunday afternoon.";
/** Held out: long build-ups and short hits. */
const VARIED =
  "For eleven years Delia had piloted the last ferry across the harbour, through fog and sleet and the long grey nights when nobody at all was aboard. Tonight a boy was hiding under the benches. Soaked. Shaking. The radio crackled that the harbour police were searching for a missing child, and she knew, before he even looked up, that the child was him. She lied. When the ferry docked, a police car was waiting on the pier with its blue lights washing across the wet stones, and she walked the boy straight past it, holding his hand. She never looked back.";

describe("demoStory: praise the notes can back up", () => {
  const stories: [string, string, "three-act" | "story-spine"][] = [
    ["unpunctuated", UNPUNCTUATED, "three-act"],
    ["pitch", PITCH, "story-spine"],
    ["flat", FLAT, "three-act"],
    ["steady", STEADY, "three-act"],
    ["varied", VARIED, "three-act"],
  ];

  it.each(stories)("%s: the rhythm strength only with the rhythm, 'A clear shape' only with the structure", (_label, text, framework) => {
    const a = demoStory({ text, framework, format: "personal-story" });
    const pacing = skill(a, "pacing")!;
    const structure = skill(a, "structure")!;
    const strengths = a.strengths.join("\n");
    if (strengths.includes("Rhythm with range")) {
      expect(pacing.score).toBeGreaterThanOrEqual(60);
      expect(pacing.comment).not.toMatch(/Save your shortest sentences|steady ~/);
    }
    if (pacing.score < 60) expect(strengths).not.toMatch(/Rhythm with range|rhythmic range/);
    if (a.headline.startsWith("A clear shape")) expect(structure.score).toBeGreaterThanOrEqual(65);
    if (strengths.includes("A shape you can feel")) expect(structure.score).toBeGreaterThanOrEqual(65);
    if (a.headline.startsWith("Confident rhythm")) expect(strengths).toContain("Rhythm with range");
  });

  it("drops the reported contradictions", () => {
    for (const text of [UNPUNCTUATED, PITCH, STEADY]) {
      expect(demoStory({ text, framework: "three-act", format: "short-film" }).strengths.join("\n")).not.toContain("Rhythm with range");
    }
    const flat = demoStory({ text: FLAT, framework: "three-act", format: "personal-story" });
    expect(flat.headline).not.toMatch(/^A clear shape/);
    expect(flat.strengths.join("\n")).not.toContain("A shape you can feel");
  });

  it("still praises real rhythm, and ranks varied above steady", () => {
    const varied = demoStory({ text: VARIED, framework: "three-act", format: "short-film" });
    const steady = demoStory({ text: STEADY, framework: "three-act", format: "short-film" });
    expect(skill(varied, "pacing")!.score).toBeGreaterThan(skill(steady, "pacing")!.score);
    expect(skill(varied, "pacing")!.score).toBeGreaterThanOrEqual(70);
    expect(varied.strengths.join("\n")).toContain("Rhythm with range");
  });
});

// ---------------------------------------------------------------------------
// Shot Planner: the cast
// ---------------------------------------------------------------------------

const subjects = (plan: ShotPlan) => plan.shots.map((s) => s.subject);

describe("demoShots: places and common nouns aren't characters; roles as subjects are", () => {
  // Evidence: "Fifth and Avenue and Church", a push-in on "Church", and the crying woman never a subject.
  const CITY =
    "Steam rises from the grates. Traffic crawls down Fifth Avenue as the sun comes up. Church bells ring somewhere to the east. A woman in a red coat stops at the crosswalk, checks her phone, and starts to cry.";

  it("finds the woman in the city scene and nobody else", () => {
    const plan = demoShots({ scene: CITY });
    const text = JSON.stringify(plan);
    expect(text).not.toMatch(/\b(Fifth|Avenue|Church) (and|listens|alone)\b|on Church\b|between Fifth/);
    for (const s of subjects(plan)) expect(s).not.toMatch(/^(Fifth|Avenue|Church|The ring)\b/);
    const cry = plan.shots.find((s) => s.action.includes("starts to cry"));
    expect(cry?.subject).toBe("The woman");
    expect(cry?.size).toBe("close-up");
    // No push-in on someone who hasn't appeared yet.
    const push = plan.shots.find((s) => s.movement === "push-in" && s.size === "close-up");
    if (push) expect(push.action).not.toMatch(/bells|Traffic/);
  });

  it.each([
    {
      scene: "Taxis crawl up Broadway. Church bells ring. A man in a grey suit waits by the bus stop, reading a newspaper. Rain starts. He opens an umbrella.",
      cast: /^Bus stop\.( The man)? —|The man/,
      never: /Broadway|Church/,
    },
    {
      scene: "Maria walks along Ocean Drive past Grace Cathedral. Pigeons scatter. Maria stops at the fountain and takes out a letter. She reads it twice.",
      cast: /Maria/,
      never: /\b(Ocean|Drive|Grace|Cathedral)\b(?! past)/,
    },
  ])("held out: $scene", ({ scene, cast, never }) => {
    const plan = demoShots({ scene });
    expect(plan.sceneSummary).toMatch(cast);
    for (const s of subjects(plan)) expect(s).not.toMatch(never);
    expect(plan.coverageNotes.join(" ")).not.toMatch(never);
  });

  it("adds a role noun that is the subject of its own sentence even when a name exists", () => {
    const plan = demoShots({ scene: "Leo waits at the bar. A woman in a red coat walks in and sits beside him. Leo glances at her. She orders a whisky." });
    expect(plan.sceneSummary).toMatch(/Leo and the woman/);
    expect(plan.coverageNotes.join(" ")).toContain("between Leo and the woman");
    // An appositive still describes the named character rather than adding someone.
    const named = demoShots({ scene: "Maria, a woman in her forties, sits alone at the bar. Maria stares at her phone. It buzzes." });
    expect(named.sceneSummary).not.toMatch(/the woman/);
  });
});

describe("demoShots: pronouns", () => {
  // Evidence: "She glances at it and laughs." was given to the detective; the suspect was a "Cutaway".
  const PRONOUNS =
    'The detective enters the interrogation room. The suspect does not look up. He slides a photo across the table. She glances at it and laughs. He leans closer. "You were there." She stops laughing.';

  it("keeps both people and never pins an unresolved pronoun on the wrong one", () => {
    const plan = demoShots({ scene: PRONOUNS });
    expect(plan.coverageNotes.join(" ")).toContain("between the detective and the suspect");
    expect(plan.coverageNotes.join(" ")).not.toMatch(/With one character/);
    const suspect = plan.shots.find((s) => s.action.startsWith("The suspect does not look up"));
    expect(suspect?.subject).toBe("The suspect");
    const laughs = plan.shots.find((s) => s.action.startsWith("She glances at it"));
    expect(laughs?.subject).not.toBe("The detective");
    expect(plan.sceneSummary.startsWith("Interrogation Room.")).toBe(true);
  });

  it("resolves 'She' by the character's name when nothing else says who she is", () => {
    const scene = `INT. DINER - NIGHT

Rain streaks the window. NADIA (30s) wipes the counter. SAM (40s) nurses cold coffee.

NADIA
You sold it.

SAM
(not looking up)
I sold the truck.

She slams the coffee pot down.

NADIA
Then you should have told me.

She leaves the money on the counter and walks out into the rain.`;
    const plan = demoShots({ scene });
    for (const s of plan.shots.filter((x) => x.action.startsWith("She "))) expect(s.subject, s.action).toBe("Nadia");
  });

  it("follows a pronoun after a lead-in ('For a moment he…')", () => {
    const plan = demoShots({
      scene:
        "EXT. ROOFTOP - NIGHT. Rain hammers the gravel. Kai sprints across the roof, a bag of stolen diamonds clutched to his chest. Behind him, two guards burst through the stairwell door. Kai reaches the edge. For a moment he hangs there, looking down at the alley six floors below. He leaps.",
    });
    const hangs = plan.shots.find((s) => s.action.startsWith("For a moment he hangs"));
    if (hangs) expect(hangs.subject).toBe("Kai");
  });
});

describe("demoShots: short action lines", () => {
  it.each([
    {
      // Evidence: "He leaps." vanished and the closing wide fell on the line before it.
      scene:
        "EXT. ROOFTOP - NIGHT\nRain hammers the gravel. Kai sprints across the roof, a bag of stolen diamonds clutched to his chest. Behind him, two guards burst through the stairwell door. Kai reaches the edge. For a moment he hangs there, looking down at the alley six floors below. He leaps.",
      line: "He leaps.",
      closing: true,
    },
    {
      // Evidence: the market chase lost "Dead end."
      scene:
        "A motorbike tears through the market. Stalls explode into fruit and splinters. JONAS (20s) ducks under an awning, vaults a cart, and sprints down an alley. The bike skids in after him. Dead end. Jonas turns, breathing hard, and grabs a length of pipe.",
      line: "Dead end.",
      closing: false,
    },
    {
      scene: "INT. HALLWAY - NIGHT\nNora creeps along the dark hallway toward her brother's door, one hand on the wall. A floorboard creaks. She freezes. She opens the door.",
      line: "She opens the door.",
      closing: true,
    },
  ])("keeps $line", ({ scene, line, closing }) => {
    const plan = demoShots({ scene });
    const shot = plan.shots.find((s) => s.action === line);
    expect(shot, JSON.stringify(plan.shots.map((s) => s.action))).toBeDefined();
    if (closing) expect(plan.shots[plan.shots.length - 1].action).toBe(line);
  });

  it("lets a punchy line in the back half carry the turn", () => {
    const plan = demoShots({
      scene:
        "A motorbike tears through the market. Stalls explode into fruit and splinters. JONAS (20s) ducks under an awning, vaults a cart, and sprints down an alley. The bike skids in after him. Dead end. Jonas turns, breathing hard, and grabs a length of pipe.",
    });
    const turn = plan.shots.find((s) => s.movement === "push-in" && s.size === "close-up");
    expect(turn?.action).toBe("Dead end.");
    expect(turn?.subject).toBe("Jonas");
  });
});

// ---------------------------------------------------------------------------
// Shot Planner: notes on the writer's own shots
// ---------------------------------------------------------------------------

describe("demoShots: 'same moment' compares what's in frame", () => {
  const DANIEL = `INT. KITCHEN - NIGHT

Rain on the windows. MARA (40s) stands at the stove, stirring a pot that has long since boiled dry.

Her son DANIEL (17) enters, soaked, car keys in hand.

DANIEL
I'm going.

MARA
Where?

He doesn't answer. He puts the keys on the table between them.

Mara turns off the burner. Looks at the keys. Doesn't touch them.

MARA (CONT'D)
Your father used to leave them there too.

Daniel picks the keys back up and walks out. The door stays open. Rain comes in.`;

  const ideas = [
    "Over-the-shoulder of Daniel at the door",
    "Insert of the keys on the table",
    "Wide of the kitchen from the hallway",
    "Close on Mara's hand on the burner knob",
    "Close-up of Daniel's face as the door stays open",
  ];
  const plan = demoShots({ scene: DANIEL, userShots: ideas.join("\n") });
  const note = (i: number) => plan.feedbackOnUserShots[i].note;
  const find = (pred: (s: ShotPlan["shots"][number]) => boolean) => plan.shots.find(pred);

  it("matches an over-the-shoulder of Daniel to the over-the-shoulder with Daniel in it, not the insert of the door", () => {
    // Evidence: it pointed at "CU Insert — The door: The door stays open." instead of the plan's over-the-shoulder.
    const ots = find((s) => s.framing === "over-the-shoulder" && /Daniel/.test(s.subject))!;
    const door = find((s) => s.framing === "insert" && s.subject === "The door")!;
    expect(ots).toBeDefined();
    expect(note(0)).toContain(`shot ${ots.number}`);
    if (door) expect(note(0)).not.toContain(`shot ${door.number} `);
  });

  it("keeps the correct matches: the keys insert and the burner", () => {
    const keys = find((s) => s.framing === "insert" && s.subject === "The keys")!;
    expect(note(1)).toContain(`covers the same moment as shot ${keys.number}`);
    const burner = find((s) => s.action.includes("burner"))!;
    expect(note(3)).toContain(`shot ${burner.number}`);
    expect(note(2)).toContain("shot 1");
  });

  it("doesn't claim a duplicate from one shared noun in another shot's action", () => {
    const door = find((s) => s.subject === "The door");
    expect(note(4)).not.toMatch(/covers the same moment|already has this set-up/);
    if (door) expect(note(4)).not.toContain(`shot ${door.number}`);
  });
});

describe("demoShots: who does what (held out)", () => {
  it("reads 'Nora lights a cigarette' as Nora acting, and 'She offers one to Beth' as not Beth", () => {
    const plan = demoShots({ scene: "Nora and Beth sit on the porch. Nora lights a cigarette. She offers one to Beth. Beth shakes her head." });
    expect(plan.sceneSummary).toMatch(/Nora and Beth/);
    expect(plan.shots.find((s) => s.action.startsWith("She offers one"))?.subject).toBe("Nora");
  });

  it("doesn't make a character of a compound noun ('Brake lights glow')", () => {
    const plan = demoShots({ scene: "Brake lights glow in the rain. Tom waits at the corner, hands in his pockets. He checks his watch. A bus pulls up." });
    expect(JSON.stringify(plan)).not.toMatch(/\bBrake (and|listens|alone)\b|between Brake/);
    expect(plan.sceneSummary).toMatch(/Tom/);
  });

  it("gives a pronoun-only scene a cast instead of 'the protagonist'", () => {
    const plan = demoShots({ scene: "She walks into the kitchen. She opens the fridge. It's empty. She laughs." });
    expect(JSON.stringify(plan)).not.toMatch(/protagonist/i);
    expect(plan.shots.some((s) => s.subject === "The woman")).toBe(true);
  });

  it("keeps the subject through verb-first fragments ('Kneels.', 'Digs.')", () => {
    const plan = demoShots({ scene: "EXT. BEACH - DAWN\n\nWaves roll in. An old man walks along the shore with a metal detector. He stops. Kneels. Digs." });
    for (const s of plan.shots.filter((x) => x.action === "Kneels." || x.action === "Digs.")) expect(s.subject).toBe("The man");
  });

  it("alternates unattributed lines of prose dialogue", () => {
    const plan = demoShots({
      scene:
        'Maria sits at the kitchen table, turning a mug in her hands. Her father stands by the sink. "Where will you go?" he asks. "Florida. Your aunt has a room." He pushes a set of keys across the table. She doesn\'t take them. "You can keep the car," he says. "I don\'t want the car." Steam rises from the kettle. Neither of them moves to turn it off.',
    });
    expect(plan.shots.find((s) => s.action.includes("Florida"))?.subject).toMatch(/^Maria\b/);
    expect(plan.shots.find((s) => s.action.includes("I don't want the car"))?.subject).toMatch(/^Maria\b/);
    expect(plan.shots.find((s) => s.action.includes("You can keep the car"))?.subject).toMatch(/^The father\b/);
  });
});
