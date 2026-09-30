import { BookOpen, CalendarDays, FlaskConical, Sparkles, Swords, type LucideIcon } from "lucide-react";
import type { Catalog } from "@/components/home/catalog";
import { formatXp } from "@/components/home/rank-card";
import { XP_REWARDS } from "@/lib/progress";
import type { XpEvent } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { describeXpReason, type XpKind } from "./progress-helpers";
import { SectionCard } from "./section-card";

const KIND_ICON: Record<XpKind, LucideIcon> = {
  lesson: BookOpen,
  practice: Swords,
  lab: FlaskConical,
  daily: CalendarDays,
  other: Sparkles,
};

const KIND_LABEL: Record<XpKind, string> = {
  lesson: "Lesson",
  practice: "Drill",
  lab: "Story Lab",
  daily: "Daily",
  other: "Bonus",
};

/** The most recent XP events, newest first. */
export function XpLog({
  xpLog,
  catalog,
  limit = 12,
  className,
}: {
  xpLog: XpEvent[];
  catalog: Catalog;
  limit?: number;
  className?: string;
}) {
  const events = xpLog.slice(0, limit);
  return (
    <SectionCard id="xp-log-heading" title="Recent XP" description="Where your experience came from." className={className}>
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sea-700 px-4 py-5 text-sm text-sea-300">
          <p className="font-medium text-sea-200">How XP is earned</p>
          <ul className="mt-2 space-y-1 text-sea-400">
            <li>
              Lesson complete: {XP_REWARDS.lessonComplete} XP (+{XP_REWARDS.quizPerfectBonus} for a perfect quiz)
            </li>
            <li>
              Practice drill: {XP_REWARDS.practiceBase}–{XP_REWARDS.practiceBase + 100 * XP_REWARDS.practiceScoreFactor} XP, by
              score
            </li>
            <li>Story Lab analysis: {XP_REWARDS.labAnalysis} XP</li>
            <li>Daily challenge: {XP_REWARDS.daily} XP</li>
          </ul>
        </div>
      ) : (
        <ol className="space-y-1">
          {events.map((event, i) => {
            const reason = describeXpReason(event.reason, catalog);
            const Icon = KIND_ICON[reason.kind];
            return (
              <li key={`${event.at}-${i}`} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sea-800 text-sea-300">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-sea-100">{reason.label}</span>
                  <span className="block text-xs text-sea-400">
                    {KIND_LABEL[reason.kind]} · <time dateTime={event.at}>{formatRelative(event.at)}</time>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-bronze-300 tabular-nums">+{formatXp(event.amount)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
