import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookmarkCheck, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LAB_XP_DAILY_LIMIT } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { entryHref } from "./lab-meta";

/** "← Story Lab" link shown above each tool and saved entry. */
export function BackToLab({ className }: { className?: string }) {
  return (
    <Link
      href="/lab"
      className={cn(
        "mb-4 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-sea-300 transition-colors hover:text-bronze-300",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      Story Lab
    </Link>
  );
}

export function SectionHeading({
  id,
  icon,
  title,
  description,
  actions,
  className,
}: {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-sea-800 text-bronze-300 ring-1 ring-sea-700" aria-hidden>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 id={id} className="font-display text-xl font-semibold text-sea-100">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-sea-300">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Confirmation that an analysis was saved to the logbook, with the XP it actually earned. */
export function SavedNotice({
  entryId,
  xpGained,
  replaced = false,
  className,
}: {
  entryId: string;
  /** XP the save earned (0 for a repeat submission or past the daily Story Lab limit). */
  xpGained: number;
  /** True when an identical earlier submission was updated instead of a new entry being added. */
  replaced?: boolean;
  className?: string;
}) {
  const detail = replaced
    ? "Same text as a saved analysis, so that entry was updated rather than duplicated — no new XP."
    : xpGained > 0
      ? null
      : `You've earned today's Story Lab XP (${LAB_XP_DAILY_LIMIT} analyses a day). Keep analysing — the notes are still saved.`;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2 text-emerald-200">
        <BookmarkCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div>
          <p>
            {replaced ? "Updated in your Story Lab logbook" : "Saved to your Story Lab logbook"}
            {xpGained > 0 ? (
              <span className="ml-2 rounded-full bg-bronze-500/15 px-2 py-0.5 text-xs font-semibold text-bronze-300">+{xpGained} XP</span>
            ) : null}
          </p>
          {detail ? <p className="mt-0.5 text-xs text-emerald-200/80">{detail}</p> : null}
        </div>
      </div>
      <Link href={entryHref(entryId)} className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-200 hover:text-emerald-100">
        Open saved copy
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

/** An error from the coach with a retry button. */
export function RequestError({ message, onRetry, onDismiss }: { message: string; onRetry: () => void; onDismiss?: () => void }) {
  return (
    <Alert tone="error" title="The coach couldn't finish that analysis" className="animate-rise">
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onRetry} icon={<RotateCcw className="size-4" aria-hidden />}>
          Try again
        </Button>
        {onDismiss ? (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

/** A word count with a hint, tied to a textarea through aria-describedby. */
export function FieldMeta({ id, children, count, max }: { id: string; children?: ReactNode; count: string; max?: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-xs">
      <p id={id} className="min-w-0 text-sea-300">
        {children}
      </p>
      <p className="shrink-0 text-sea-400 tabular-nums" aria-hidden>
        {count}
        {max ? <span className="text-sea-500"> / {max}</span> : null}
      </p>
    </div>
  );
}
