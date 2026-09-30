/**
 * Smoke tests: the practice screens render with real content and store data
 * (server-side, so effects don't run — this catches render-time errors and
 * checks the key copy and controls are present).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { SCENARIOS, getScenario } from "@/content/scenarios";
import { demoEvaluate, demoPersonaReply } from "@/lib/demo/practice";
import { initialData, useAppStore } from "@/lib/store";
import type { ChatMessage, PracticeSession } from "@/lib/types";
import { Briefing } from "./briefing";
import { lessonPicksBySkill } from "./lesson-picks";
import { PracticeCatalog } from "./practice-catalog";
import { PracticeSessionView } from "./practice-session";
import { toPublicScenario } from "./public-scenario";
import { ScenarioCard } from "./scenario-card";
import { Scorecard } from "./scorecard";
import { Transcript } from "./transcript";

const scenario = getScenario("studio-pitch")!;
const publicScenario = toPublicScenario(scenario);

function makeSession(lines: string[], evaluated = false): PracticeSession {
  const messages: ChatMessage[] = [{ id: "m0", role: "persona", content: scenario.openingLine, at: "2026-09-29T10:00:00.000Z" }];
  lines.forEach((line, i) => {
    messages.push({ id: `u${i}`, role: "user", content: line, at: "2026-09-29T10:01:00.000Z" });
    const reply = demoPersonaReply(
      scenario,
      messages.map(({ role, content }) => ({ role, content })),
    );
    messages.push({ id: `p${i}`, role: "persona", content: reply, at: "2026-09-29T10:01:05.000Z" });
  });
  return {
    id: evaluated ? "done" : "open",
    scenarioId: scenario.id,
    startedAt: "2026-09-29T10:00:00.000Z",
    messages,
    ...(evaluated
      ? {
          endedAt: "2026-09-29T10:10:00.000Z",
          mode: "demo" as const,
          evaluation: demoEvaluate(
            scenario,
            messages.map(({ role, content }) => ({ role, content })),
          ),
        }
      : {}),
  };
}

const LINES = [
  "It's about a seventy-year-old retired lifeguard named Doris who's the only one who believes something lives in the pool at Sunny Acres.",
  "Comps are Jaws meets Cocoon, mid-budget.",
];

afterEach(() => {
  useAppStore.setState({ ...initialData });
});

describe("practice UI", () => {
  it("strips the hidden persona brief from client props", () => {
    expect("personaBrief" in publicScenario).toBe(false);
    expect(publicScenario.persona.name).toBe("Renata Vale");
  });

  it("renders every scenario card", () => {
    for (const s of SCENARIOS) {
      const html = renderToStaticMarkup(<ScenarioCard scenario={toPublicScenario(s)} stats={{ best: 72, attempts: 2 }} />);
      expect(html).toContain(`/practice/${s.id}`);
      expect(html).toContain(s.persona.name.replace("'", "&#x27;"));
      expect(html).toContain("72");
    }
  });

  it("renders the catalog with filters", () => {
    const html = renderToStaticMarkup(<PracticeCatalog scenarios={SCENARIOS.map(toPublicScenario)} />);
    for (const label of ["All", "Pitch", "Oral", "Directing", "Writers&#x27; room", "Craft"]) expect(html).toContain(label);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Recent sessions");
  });

  it("renders the briefing with role, objective, rubric and tips", () => {
    const html = renderToStaticMarkup(
      <Briefing
        scenario={publicScenario}
        ready
        onStart={() => {}}
        onResume={() => {}}
        resumable={makeSession(LINES)}
        voice={{ supported: true, enabled: false, onToggle: () => {} }}
      />,
    );
    expect(html).toContain("Your role");
    expect(html).toContain("Your objective");
    for (const r of scenario.rubric) expect(html).toContain(r.label);
    expect(html).toContain("Enter the room");
    expect(html).toContain("Pick up where you left off");
    expect(html).toContain('role="switch"');
  });

  it("renders the session view's briefing before the drill starts", () => {
    const html = renderToStaticMarkup(<PracticeSessionView scenario={publicScenario} lessonPicks={{}} />);
    expect(html).toContain(scenario.title);
    // Start is disabled until saved progress has loaded.
    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Enter the room/);
  });

  it("renders the scorecard with every section", () => {
    const session = makeSession(LINES, true);
    const html = renderToStaticMarkup(
      <Scorecard
        scenario={publicScenario}
        evaluation={session.evaluation!}
        mode="demo"
        xpGained={84}
        lessonPicks={lessonPicksBySkill()}
        transcriptHref="/practice/review/done"
      />,
    );
    expect(html).toContain(session.evaluation!.headline.replace(/'/g, "&#x27;").split("—")[0].trim().slice(0, 20));
    expect(html).toContain("Skill breakdown");
    expect(html).toContain("What worked");
    expect(html).toContain("What to sharpen");
    expect(html).toContain("Try saying:");
    expect(html).toContain("+84 XP");
    expect(html).toContain("Demo coach");
    expect(html).toContain("Try again");
    expect(html).toContain("Review transcript");
    expect(html).toContain("Back to Practice");
  });

  it("keeps a clean heading outline in the briefing and scorecard", () => {
    const briefing = renderToStaticMarkup(
      <Briefing scenario={publicScenario} ready onStart={() => {}} onResume={() => {}} voice={{ supported: false, enabled: false, onToggle: () => {} }} />,
    );
    const levels = (html: string) => [...html.matchAll(/<h([1-6])/g)].map((m) => Number(m[1]));
    // h1 (page) then h2 sections — no jump straight to h3.
    expect(levels(briefing)[0]).toBe(1);
    expect(levels(briefing)).not.toContain(3);

    const session = makeSession(LINES, true);
    const props = { scenario: publicScenario, evaluation: session.evaluation!, lessonPicks: {}, transcriptHref: "#t" };
    // As the whole page (after a drill), the headline is the h1 and sections are h2.
    expect(levels(renderToStaticMarkup(<Scorecard {...props} headingLevel={1} />))).toEqual([1, 2, 2, 2]);
    // Under a page header (session review), it steps down a level.
    expect(levels(renderToStaticMarkup(<Scorecard {...props} />))).toEqual([2, 3, 3, 3]);
  });

  it("renders a transcript", () => {
    const session = makeSession(LINES);
    const html = renderToStaticMarkup(<Transcript messages={session.messages} persona={scenario.persona} category={scenario.category} />);
    expect(html.match(/<li/g)).toHaveLength(session.messages.length);
    expect(html).toContain("You");
  });
});
