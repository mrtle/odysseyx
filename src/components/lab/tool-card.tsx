import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabToolMeta } from "./lab-meta";

/** A Story Lab tool on the hub: what it does, what you get, and a way in. */
export function ToolCard({ tool, index }: { tool: LabToolMeta; index: number }) {
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-sea-700/80 bg-sea-900/60 p-6 shadow-xl shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sea-900/80",
        tool.accent.border,
      )}
    >
      <span aria-hidden className={cn("pointer-events-none absolute -top-20 -right-16 size-48 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-70", tool.accent.glow)} />
      <div className="relative flex items-center justify-between gap-3">
        <span className={cn("flex size-12 items-center justify-center rounded-xl shadow-lg shadow-black/30", tool.accent.tile)} aria-hidden>
          <Icon className="size-6" />
        </span>
        <span className="font-display text-sm text-sea-500" aria-hidden>
          {["I", "II", "III"][index] ?? index + 1}
        </span>
      </div>
      <p className={cn("relative mt-5 text-xs font-semibold tracking-[0.18em] uppercase", tool.accent.text)}>{tool.tagline}</p>
      <h3 className="relative mt-1 font-display text-2xl font-semibold text-sea-100">{tool.name}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-sea-300">{tool.description}</p>
      <ul className="relative mt-4 space-y-1.5 text-sm text-sea-200">
        {tool.outputs.map((o) => (
          <li key={o} className="flex gap-2">
            <Check className={cn("mt-0.5 size-4 shrink-0", tool.accent.text)} aria-hidden />
            <span>{o}</span>
          </li>
        ))}
      </ul>
      <span className="relative mt-auto flex items-center gap-1.5 pt-6 text-sm font-semibold text-sea-100 group-hover:text-bronze-200">
        Open the {tool.name}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
    </Link>
  );
}
