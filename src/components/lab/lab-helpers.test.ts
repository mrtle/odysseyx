import { describe, expect, it } from "vitest";
import type { ShotPlan } from "@/lib/ai/schemas";
import { INPUT_LABELS, composeLabInput, extraValue, parseLabInput } from "./lab-input";
import { deriveTitle, entryHref, toolHref } from "./lab-meta";
import { CSV_HEADERS, csvCell, fileSlug, shotPlanToCsv, shotPlanToText } from "./shot-export";

describe("lab input encoding", () => {
  it("round-trips the main text and labelled extras", () => {
    const input = composeLabInput("  INT. KITCHEN - NIGHT\n\nRain.  ", [
      { label: INPUT_LABELS.intent, value: "Tense" },
      { label: INPUT_LABELS.userShots, value: "Wide\nClose-up" },
      { label: INPUT_LABELS.genre, value: "   " },
    ]);
    const parts = parseLabInput(input);
    expect(parts.main).toBe("INT. KITCHEN - NIGHT\n\nRain.");
    expect(parts.extras).toEqual([
      { label: "Directing intent", value: "Tense" },
      { label: "Your shot ideas", value: "Wide\nClose-up" },
    ]);
    expect(extraValue(parts, INPUT_LABELS.userShots)).toBe("Wide\nClose-up");
    expect(extraValue(parts, INPUT_LABELS.genre)).toBeUndefined();
  });

  it("treats plain input as main text only", () => {
    expect(parseLabInput("Just a logline.")).toEqual({ main: "Just a logline.", extras: [] });
    expect(composeLabInput("Just a logline.")).toBe("Just a logline.");
  });
});

describe("lab meta helpers", () => {
  it("derives short titles, turning sluglines into readable ones", () => {
    expect(deriveTitle("A shy librarian who hates crowds must win a televised trivia tournament.")).toBe("A shy librarian who hates crowds must win…");
    expect(deriveTitle("INT. LIGHTHOUSE KITCHEN - NIGHT\n\nRain.")).toBe("Lighthouse Kitchen — Night");
    // Action on the same line as the slugline stays out of the title.
    expect(
      deriveTitle("INT. LIGHTHOUSE - NIGHT The lamp room is dark. ELENA (60s) climbs the last steps, one hand on the wall."),
    ).toBe("Lighthouse — Night");
    expect(deriveTitle("EXT. HARBOUR WALL. Waves hit the stones and MARA runs.")).toBe("Harbour Wall");
    expect(deriveTitle("INT. ALL-NIGHT DINER - 3 A.M.")).toBe("All-Night Diner — 3 A.M.");
    expect(deriveTitle("   ")).toBe("Untitled");
  });

  it("builds links", () => {
    expect(entryHref("abc")).toBe("/lab/entry/abc");
    expect(toolHref("story")).toBe("/lab/story");
    expect(toolHref("shots", "a b")).toBe("/lab/shots?from=a%20b");
  });
});

const plan: ShotPlan = {
  sceneSummary: "A kitchen at night.",
  emotionalIntent: "Dread.",
  visualConcept: "Palette: blue.",
  shots: [
    { number: 1, size: "wide", framing: "establishing", angle: "eye-level", movement: "static", lens: "24mm", subject: "Kitchen", action: "Rain, falling", purpose: "Orient us", sound: "" },
    { number: 2, size: "close-up", framing: "single", angle: "low", movement: "push-in", lens: "85mm", subject: "Mara", action: 'She says "no"', purpose: "=The turn", sound: "Silence" },
  ],
  coverageNotes: ["Protect shot 2."],
  feedbackOnUserShots: [{ shot: "Drone", note: "Motivate it." }],
};

describe("shot plan export", () => {
  it("writes CSV with headers, quoting and formula protection", () => {
    const csv = shotPlanToCsv(plan).split("\r\n");
    expect(csv[0]).toBe(CSV_HEADERS.join(","));
    expect(csv).toHaveLength(3);
    expect(csv[1]).toContain('"Rain, falling"');
    expect(csv[2]).toContain('"She says ""no"""');
    expect(csv[2]).toContain("'=The turn");
    expect(csv[2]).toContain("CU — Close-Up");
    expect(csvCell("-1")).toBe("'-1");
  });

  it("writes a readable text version", () => {
    const text = shotPlanToText(plan, "The Envelope");
    expect(text).toContain("THE ENVELOPE");
    expect(text).toContain("1. WS · Establishing · Eye Level · Static · 24mm");
    expect(text).toContain("   Sound: Silence");
    expect(text).toContain("COVERAGE NOTES\n- Protect shot 2.");
    expect(text).toContain('- "Drone": Motivate it.');
  });

  it("slugs file names", () => {
    expect(fileSlug("Lighthouse Kitchen — Night")).toBe("lighthouse-kitchen-night");
    expect(fileSlug("!!!")).toBe("shot-plan");
  });
});
