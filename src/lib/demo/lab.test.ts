import { describe, expect, it } from "vitest";
import {
  LOGLINE_COMPONENTS,
  LoglineAnalysisSchema,
  ShotPlanSchema,
  StoryAnalysisSchema,
  type LoglineAnalysis,
} from "@/lib/ai/schemas";
import { FRAMEWORK_IDS, FRAMEWORKS } from "@/lib/frameworks";
import { STORY_FORMATS } from "@/lib/ai/schemas";
import { demoLogline, demoShots, demoStory } from "./lab";

const WEAK = "A man goes on a journey to find himself and learns what really matters.";
const STRONG =
  "When her estranged father is framed for a cartel murder, a disgraced deep-sea diver must recover the evidence from a sunken ferry before a hurricane buries it — and him — forever.";
const LOGLINES = [
  WEAK,
  STRONG,
  "A shy librarian who hates crowds must win a televised trivia tournament to save her small-town library from demolition.",
  "Maya, a burned-out ER nurse, fights to keep her clinic open against a ruthless developer while hiding her own addiction.",
  "Two friends go on a road trip.",
  "After a botched heist, a getaway driver with a stutter wants to collect his cut, but the crew is convinced he's the one who talked.",
  "It's about grief.",
  "An agoraphobic crossword setter must decode the clues a killer is hiding in her own newspaper grid before he strikes again on Sunday.",
];

const STORY = `This is a story about the summer I learned to swim. I was eleven and I was really scared of the water, basically terrified of it.

Every morning my grandmother walked me to the lake at the edge of our town. The water was cold and green and smelled like pine needles and diesel from the boats. She would sit on the dock with her thermos and watch me not go in.

Then one day she didn't come. My mother said she was in the hospital and that she might not come home. I felt so sad that I couldn't eat.

I decided I would swim across the lake before she came back, so she could see it from her window. I tried every day. I swallowed water, I panicked, I went under and came up coughing while the older kids laughed at me from the dock.

On the last day of August I finally did it. My arms burned and the far shore wouldn't get closer, but I kept going until my feet touched the mud.

She came home in September. I never told her I did it for her. I learned that courage is just fear that keeps going.`;

const SCENE = `INT. LIGHTHOUSE KITCHEN - NIGHT

Rain hammers the windows. MARA (40s), soaked, stands at the stove. TOM (60s), her father, sits at the table with an unopened envelope.

TOM
You came back.

MARA
You wrote.

Tom slides the envelope across the table. Mara picks up the envelope and turns it over. She doesn't open it.

MARA (CONT'D)
Is it true? What they're saying about the boat?

Tom looks at the window. A long silence.

TOM
Your mother never knew.

Mara realizes what he means. She sets the envelope down, slowly.

MARA
Then neither will I.

She walks out into the rain. The door slams. Tom sits alone.`;

const PROSE_SCENE =
  "A woman sits alone in a diner at 3am. She stares at her phone. It buzzes. She reads the message, then laughs, then cries. The waitress pours more coffee without asking.";

function component(a: LoglineAnalysis, key: (typeof LOGLINE_COMPONENTS)[number]) {
  return a.components.find((c) => c.key === key)!;
}

