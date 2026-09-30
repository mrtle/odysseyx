import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { SkillStat } from "@/lib/progress";
import { SKILL_LIST, type SkillId } from "@/lib/skills";
import { cn, SCORE_TONE_CLASS, scoreTone } from "@/lib/utils";
import { trendInfo } from "./progress-helpers";
import { SectionCard } from "./section-card";
import { SkillRadar, toRadarPoints } from "./skill-radar";

const TREND_STYLE = {
  up: { icon: TrendingUp, className: "text-emerald-300" },
  down: { icon: TrendingDown, className: "text-rose-400" },
  flat: { icon: Minus, className: "text-sea-300" },
  none: { icon: null, className: "text-sea-400" },
} as const;

/** Radar plus its table twin: score, trend and sample count per skill. */
export function SkillsSection({ profile, className }: { profile: Record<SkillId, SkillStat>; className?: string }) {
  const measured = SKILL_LIST.filter((s) => profile[s.id].score !== null).length;
  return (
    <SectionCard
      id="skills-heading"
      title="Skill chart"
      description={
        measured === 0
          ? "Nothing charted yet. Scores from drills, the Story Lab, quizzes and daily challenges plot your profile."
          : `${measured} of ${SKILL_LIST.length} skills charted. Recent work counts most; live drills and lab analyses count more than quizzes.`
      }
      className={className}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="mx-auto w-full max-w-sm">
          <SkillRadar points={toRadarPoints(profile)} title="Your skill chart" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Score, recent trend and number of scores for each skill</caption>
            <thead>
              <tr className="border-b border-sea-800 text-left text-xs text-sea-400">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Skill
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Score
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Trend
                </th>
                <th scope="col" className="py-2 pl-2 text-right font-medium">
                  Samples
                </th>
              </tr>
            </thead>
            <tbody>
              {SKILL_LIST.map((skill) => {
                const stat = profile[skill.id];
                const trend = trendInfo(stat);
                const style = TREND_STYLE[trend.direction];
                const TrendIcon = style.icon;
                return (
                  <tr key={skill.id} className="border-b border-sea-800/60 last:border-0">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-sea-100">
                      <span title={skill.description}>{skill.name}</span>
                    </th>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {stat.score === null ? (
                        <span className="text-sea-400">
                          —<span className="sr-only">not yet measured</span>
                        </span>
                      ) : (
                        <span className={cn("font-semibold", SCORE_TONE_CLASS[scoreTone(stat.score)])}>{stat.score}</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className={cn("inline-flex items-center justify-end gap-1 text-xs tabular-nums", style.className)}>
                        {TrendIcon ? <TrendIcon className="size-3.5" aria-hidden /> : null}
                        <span aria-hidden>{trend.label}</span>
                        <span className="sr-only">{trend.description}</span>
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right text-sea-300 tabular-nums">{stat.samples}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
