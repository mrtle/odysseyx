import type { SkillScore } from "@/lib/ai/schemas";
import { SKILLS } from "@/lib/skills";
import { cn, SCORE_TONE_CLASS, scoreTone } from "@/lib/utils";

const BAR_TONE: Record<ReturnType<typeof scoreTone>, string> = {
  low: "from-rose-500 to-rose-400",
  mid: "from-amber-500 to-amber-300",
  good: "from-emerald-500 to-emerald-300",
  great: "from-sky-500 to-sky-300",
};

/** Per-skill scores with a bar and the coach's comment. */
export function SkillBars({ scores, className }: { scores: SkillScore[]; className?: string }) {
  return (
    <ul className={cn("space-y-4", className)}>
      {scores.map((s) => {
        const tone = scoreTone(s.score);
        return (
          <li key={s.skill}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-sea-100">{SKILLS[s.skill].name}</span>
              <span className={cn("font-display text-sm font-bold", SCORE_TONE_CLASS[tone])}>{Math.round(s.score)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sea-800" aria-hidden>
              <div
                className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700", BAR_TONE[tone])}
                style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }}
              />
            </div>
            {s.comment ? <p className="mt-1.5 text-sm leading-relaxed text-sea-300">{s.comment}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
