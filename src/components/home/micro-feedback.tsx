import { Compass, PenLine, Sparkles } from "lucide-react";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillChip } from "@/components/ui/skill-chip";
import type { MicroFeedback } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROWS = [
  { key: "praise", label: "What's working", icon: Sparkles, tone: "text-emerald-300" },
  { key: "nudge", label: "One thing to fix", icon: Compass, tone: "text-bronze-300" },
  { key: "tryThis", label: "Try this next", icon: PenLine, tone: "text-aegean-300" },
] as const;

/** The coach's quick read on a daily challenge: score, praise, nudge, next step. */
export function MicroFeedbackView({ feedback, className }: { feedback: MicroFeedback; className?: string }) {
  return (
    <section aria-label="Coach feedback" className={cn("flex flex-col gap-5 sm:flex-row sm:items-start", className)}>
      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center">
        <ScoreRing score={feedback.score} size={84} stroke={7} label="Score" />
        <SkillChip skill={feedback.skill} />
      </div>
      <dl className="min-w-0 flex-1 space-y-3.5">
        {ROWS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key}>
            <dt className={cn("flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase", tone)}>
              <Icon className="size-3.5" aria-hidden />
              {label}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-sea-200">{feedback[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
