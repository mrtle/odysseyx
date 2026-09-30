import { Camera, Compass, Map, MessageSquare, Mic, Scissors, Users, type LucideIcon } from "lucide-react";
import type { TrackIcon } from "@/lib/types";

const ICONS: Record<TrackIcon, LucideIcon> = {
  compass: Compass,
  map: Map,
  users: Users,
  "message-square": MessageSquare,
  camera: Camera,
  scissors: Scissors,
  mic: Mic,
};

export function TrackIconGlyph({ icon, className }: { icon: TrackIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
