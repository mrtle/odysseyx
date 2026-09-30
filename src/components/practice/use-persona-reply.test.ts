/**
 * The client half of the persona stream protocol: notices after
 * NOTICE_MARKER are never treated as the persona's words.
 */
import { describe, expect, it } from "vitest";
import { NOTICE_MARKER } from "@/lib/ai/stream-protocol";
import { settleReply, toRequestMessages, visibleReply } from "./use-persona-reply";

describe("settleReply", () => {
  it("commits a normal reply", () => {
    expect(settleReply("  What's the movie?  ")).toEqual({ kind: "reply", text: "What's the movie?" });
  });

  it("treats an empty body as a failed turn", () => {
    expect(settleReply("   ").kind).toBe("failed");
  });

  it("treats a notice with no dialogue before it as a failed turn carrying the notice", () => {
    expect(settleReply(`${NOTICE_MARKER}The coach can't help with that particular request.`)).toEqual({
      kind: "failed",
      error: "The coach can't help with that particular request.",
    });
  });

  it("holds dialogue cut short by a notice separately from the notice", () => {
    const settled = settleReply(`Well, the thing is\n\n${NOTICE_MARKER}The AI coach is temporarily unavailable. Try again shortly.`);
    expect(settled).toEqual({
      kind: "interrupted",
      text: "Well, the thing is",
      notice: "The AI coach is temporarily unavailable. Try again shortly.",
    });
  });

  it("never lets the notice text leak into what would be saved", () => {
    for (const body of [`Hi${NOTICE_MARKER}oops`, `${NOTICE_MARKER}oops`, `Hi ${NOTICE_MARKER}`]) {
      const settled = settleReply(body);
      const saved = settled.kind === "failed" ? "" : settled.text;
      expect(saved).not.toContain("oops");
      expect(saved).not.toContain(NOTICE_MARKER);
    }
  });

  it("falls back to a generic notice when the marker arrives without text", () => {
    const settled = settleReply(`Hi there${NOTICE_MARKER}`);
    expect(settled.kind).toBe("interrupted");
    if (settled.kind === "interrupted") expect(settled.notice).toMatch(/interrupted/);
  });
});

describe("visibleReply", () => {
  it("hides a notice as soon as its marker streams in", () => {
    expect(visibleReply("Okay, so")).toBe("Okay, so");
    expect(visibleReply(`Okay, so${NOTICE_MARKER}The AI co`)).toBe("Okay, so");
  });
});

describe("toRequestMessages", () => {
  it("caps message count and length for the API", () => {
    const long = "x".repeat(9000);
    const out = toRequestMessages(Array.from({ length: 90 }, () => ({ role: "user" as const, content: long })));
    expect(out).toHaveLength(80);
    expect(out[0].content).toHaveLength(8000);
  });
});
