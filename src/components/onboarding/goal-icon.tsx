import { Clapperboard, Feather, Mic, PenLine, Rocket, Video, type LucideIcon } from "lucide-react";
import type { GoalIconName } from "@/lib/goals";

const ICONS: Record<GoalIconName, LucideIcon> = {
  clapperboard: Clapperboard,
  "pen-line": PenLine,
  video: Video,
  rocket: Rocket,
  mic: Mic,
  feather: Feather,
};

export function GoalIcon({ icon, className }: { icon: GoalIconName; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
