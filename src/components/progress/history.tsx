"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CalendarDays, FlaskConical, Swords } from "lucide-react";
import type { Catalog } from "@/components/home/catalog";
import { ActivityRow, buildActivity } from "@/components/home/recent-activity";
import { Button, ButtonLink } from "@/components/ui/button";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillChip } from "@/components/ui/skill-chip";
import { getDailyPrompt } from "@/content/daily-prompts";
import { dailyHistory } from "@/lib/daily";
import type { DailyEntry, LabEntry, PracticeSession } from "@/lib/types";
import { SectionCard } from "./section-card";

const PAGE = 6;

function ShowMore({ shown, total, onMore, noun }: { shown: number; total: number; onMore: () => void; noun: string }) {
  if (shown >= total) return null;
  return (
    <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onMore}>
      Show {Math.min(PAGE, total - shown)} more {noun} <span className="text-sea-400">({total - shown} left)</span>
    </Button>
  );
}

function EmptyNote({ children, action }: { children: string; action: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-sea-700 px-4 py-6 text-center">
      <p className="text-sm text-sea-300">{children}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}

export function PracticeHistory({
  sessions,
  catalog,
  className,
}: {
  sessions: PracticeSession[];
  catalog: Catalog;
  className?: string;
}) {
  const [limit, setLimit] = useState(PAGE);
  const items = buildActivity(sessions, [], catalog, Number.POSITIVE_INFINITY);
  const scored = sessions.filter((s) => s.evaluation);
  const average = scored.length ? Math.round(scored.reduce((n, s) => n + (s.evaluation?.overall ?? 0), 0) / scored.length) : null;
  return (
    <SectionCard
      id="practice-history-heading"
      title="Practice drills"
      description={
        items.length === 0
          ? "Scored rehearsals with AI personas."
          : `${scored.length} scored${average !== null ? ` · average ${average}` : ""}`
      }
      className={className}
    >
      {items.length === 0 ? (
        <EmptyNote
          action={
            <ButtonLink href="/practice" size="sm" variant="secondary" icon={<Swords className="size-4" aria-hidden />}>
              Rehearse a scene
            </ButtonLink>
          }
        >
          No drills yet. Your scorecards will be logged here.
        </EmptyNote>
      ) : (
        <>
          <ul className="-mx-2 divide-y divide-sea-800">
            {items.slice(0, limit).map((item) => (
              <li key={item.id}>
                <ActivityRow item={item} />
              </li>
            ))}
          </ul>
          <ShowMore shown={limit} total={items.length} noun="drills" onMore={() => setLimit((n) => n + PAGE)} />
        </>
      )}
    </SectionCard>
  );
}

export function LabHistory({ labEntries, catalog, className }: { labEntries: LabEntry[]; catalog: Catalog; className?: string }) {
  const [limit, setLimit] = useState(PAGE);
  const items = buildActivity([], labEntries, catalog, Number.POSITIVE_INFINITY);
  return (
    <SectionCard
      id="lab-history-heading"
      title="Story Lab"
      description={
        items.length === 0
          ? "Saved loglines, story analyses and shot plans."
          : `${items.length} saved ${items.length === 1 ? "analysis" : "analyses"}`
      }
      className={className}
    >
      {items.length === 0 ? (
        <EmptyNote
          action={
            <ButtonLink href="/lab" size="sm" variant="secondary" icon={<FlaskConical className="size-4" aria-hidden />}>
              Open the Story Lab
            </ButtonLink>
          }
        >
          Nothing saved yet. Every analysis you run is kept here.
        </EmptyNote>
      ) : (
        <>
          <ul className="-mx-2 divide-y divide-sea-800">
            {items.slice(0, limit).map((item) => (
              <li key={item.id}>
                <ActivityRow item={item} />
              </li>
            ))}
          </ul>
          <ShowMore shown={limit} total={items.length} noun="entries" onMore={() => setLimit((n) => n + PAGE)} />
        </>
      )}
    </SectionCard>
  );
}

export function DailyHistory({ daily, className }: { daily: Record<string, DailyEntry>; className?: string }) {
  const [limit, setLimit] = useState(PAGE);
  const entries = dailyHistory(daily);
  return (
    <SectionCard
      id="daily-history-heading"
      title="Daily challenges"
      description={entries.length === 0 ? "One micro-story a day." : `${entries.length} completed`}
      className={className}
    >
      {entries.length === 0 ? (
        <EmptyNote
          action={
            <ButtonLink href="/" size="sm" variant="secondary" icon={<CalendarDays className="size-4" aria-hidden />}>
              Today&apos;s challenge
            </ButtonLink>
          }
        >
          No challenges logged yet. Today&apos;s is waiting on Home.
        </EmptyNote>
      ) : (
        <>
          <ul className="-mx-2 divide-y divide-sea-800">
            {entries.slice(0, limit).map((entry) => {
              const prompt = getDailyPrompt(entry.promptId);
              const date = new Date(`${entry.date}T12:00:00`);
              return (
                <li key={entry.date} className="flex items-center gap-3 px-2 py-2.5">
                  <details className="group min-w-0 flex-1">
                    <summary className="cursor-pointer list-none rounded-md [&::-webkit-details-marker]:hidden">
                      <span className="block truncate text-sm font-medium text-sea-100 group-open:text-bronze-200">
                        {prompt?.title ?? "Daily challenge"}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-sea-400">
                        <time dateTime={entry.date}>
                          {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                        </time>
                        {entry.feedback ? <SkillChip skill={entry.feedback.skill} /> : null}
                        <span className="text-bronze-300 group-open:hidden">Read</span>
                        <span className="hidden text-bronze-300 group-open:inline">Hide</span>
                      </span>
                    </summary>
                    <blockquote className="mt-2 border-l-2 border-bronze-500/50 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-sea-200">
                      {entry.response}
                    </blockquote>
                    {entry.feedback ? <p className="mt-2 text-xs leading-relaxed text-sea-300">{entry.feedback.nudge}</p> : null}
                  </details>
                  {entry.feedback ? <ScoreRing score={entry.feedback.score} size={40} stroke={4} /> : null}
                </li>
              );
            })}
          </ul>
          <ShowMore shown={limit} total={entries.length} noun="days" onMore={() => setLimit((n) => n + PAGE)} />
        </>
      )}
      {entries.length > 0 ? (
        <p className="mt-3 text-xs text-sea-500">
          Tomorrow&apos;s prompt appears on{" "}
          <Link href="/" className="text-bronze-300 hover:text-bronze-200">
            Home
          </Link>{" "}
          at midnight.
        </p>
      ) : null}
    </SectionCard>
  );
}
