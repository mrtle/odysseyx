import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: {
  /** 0–1 */
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-sea-800", className)}
    >
      <div
        className={cn("h-full rounded-full bg-gradient-to-r from-bronze-500 to-bronze-300 transition-[width] duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
