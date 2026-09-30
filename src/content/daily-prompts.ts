/**
 * Daily micro-story challenges. One is chosen per calendar day.
 */
import type { DailyPrompt } from "@/lib/types";

export const DAILY_PROMPTS: DailyPrompt[] = [];

export function getDailyPrompt(id: string): DailyPrompt | undefined {
  return DAILY_PROMPTS.find((p) => p.id === id);
}
