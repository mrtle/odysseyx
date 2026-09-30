import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Clapperboard, FlaskConical, Lightbulb, Sparkles, TriangleAlert, X } from "lucide-react";
import { RichText } from "@/components/ui/rich-text";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { LessonBlock } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExerciseScratchpad } from "./exercise-scratchpad";
import { plainText, slugify } from "./learn-helpers";

type BlockOf<T extends LessonBlock["type"]> = Extract<LessonBlock, { type: T }>;

const BODY = "text-[1.0625rem] leading-8 text-sea-200";

/** Unique anchor ids for every heading block, in order. */
export function headingIds(blocks: LessonBlock[]): Map<number, string> {
  const seen = new Map<string, number>();
  const ids = new Map<number, string>();
  blocks.forEach((block, index) => {
    if (block.type !== "heading") return;
    const base = slugify(block.text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    ids.set(index, count === 0 ? base : `${base}-${count + 1}`);
  });
  return ids;
}

/** Renders a lesson body. Server-compatible; only the inline exercise is a client island. */
export function LessonBlocks({ blocks, className }: { blocks: LessonBlock[]; className?: string }) {
  const ids = headingIds(blocks);
  return (
    <div className={cn("space-y-6", className)}>
      {blocks.map((block, index) => (
        <LessonBlockView key={index} block={block} index={index} headingId={ids.get(index)} />
      ))}
    </div>
  );
}

function LessonBlockView({ block, index, headingId }: { block: LessonBlock; index: number; headingId?: string }): ReactNode {
  switch (block.type) {
    case "heading":
      return <HeadingBlock block={block} id={headingId ?? `section-${index}`} first={index === 0} />;
    case "text":
      return <TextBlock block={block} />;
    case "list":
      return <ListBlock block={block} />;
    case "callout":
      return <CalloutBlock block={block} />;
    case "example":
      return <ExampleBlock block={block} />;
    case "quote":
      return <QuoteBlock block={block} />;
    case "compare":
      return <CompareBlock block={block} />;
    case "beats":
      return <BeatsBlock block={block} id={`beats-${index}`} />;
    case "exercise-inline":
      return <ExerciseScratchpad prompt={block.prompt} placeholder={block.placeholder} />;
    default: {
      const unknown: never = block;
      void unknown;
      return null;
    }
  }
}

function HeadingBlock({ block, id, first }: { block: BlockOf<"heading">; id: string; first: boolean }) {
  return (
    <h2
      id={id}
      className={cn(
        "scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-balance text-sea-100 sm:text-[1.7rem]",
        first ? undefined : "pt-6",
      )}
    >
      <RichText text={block.text} />
    </h2>
  );
}

function TextBlock({ block }: { block: BlockOf<"text"> }) {
  return (
    <div className="space-y-5">
      <RichText text={block.body} paragraphs className={BODY} />
    </div>
  );
}

function ListBlock({ block }: { block: BlockOf<"list"> }) {
  if (block.ordered) {
    return (
      <ol role="list" className="space-y-3">
        {block.items.map((item, i) => (
          <li key={i} className={cn("flex gap-3.5", BODY)}>
            <span
              aria-hidden
              className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-bronze-500/40 bg-bronze-500/10 font-display text-xs font-bold text-bronze-300"
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <RichText text={item} />
            </span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul role="list" className="space-y-2.5">
      {block.items.map((item, i) => (
        <li key={i} className={cn("flex gap-3.5", BODY)}>
          <span aria-hidden className="mt-[0.8rem] size-1.5 shrink-0 rotate-45 bg-bronze-400" />
          <span className="min-w-0">
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const CALLOUT_STYLES: Record<
  BlockOf<"callout">["tone"],
  { box: string; iconWrap: string; title: string; label: string; icon: ReactNode }
> = {
  tip: {
    box: "border-bronze-500/35 bg-bronze-500/[0.07] before:bg-bronze-400",
    iconWrap: "bg-bronze-500/15 text-bronze-300",
    title: "text-bronze-200",
    label: "Tip",
    icon: <Lightbulb className="size-4" aria-hidden />,
  },
  warning: {
    box: "border-wine-500/45 bg-wine-600/[0.12] before:bg-wine-400",
    iconWrap: "bg-wine-500/20 text-wine-400",
    title: "text-rose-200",
    label: "Watch out",
    icon: <TriangleAlert className="size-4" aria-hidden />,
  },
  insight: {
    box: "border-aegean-500/35 bg-aegean-500/[0.07] before:bg-aegean-400",
    iconWrap: "bg-aegean-500/15 text-aegean-300",
    title: "text-aegean-300",
    label: "Insight",
    icon: <Sparkles className="size-4" aria-hidden />,
  },
};

function CalloutBlock({ block }: { block: BlockOf<"callout"> }) {
  const style = CALLOUT_STYLES[block.tone] ?? CALLOUT_STYLES.tip;
  const title = block.title ?? style.label;
  return (
    <div
      role="note"
      aria-label={plainText(title)}
      className={cn(
        "relative flex gap-3.5 overflow-hidden rounded-2xl border py-4 pr-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 sm:pr-5",
        style.box,
      )}
    >
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.iconWrap)}>{style.icon}</span>
      <div className="min-w-0 pt-0.5">
        <p className={cn("text-sm font-semibold tracking-wide", style.title)}>
          {block.title ? <RichText text={block.title} /> : style.label}
        </p>
        <div className="mt-1.5 space-y-3">
          <RichText text={block.body} paragraphs className="text-[0.98rem] leading-7 text-sea-200" />
        </div>
      </div>
    </div>
  );
}

const SPROCKETS = {
  backgroundImage: "linear-gradient(90deg, var(--color-sea-950) 0 9px, transparent 9px)",
  backgroundSize: "18px 7px",
  backgroundRepeat: "repeat-x",
  backgroundPosition: "6px center",
} as const;

function FilmEdge() {
  return <div aria-hidden className="h-4 bg-sea-800/90" style={SPROCKETS} />;
}

function ExampleBlock({ block }: { block: BlockOf<"example"> }) {
  return (
    <figure
      aria-label={`Example: ${plainText(block.title)}`}
      className="overflow-hidden rounded-2xl border border-sea-700 bg-sea-950/70 shadow-xl shadow-black/30"
    >
      <FilmEdge />
      <div className="border-y border-sea-700/70 bg-gradient-to-b from-sea-900/80 to-sea-900/40 px-5 py-5 sm:px-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-aegean-300 uppercase">
          <Clapperboard className="size-3.5" aria-hidden />
          Example
        </p>
        <p className="mt-1.5 font-display text-lg leading-snug font-semibold text-sea-100 sm:text-xl">
          <RichText text={block.title} />
        </p>
        {block.source ? (
          <p className="mt-0.5 text-sm text-sea-300 italic">
            <RichText text={block.source} />
          </p>
        ) : null}
        <div className="mt-4 space-y-4">
          <RichText text={block.body} paragraphs className="text-[0.98rem] leading-7 text-sea-200" />
        </div>
      </div>
      <FilmEdge />
    </figure>
  );
}

function QuoteBlock({ block }: { block: BlockOf<"quote"> }) {
  return (
    <figure className="relative py-3 pr-2 pl-8 sm:pl-12">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 font-display text-7xl leading-none text-bronze-500/40 select-none sm:text-8xl"
      >
        &ldquo;
      </span>
      <blockquote className="font-display text-[1.45rem] leading-snug text-balance text-sea-100 italic sm:text-[1.75rem]">
        <RichText text={block.text} />
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 text-sm font-medium tracking-wide text-bronze-300">
        <span aria-hidden className="h-px w-8 bg-bronze-500/60" />
        <RichText text={block.attribution} />
      </figcaption>
    </figure>
  );
}

function CompareBlock({ block }: { block: BlockOf<"compare"> }) {
  const weakLabel = block.weakLabel ?? "Weaker";
  const strongLabel = block.strongLabel ?? "Stronger";
  return (
    <figure aria-label={`${weakLabel} versus ${strongLabel}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-wine-500/35 bg-wine-600/[0.08] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-wine-400 uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-wine-500/20">
              <X className="size-3" aria-hidden />
            </span>
            {weakLabel}
          </p>
          <div className="mt-3 space-y-3">
            <RichText text={block.weak} paragraphs className="text-[0.98rem] leading-7 text-sea-300" />
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/[0.07] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="size-3" aria-hidden />
            </span>
            {strongLabel}
          </p>
          <div className="mt-3 space-y-3">
            <RichText text={block.strong} paragraphs className="text-[0.98rem] leading-7 text-sea-100" />
          </div>
        </div>
      </div>
      {block.note ? (
        <p className="mt-3 flex gap-2.5 px-1 text-sm leading-6 text-sea-300">
          <ArrowRight className="mt-1 size-4 shrink-0 text-bronze-400" aria-hidden />
          <span>
            <RichText text={block.note} />
          </span>
        </p>
      ) : null}
    </figure>
  );
}

/** Beats laid out horizontally (on wider screens) when there are few enough to fit. */
const MAX_HORIZONTAL_BEATS = 5;

function BeatsBlock({ block, id }: { block: BlockOf<"beats">; id: string }) {
  const framework = block.frameworkId ? FRAMEWORKS[block.frameworkId] : undefined;
  const title = block.title ?? framework?.name ?? "The beats";
  const horizontal = block.beats.length > 1 && block.beats.length <= MAX_HORIZONTAL_BEATS;
  return (
    <figure aria-labelledby={id} className="rounded-2xl border border-sea-700/80 bg-sea-900/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-bronze-400 uppercase">Beat map</p>
          <h3 id={id} className="mt-1 font-display text-lg font-semibold text-sea-100 sm:text-xl">
            <RichText text={title} />
          </h3>
        </div>
        {framework ? (
          <Link
            href={`/lab/story?framework=${framework.id}`}
            title={`${framework.origin}. Best for: ${framework.bestFor}.`}
            className="inline-flex items-center gap-1.5 rounded-full border border-aegean-500/40 bg-aegean-500/10 px-3 py-1 text-xs font-medium text-aegean-300 transition-colors hover:border-aegean-400 hover:bg-aegean-500/20"
          >
            <FlaskConical className="size-3.5" aria-hidden />
            {framework.name}
            <span className="sr-only">: map your own story with this framework in Story Lab</span>
          </Link>
        ) : null}
      </div>
      {framework && block.title ? <p className="mt-1 text-sm text-sea-300">{framework.origin}</p> : null}

      <ol role="list" className={cn("mt-5", horizontal ? "sm:grid sm:auto-cols-fr sm:grid-flow-col sm:gap-4" : undefined)}>
        {block.beats.map((beat, i) => {
          const last = i === block.beats.length - 1;
          return (
            <li
              key={`${beat.name}-${i}`}
              className={cn("relative flex gap-4", last ? undefined : "pb-6", horizontal ? "sm:flex-col sm:gap-3 sm:pb-0" : undefined)}
            >
              {last ? null : (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-9 bottom-1 left-[15px] w-px bg-gradient-to-b from-bronze-500/50 to-sea-600",
                    horizontal
                      ? "sm:top-[15px] sm:right-[-0.75rem] sm:bottom-auto sm:left-10 sm:h-px sm:w-auto sm:bg-gradient-to-r"
                      : undefined,
                  )}
                />
              )}
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-bronze-500/50 bg-sea-900 font-display text-sm font-bold text-bronze-300">
                {i + 1}
              </span>
              <div className="min-w-0 pt-1 sm:pt-0.5">
                <p className="font-semibold text-sea-100">
                  <RichText text={beat.name} />
                </p>
                <p className="mt-1 text-sm leading-6 text-sea-300">
                  <RichText text={beat.description} />
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
