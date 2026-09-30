/**
 * The live drill screen, server-rendered against a mocked store holding an
 * in-progress session (zustand's server snapshot only sees initial state).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getScenario } from "@/content/scenarios";
import { useAppStore } from "@/lib/store";
import { PracticeChat, countTurns } from "./practice-chat";
import { toPublicScenario } from "./public-scenario";
import type { usePersonaReply } from "./use-persona-reply";

/** Override the persona-reply hook's state for one render (null = the real hook). */
const replyOverride = vi.hoisted(() => ({ current: null as null | Partial<ReturnType<typeof usePersonaReply>> }));

vi.mock("./use-persona-reply", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./use-persona-reply")>();
  return {
    ...actual,
    usePersonaReply: (scenarioId: string) => {
      const real = actual.usePersonaReply(scenarioId);
      return replyOverride.current ? { ...real, ...replyOverride.current } : real;
    },
  };
});

vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  const { getScenario: find } = await import("@/content/scenarios");
  const scenario = find("studio-pitch")!;
  const at = "2026-09-29T10:00:00.000Z";
  const lines = (count: number) =>
    Array.from({ length: count }, (_, i) => [
      { id: `u${i}`, role: "user" as const, content: i === 0 ? "It's about a lifeguard named Doris at Sunny Acres." : `Line ${i}`, at },
      { id: `p${i}`, role: "persona" as const, content: `Reply ${i}`, at },
    ]).flat();
  const state = {
    ...actual.initialData,
    settings: { autoSpeak: false },
    sessions: [
      { id: "short", scenarioId: scenario.id, startedAt: at, messages: [{ id: "m0", role: "persona" as const, content: scenario.openingLine, at }, ...lines(1)] },
      { id: "long", scenarioId: scenario.id, startedAt: at, messages: [{ id: "m0", role: "persona" as const, content: scenario.openingLine, at }, ...lines(6)] },
      {
        id: "waiting",
        scenarioId: scenario.id,
        startedAt: at,
        messages: [
          { id: "m0", role: "persona" as const, content: scenario.openingLine, at },
          { id: "u0", role: "user" as const, content: "Hello?", at },
        ],
      },
    ],
    addMessage: vi.fn(),
    updateSettings: vi.fn(),
  };
  const useAppStore = Object.assign(<T,>(selector: (s: typeof state) => T) => selector(state), { getState: () => state });
  return { ...actual, useAppStore, useHasHydrated: () => true };
});

const scenario = toPublicScenario(getScenario("studio-pitch")!);
const render = (sessionId: string) => renderToStaticMarkup(<PracticeChat scenario={scenario} sessionId={sessionId} onEnd={() => {}} />);

afterEach(() => {
  replyOverride.current = null;
});

describe("PracticeChat", () => {
  it("renders the conversation, turn counter and composer", () => {
    const html = render("short");
    expect(html).toContain('aria-label="Conversation with Renata Vale"');
    expect(html).toContain(scenario.openingLine.replace(/'/g, "&#x27;"));
    expect(html).toContain("Sunny Acres");
    expect(html).toMatch(/Turn <\/span><span[^>]*>1<\/span><span[^>]*> of ~6<\/span>/);
    expect(html).toContain('aria-label="Send"');
    expect(html).toContain("Your line to Renata Vale");
  });

  it("keeps End & get scored disabled until two turns", () => {
    const html = render("short");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*title="Take at least 2 turns before ending the scene"/);
  });

  it("nudges the learner to end once the scene has run its length", () => {
    const html = render("long");
    expect(html).toContain("That&#x27;s the scene&#x27;s natural length");
  });

  it("offers to fetch a missing reply", () => {
    expect(render("waiting")).toContain("Get Renata&#x27;s reply");
  });

  it("falls back gracefully for an unknown session", () => {
    expect(render("missing")).toContain("This session is no longer available");
  });

  it("keeps the persona's name visible on narrow screens", () => {
    const html = render("short");
    // The persona block has a real minimum width, so the controls wrap below it instead of squeezing it to nothing.
    expect(html).toMatch(/class="flex min-w-\[12rem\] flex-1[^"]*"/);
    // A short placeholder that fits one row on a phone.
    expect(html).toContain('placeholder="Reply to Renata…"');
  });

  it("renders Stop as a plain button (never a submit) while a reply streams", () => {
    replyOverride.current = { draft: "Well", streaming: true };
    const html = render("waiting");
    expect(html).toMatch(/<button type="button" aria-label="Stop Renata&#x27;s reply"/);
    expect(html).not.toContain('type="submit"');
    expect(html).toContain("Renata is speaking…");
  });

  it("shows a cut-off reply as dialogue and its notice out of character, without saving either", () => {
    replyOverride.current = { interrupted: { text: "Well, the thing is", notice: "The AI coach is temporarily unavailable." } };
    const html = render("waiting");
    expect(html).toContain("Well, the thing is…");
    expect(html).toContain("Renata was cut off");
    expect(html).toContain("The AI coach is temporarily unavailable.");
    expect(html).toContain("Try again");
    expect(html).toContain("Keep the unfinished line");
    expect(useAppStore.getState().addMessage).not.toHaveBeenCalled();
  });
});

describe("countTurns", () => {
  it("counts a retry after a failed reply, or a blank line, as the same turn", () => {
    expect(
      countTurns([
        { role: "persona", content: "opening" },
        { role: "user", content: "a" },
        { role: "user", content: "  " },
        { role: "user", content: "b" },
        { role: "persona", content: "reply" },
        { role: "user", content: "c" },
      ]),
    ).toBe(2);
  });
});
