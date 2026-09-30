/**
 * Stored and imported progress: values outside the app's closed
 * vocabularies (a backup from another version, a hand-edited file) are
 * dropped or mapped, counted, and never crash the pages that render them.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BeatMap } from "@/components/lab/beat-map";
import { LoglineResult } from "@/components/lab/logline-result";
import { ShotPlanResult } from "@/components/lab/shot-plan-result";
import { StoryResult } from "@/components/lab/story-result";
import { MicroFeedbackView } from "@/components/home/micro-feedback";
import { fixtureState } from "@/components/home/test-fixtures";
import { buildExport, parseProgressImport } from "@/components/progress/progress-helpers";
import { SkillBars } from "@/components/ui/skill-bars";
import { BEAT_STATUSES, LOGLINE_COMPONENTS } from "@/lib/constants";
import { CAMERA_ANGLES, CAMERA_MOVEMENTS, SHOT_FRAMINGS, SHOT_SIZES } from "@/lib/film";
import { FRAMEWORKS, FRAMEWORK_IDS } from "@/lib/frameworks";
import { collectSkillObservations } from "@/lib/progress";
import { SKILL_IDS } from "@/lib/skills";
import type { LabEntry, PracticeSession } from "@/lib/types";
import { sanitizePersisted, type SanitizeReport } from "./persisted-state";

const story = {
  id: "l1",
  tool: "story",
  createdAt: "2026-09-01T10:00:00.000Z",
  title: "The Lighthouse",
  input: "A keeper…",
  framework: "three-act",
  mode: "demo",
  result: {
    overall: 64,
    headline: "A clear setup, a soft ending.",
    summary: "The middle sags.",
    framework: "three-act",
    beats: [
      { beat: "Setup", status: "strong", evidence: "The keeper lights the lamp.", suggestion: "Keep it." },
      { beat: "Inciting incident", status: "present", evidence: "A ship goes dark.", suggestion: "Sooner." },
      { beat: "Midpoint", status: "weak", evidence: "", suggestion: "Raise the cost." },
      { beat: "Climax", status: "missing", evidence: "", suggestion: "Write it." },
    ],
    skillScores: [{ skill: "structure", score: 60, comment: "Solid setup." }],
    strengths: ["The opening image."],
    improvements: [{ title: "Land the ending", detail: "Pay off the lamp.", example: "" }],
    lineNotes: [{ quote: "The keeper lights the lamp.", note: "Strong image." }],
    revisionPlan: ["Rewrite the climax."],
  },
};

const shots = {
  id: "l2",
  tool: "shots",
  createdAt: "2026-09-02T10:00:00.000Z",
  title: "The Envelope",
  input: "INT. KITCHEN…",
  mode: "live",
  result: {
    sceneSummary: "She opens the envelope.",
    emotionalIntent: "Dread.",
    visualConcept: "Tight and still.",
    shots: [
      { number: 1, size: "wide", framing: "establishing", angle: "high", movement: "static", lens: "24mm", subject: "Kitchen", action: "She enters.", purpose: "Place us.", sound: "Fridge hum." },
      { number: 2, size: "close-up", framing: "insert", angle: "eye-level", movement: "push-in", lens: "85mm", subject: "Envelope", action: "Her thumb on the seal.", purpose: "Dread.", sound: "" },
    ],
    coverageNotes: ["Grab a reverse."],
    feedbackOnUserShots: [{ shot: "Drone shot", note: "Too big for this scene." }],
  },
};

const logline = {
  id: "l3",
  tool: "logline",
  createdAt: "2026-09-03T10:00:00.000Z",
  title: "Trivia",
  input: "A shy librarian…",
  mode: "demo",
  result: {
    overall: 70,
    verdict: "Clear.",
    genreRead: "Comedy.",
    components: [
      { key: "protagonist", score: 7, note: "Shy librarian." },
      { key: "goal", score: 8, note: "Win the tournament." },
    ],
    rewrites: [{ angle: "Irony", logline: "A librarian who hates trivia…" }],
    questions: ["Who runs the tournament?"],
  },
};

const session = {
  id: "s1",
  scenarioId: "elevator-pitch",
  startedAt: "2026-09-04T10:00:00.000Z",
  messages: [{ id: "m1", role: "user", content: "It's about a deaf drummer.", at: "2026-09-04T10:00:05.000Z" }],
  evaluation: {
    overall: 71,
    headline: "Good hook.",
    summary: "Stakes stayed abstract.",
    skillScores: [
      { skill: "hook", score: 80, comment: "Sharp." },
      { skill: "delivery", score: 62, comment: "Rushed." },
    ],
    strengths: ["The premise."],
    improvements: [{ title: "Name the stakes", detail: "What does he lose?", example: "If he fails, the band replaces him." }],
    bestMoment: "It's about a deaf drummer.",
    nextStep: { title: "Stakes drill", description: "Practise stakes." },
  },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** The reported backup: an unknown skill, an unknown framework and an unknown beat status, plus more held-out junk. */
