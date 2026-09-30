/**
 * Display metadata for the Story Lab: tool cards, story formats, beat
 * statuses and logline components. Pure data — safe for server and client.
 */
import { Clapperboard, ScrollText, Stethoscope, type LucideIcon } from "lucide-react";
import type { BeatStatus, LoglineComponent, StoryFormat } from "@/lib/ai/schemas";
import type { LabEntry, LabToolId } from "@/lib/types";

export interface LabToolMeta {
  id: LabToolId;
  name: string;
  href: string;
  tagline: string;
  description: string;
  outputs: string[];
  /** What the user pastes in, for copy like "Original logline". */
  inputNoun: string;
  icon: LucideIcon;
  /** Static Tailwind classes for the tool's accent. */
  accent: { tile: string; text: string; glow: string; border: string };
}

export const LAB_TOOLS: Record<LabToolId, LabToolMeta> = {
  logline: {
    id: "logline",
    name: "Logline Doctor",
    href: "/lab/logline",
    tagline: "One sentence, six vital signs",
    description:
      "Paste your logline and get it scored on protagonist, goal, obstacle, stakes, hook and specificity — with three rewrites that keep your story.",
    outputs: ["Six vital signs, scored out of 10", "Three rewrites, each from a different angle", "Questions to answer before the next draft"],
    inputNoun: "logline",
    icon: Stethoscope,
    accent: {
      tile: "bg-gradient-to-br from-bronze-300 to-bronze-600 text-sea-950",
      text: "text-bronze-300",
      glow: "from-bronze-400/25",
      border: "hover:border-bronze-500/50",
    },
  },
  story: {
    id: "story",
    name: "Story Doctor",
    href: "/lab/story",
    tagline: "A story editor's read, beat by beat",
    description:
      "Map a story, treatment or scene onto a structure framework — see which beats land, which are missing, and exactly which lines to revise.",
    outputs: ["An interactive beat map", "Skill scores and line-by-line notes", "A step-by-step revision plan"],
    inputNoun: "story",
    icon: ScrollText,
    accent: {
      tile: "bg-gradient-to-br from-aegean-300 to-aegean-500 text-sea-950",
      text: "text-aegean-300",
      glow: "from-aegean-400/25",
      border: "hover:border-aegean-400/50",
    },
  },
  shots: {
    id: "shots",
    name: "Shot Planner",
    href: "/lab/shots",
    tagline: "From the page to the call sheet",
    description:
      "Turn a scene into coverage a crew could shoot — sizes, angles, movement and lenses, each with a storytelling reason — plus notes on your own shot ideas.",
    outputs: ["A shot list with purpose, lens and sound", "Visual concept and coverage notes", "Export as text or CSV"],
    inputNoun: "scene",
    icon: Clapperboard,
    accent: {
      tile: "bg-gradient-to-br from-wine-400 to-wine-600 text-sea-100",
      text: "text-wine-400",
      glow: "from-wine-500/25",
      border: "hover:border-wine-400/50",
    },
  },
};

export const LAB_TOOL_LIST: LabToolMeta[] = [LAB_TOOLS.logline, LAB_TOOLS.story, LAB_TOOLS.shots];

export const STORY_FORMAT_OPTIONS: Record<StoryFormat, { label: string; hint: string }> = {
  "personal-story": { label: "Personal story", hint: "A true story told in first person — for the stage, a video or an essay." },
  "short-film": { label: "Short film", hint: "A script, outline or treatment for a 5–20 minute film." },
  feature: { label: "Feature treatment", hint: "An outline or treatment for a feature-length film." },
  "tv-episode": { label: "TV episode", hint: "An episode outline with act breaks and A/B stories." },
  scene: { label: "Single scene", hint: "One scene — beats compress into moments, looks and lines." },
  pitch: { label: "Pitch", hint: "A spoken or written pitch meant to be heard once and remembered." },
  "brand-story": { label: "Brand or founder story", hint: "Your company's origin, a customer story, or a brand narrative." },
};

