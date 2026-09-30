import { cn, SCORE_TONE_CLASS, SCORE_TONE_STROKE, scoreTone } from "@/lib/utils";

/** Circular 0–100 score gauge. */
export function ScoreRing({
  score,
  size = 96,
  stroke = 8,
  label,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = scoreTone(value);
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-sea-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className={cn("fill-none transition-[stroke-dashoffset] duration-700", SCORE_TONE_STROKE[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-display font-bold leading-none", SCORE_TONE_CLASS[tone])} style={{ fontSize: size * 0.3 }}>
          {value}
        </span>
        {label ? <span className="mt-1 text-[10px] font-medium tracking-wider text-sea-400 uppercase">{label}</span> : null}
      </div>
      <span className="sr-only">
        {label ? `${label}: ` : ""}
        {value} out of 100
      </span>
    </div>
  );
}
