/**
 * Server-render smoke tests for Home and Onboarding: they catch render-time
 * errors and check the key copy, links and controls are present.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SCENARIOS } from "@/content/scenarios";
import { dailyPromptFor } from "@/lib/daily";
import { computeSkillProfile } from "@/lib/progress";
import { OnboardingFlow, OnboardingForm, returnToFor } from "@/components/onboarding/onboarding-flow";
import HomePage from "@/app/page";
import { buildCatalog, recommendFromCatalog } from "./catalog";
import { Dashboard } from "./dashboard";
import { HomeView } from "./home-view";
import { PROFILE_COOKIE, isProfileCookieValue, profileCookieString } from "./profile-cookie";
import { RecentActivity, buildActivity } from "./recent-activity";
import { SkillChartCard, skillExtremes } from "./skill-chart-card";
import { TodaysCourse } from "./todays-course";
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
  useSearchParams: () => new URLSearchParams(),
}));

const requestCookies = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (requestCookies.has(name) ? { name, value: requestCookies.get(name) } : undefined),
  }),
}));

afterEach(() => {
  resetFixtureState();
  requestCookies.clear();
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
  it("server-renders the landing page for newcomers (no profile cookie)", () => {
    const html = renderToStaticMarkup(<HomeView catalog={fixtureCatalog} />);
    expect(html).toContain("Every story is an");
    expect(html).toContain('href="/onboarding"');
    expect(html).not.toContain('aria-busy="true"');
  });

  it("shows the dashboard skeleton until hydrated when the cookie says a profile exists", () => {
    const html = renderToStaticMarkup(<HomeView catalog={fixtureCatalog} profileHint />);
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Every story is an");
  });
});

describe("HomePage (server)", () => {
  it("renders the landing content when the request has no profile cookie", async () => {
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain("Every story is an");
    expect(html).not.toContain("Loading your voyage");
  });

  it("renders the dashboard shell when the request carries the profile cookie", async () => {
    requestCookies.set(PROFILE_COOKIE, "1");
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain("Loading your voyage");
    expect(html).not.toContain("Every story is an");
  });

  it("ignores unexpected cookie values", async () => {
    requestCookies.set(PROFILE_COOKIE, "yes");
    expect(renderToStaticMarkup(await HomePage())).toContain("Every story is an");
  });
});

describe("profile cookie", () => {
  it("is long-lived, site-wide and SameSite=Lax; clearing expires it", () => {
    expect(profileCookieString(true)).toBe("ox_profile=1; Max-Age=31536000; Path=/; SameSite=Lax");
    expect(profileCookieString(true, true)).toContain("; Secure");
    expect(profileCookieString(false)).toBe("ox_profile=; Max-Age=0; Path=/; SameSite=Lax");
    expect(isProfileCookieValue("1")).toBe(true);
    expect(isProfileCookieValue("")).toBe(false);
    expect(isProfileCookieValue(undefined)).toBe(false);
  });
});

describe("TodaysCourse", () => {
  it("lets the lesson and drill cards shrink to the phone's width", () => {
    const rec = recommendFromCatalog(computeSkillProfile([]), fixtureCatalog, {}, ["visual", "structure", "pacing"]);
    const html = renderToStaticMarkup(<TodaysCourse recommendation={rec} lessonsCompleted={0} totalLessons={3} />);
    // An implicit `auto` column sizes to the nowrap persona line and clips the cards' right edge.
    expect(html).toContain("grid grid-cols-1 gap-3 md:grid-cols-2");
    const cards = [...html.matchAll(/<a [^>]*class="(group [^"]*)"/g)].map((m) => m[1].split(" "));
    expect(cards).toHaveLength(2);
    for (const cls of cards) expect(cls).toContain("min-w-0");
    expect(html).toContain("Start lesson");
    expect(html).toContain("Start drill");
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

describe("SkillChartCard", () => {
  const at = new Date().toISOString();
  const obs = (skill: "dialogue" | "hook" | "visual", score: number) => ({ skill, score, at, source: "daily" as const });

  it("only compares strongest and weakest when two skills have different scores", () => {
    expect(skillExtremes(computeSkillProfile([])).kind).toBe("none");
    expect(skillExtremes(computeSkillProfile([obs("dialogue", 65)]))).toMatchObject({ kind: "level", count: 1 });
    expect(skillExtremes(computeSkillProfile([obs("dialogue", 65), obs("hook", 65)]))).toMatchObject({ kind: "level", count: 2 });
    const range = skillExtremes(computeSkillProfile([obs("dialogue", 65), obs("hook", 80), obs("visual", 50)]));
    expect(range.kind === "range" && [range.strongest.skill, range.weakest.skill]).toEqual(["hook", "visual"]);
  });

  it("doesn't list one skill as both strongest and weakest after the first daily challenge", () => {
    const html = decode(renderToStaticMarkup(<SkillChartCard profile={computeSkillProfile([obs("dialogue", 65)])} observations={1} />));
    expect(html).not.toContain("Strongest");
    expect(html).not.toContain("Weakest");
    expect(html).toContain("First reading");
    expect(html).toContain("1 of 8 skills charted");
  });
});

describe("RecentActivity", () => {
  it("wraps long titles instead of truncating them, and gives the header link a 44px hit area", () => {
    const items = buildActivity([fixtureSession], [fixtureLabEntry], fixtureCatalog);
    const html = renderToStaticMarkup(<RecentActivity items={items} />);
    expect(html).toContain("line-clamp-2");
    expect(html).not.toMatch(/\btruncate\b/);
    const fullLog = html.match(/<a [^>]*class="([^"]*)"[^>]*>Full log<\/a>/)?.[1] ?? "";
    expect(fullLog.split(" ")).toEqual(expect.arrayContaining(["py-3", "-my-3"]));
  });
});

describe("Onboarding", () => {
  it("shows a skeleton until hydrated", () => {
    expect(renderToStaticMarkup(<OnboardingFlow />)).toContain('aria-busy="true"');
  });

  it("only returns to known in-app destinations", () => {
    expect(returnToFor("progress")).toBe("/progress");
    expect(returnToFor("home")).toBe("/");
    expect(returnToFor(null)).toBe("/");
    expect(returnToFor("https://evil.example")).toBe("/");
    expect(returnToFor("constructor")).toBe("/");
    expect(returnToFor("__proto__")).toBe("/");
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
