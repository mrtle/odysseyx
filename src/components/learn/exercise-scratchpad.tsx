"use client";

import { useId, useState } from "react";
import { NotebookPen, Eraser } from "lucide-react";
import { RichText } from "@/components/ui/rich-text";
import { cn, wordCount } from "@/lib/utils";

/**
 * An inline "try it now" exercise inside a lesson. Notes live only in
 * component state — a scratchpad, not a saved draft.
 */
export function ExerciseScratchpad({ prompt, placeholder }: { prompt: string; placeholder?: string }) {
  const id = useId();
  const [text, setText] = useState("");
  const words = wordCount(text);

  return (
    <div className="rounded-2xl border border-dashed border-bronze-500/40 bg-bronze-500/[0.04] p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-bronze-500/15 text-bronze-300">
          <NotebookPen className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-bronze-400 uppercase">Try it now</p>
          <label htmlFor={`${id}-input`} className="mt-1 block text-base leading-7 text-sea-100">
            <RichText text={prompt} />
          </label>
        </div>
      </div>
      <textarea
        id={`${id}-input`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Scribble your answer here…"}
        rows={4}
        aria-describedby={`${id}-hint`}
        className="field min-h-28 resize-y text-base leading-7"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-sea-300">
        <p id={`${id}-hint`}>Scratchpad only — notes aren&apos;t saved when you leave this page.</p>
        <div className="flex items-center gap-3">
          <span className={cn(words > 0 ? "text-sea-300" : undefined)}>
            {words} {words === 1 ? "word" : "words"}
          </span>
          {text ? (
            <button
              type="button"
              onClick={() => setText("")}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sea-300 transition-colors hover:bg-sea-800 hover:text-sea-100"
            >
              <Eraser className="size-3.5" aria-hidden />
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
