/**
 * The live drill screen, server-rendered against a mocked store holding an
 * in-progress session (zustand's server snapshot only sees initial state).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { getScenario } from "@/content/scenarios";
import { PracticeChat } from "./practice-chat";
import { toPublicScenario } from "./public-scenario";

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

describe("PracticeChat", () => {
  it("renders the conversation, turn counter and composer", () => {
    const html = render("short");
    expect(html).toContain('aria-label="Conversation with Renata Vale"');
    expect(html).toContain(scenario.openingLine.replace(/'/g, "&#x27;"));
    expect(html).toContain("Sunny Acres");
    expect(html).toMatch(/Turn <span[^>]*>1<\/span> of ~6/);
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
});