describe("demoLogline", () => {
  it("returns schema-valid analyses with all six components in order", () => {
    for (const logline of LOGLINES) {
      const a = LoglineAnalysisSchema.parse(demoLogline({ logline }));
      expect(a.components.map((c) => c.key)).toEqual([...LOGLINE_COMPONENTS]);
      for (const c of a.components) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(10);
        expect(Number.isInteger(c.score)).toBe(true);
        expect(c.note.length).toBeGreaterThan(20);
      }
      expect(a.overall).toBeGreaterThanOrEqual(0);
      expect(a.overall).toBeLessThanOrEqual(100);
      expect(a.verdict.length).toBeGreaterThan(10);
      expect(a.genreRead.length).toBeGreaterThan(10);
      expect(a.questions.length).toBeGreaterThanOrEqual(2);
      expect(a.questions.length).toBeLessThanOrEqual(4);
    }
  });

  it("always gives exactly three rewrites with distinct angles and distinct text", () => {
    for (const logline of LOGLINES) {
      const { rewrites } = demoLogline({ logline });
      expect(rewrites).toHaveLength(3);
      expect(new Set(rewrites.map((r) => r.angle)).size).toBe(3);
      expect(new Set(rewrites.map((r) => r.logline)).size).toBe(3);
      for (const r of rewrites) {
        expect(r.logline.trim().length).toBeGreaterThan(10);
        expect(r.logline).not.toBe(logline);
        expect(r.logline).toMatch(/^[A-Z[]/);
      }
    }
  });

  it("is deterministic", () => {
    for (const logline of LOGLINES) {
      expect(demoLogline({ logline, genre: "Drama" })).toEqual(demoLogline({ logline, genre: "Drama" }));
    }
  });

  it("scores a specific, ironic logline well above a vague one", () => {
    const weak = demoLogline({ logline: WEAK });
    const strong = demoLogline({ logline: STRONG });
    expect(strong.overall).toBeGreaterThanOrEqual(70);
    expect(weak.overall).toBeLessThanOrEqual(40);
    expect(strong.overall - weak.overall).toBeGreaterThanOrEqual(35);
    for (const key of ["protagonist", "goal", "stakes"] as const) {
      expect(component(strong, key).score).toBeGreaterThan(component(weak, key).score);
    }
  });

  it("quotes the writer's own words and keeps their story in the rewrites", () => {
    const a = demoLogline({ logline: STRONG });
    expect(component(a, "protagonist").note).toContain("a disgraced deep-sea diver");
    expect(component(a, "goal").note).toContain("recover the evidence");
    expect(a.rewrites.every((r) => r.logline.toLowerCase().includes("diver"))).toBe(true);
  });

  it("restructures a logline without an inciting incident into the classic shape with placeholders", () => {
    const a = demoLogline({ logline: "A shy librarian who hates crowds must win a televised trivia tournament to save her small-town library from demolition." });
    const classic = a.rewrites.find((r) => r.angle === "Classic shape");
    expect(classic?.logline).toMatch(/^When \[the inciting incident\], a shy librarian who hates crowds must win a televised trivia tournament/);
    expect(classic?.logline).toContain("before [what she loses if she fails]");
  });

  it("flags vague language and missing stakes", () => {
    const a = demoLogline({ logline: WEAK });
    expect(component(a, "specificity").note).toMatch(/journey|himself/);
    expect(component(a, "stakes").score).toBeLessThanOrEqual(3);
  });

  it("reads genre and notices a mismatch with the stated genre", () => {
    expect(demoLogline({ logline: STRONG }).genreRead.toLowerCase()).toContain("thriller");
    expect(demoLogline({ logline: STRONG, genre: "Romantic comedy" }).genreRead).toContain("You've labelled it Romantic comedy");
  });

  it("penalises loglines far outside the ideal length", () => {
    const long = `${STRONG} Meanwhile her ex-husband, a crooked harbour cop with gambling debts, is closing in, and the ferry's owner will do anything to keep the wreck secret, including sabotaging her dive gear and bribing the coast guard.`;
    expect(demoLogline({ logline: long }).overall).toBeLessThan(demoLogline({ logline: STRONG }).overall);
    expect(component(demoLogline({ logline: "A cop chases a thief." }), "specificity").note).toMatch(/too thin/);
  });
});

describe("demoStory", () => {
  it("returns a schema-valid analysis for every framework and format", () => {
    for (const framework of FRAMEWORK_IDS) {
      for (const format of STORY_FORMATS) {
        const a = StoryAnalysisSchema.parse(demoStory({ text: STORY, framework, format }));
        expect(a.framework).toBe(framework);
        expect(a.overall).toBeGreaterThanOrEqual(0);
        expect(a.overall).toBeLessThanOrEqual(100);
      }
    }
  });

  it("maps exactly the framework's beats, by name and in order", () => {
    for (const framework of FRAMEWORK_IDS) {
      const a = demoStory({ text: STORY, framework, format: "personal-story" });
      expect(a.beats.map((b) => b.beat)).toEqual(FRAMEWORKS[framework].beats.map((b) => b.name));
    }
  });

  it("quotes real sentences as evidence, and evidence follows story order", () => {
    const a = demoStory({ text: STORY, framework: "three-act", format: "personal-story" });
    const flat = STORY.replace(/\s+/g, " ");
    let lastIndex = -1;
    for (const b of a.beats) {
      if (b.status === "missing") {
        expect(b.evidence).toBe("");
        continue;
      }
      const quote = b.evidence.replace(/…$/, "");
      const index = flat.indexOf(quote);
      expect(index, `evidence for ${b.beat} should be quoted from the text`).toBeGreaterThanOrEqual(0);
      expect(index).toBeGreaterThan(lastIndex);
      lastIndex = index;
    }
  });

  it("includes the core skills, and visual/dialogue only when there's material", () => {
    const a = demoStory({ text: STORY, framework: "three-act", format: "personal-story" });
    const skills = a.skillScores.map((s) => s.skill);
    for (const core of ["structure", "character", "conflict", "hook", "pacing"] as const) expect(skills).toContain(core);
    expect(new Set(skills).size).toBe(skills.length);
    expect(skills).toContain("visual");
    expect(skills).not.toContain("dialogue");

    const scene = demoStory({
      text: `"You're late," Nina said, not looking up from the ledger. "The bank called twice."\n\nSam hung his coat on the nail by the door, the same nail for forty years. "Let them call," he said. The rain kept on against the window.`,
      framework: "kishotenketsu",
      format: "scene",
    });
    expect(scene.skillScores.map((s) => s.skill)).toContain("dialogue");
  });

  it("writes 3–6 line notes that quote exact sentences, and a 3–6 step plan", () => {
    const a = demoStory({ text: STORY, framework: "story-circle", format: "personal-story" });
    const flat = STORY.replace(/\s+/g, " ");
    expect(a.lineNotes.length).toBeGreaterThanOrEqual(3);
    expect(a.lineNotes.length).toBeLessThanOrEqual(6);
    for (const n of a.lineNotes) expect(flat).toContain(n.quote);
    expect(a.revisionPlan.length).toBeGreaterThanOrEqual(3);
    expect(a.revisionPlan.length).toBeLessThanOrEqual(6);
    expect(a.strengths.length).toBeGreaterThanOrEqual(1);
    expect(a.improvements.length).toBeGreaterThanOrEqual(2);
  });

  it("catches the generic opener, the named emotion and the stated moral", () => {
    const a = demoStory({ text: STORY, framework: "three-act", format: "personal-story" });
    const notes = a.lineNotes.map((n) => `${n.quote} ${n.note}`).join("\n");
    expect(notes).toContain("This is a story about the summer I learned to swim.");
    expect(notes).toMatch(/names the emotion/);
    expect(notes).toMatch(/explains the lesson/);
    expect(a.skillScores.find((s) => s.skill === "hook")!.score).toBeLessThan(50);
  });

  it("is deterministic", () => {
    expect(demoStory({ text: STORY, framework: "save-the-cat", format: "feature", title: "The Lake" })).toEqual(
      demoStory({ text: STORY, framework: "save-the-cat", format: "feature", title: "The Lake" }),
    );
  });

  it("scores a developed story above a flat, generic one", () => {
    const flat = demoStory({
      text: "This is a story about my job. I work in an office. It is fine. Some days are good and some days are bad. I like my coworkers. One day I got a new desk. It was nice. That is my story about my job and what it means to me.",
      framework: "three-act",
      format: "personal-story",
    });
    const rich = demoStory({ text: STORY, framework: "three-act", format: "personal-story" });
    expect(rich.overall).toBeGreaterThan(flat.overall);
  });
});

