/**
 * Server-render smoke tests for Home and Onboarding: they catch render-time
 * errors and check the key copy, links and controls are present.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SCENARIOS } from "@/content/scenarios";
import { dailyPromptFor } from "@/lib/daily";
import { computeSkillProfile } from "@/lib/progress";
import { OnboardingFlow, OnboardingForm } from "@/components/onboarding/onboarding-flow";
import { buildCatalog, recommendFromCatalog } from "./catalog";
import { Dashboard } from "./dashboard";
import { HomeView } from "./home-view";
import { buildActivity } from "./recent-activity";
import {
  FIXTURE_TRACKS,
  fixtureCatalog,
  fixtureLabEntry,
  fixtureSession,
  fixtureState,
  resetFixtureState,
  todaysDailyEntry,
  useFixtureState,
} from "./test-fixtures";
import { Welcome } from "./welcome";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
}));

afterEach(() => {
  resetFixtureState();
});

const decode = (html: string) => html.replaceAll("&#x27;", "'").replaceAll("&quot;", '"').replaceAll("&amp;", "&");

describe("catalog", () => {
  it("strips lesson bodies and persona briefs", () => {
    const json = JSON.stringify(fixtureCatalog);
    expect(json).not.toContain("SECRET LESSON BODY");
    expect(json).not.toContain("personaBrief");
    expect(json).not.toContain(SCENARIOS[0].personaBrief.slice(0, 40));
    expect(fixtureCatalog.lessonSkills["foundations/four-elements"]).toEqual(["hook", "conflict"]);
  });

  it("honours the goal's priority order among unmeasured skills", () => {
    // Filmmaker: visual first, even though structure comes earlier in SKILL_IDS.
    const rec = recommendFromCatalog(computeSkillProfile([]), fixtureCatalog, {}, ["visual", "structure", "pacing"]);
    expect(rec.focusSkill).toBe("visual");
    const measuredVisual = computeSkillProfile([
      { skill: "visual", score: 60, at: new Date().toISOString(), source: "practice" },
    ]);
    expect(recommendFromCatalog(measuredVisual, fixtureCatalog, {}, ["visual", "structure", "pacing"]).focusSkill).toBe(
      "structure",
    );
  });

  it("handles an empty curriculum and no scenarios", () => {
    const empty = buildCatalog([], []);
    const rec = recommendFromCatalog(computeSkillProfile([]), empty, {});
    expect(rec).toMatchObject({ focusSkill: "hook", lesson: null, track: null, scenario: null });
  });

  it("maps recommendations back onto catalog items", () => {
    const rec = recommendFromCatalog(computeSkillProfile([]), fixtureCatalog, {}, ["visual"]);
    expect(rec.focusSkill).toBe("visual");
    expect(rec.lesson?.id).toBe("shot-sizes");
    expect(rec.track?.id).toBe("foundations");
    const easiestVisual = [...SCENARIOS]
      .filter((s) => s.skills.includes("visual"))
      .sort((a, b) => a.difficulty - b.difficulty)[0];
    expect(rec.scenario?.id).toBe(easiestVisual.id);
    expect(rec.scenario).not.toHaveProperty("personaBrief");
  });

  it("merges drills and lab entries newest first, skipping silent sessions", () => {
    const silent = { ...fixtureSession, id: "silent", messages: fixtureSession.messages.slice(0, 1), evaluation: undefined };
    const items = buildActivity([fixtureSession, silent], [fixtureLabEntry], fixtureCatalog);
    expect(items.map((i) => i.id)).toEqual(["sess-1", "lab-1"]);
    expect(items[0]).toMatchObject({ href: "/practice/review/sess-1", title: "The Studio Pitch", score: 74 });
    expect(items[1]).toMatchObject({ href: "/lab/entry/lab-1", score: 68 });
  });
});

describe("HomeView", () => {
  it("shows a skeleton until the store has hydrated", () => {
    const html = renderToStaticMarkup(<HomeView catalog={fixtureCatalog} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Every story is an");
  });
});

describe("Welcome", () => {
  it("renders the hero, four pillars, a labelled sample scorecard and the CTA", () => {
    const html = decode(renderToStaticMarkup(<Welcome />));
    expect(html).toContain("Every story is an");
    expect(html).toContain('href="/onboarding"');
    for (const pillar of ["Learn the craft", "Rehearse with AI personas", "Get notes in the Story Lab", "Track the voyage"]) {
      expect(html).toContain(pillar);
    }
    expect(html).toContain("Sample scorecard");
    expect(html).toContain("Eight skills, one chart");
    expect(html).not.toContain("Your log already holds");
  });

  it("acknowledges progress logged before onboarding", () => {
    const html = renderToStaticMarkup(<Welcome existingXp={1250} />);
    expect(html).toContain("Your log already holds 1,250 XP");
  });
});

describe("Dashboard", () => {
  it("greets the learner and shows rank, course, challenge, chart, activity and lab tools", () => {
    const state = fixtureState();
    useFixtureState(state);
    const html = decode(renderToStaticMarkup(<Dashboard catalog={fixtureCatalog} profile={state.profile!} />));

    expect(html).toMatch(/Good (morning|afternoon|evening), Penelope\./);
    expect(html).toContain("Working on “A short film about my grandmother”");
    // 1,020 XP → Navigator, 380 XP to Captain.
    expect(html).toContain("Navigator");
    expect(html).toContain("1,020 XP");
    expect(html).toContain("380 XP");
    expect(html).toContain("3-day streak");
    // Filmmaker → visual is unmeasured and preferred.
    expect(html).toContain("Visual Storytelling");
    expect(html).toContain('href="/learn/foundations/shot-sizes"');
    const easiestVisual = [...SCENARIOS]
      .filter((s) => s.skills.includes("visual"))
      .sort((a, b) => a.difficulty - b.difficulty)[0];
    expect(html).toContain(`href="/practice/${easiestVisual.id}"`);
    // Daily challenge
    const prompt = dailyPromptFor(new Date());
    expect(html).toContain(prompt.title);
    expect(html).toContain("Get feedback");
    expect(html).toContain('maxLength="4000"');
    // Activity + lab
    expect(html).toContain('href="/practice/review/sess-1"');
    expect(html).toContain('href="/lab/entry/lab-1"');
    for (const tool of ["logline", "story", "shots"]) expect(html).toContain(`href="/lab/${tool}"`);
    expect(html).toContain('role="img"');
  });

  it("shows today's saved entry, feedback, demo notice and countdown once the challenge is done", () => {
    const entry = todaysDailyEntry();
    const state = fixtureState({ daily: { [entry.date]: entry } });
    useFixtureState(state);
    const html = decode(renderToStaticMarkup(<Dashboard catalog={fixtureCatalog} profile={state.profile!} />));
    expect(html).toContain("Logged today");
    expect(html).toContain("The kettle clicks off. Nobody pours.");
    expect(html).toContain("lands like a door closing");
    expect(html).toContain("Demo coach");
    expect(html).toMatch(/next challenge in/i);
    expect(html).toContain("Take another pass");
    expect(html).not.toContain("Get feedback");
  });

  it("copes with an empty curriculum, no scenarios and no activity", () => {
    const state = fixtureState({ sessions: [], labEntries: [], xp: 0, xpLog: [], activityDates: [], lessonProgress: {} });
    useFixtureState(state);
    const html = decode(renderToStaticMarkup(<Dashboard catalog={buildCatalog([], [])} profile={state.profile!} />));
    expect(html).toContain("Deckhand");
    expect(html).toContain("The curriculum is being charted");
    expect(html).toContain("Pick a room to rehearse");
    expect(html).toContain("Nothing logged yet");
    expect(html).toContain("Blank waters for now");
  });
});

describe("Onboarding", () => {
  it("shows a skeleton until hydrated", () => {
    expect(renderToStaticMarkup(<OnboardingFlow />)).toContain('aria-busy="true"');
  });

  it("starts a new voyager on the name step", () => {
    const html = decode(renderToStaticMarkup(<OnboardingForm initial={null} returnTo="/" />));
    expect(html).toContain("Set your course");
    expect(html).toContain("What should the crew call you?");
    expect(html).toContain('autoComplete="given-name"');
    expect(html).toContain('aria-current="step"');
    for (const label of ["Name", "Goal", "Experience", "Project"]) expect(html).toContain(label);
    expect(html).toContain("Continue");
    expect(html).not.toContain("Cancel");
  });

  it("pre-fills an existing profile and offers cancel", () => {
    const html = decode(renderToStaticMarkup(<OnboardingForm initial={fixtureState().profile} returnTo="/progress" />));
    expect(html).toContain("Adjust your heading");
    expect(html).toContain('value="Penelope Ithaca"');
    expect(html).toContain("Cancel");
    expect(html).toContain("Filmmaker");
  });

  it("uses fixture tracks with lessons", () => {
    expect(FIXTURE_TRACKS[0].lessons.length).toBeGreaterThan(0);
  });
});
