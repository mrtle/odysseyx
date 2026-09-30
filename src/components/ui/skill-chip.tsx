import { SKILLS, type SkillId } from "@/lib/skills";
import { cn } from "@/lib/utils";

export function SkillChip({ skill, className }: { skill: SkillId; className?: string }) {
  return (
    <span
      title={SKILLS[skill].description}
      className={cn(
        "inline-flex items-center rounded-md border border-sea-600/80 bg-sea-800/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-sea-200",
        className,
      )}
    >
      {SKILLS[skill].short}
    </span>
  );
}
