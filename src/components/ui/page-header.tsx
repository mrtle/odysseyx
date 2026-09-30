import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-sea-100 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-base leading-relaxed text-sea-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
