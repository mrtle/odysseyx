import Link from "next/link";
import { ChevronRight, History, Swords } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreRing } from "@/components/ui/score-ring";
import { sessionActivityAt } from "@/lib/progress";
import type { LabEntry, PracticeSession } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { findScenario, type Catalog } from "./catalog";
import { LAB_TOOL_LINKS, labEntryScore, labEntrySummary } from "./lab-tools";

export interface ActivityItem {
  id: string;
  kind: "practice" | "lab";
  href: string;
  title: string;
  meta: string;
  at: string;
  score: number | null;
  /** Shown instead of a score ring, e.g. "Unfinished" or "8 shots". */
  note?: string;
  labTool?: LabEntry["tool"];
}

/** Sessions the learner actually spoke in, plus lab entries, newest first. */
export function buildActivity(sessions: PracticeSession[], labEntries: LabEntry[], catalog: Catalog, limit = 5): ActivityItem[] {
  const practice = sessions
    .filter((s) => s.messages.some((m) => m.role === "user"))
    .map<ActivityItem>((s) => {
      const scenario = findScenario(catalog, s.scenarioId);
      return {
        id: s.id,
        kind: "practice",
        href: `/practice/review/${s.id}`,
        title: scenario?.title ?? "Practice drill",
        meta: scenario ? `Practice · ${scenario.persona.name}` : "Practice",
        at: sessionActivityAt(s),
        score: s.evaluation?.overall ?? null,
        note: s.evaluation ? undefined : "Unfinished",
      };
    });
  const lab = labEntries.map<ActivityItem>((e) => ({
    id: e.id,
    kind: "lab",
    href: `/lab/entry/${e.id}`,
    title: e.title || LAB_TOOL_LINKS[e.tool].name,
    meta: `Story Lab · ${LAB_TOOL_LINKS[e.tool].name}`,
    at: e.createdAt,
    score: labEntryScore(e),
    note: labEntryScore(e) === null ? labEntrySummary(e) : undefined,
    labTool: e.tool,
  }));
  return [...practice, ...lab].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, limit);
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const tool = item.labTool ? LAB_TOOL_LINKS[item.labTool] : null;
  const Icon = tool ? tool.icon : Swords;
  return (
    <Link href={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sea-800/60">
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tool ? tool.tile : "bg-sea-800 text-sea-200",
        )}
      >
        <Icon className="size-4" />
      </span>
      {/* Titles wrap to two lines: beside a score ring and chevron a phone leaves ~110px, too little for one. */}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-medium break-words text-sea-100 group-hover:text-bronze-200">{item.title}</span>
        <span className="line-clamp-2 text-xs text-sea-400">
          {item.meta} · <time dateTime={item.at}>{formatRelative(item.at)}</time>
        </span>
      </span>
      {item.score !== null ? <ScoreRing score={item.score} size={40} stroke={4} /> : <Badge tone="neutral">{item.note}</Badge>}
      <ChevronRight className="size-4 shrink-0 text-sea-600 group-hover:text-bronze-300" aria-hidden />
    </Link>
  );
}

export function RecentActivity({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <section aria-labelledby="recent-activity-heading" className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="recent-activity-heading" className="font-display text-xl font-semibold text-sea-100">
          Recent voyages
        </h2>
        {items.length > 0 ? (
          <Link href="/progress" className="-mx-2 -my-3 inline-flex items-center rounded-md px-2 py-3 text-sm font-medium text-bronze-300 hover:text-bronze-200">
            Full log
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={<History className="size-7" aria-hidden />}
          title="Nothing logged yet"
          description="Your drills and Story Lab analyses land here with their scores, so you can reread every note."
          action={
            <ButtonLink href="/practice" variant="secondary" size="sm">
              Rehearse a scene
            </ButtonLink>
          }
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-sea-800 rounded-2xl border border-sea-700/80 bg-sea-900/60 p-1.5 shadow-xl shadow-black/20">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <ActivityRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
