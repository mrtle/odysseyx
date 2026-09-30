import { cn } from "@/lib/utils";
import { DIFFICULTY_LABEL } from "./category";

/** One to three filled pips, with the difficulty name for screen readers and on hover. */
export function DifficultyPips({ difficulty, showLabel = false, className }: { difficulty: 1 | 2 | 3; showLabel?: boolean; className?: string }) {
  const label = DIFFICULTY_LABEL[difficulty];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={`Difficulty: ${label}`}>
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-2.5 w-1.5 rounded-sm", n <= difficulty ? "bg-bronze-400" : "bg-sea-700")} />
        ))}
      </span>
      {showLabel ? <span>{label}</span> : <span className="sr-only">Difficulty: {label}</span>}
    </span>
  );
}
