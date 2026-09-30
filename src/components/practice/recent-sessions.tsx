"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import type { PracticeSession } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { PersonaAvatar } from "./persona-avatar";
import type { PublicScenario } from "./public-scenario";
import { byLastActivity, lastActivity } from "./session-time";

const PAGE = 6;

export function RecentSessions({ sessions, scenarios }: { sessions: PracticeSession[]; scenarios: PublicScenario[] }) {
  const [limit, setLimit] = useState(PAGE);
  const byId = new Map(scenarios.map((s) => [s.id, s]));
  // Sessions abandoned before the learner said anything aren't worth listing. Most recently active first.
  const visible = sessions.filter((s) => byId.has(s.scenarioId) && s.messages.some((m) => m.role === "user")).sort(byLastActivity);

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-7" aria-hidden />}
        title="No voyages logged yet"
        description="Your drills land here with their scores, so you can reread the transcript and see what the coach flagged."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-sea-700/80 bg-sea-900/60 p-2 shadow-xl shadow-black/20 backdrop-blur-sm sm:p-3">
      <ul className="divide-y divide-sea-800">
        {visible.slice(0, limit).map((session) => {
          const scenario = byId.get(session.scenarioId)!;
          const turns = session.messages.filter((m) => m.role === "user").length;
          const score = session.evaluation?.overall;
          const when = lastActivity(session);
          return (
            <li key={session.id}>
              <Link
                href={`/practice/review/${session.id}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-sea-800/60"
              >
                <PersonaAvatar persona={scenario.persona} category={scenario.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-sea-100 group-hover:text-bronze-200">{scenario.title}</p>
                  <p className="line-clamp-2 text-xs text-sea-400">
                    <time dateTime={when}>{formatRelative(when)}</time>
                    {" · "}
                    {turns} turn{turns === 1 ? "" : "s"}
                    {session.mode === "demo" ? " · demo coach" : ""}
                  </p>
                </div>
                {score !== undefined ? (
                  <ScoreRing score={score} size={40} stroke={4} />
                ) : (
                  <Badge tone="neutral">Unfinished</Badge>
                )}
                <ChevronRight className="size-4 shrink-0 text-sea-500 group-hover:text-bronze-300" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
      {visible.length > limit ? (
        <div className="px-3 pt-1 pb-2">
          <Button variant="ghost" size="sm" onClick={() => setLimit((n) => n + PAGE)}>
            Show more ({visible.length - limit})
          </Button>
        </div>
      ) : null}
    </div>
  );
}
