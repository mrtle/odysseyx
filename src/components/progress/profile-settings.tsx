"use client";

import { useId } from "react";
import { PencilLine, Volume2 } from "lucide-react";
import { GoalIcon } from "@/components/onboarding/goal-icon";
import { ButtonLink } from "@/components/ui/button";
import { SkillChip } from "@/components/ui/skill-chip";
import { EXPERIENCES, GOALS } from "@/lib/goals";
import { useAppStore } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SectionCard } from "./section-card";

/** The learner's profile at a glance, a link to edit it, and app settings. */
export function ProfileSettings({ profile, className }: { profile: Profile; className?: string }) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const id = useId();
  const goal = GOALS[profile.goal];
  const experience = EXPERIENCES[profile.experience];
  const since = new Date(profile.createdAt);

  return (
    <SectionCard
      id="profile-heading"
      title="Profile"
      description="Your coach tunes feedback to your goal and level."
      action={
        <ButtonLink
          href="/onboarding?from=progress"
          variant="secondary"
          size="sm"
          icon={<PencilLine className="size-3.5" aria-hidden />}
        >
          Edit profile
        </ButtonLink>
      }
      className={className}
    >
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-sea-400">Name</dt>
          <dd className="mt-1 font-medium text-sea-100">{profile.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sea-400">Goal</dt>
          <dd className="mt-1 flex items-center gap-2 text-sea-100">
            {goal ? (
              <>
                <GoalIcon icon={goal.icon} className="size-4 text-bronze-300" /> {goal.label}
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sea-400">Experience</dt>
          <dd className="mt-1 text-sea-100">{experience?.label ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-sea-400">Sailing since</dt>
          <dd className="mt-1 text-sea-100">
            {Number.isNaN(since.getTime())
              ? "—"
              : since.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
          </dd>
        </div>
        {goal ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-sea-400">Your course leans on</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {goal.preferredSkills.map((skill) => (
                <SkillChip key={skill} skill={skill} />
              ))}
            </dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-sea-400">Working on</dt>
          <dd className="mt-1 text-sea-100">{profile.project || <span className="text-sea-500">Nothing named yet</span>}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-sea-800 pt-4">
        <div className="min-w-0">
          <p id={`${id}-speak`} className="flex items-center gap-2 text-sm font-medium text-sea-100">
            <Volume2 className="size-4 text-sea-400" aria-hidden /> Read persona lines aloud
          </p>
          <p id={`${id}-speak-desc`} className="mt-0.5 text-xs text-sea-400">
            In practice drills, hear each reply in the persona&apos;s voice (where your browser supports it).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.autoSpeak}
          aria-labelledby={`${id}-speak`}
          aria-describedby={`${id}-speak-desc`}
          onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
            settings.autoSpeak ? "border-bronze-400 bg-bronze-500" : "border-sea-600 bg-sea-800",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "inline-block size-4 rounded-full bg-sea-100 shadow transition-transform",
              settings.autoSpeak ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
    </SectionCard>
  );
}
