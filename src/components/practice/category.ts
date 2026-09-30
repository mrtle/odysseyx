import { Clapperboard, Drama, Mic, NotebookPen, Presentation, type LucideIcon } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type { ScenarioCategory } from "@/lib/types";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  badge: BadgeTone;
  /** Avatar tile gradient + ring. */
  tile: string;
}

export const CATEGORY_META: Record<ScenarioCategory, CategoryMeta> = {
  pitch: {
    label: "Pitch",
    icon: Presentation,
    badge: "bronze",
    tile: "from-bronze-400/30 to-bronze-700/10 ring-bronze-400/30",
  },
  oral: {
    label: "Oral",
    icon: Mic,
    badge: "aegean",
    tile: "from-aegean-400/30 to-aegean-500/5 ring-aegean-400/30",
  },
  directing: {
    label: "Directing",
    icon: Clapperboard,
    badge: "wine",
    tile: "from-wine-400/30 to-wine-600/10 ring-wine-400/30",
  },
  "writers-room": {
    label: "Writers' room",
    icon: NotebookPen,
    badge: "neutral",
    tile: "from-violet-400/25 to-violet-700/10 ring-violet-400/30",
  },
  craft: {
    label: "Craft",
    icon: Drama,
    badge: "success",
    tile: "from-emerald-400/25 to-emerald-700/10 ring-emerald-400/30",
  },
};

export const CATEGORY_ORDER: ScenarioCategory[] = ["pitch", "oral", "directing", "writers-room", "craft"];

export const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = {
  1: "Warm-up",
  2: "Intermediate",
  3: "Advanced",
};