function badBackup() {
  const s = clone(session) as Record<string, unknown> & { evaluation: Record<string, unknown> };
  s.evaluation.skillScores = [
    { skill: "voice", score: 70, comment: "Unknown to this version." },
    { skill: "hook", score: 80, comment: "Sharp." },
    { skill: "hook", score: 10, comment: "Duplicate." },
    { skill: "pacing", score: "high" },
    null,
  ];
  s.evaluation.improvements = [{ title: "Keep", detail: "Me.", example: 3 }, "just a string", { title: 5 }];
  s.evaluation.strengths = ["Fine.", 42, { text: "nope" }];

  const freytag = clone(story) as Record<string, unknown> & { result: Record<string, unknown> };
  freytag.id = "l-freytag";
  freytag.framework = "freytag";
  freytag.result.framework = "freytag";

  const partial = clone(story) as Record<string, unknown> & { result: Record<string, unknown> };
  partial.framework = "freytag"; // the result's own framework wins
  partial.result.beats = [
    { beat: "Setup", status: "partial", evidence: "Some.", suggestion: "More." },
    { beat: "Climax", status: 7 },
    { status: "strong" },
    "Midpoint",
  ];
  partial.result.skillScores = [{ skill: "voice", score: 50, comment: "" }, { skill: "structure", score: 55 }];
  partial.result.lineNotes = [{ quote: "Kept.", note: 1 }, { note: "No quote." }, 9];
  partial.result.improvements = [null, { title: "Ok", detail: "Fine." }];
  partial.result.revisionPlan = ["Step one.", { step: 2 }];

  const badShots = clone(shots) as Record<string, unknown> & { result: Record<string, unknown> };
  badShots.result.shots = [
    { number: 1, size: "cowboy", framing: "dirty single", angle: "canted", movement: "drone", subject: "Kitchen", action: "She enters." },
    { size: "wide" },
    "CU on the envelope",
    { subject: "Envelope", action: "Thumb on the seal.", lens: 85 },
  ];
  badShots.result.feedbackOnUserShots = [{ shot: "Drone", note: "Too big." }, { shot: "Only a shot" }];

  const badLogline = clone(logline) as Record<string, unknown> & { result: Record<string, unknown> };
  badLogline.result.components = [
    { key: "protagonist", score: 7, note: "Shy librarian." },
    { key: "theme", score: 9, note: "Unknown component." },
    { key: "goal", score: 8 },
  ];
  badLogline.result.rewrites = [{ angle: "Irony", logline: "Kept." }, { angle: "Missing logline" }];
  badLogline.result.questions = ["Kept?", false];

  return {
    sessions: [s],
    labEntries: [freytag, partial, badShots, badLogline],
    daily: {
      "2026-09-05": { promptId: "six-word-story", date: "2026-09-05", response: "Baby shoes.", feedback: { score: 70, praise: "p", nudge: "n", tryThis: "t", skill: "voice" } },
      "2026-09-06": { promptId: "six-word-story", date: "2026-09-06", response: "Kept.", feedback: { score: 70, praise: "p", nudge: "n", tryThis: "t", skill: "hook" } },
    },
  };
}

