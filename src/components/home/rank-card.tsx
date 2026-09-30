import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RANKS, rankForXp, type StreakInfo } from "@/lib/progress";
import { cn } from "@/lib/utils";

const xpFormat = new Intl.NumberFormat("en-US");

export function formatXp(xp: number): string {
  return xpFormat.format(Math.max(0, Math.round(xp)));
}

/** A one-line status for the streak. */
export function streakMessage(streak: StreakInfo): string {
  if (streak.activeToday) return streak.current > 1 ? "Today's log is in. Keep the wind at your back." : "Today's log is in.";
  if (streak.current > 0) return "Log anything today to keep it alive.";
  return streak.longest > 0 ? "The wind dropped. Start a new streak today." : "Do one thing today to start a streak.";
}

/** Rank medallion, XP progress and streak — the learner's standing at a glance. */
export function RankCard({ xp, streak, className }: { xp: number; streak: StreakInfo; className?: string }) {
  const { rank, next, xpIntoRank, xpForNext, progress } = rankForXp(xp);
  const toNext = next ? next.minXp - Math.floor(Math.max(0, xp)) : 0;

  return (
    <Card className={cn("flex flex-col gap-5 sm:flex-row sm:items-stretch", className)}>
      <Link
        href="/progress"
        className="group flex min-w-0 flex-1 items-center gap-4 rounded-xl focus-visible:outline-offset-4"
        aria-label={`Rank ${rank.level} of ${RANKS.length}: ${rank.title}, ${formatXp(xp)} XP. Open your captain's log.`}
      >
        <span
          aria-hidden
          className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-bronze-300 to-bronze-600 text-sea-950 shadow-lg shadow-bronze-900/30"
        >
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Rank</span>
          <span className="font-display text-2xl leading-none font-bold">{rank.level}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-display text-xl font-semibold text-sea-100 group-hover:text-bronze-200">
              {rank.title}
            </span>
            <span className="shrink-0 text-sm font-semibold text-bronze-300">{formatXp(xp)} XP</span>
          </span>
          <ProgressBar value={progress} className="mt-2" label={next ? `Progress to ${next.title}` : "Highest rank reached"} />
          <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-sea-400">
            <span>
              {next ? (
                <>
                  <span className="font-medium text-sea-200 tabular-nums">{formatXp(toNext)} XP</span> to {next.title}
                </>
              ) : (
                "The voyage is complete — you are Odysseus."
              )}
            </span>
            {next ? (
              <span className="tabular-nums">
                {formatXp(xpIntoRank)} / {formatXp(xpForNext)}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronRight className="hidden size-4 shrink-0 text-sea-500 group-hover:text-bronze-300 sm:block" aria-hidden />
      </Link>

      <div className="flex items-center gap-3 border-t border-sea-800 pt-4 sm:w-56 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            streak.activeToday ? "bg-orange-500/15 text-orange-300" : "bg-sea-800 text-sea-400",
          )}
        >
          <Flame className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight font-semibold text-sea-100">{streak.current}-day streak</p>
          <p className="text-xs text-sea-400">
            Longest {streak.longest} {streak.longest === 1 ? "day" : "days"}
          </p>
          <p className={cn("mt-0.5 text-xs", streak.activeToday ? "text-orange-200" : "text-sea-300")}>{streakMessage(streak)}</p>
        </div>
      </div>
    </Card>
  );
}
