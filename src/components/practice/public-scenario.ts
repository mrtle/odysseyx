/**
 * The client-safe view of a scenario: everything except the persona's
 * hidden direction, which stays on the server.
 */
import type { Scenario } from "@/lib/types";

export type PublicScenario = Omit<Scenario, "personaBrief">;

export function toPublicScenario(scenario: Scenario): PublicScenario {
  const { personaBrief: _hidden, ...rest } = scenario;
  void _hidden;
  return rest;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
