"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/loading";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { ScenarioCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CATEGORY_META, CATEGORY_ORDER } from "./category";
import type { PublicScenario } from "./public-scenario";
import { RecentSessions } from "./recent-sessions";
import { ScenarioCard, type ScenarioStats } from "./scenario-card";

type Filter = "all" | ScenarioCategory;

export function PracticeCatalog({ scenarios }: { scenarios: PublicScenario[] }) {
  const hydrated = useHasHydrated();
  const sessions = useAppStore((s) => s.sessions);
  const [filter, setFilter] = useState<Filter>("all");

  const stats = useMemo(() => {
    const map = new Map<string, ScenarioStats>();
    for (const session of sessions) {
      if (!session.messages.some((m) => m.role === "user")) continue;
      const entry = map.get(session.scenarioId) ?? { best: null, attempts: 0 };
      entry.attempts++;
      const score = session.evaluation?.overall;
      if (score !== undefined) entry.best = Math.max(entry.best ?? 0, score);
      map.set(session.scenarioId, entry);
    }
    return map;
  }, [sessions]);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: scenarios.length },
    ...CATEGORY_ORDER.map((c) => ({ id: c, label: CATEGORY_META[c].label, count: scenarios.filter((s) => s.category === c).length })),
  ];
  const visible = filter === "all" ? scenarios : scenarios.filter((s) => s.category === filter);

  return (
    <>
      <section aria-labelledby="drills-heading">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="drills-heading" className="font-display text-2xl font-semibold text-sea-100">
            Choose your room
          </h2>
          <div role="group" aria-label="Filter drills by category" className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-bronze-400/60 bg-bronze-500/15 text-bronze-200"
                      : "border-sea-700 bg-sea-900/60 text-sea-300 hover:border-sea-500 hover:text-sea-100",
                  )}
                >
                  {f.label}
                  <span className={cn("text-xs tabular-nums", active ? "text-bronze-300/80" : "text-sea-400")}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" role="status">
          {filter === "all" ? `Showing all ${visible.length} drills` : `Showing ${visible.length} ${CATEGORY_META[filter].label} drill${visible.length === 1 ? "" : "s"}`}
        </p>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((scenario) => (
            <li key={scenario.id} className="min-w-0 animate-fade-in">
              <ScenarioCard scenario={scenario} stats={hydrated ? (stats.get(scenario.id) ?? null) : undefined} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-heading" className="mt-14">
        <h2 id="recent-heading" className="mb-5 font-display text-2xl font-semibold text-sea-100">
          Recent sessions
        </h2>
        {hydrated ? (
          <RecentSessions sessions={sessions} scenarios={scenarios} />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}
      </section>
    </>
  );
}
