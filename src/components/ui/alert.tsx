import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "tip" | "warning" | "error";

const STYLES: Record<AlertTone, { box: string; icon: ReactNode }> = {
  info: { box: "border-aegean-500/40 bg-aegean-500/10 text-aegean-300", icon: <Info className="size-4" aria-hidden /> },
  tip: { box: "border-bronze-500/40 bg-bronze-500/10 text-bronze-200", icon: <Lightbulb className="size-4" aria-hidden /> },
  warning: { box: "border-amber-500/40 bg-amber-500/10 text-amber-200", icon: <TriangleAlert className="size-4" aria-hidden /> },
  error: { box: "border-wine-500/50 bg-wine-600/15 text-wine-400", icon: <TriangleAlert className="size-4" aria-hidden /> },
};

export function Alert({ tone = "info", title, children, className }: { tone?: AlertTone; title?: string; children?: ReactNode; className?: string }) {
  const style = STYLES[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", style.box, className)}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-sea-200">{children}</div> : null}
      </div>
    </div>
  );
}
