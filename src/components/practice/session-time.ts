/**
 * When a practice session was last touched: scored, or else its latest line,
 * or else when it started. Lists sort by it and show it, so a session you
 * just finished reads (and sorts) as the most recent. Delegates to the shared
 * helper in @/lib/progress so Practice, Home and Progress agree.
 */
import { sessionActivityAt } from "@/lib/progress";
import type { PracticeSession } from "@/lib/types";

type Timed = Pick<PracticeSession, "startedAt" | "endedAt" | "messages">;

export const lastActivity = sessionActivityAt;

/** Most recently active first. */
export function byLastActivity(a: Timed, b: Timed): number {
  return lastActivity(b).localeCompare(lastActivity(a));
}
