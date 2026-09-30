import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LAB_TOOL_LIST } from "./lab-tools";

/** One-tap entry into the three Story Lab tools. */
export function LabQuickStart({ className }: { className?: string }) {
  return (
    <section aria-labelledby="lab-quick-start-heading" className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="lab-quick-start-heading" className="font-display text-xl font-semibold text-sea-100">
          Story Lab
        </h2>
        <Link href="/lab" className="-mx-2 -my-3 inline-flex items-center rounded-md px-2 py-3 text-sm font-medium text-bronze-300 hover:text-bronze-200">
          All tools
        </Link>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
        {LAB_TOOL_LIST.map((tool) => {
          const Icon = tool.icon;
          return (
            <li key={tool.id}>
              <Link
                href={tool.href}
                className="group flex h-full items-start gap-3 rounded-xl border border-sea-700/80 bg-sea-900/60 p-3.5 transition-colors hover:border-bronze-500/50 hover:bg-sea-900"
              >
                <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tool.tile)}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-sea-100 group-hover:text-bronze-200">
                    {tool.name}
                    <ArrowRight
                      className="size-3.5 shrink-0 text-sea-500 transition-transform group-hover:translate-x-0.5 group-hover:text-bronze-300"
                      aria-hidden
                    />
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-sea-400">{tool.blurb}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
