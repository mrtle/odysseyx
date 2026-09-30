import { describe, expect, it } from "vitest";
import type { PracticeSession } from "@/lib/types";
import { byLastActivity, lastActivity } from "./session-time";

const session = (id: string, startedAt: string, lastAt: string, endedAt?: string): PracticeSession => ({
  id,
  scenarioId: "studio-pitch",
  startedAt,
  endedAt,
  messages: [
    { id: "m0", role: "persona", content: "Hi", at: startedAt },
    { id: "m1", role: "user", content: "Hello", at: lastAt },
  ],
});

describe("lastActivity", () => {
  it("prefers the scoring time, then the latest line, then the start", () => {
    expect(lastActivity(session("a", "2026-09-29T10:00:00.000Z", "2026-09-29T10:05:00.000Z", "2026-09-29T10:09:00.000Z"))).toBe(
      "2026-09-29T10:09:00.000Z",
    );
    expect(lastActivity(session("b", "2026-09-29T10:00:00.000Z", "2026-09-29T10:05:00.000Z"))).toBe("2026-09-29T10:05:00.000Z");
    expect(lastActivity({ startedAt: "2026-09-29T10:00:00.000Z", messages: [] })).toBe("2026-09-29T10:00:00.000Z");
  });

  it("sorts a session scored just now above newer-started unfinished ones", () => {
    const scored = session("scored", "2026-09-29T10:00:00.000Z", "2026-09-29T10:06:00.000Z", "2026-09-29T10:10:00.000Z");
    const unfinished = session("unfinished", "2026-09-29T10:07:00.000Z", "2026-09-29T10:08:00.000Z");
    // The store keeps sessions newest-started first.
    expect([unfinished, scored].sort(byLastActivity).map((s) => s.id)).toEqual(["scored", "unfinished"]);
  });
});
