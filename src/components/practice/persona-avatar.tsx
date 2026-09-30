import type { Persona, ScenarioCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "./category";

const SIZES = {
  sm: "size-8 rounded-lg text-base",
  md: "size-11 rounded-xl text-xl",
  lg: "size-16 rounded-2xl text-3xl",
} as const;

/** The persona's emoji on a tile tinted by the drill's category. Decorative: pair it with the name. */
export function PersonaAvatar({
  persona,
  category,
  size = "md",
  className,
}: {
  persona: Pick<Persona, "avatar">;
  category: ScenarioCategory;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-br ring-1 select-none",
        CATEGORY_META[category].tile,
        SIZES[size],
        className,
      )}
    >
      {persona.avatar}
    </span>
  );
}
