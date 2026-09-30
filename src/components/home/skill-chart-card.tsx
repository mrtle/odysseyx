import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SkillRadar, toRadarPoints } from "@/components/progress/skill-radar";
import type { SkillStat } from "@/lib/progress";
import { SKILLS, SKILL_IDS, type SkillId } from "@/lib/skills";
import { cn } from "@/lib/utils";

/** Strongest and weakest measured skills, or null when nothing is measured. */
export function skillExtremes(profile: Record<SkillId, SkillStat>): { strongest: SkillStat; weakest: SkillStat } | null {
  const measured = SKILL_IDS.map((id) => profile[id]).filter((s): s is SkillStat & { score: number } => s.score !== null);
  if (measured.length === 0) return null;
  const strongest = measured.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = measured.reduce((a, b) => (b.score < a.score ? b : a));
  return { strongest, weakest };
}

/** Compact radar of the learner's skill profile for the Home dashboard. */
export function SkillChartCard({
  profile,
  observations,
  className,
}: {
  profile: Record<SkillId, SkillStat>;
  observations: number;
  className?: string;
}) {
  const extremes = skillExtremes(profile);
  const measuredCount = SKILL_IDS.filter((id) => profile[id].score !== null).length;
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-sea-100">Skill chart</h2>
          <p className="text-xs text-sea-400">
            {measuredCount} of {SKILL_IDS.length} skills charted
          </p>
        </div>
        <Link href="/progress" className="text-sm font-medium text-bronze-300 hover:text-bronze-200">
          Details
        </Link>
      </div>
      <div className="mx-auto mt-2 w-full max-w-xs">
        <SkillRadar points={toRadarPoints(profile)} title="Your skill chart" />
      </div>
      {observations === 0 || !extremes ? (
        <p className="mt-1 text-center text-sm leading-relaxed text-sea-300">
          Blank waters for now. Every drill, Story Lab analysis, quiz and daily challenge plots a point.
        </p>
      ) : (
        <dl className="mt-1 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-sea-800 bg-sea-950/40 px-2 py-2">
            <dt className="text-[11px] font-semibold tracking-wide text-sea-400 uppercase">Strongest</dt>
            <dd className="mt-0.5 text-sm font-semibold text-sea-100">
              {SKILLS[extremes.strongest.skill].short}{" "}
              <span className="text-emerald-300 tabular-nums">{extremes.strongest.score}</span>
            </dd>
          </div>
          <div className="rounded-xl border border-sea-800 bg-sea-950/40 px-2 py-2">
            <dt className="text-[11px] font-semibold tracking-wide text-sea-400 uppercase">Weakest</dt>
            <dd className="mt-0.5 text-sm font-semibold text-sea-100">
              {SKILLS[extremes.weakest.skill].short} <span className="text-amber-300 tabular-nums">{extremes.weakest.score}</span>
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
