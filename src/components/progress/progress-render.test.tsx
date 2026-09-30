/**
 * Server-render smoke tests for the captain's log.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fixtureCatalog,
  fixtureState,
  resetFixtureState,
  todaysDailyEntry,
  useFixtureState,
} from "@/components/home/test-fixtures";
import { RANKS, computeSkillProfile } from "@/lib/progress";
import { SKILL_LIST } from "@/lib/skills";
import { ProgressLog, ProgressView } from "./progress-view";
import { SkillRadar, labelLayout, toRadarPoints } from "./skill-radar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/progress",
}));

afterEach(() => {
  resetFixtureState();
});

const decode = (html: string) => html.replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&amp;", "&");

describe("SkillRadar", () => {
  it("labels all eight axes and marks unmeasured skills with a dash", () => {
    const profile = computeSkillProfile([{ skill: "hook", score: 72, at: new Date().toISOString(), source: "practice" }]);
    const html = renderToStaticMarkup(<SkillRadar points={toRadarPoints(profile)} />);
    for (const skill of SKILL_LIST) expect(html).toContain(`>${skill.short}<`);
    expect(html).toContain(">72<");
    expect(html.match(/>—</g)).toHaveLength(7);
    expect(html).toContain('role="img"');
    expect(html).toContain("Hook &amp; Premise: 72 out of 100");
    expect(html).toContain("Structure: not yet measured");
    // Four grid rings plus the profile polygon.
    expect(html.match(/<polygon/g)).toHaveLength(5);
  });

  it("draws no profile polygon when nothing is measured", () => {
    const html = renderToStaticMarkup(<SkillRadar points={toRadarPoints(computeSkillProfile([]))} />);
    expect(html.match(/<polygon/g)).toHaveLength(4);
    expect(html.match(/>—</g)).toHaveLength(8);
  });

  it("can hide scores", () => {
    const html = renderToStaticMarkup(<SkillRadar points={toRadarPoints(computeSkillProfile([]))} showScores={false} />);
    expect(html).not.toContain(">—<");
  });

  it("anchors labels away from the chart", () => {
    expect(labelLayout(0, 8).anchor).toBe("middle"); // top
    expect(labelLayout(2, 8).anchor).toBe("start"); // right
    expect(labelLayout(4, 8).anchor).toBe("middle"); // bottom
    expect(labelLayout(6, 8).anchor).toBe("end"); // left
  });
});

describe("ProgressView", () => {
  it("shows a skeleton until hydrated", () => {
    const html = decode(renderToStaticMarkup(<ProgressView catalog={fixtureCatalog} />));
    expect(html).toContain("Captain's log");
    expect(html).toContain('aria-busy="true"');
  });
});

describe("ProgressLog", () => {
  it("renders every section of the log", () => {
    const entry = todaysDailyEntry();
    useFixtureState(fixtureState({ daily: { [entry.date]: entry } }));
    const html = decode(renderToStaticMarkup(<ProgressLog catalog={fixtureCatalog} />));

    // Stats and rank ladder
    expect(html).toContain("1,020 XP");
    for (const rank of RANKS) expect(html).toContain(rank.title);
    expect(html).toContain("You are here");
    expect(html).toContain('aria-current="step"');
    // Streak + heatmap
    expect(html).toContain("Last 12 weeks");
    expect(html).toMatch(/<table[^>]*>.*Daily activity for the last 12 weeks/);
    expect(html).toContain("Active on");
    // Skills
    for (const skill of SKILL_LIST) expect(html).toContain(skill.name);
    expect(html).toContain("not yet measured");
    // Lessons per track
    expect(html).toContain('href="/learn/foundations"');
    expect(html).toContain('href="/learn/visual"');
    expect(html).toContain("1/2");
    // Histories
    expect(html).toContain('href="/practice/review/sess-1"');
    expect(html).toContain('href="/lab/entry/lab-1"');
    expect(html).toContain("The kettle clicks off. Nobody pours.");
    // XP log with readable labels
    expect(html).toContain("The Studio Pitch");
    expect(html).toContain("The Four Elements");
    expect(html).toContain("+104");
    // Profile + data
    expect(html).toContain('href="/onboarding?from=progress"');
    expect(html).toContain('role="switch"');
    expect(html).toContain("Export progress (JSON)");
    expect(html).toContain("Reset progress…");
  });

  it("offers setup when there's activity but no profile", () => {
    useFixtureState(fixtureState({ profile: null }));
    const html = decode(renderToStaticMarkup(<ProgressLog catalog={fixtureCatalog} />));
    expect(html).toContain("Set up your profile");
  });

  it("shows friendly empty states for a fresh log", () => {
    useFixtureState(
      fixtureState({ sessions: [], labEntries: [], daily: {}, xpLog: [], xp: 0, activityDates: [], lessonProgress: {} }),
    );
    const html = decode(renderToStaticMarkup(<ProgressLog catalog={fixtureCatalog} />));
    expect(html).toContain("No drills yet");
    expect(html).toContain("Nothing saved yet");
    expect(html).toContain("No challenges logged yet");
    expect(html).toContain("How XP is earned");
    expect(html).toContain("Deckhand");
  });
});
