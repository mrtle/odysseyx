import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  headingLevel = 3,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Use 1 when the empty state is the whole page (not-found pages), so the page still has an h1. */
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-sea-600 bg-sea-900/40 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-bronze-400">{icon}</div> : null}
      <Heading className="font-display text-lg font-semibold text-sea-100">{title}</Heading>
      {description ? <p className="mt-2 max-w-md text-sm text-sea-300">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
