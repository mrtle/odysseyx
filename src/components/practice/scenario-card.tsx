import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading";
import { SkillChip } from "@/components/ui/skill-chip";
import { cn, SCORE_TONE_CLASS, scoreTone } from "@/lib/utils";
import { CATEGORY_META } from "./category";
import { DifficultyPips } from "./difficulty-pips";
import { PersonaAvatar } from "./persona-avatar";
import type { PublicScenario } from "./public-scenario";

export interface ScenarioStats {
  best: number | null;
  attempts: number;
}

function BestScore({ stats }: { stats: ScenarioStats | null | undefined }) {
  if (stats === undefined) return <Skeleton className="h-7 w-14 rounded-full" />;
  if (!stats || stats.attempts === 0) {
    return (
      <Badge tone="neutral">New</Badge>
    );
  }
  if (stats.best === null) return <Badge tone="neutral">In progress</Badge>;
  const tone = scoreTone(stats.best);
  return (
    <span
      className="inline-flex items-baseline gap-1 rounded-full border border-sea-600 bg-sea-800/80 px-2.5 py-0.5"
      title={`Best score ${stats.best} across ${stats.attempts} attempt${stats.attempts === 1 ? "" : "s"}`}
    >
      <span className="text-[10px] font-semibold tracking-wider text-sea-400 uppercase">Best</span>
      <span className={cn("font-display text-sm font-bold", SCORE_TONE_CLASS[tone])}>{stats.best}</span>
    </span>
  );
}

/**
 * A drill in the Practice catalog. `stats` is undefined while progress is
 * loading, null when unknown.
 */
export function ScenarioCard({ scenario, stats }: { scenario: PublicScenario; stats?: ScenarioStats | null }) {
  const meta = CATEGORY_META[scenario.category];
  const Icon = meta.icon;
  return (
    <Link
      href={`/practice/${scenario.id}`}
      className="group flex h-full flex-col rounded-2xl border border-sea-700/80 bg-sea-900/60 p-5 shadow-xl shadow-black/20 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-bronze-500/50 hover:bg-sea-900/85 focus-visible:border-bronze-400"
    >
      <div className="flex items-start gap-3">
        <PersonaAvatar persona={scenario.persona} category={scenario.category} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sea-100">{scenario.persona.name}</p>
          <p className="truncate text-xs text-sea-400">{scenario.persona.role}</p>
        </div>
        <BestScore stats={stats} />
      </div>

      <h3 className="mt-4 font-display text-xl font-semibold text-sea-100 transition-colors group-hover:text-bronze-200">
        {scenario.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-sea-300">{scenario.tagline}</p>

      <div className="mt-auto pt-5">
        <ul className="flex flex-wrap gap-1.5" aria-label="Skills trained">
          {scenario.skills.map((skill) => (
            <li key={skill}>
              <SkillChip skill={skill} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sea-800 pt-3 text-xs text-sea-400">
          <Badge tone={meta.badge}>
            <Icon className="size-3" aria-hidden />
            {meta.label}
          </Badge>
          <span className="flex items-center gap-3">
            <DifficultyPips difficulty={scenario.difficulty} />
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {scenario.minutes} min
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