function render(entry: LabEntry): string {
  if (entry.tool === "story") return renderToStaticMarkup(<StoryResult analysis={entry.result} mode={entry.mode} entryId={entry.id} />);
  if (entry.tool === "shots") return renderToStaticMarkup(<ShotPlanResult plan={entry.result} mode={entry.mode} title={entry.title} />);
  return renderToStaticMarkup(<LoglineResult analysis={entry.result} mode={entry.mode} logline={entry.input} />);
}

describe("sanitizePersisted", () => {
  it("keeps valid progress exactly as it was", () => {
    const raw = { sessions: [session], labEntries: [story, shots, logline] };
    const report: SanitizeReport = { dropped: 0, repaired: 0 };
    expect(sanitizePersisted(clone(raw), report)).toEqual(raw);
    expect(report).toEqual({ dropped: 0, repaired: 0 });
  });

  it("drops or maps every value outside the closed vocabularies, and counts them", () => {
    const report: SanitizeReport = { dropped: 0, repaired: 0 };
    const clean = sanitizePersisted(badBackup(), report);

    const evaluation = clean.sessions![0].evaluation!;
    expect(evaluation.skillScores).toEqual([{ skill: "hook", score: 80, comment: "Sharp." }]);
    expect(evaluation.improvements).toEqual([{ title: "Keep", detail: "Me.", example: "" }]);
    expect(evaluation.strengths).toEqual(["Fine."]);

    // Unknown framework everywhere: the entry can't be drawn, so it's dropped.
    expect(clean.labEntries!.map((e) => e.id)).toEqual(["l1", "l2", "l3"]);
    const [partial, badShots, badLogline] = clean.labEntries!;

    expect(partial.tool === "story" && partial.framework).toBe("three-act");
    if (partial.tool !== "story") throw new Error("expected a story");
    expect(partial.result.framework).toBe("three-act");
    expect(partial.result.beats).toEqual([
      { beat: "Setup", status: "present", evidence: "Some.", suggestion: "More." },
      { beat: "Climax", status: "present", evidence: "", suggestion: "" },
    ]);
    expect(partial.result.skillScores).toEqual([{ skill: "structure", score: 55, comment: "" }]);
    expect(partial.result.lineNotes).toEqual([{ quote: "Kept.", note: "" }]);
    expect(partial.result.improvements).toEqual([{ title: "Ok", detail: "Fine.", example: "" }]);
    expect(partial.result.revisionPlan).toEqual(["Step one."]);

    if (badShots.tool !== "shots") throw new Error("expected shots");
    expect(badShots.result.shots).toHaveLength(2);
    expect(badShots.result.shots[0]).toMatchObject({ number: 1, size: "medium", framing: "single", angle: "eye-level", movement: "static", lens: "", sound: "" });
    expect(badShots.result.shots[1]).toMatchObject({ number: 4, size: "medium", subject: "Envelope", lens: "" });
    expect(badShots.result.feedbackOnUserShots).toEqual([{ shot: "Drone", note: "Too big." }]);

    if (badLogline.tool !== "logline") throw new Error("expected a logline");
    expect(badLogline.result.components.map((c) => c.key)).toEqual(["protagonist", "goal"]);
    expect(badLogline.result.components[1].note).toBe("");
    expect(badLogline.result.rewrites).toEqual([{ angle: "Irony", logline: "Kept." }]);
    expect(badLogline.result.questions).toEqual(["Kept?"]);

    expect(clean.daily!["2026-09-05"].feedback).toBeUndefined();
    expect(clean.daily!["2026-09-06"].feedback?.skill).toBe("hook");

    // Every value that was left out or mapped is counted.
    const droppedFromSession = 4 + 2 + 2; // skill scores, improvements, strengths
    const droppedEntries = 1; // the "freytag" story
    const droppedFromStory = 2 + 1 + 2 + 1 + 1; // beats, skill scores, line notes, improvements, plan steps
    const droppedFromShots = 2 + 1; // shots, notes on the user's shots
    const droppedFromLogline = 1 + 1 + 1; // components, rewrites, questions
    const droppedFeedback = 1; // daily feedback for an unknown skill
    expect(report.dropped).toBe(
      droppedFromSession + droppedEntries + droppedFromStory + droppedFromShots + droppedFromLogline + droppedFeedback,
    );
    // Two beat statuses, one framework, and four shot enums on each of the two kept shots.
    expect(report.repaired).toBe(2 + 1 + 8);
  });

  it("only ever returns values the pages can look up", () => {
    const clean = sanitizePersisted(badBackup());
    const skills = [
      ...clean.sessions!.flatMap((s) => s.evaluation?.skillScores ?? []),
      ...clean.labEntries!.flatMap((e) => (e.tool === "story" ? e.result.skillScores : [])),
    ].map((s) => s.skill);
    for (const skill of skills) expect(SKILL_IDS).toContain(skill);
    for (const entry of clean.labEntries!) {
      if (entry.tool === "story") {
        expect(FRAMEWORK_IDS).toContain(entry.framework);
        expect(FRAMEWORK_IDS).toContain(entry.result.framework);
        for (const beat of entry.result.beats) expect(BEAT_STATUSES).toContain(beat.status);
      }
      if (entry.tool === "logline") for (const c of entry.result.components) expect(LOGLINE_COMPONENTS).toContain(c.key);
      if (entry.tool === "shots") {
        for (const shot of entry.result.shots) {
          expect(SHOT_SIZES).toContain(shot.size);
          expect(SHOT_FRAMINGS).toContain(shot.framing);
          expect(CAMERA_ANGLES).toContain(shot.angle);
          expect(CAMERA_MOVEMENTS).toContain(shot.movement);
        }
      }
    }
  });

  it("keeps the reported bad values out of storage too (the store's merge uses the same validator)", () => {
    const clean = sanitizePersisted({ labEntries: [{ ...clone(story), framework: 42, result: { ...clone(story.result), framework: null } }] });
    expect(clean.labEntries).toEqual([]);
  });
});

