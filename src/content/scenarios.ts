/**
 * Practice drills: AI roleplay scenarios.
 */
import type { Scenario } from "@/lib/types";

export const SCENARIOS: Scenario[] = [];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