export const BEAT_STATUS_META: Record<BeatStatus, { label: string; description: string; marker: string; text: string; badge: string }> = {
  strong: {
    label: "Strong",
    description: "Clearly present and doing its job",
    marker: "border-emerald-300 bg-emerald-400 text-sea-950",
    text: "text-emerald-300",
    badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  },
  present: {
    label: "Present",
    description: "There, but underpowered",
    marker: "border-aegean-300 bg-aegean-500 text-sea-950",
    text: "text-aegean-300",
    badge: "border-aegean-500/40 bg-aegean-500/10 text-aegean-300",
  },
  weak: {
    label: "Weak",
    description: "Only gestured at, or doing the wrong job",
    marker: "border-amber-300 bg-amber-400/15 text-amber-200",
    text: "text-amber-200",
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  missing: {
    label: "Missing",
    description: "Nothing in the draft serves this beat yet",
    marker: "border-dashed border-wine-400 bg-sea-950 text-wine-400",
    text: "text-wine-400",
    badge: "border-wine-500/50 bg-wine-600/15 text-wine-400",
  },
};

export const LOGLINE_COMPONENT_META: Record<LoglineComponent, { label: string; question: string }> = {
  protagonist: { label: "Protagonist", question: "Who is this about — a castable person, not a placeholder?" },
  goal: { label: "Goal", question: "What do they actively set out to do?" },
  obstacle: { label: "Obstacle", question: "Who or what fights back?" },
  stakes: { label: "Stakes", question: "What do they lose if they fail?" },
  hook: { label: "Hook & irony", question: "What makes this premise impossible to ignore?" },
  specificity: { label: "Specificity", question: "Could this only be your story?" },
};

export const GENRE_SUGGESTIONS = [
  "Thriller",
  "Drama",
  "Comedy",
  "Horror",
  "Science fiction",
  "Fantasy",
  "Romance",
  "Crime",
  "Action-adventure",
  "Coming-of-age",
  "Documentary",
  "Animation",
] as const;

/** The logline length window worth aiming for. */
export const LOGLINE_IDEAL_WORDS = { min: 20, max: 45 } as const;

export function entryHref(id: string): string {
  return `/lab/entry/${encodeURIComponent(id)}`;
}

/** Link to a tool, optionally pre-filled from a saved entry ("Run again"). */
export function toolHref(tool: LabToolId, fromEntryId?: string): string {
  return fromEntryId ? `${LAB_TOOLS[tool].href}?from=${encodeURIComponent(fromEntryId)}` : LAB_TOOLS[tool].href;
}

/** A 0–100 score for the history list, or null for tools without one. */
export function entryScore(entry: LabEntry): number | null {
  return entry.tool === "shots" ? null : entry.result.overall;
}

/** A short title from the first words of a piece of writing (a slugline becomes "Lighthouse Kitchen — Night"). */
export function deriveTitle(text: string, maxWords = 8): string {
  const firstLine = text.trim().split(/\n/).find((l) => l.trim().length > 0)?.trim() ?? "";
  const slug = firstLine.match(/^(?:INT\.?\/EXT\.?|EXT\.?\/INT\.?|I\/E\.?|INT\.|EXT\.)\s*(.+)$/i);
  if (slug) {
    // Keep only the heading when action shares the line: "LIGHTHOUSE - NIGHT The lamp room…" → "LIGHTHOUSE - NIGHT".
    const timeOfDay = slug[1].match(/^(.*?\s[-–—]\s*(?:DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|SUNSET|SUNRISE|CONTINUOUS|LATER|SAME TIME)\b)/i);
    const sentenceEnd = slug[1].match(/^(.*?)[.!?]\s/);
    let heading = (timeOfDay?.[1] ?? sentenceEnd?.[1] ?? slug[1]).trim();
    const headingWords = heading.split(/\s+/);
    if (headingWords.length > maxWords) heading = headingWords.slice(0, maxWords).join(" ");
    return heading
      .toLowerCase()
      .replace(/\s+[-–—]\s+/g, " — ")
      .replace(/(^|[\s(/-])([a-z])/g, (_, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`)
      .replace(/\b(\d+)\s?([ap])\.?m\.?(?=\s|$)/gi, (_, n: string, ap: string) => `${n} ${ap.toUpperCase()}.M.`)
      .trim();
  }
  const clean = firstLine.replace(/\s+/g, " ");
  const words = clean.split(" ").filter(Boolean);
  if (words.length === 0) return "Untitled";
  const head = words.slice(0, maxWords).join(" ").replace(/[,;:—–-]+$/, "");
  return words.length > maxWords ? `${head}…` : head;
}
