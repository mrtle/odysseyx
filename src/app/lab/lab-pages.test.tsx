/**
 * Server renders of the Story Lab routes. Store-dependent UI renders its
 * skeleton on the server (the store hydrates after mount), so these check
 * that every page renders without throwing and shows its static frame.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ search: new URLSearchParams() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/lab",
  useSearchParams: () => nav.search,
}));

import LabPage from "./page";
import LabEntryPage from "./entry/[id]/page";
import LoglineLabPage from "./logline/page";
import ShotsLabPage from "./shots/page";
import StoryLabPage from "./story/page";

const noSearch = Promise.resolve({});

/** The tool pages take no props: their query string is read on the client with useSearchParams. */
function withQuery(query: string) {
  nav.search = new URLSearchParams(query);
}

afterEach(() => withQuery(""));

describe("Story Lab pages", () => {
  it("renders the hub with three tools and the logbook", () => {
    const html = renderToStaticMarkup(<LabPage />);
    expect(html).toContain("Bring your own work aboard");
    expect(html).toContain('href="/lab/logline"');
    expect(html).toContain('href="/lab/story"');
    expect(html).toContain('href="/lab/shots"');
    expect(html).toContain("Your logbook");
  });

  it("renders the Logline Doctor form", () => {
    const html = renderToStaticMarkup(<LoglineLabPage />);
    expect(html).toContain("Your logline");
    expect(html).toContain("Try an example");
    expect(html).toContain("Diagnose logline");
  });

  it("renders the Story Doctor with a framework from the query string", () => {
    withQuery("framework=story-circle");
    const html = renderToStaticMarkup(<StoryLabPage />);
    expect(html).toContain("Structure framework");
    expect(html).toMatch(/checked="" value="story-circle"/);
    expect(html).toContain("Get story notes");
  });

  it("ignores an unknown framework in the query string", () => {
    withQuery("framework=nope");
    const html = renderToStaticMarkup(<StoryLabPage />);
    expect(html).toMatch(/checked="" value="three-act"/);
  });

  it("renders the Shot Planner form with the screenplay face", () => {
    const html = renderToStaticMarkup(<ShotsLabPage />);
    expect(html).toContain("The scene");
    expect(html).toContain("screenplay");
    expect(html).toContain("Plan the shots");
  });

  it("shows a skeleton for 'Run again' until the store hydrates", () => {
    withQuery("from=abc");
    const html = renderToStaticMarkup(<LoglineLabPage />);
    expect(html).not.toContain("Diagnose logline");
    expect(html).toContain("animate-pulse");
  });

  it("keeps the tool pages free of request-time APIs so they prerender", () => {
    // A page that awaited searchParams would be an async function taking props.
    for (const Page of [LoglineLabPage, StoryLabPage, ShotsLabPage]) {
      expect(Page.length).toBe(0);
      expect(Page.constructor.name).not.toBe("AsyncFunction");
    }
  });

  it("renders the saved-entry page shell", async () => {
    const html = renderToStaticMarkup(await LabEntryPage({ params: Promise.resolve({ id: "missing" }), searchParams: noSearch }));
    expect(html).toContain("animate-pulse");
  });
});