describe("importing a backup with unknown values", () => {
  function importBad() {
    const file = JSON.parse(JSON.stringify(buildExport(fixtureState(), new Date("2026-09-30T08:00:00.000Z"))));
    const bad = badBackup();
    file.data.sessions.push(...bad.sessions);
    file.data.labEntries.push(...bad.labEntries);
    Object.assign(file.data.daily, bad.daily);
    const result = parseProgressImport(JSON.stringify(file));
    if (!result.ok) throw new Error(result.error);
    return result;
  }

  it("is accepted, with the unreadable story left out", () => {
    const result = importBad();
    expect(result.data.labEntries.some((e) => e.id === "l-freytag")).toBe(false);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
  });

  it("renders every page component without crashing", () => {
    const { data } = importBad();
    for (const entry of data.labEntries) expect(() => render(entry)).not.toThrow();
    for (const s of data.sessions as PracticeSession[]) {
      if (s.evaluation) expect(renderToStaticMarkup(<SkillBars scores={s.evaluation.skillScores} />)).toContain("Hook");
    }
    for (const entry of Object.values(data.daily)) {
      if (entry.feedback) expect(() => renderToStaticMarkup(<MicroFeedbackView feedback={entry.feedback!} />)).not.toThrow();
    }
    const storyEntry = data.labEntries.find((e) => e.id === "l1");
    if (storyEntry?.tool !== "story") throw new Error("expected the repaired story");
    const html = renderToStaticMarkup(<BeatMap beats={storyEntry.result.beats} framework={storyEntry.framework} />);
    expect(html).toContain("Setup");
    expect(render(storyEntry)).toContain(FRAMEWORKS["three-act"].name);
    const shotEntry = data.labEntries.find((e) => e.id === "l2");
    expect(shotEntry && render(shotEntry)).toContain("Shot list with 2 shots");
    // The skill profile only ever sees known skills.
    for (const obs of collectSkillObservations(data, {})) expect(SKILL_IDS).toContain(obs.skill);
  });
});
