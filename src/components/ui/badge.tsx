import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "bronze" | "aegean" | "wine" | "success";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-sea-600 bg-sea-800/80 text-sea-200",
  bronze: "border-bronze-500/40 bg-bronze-500/10 text-bronze-300",
  aegean: "border-aegean-500/40 bg-aegean-500/10 text-aegean-300",
  wine: "border-wine-500/40 bg-wine-500/10 text-wine-400",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
