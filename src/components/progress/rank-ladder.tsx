import { Anchor, Check } from "lucide-react";
import { formatXp } from "@/components/home/rank-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RANKS, rankForXp } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { SectionCard } from "./section-card";

/** Every rank from Deckhand to Odysseus, with the learner's position marked. */
export function RankLadder({ xp, className }: { xp: number; className?: string }) {
  const { rank: current, next, progress } = rankForXp(xp);
  const safeXp = Math.max(0, Math.floor(xp));

  return (
    <SectionCard
      id="rank-ladder-heading"
      title="The voyage"
      description={
        next ? (
          <>
            <span className="font-semibold text-bronze-300">{formatXp(next.minXp - safeXp)} XP</span> to {next.title}
          </>
        ) : (
          "Every rank earned. The epic is yours."
        )
      }
      className={className}
    >
      <ol className="relative space-y-1">
        {[...RANKS].reverse().map((rank) => {
          const reached = safeXp >= rank.minXp;
          const isCurrent = rank.level === current.level;
          return (
            <li
              key={rank.level}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2",
                isCurrent ? "border border-bronze-500/40 bg-bronze-500/10" : "border border-transparent",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold",
                  isCurrent
                    ? "bg-gradient-to-br from-bronze-300 to-bronze-600 text-sea-950"
                    : reached
                      ? "bg-bronze-500/20 text-bronze-300"
                      : "border border-sea-700 text-sea-400",
                )}
              >
                {reached && !isCurrent ? <Check className="size-4" /> : rank.level}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    isCurrent ? "text-bronze-200" : reached ? "text-sea-100" : "text-sea-400",
                  )}
                >
                  {rank.title}
                  {isCurrent ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-bronze-300">
                      <Anchor className="size-3" aria-hidden /> You are here
                    </span>
                  ) : null}
                </p>
                {isCurrent && next ? (
                  <ProgressBar value={progress} className="mt-1.5 h-1.5" label={`Progress to ${next.title}`} />
                ) : null}
              </div>
              <span className={cn("shrink-0 text-xs tabular-nums", reached ? "text-sea-300" : "text-sea-400")}>
                {rank.minXp === 0 ? "Start" : `${formatXp(rank.minXp)} XP`}
                <span className="sr-only">{reached ? (isCurrent ? ", current rank" : ", reached") : ", not yet reached"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
