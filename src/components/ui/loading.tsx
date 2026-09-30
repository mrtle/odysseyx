import { cn } from "@/lib/utils";

/** Three pulsing dots — "the coach is thinking". */
export function ThinkingDots({ className, label = "Thinking" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-pulse-soft rounded-full bg-bronze-400"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-sea-800/70", className)} />;
}
