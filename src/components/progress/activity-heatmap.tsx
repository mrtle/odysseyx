import { Flame, Trophy } from "lucide-react";
import type { StreakInfo } from "@/lib/progress";
import type { XpEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildHeatmap, type HeatDay, type HeatLevel } from "./progress-helpers";
import { SectionCard } from "./section-card";

const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-sea-800",
  1: "bg-bronze-700/70",
  2: "bg-bronze-600",
  3: "bg-bronze-500",
  4: "bg-bronze-300",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayLabel(day: HeatDay): string {
  const date = day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (!day.active) return `${date}: no activity`;
  return day.xp > 0 ? `${date}: active, ${day.xp} XP` : `${date}: active`;
}

/** Current and longest streak, plus a 12-week activity grid. */
export function StreakCard({
  streak,
  activityDates,
  xpLog,
  today,
  className,
}: {
  streak: StreakInfo;
  activityDates: string[];
  xpLog: XpEvent[];
  today: Date;
  className?: string;
}) {
  const heatmap = buildHeatmap(activityDates, xpLog, today, 12);
  const monthAt = new Map(heatmap.months.map((m) => [m.column, m.label]));

  return (
    <SectionCard
      id="streak-heading"
      title="Streak"
      description={
        streak.activeToday
          ? "Today's log is in."
          : streak.current > 0
            ? "Log anything today to keep it going."
            : "Any lesson, drill, analysis or daily challenge counts."
      }
      className={className}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-sea-800 bg-sea-950/40 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sea-400 uppercase">
            <Flame className={cn("size-3.5", streak.activeToday ? "text-orange-300" : "text-sea-500")} aria-hidden /> Current
          </p>
          <p className="mt-1 text-3xl font-semibold text-sea-100">
            {streak.current} <span className="text-base font-normal text-sea-400">{streak.current === 1 ? "day" : "days"}</span>
          </p>
        </div>
        <div className="rounded-xl border border-sea-800 bg-sea-950/40 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sea-400 uppercase">
            <Trophy className="size-3.5 text-bronze-400" aria-hidden /> Longest
          </p>
          <p className="mt-1 text-3xl font-semibold text-sea-100">
            {streak.longest} <span className="text-base font-normal text-sea-400">{streak.longest === 1 ? "day" : "days"}</span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-sea-200">Last 12 weeks</h3>
          <p className="text-xs text-sea-400">
            Active on <span className="font-semibold text-sea-200 tabular-nums">{heatmap.activeDays}</span> of {heatmap.totalDays}{" "}
            days
          </p>
        </div>
        <div className="mt-3 overflow-x-auto pb-1">
          <table className="border-separate border-spacing-[3px]">
            <caption className="sr-only">
              Daily activity for the last 12 weeks. Active on {heatmap.activeDays} of {heatmap.totalDays} days. Rows are weekdays,
              columns are weeks.
            </caption>
            <thead>
              <tr>
                <td />
                {heatmap.weeks.map((week, column) => (
                  <th key={week[0].key} scope="col" className="relative h-4 p-0 text-left font-normal">
                    <span aria-hidden className="absolute top-0 left-0 text-[10px] whitespace-nowrap text-sea-400">
                      {monthAt.get(column) ?? ""}
                    </span>
                    <span className="sr-only">
                      Week of {week[0].date.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((weekday, row) => (
                <tr key={weekday}>
                  <th scope="row" className="pr-1 text-right text-[10px] font-normal text-sea-400">
                    <span aria-hidden>{row % 2 === 0 ? weekday : ""}</span>
                    <span className="sr-only">{weekday}</span>
                  </th>
                  {heatmap.weeks.map((week) => {
                    const day = week[row];
                    if (day.future) return <td key={day.key} aria-hidden />;
                    const label = dayLabel(day);
                    return (
                      <td key={day.key} className="p-0">
                        <span
                          title={label}
                          className={cn(
                            "block size-3.5 rounded-[3px] sm:size-4",
                            LEVEL_CLASS[day.level],
                            day.isToday && "ring-1 ring-sea-200 ring-offset-1 ring-offset-sea-900",
                          )}
                        />
                        <span className="sr-only">{label}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-sea-400" aria-hidden>
          Less
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className={cn("size-3 rounded-[3px]", LEVEL_CLASS[level])} />
          ))}
          More
        </div>
      </div>
    </SectionCard>
  );
}
