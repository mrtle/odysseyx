import { TrackIconGlyph } from "@/components/ui/track-icon";
import type { TrackIcon } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { tile: "size-10 rounded-xl", icon: "size-5" },
  md: { tile: "size-12 rounded-2xl", icon: "size-6" },
  lg: { tile: "size-16 rounded-2xl sm:size-20 sm:rounded-3xl", icon: "size-8 sm:size-9" },
} as const;

/** A track's icon on its accent gradient (track.accent holds Tailwind `from-… to-…` classes). */
export function AccentTile({
  icon,
  accent,
  size = "md",
  className,
}: {
  icon: TrackIcon;
  accent: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center bg-gradient-to-br text-sea-950 shadow-lg shadow-black/40 ring-1 ring-white/15",
        accent,
        s.tile,
        className,
      )}
    >
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/25 to-transparent opacity-70" />
      <TrackIconGlyph icon={icon} className={cn("relative", s.icon)} />
    </span>
  );
}

/** A soft blurred glow in the track's accent, for page headers and banners. */
export function AccentGlow({ accent, className }: { accent: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full bg-gradient-to-br opacity-20 blur-3xl", accent, className)}
    />
  );
}
