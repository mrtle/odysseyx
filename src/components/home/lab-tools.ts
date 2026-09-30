/**
 * Story Lab tool names, routes and icons for Home and Progress.
 */
import { Clapperboard, ScrollText, Stethoscope, type LucideIcon } from "lucide-react";
import type { LabEntry, LabToolId } from "@/lib/types";

export interface LabToolLink {
  id: LabToolId;
  name: string;
  href: string;
  blurb: string;
  icon: LucideIcon;
  /** Static Tailwind classes for the icon tile. */
  tile: string;
}

export const LAB_TOOL_LINKS: Record<LabToolId, LabToolLink> = {
  logline: {
    id: "logline",
    name: "Logline Doctor",
    href: "/lab/logline",
    blurb: "Six vital signs and three rewrites for your one-sentence pitch.",
    icon: Stethoscope,
    tile: "bg-bronze-500/15 text-bronze-300",
  },
  story: {
    id: "story",
    name: "Story Doctor",
    href: "/lab/story",
    blurb: "A beat-by-beat structure read with line notes and a revision plan.",
    icon: ScrollText,
    tile: "bg-aegean-500/15 text-aegean-300",
  },
  shots: {
    id: "shots",
    name: "Shot Planner",
    href: "/lab/shots",
    blurb: "Turn a scene into a shot list, with the why behind every setup.",
    icon: Clapperboard,
    tile: "bg-wine-500/15 text-wine-400",
  },
};

export const LAB_TOOL_LIST: LabToolLink[] = [LAB_TOOL_LINKS.logline, LAB_TOOL_LINKS.story, LAB_TOOL_LINKS.shots];

/** The 0–100 score for a lab entry, or null for tools that don't score (shot plans). */
export function labEntryScore(entry: LabEntry): number | null {
  return entry.tool === "shots" ? null : entry.result.overall;
}

/** A short summary for entries without a score. */
export function labEntrySummary(entry: LabEntry): string {
  if (entry.tool === "shots") {
    const n = entry.result.shots.length;
    return `${n} shot${n === 1 ? "" : "s"}`;
  }
  return `${entry.result.overall}/100`;
}