describe("demoShots", () => {
  it("returns a schema-valid plan with 6–14 sequentially numbered shots", () => {
    for (const scene of [SCENE, PROSE_SCENE, "EXT. BEACH - DAWN\n\nWaves roll in. An old man walks along the shore with a metal detector. He stops. Kneels. Digs."]) {
      const plan = ShotPlanSchema.parse(demoShots({ scene }));
      expect(plan.shots.length).toBeGreaterThanOrEqual(6);
      expect(plan.shots.length).toBeLessThanOrEqual(14);
      expect(plan.shots.map((s) => s.number)).toEqual(plan.shots.map((_, i) => i + 1));
      for (const s of plan.shots) {
        expect(s.purpose.length).toBeGreaterThan(15);
        expect(s.lens).toMatch(/\d+mm/);
      }
      expect(plan.coverageNotes.length).toBeGreaterThanOrEqual(3);
      expect(plan.coverageNotes.length).toBeLessThanOrEqual(6);
      expect(plan.feedbackOnUserShots).toEqual([]);
    }
  });

  it("opens wide, reserves a push-in close-up for the turn and inserts on objects", () => {
    const plan = demoShots({ scene: SCENE, intent: "Quiet, tense — a family secret surfacing" });
    const first = plan.shots[0];
    expect(first.framing).toBe("establishing");
    expect(["wide", "extreme-wide"]).toContain(first.size);
    const turn = plan.shots.find((s) => s.movement === "push-in" && s.size === "close-up");
    expect(turn?.subject).toBe("Mara");
    expect(turn?.action).toContain("realizes");
    expect(plan.shots.some((s) => s.framing === "insert" && /envelope/i.test(s.subject))).toBe(true);
    expect(plan.coverageNotes.join(" ")).toContain("180° line between Mara and Tom");
    expect(plan.sceneSummary).toContain("Lighthouse Kitchen");
  });

  it("gives specific feedback on each of the user's own shots", () => {
    const plan = demoShots({
      scene: SCENE,
      userShots: "1. Drone shot of the lighthouse in the storm\n2. Close-up on the envelope as Tom slides it\n3. Handheld on Mara as she leaves",
    });
    expect(plan.feedbackOnUserShots.map((f) => f.shot)).toEqual([
      "Drone shot of the lighthouse in the storm",
      "Close-up on the envelope as Tom slides it",
      "Handheld on Mara as she leaves",
    ]);
    expect(plan.feedbackOnUserShots[0].note).toMatch(/drone/i);
    expect(plan.feedbackOnUserShots[1].note).toMatch(/envelope/);
    expect(plan.feedbackOnUserShots[2].note).toMatch(/handheld/i);
  });

  it("is deterministic", () => {
    expect(demoShots({ scene: PROSE_SCENE, intent: "tender" })).toEqual(demoShots({ scene: PROSE_SCENE, intent: "tender" }));
  });
});
