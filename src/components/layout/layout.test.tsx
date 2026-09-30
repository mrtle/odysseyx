/**
 * Render smoke tests for the app chrome and the root not-found page.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";
import { AppShell } from "./app-shell";
import { Logo } from "./logo";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("Logo", () => {
  it("gives each instance its own gradient id", () => {
    const html = renderToStaticMarkup(
      <>
        <Logo />
        <Logo compact />
      </>,
    );
    const ids = [...html.matchAll(/<linearGradient id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`url(#${id})`);
  });
});

describe("AppShell", () => {
  it("names both logo links", () => {
    const html = renderToStaticMarkup(<AppShell>page</AppShell>);
    const logoLinks = (html.match(/<a [^>]*>/g) ?? []).filter((tag) => tag.includes('href="/"') && tag.includes('aria-label="OdysseusX home"'));
    expect(logoLinks).toHaveLength(2);
    expect(html).not.toContain("text-sea-500");
  });
});

describe("root not-found", () => {
  it("has an h1 and links back into the app", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toMatch(/<h1[^>]*>Off the edge of the map<\/h1>/);
    for (const href of ["/", "/learn", "/practice", "/lab"]) expect(html).toContain(`href="${href}"`);
  });
});
