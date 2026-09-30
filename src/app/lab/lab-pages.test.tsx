/**
 * Server renders of the Story Lab routes. Store-dependent UI renders its
 * skeleton on the server (the store hydrates after mount), so these check
 * that every page renders without throwing and shows its static frame.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/lab",
  useSearchParams: () => new URLSearchParams(),
}));

import LabPage from "./page";
import LabEntryPage from "./entry/[id]/page";
import LoglineLabPage from "./logline/page";
import ShotsLabPage from "./shots/page";
import StoryLabPage from "./story/page";

const noSearch = Promise.resolve({});

describe("Story Lab pages", () => {
  it("renders the hub with three tools and the logbook", () => {
    const html = renderToStaticMarkup(<LabPage />);
    expect(html).toContain("Bring your own work aboard");
    expect(html).toContain('href="/lab/logline"');
    expect(html).toContain('href="/lab/story"');
    expect(html).toContain('href="/lab/shots"');
    expect(html).toContain("Your logbook");
  });

  it("renders the Logline Doctor form", async () => {
    const html = renderToStaticMarkup(await LoglineLabPage({ params: Promise.resolve({}), searchParams: noSearch }));
    expect(html).toContain("Your logline");
    expect(html).toContain("Try an example");
    expect(html).toContain("Diagnose logline");
  });

  it("renders the Story Doctor with a framework from the query string", async () => {
    const html = renderToStaticMarkup(
      await StoryLabPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ framework: "story-circle" }) }),
    );
    expect(html).toContain("Structure framework");
    expect(html).toMatch(/checked="" value="story-circle"/);
    expect(html).toContain("Get story notes");
  });

  it("ignores an unknown framework in the query string", async () => {
    const html = renderToStaticMarkup(
      await StoryLabPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ framework: "nope" }) }),
    );
    expect(html).toMatch(/checked="" value="three-act"/);
  });

  it("renders the Shot Planner form with the screenplay face", async () => {
    const html = renderToStaticMarkup(await ShotsLabPage({ params: Promise.resolve({}), searchParams: noSearch }));
    expect(html).toContain("The scene");
    expect(html).toContain("screenplay");
    expect(html).toContain("Plan the shots");
  });

  it("shows a skeleton for 'Run again' until the store hydrates", async () => {
    const html = renderToStaticMarkup(await LoglineLabPage({ params: Promise.resolve({}), searchParams: Promise.resolve({ from: "abc" }) }));
    expect(html).not.toContain("Diagnose logline");
    expect(html).toContain("animate-pulse");
  });

  it("renders the saved-entry page shell", async () => {
    const html = renderToStaticMarkup(await LabEntryPage({ params: Promise.resolve({ id: "missing" }), searchParams: noSearch }));
    expect(html).toContain("animate-pulse");
  });
});
