"use client";

import { useMemo } from "react";
import { ScrollText } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EXPERIENCES, GOALS, preferredSkillsFor } from "@/lib/goals";
import { computeStreak } from "@/lib/progress";
import { useAppStore } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { recommendFromCatalog, type Catalog } from "./catalog";
import { DailyChallenge } from "./daily-challenge";
import { greetingFor, useNow, useSkillProfile } from "./hooks";
import { LabQuickStart } from "./lab-quick-start";
import { RankCard } from "./rank-card";
import { RecentActivity, buildActivity } from "./recent-activity";
import { SkillChartCard } from "./skill-chart-card";
import { TodaysCourse } from "./todays-course";

/** The returning learner's home: standing, today's course, the daily challenge and recent work. */
export function Dashboard({ catalog, profile }: { catalog: Catalog; profile: Profile }) {
  const now = useNow(60_000);
  const xp = useAppStore((s) => s.xp);
  const activityDates = useAppStore((s) => s.activityDates);
  const lessonProgress = useAppStore((s) => s.lessonProgress);
  const sessions = useAppStore((s) => s.sessions);
  const labEntries = useAppStore((s) => s.labEntries);

  const { profile: skillProfile, observations } = useSkillProfile(catalog.lessonSkills);
  const streak = computeStreak(activityDates, now);
  const recommendation = useMemo(
    () => recommendFromCatalog(skillProfile, catalog, lessonProgress, preferredSkillsFor(profile.goal)),
    [skillProfile, catalog, lessonProgress, profile.goal],
  );
  const activity = useMemo(() => buildActivity(sessions, labEntries, catalog), [sessions, labEntries, catalog]);

  const totalLessons = catalog.tracks.reduce((n, t) => n + t.lessons.length, 0);
  const lessonsCompleted = catalog.tracks.reduce(
    (n, t) => n + t.lessons.filter((l) => lessonProgress[`${l.trackId}/${l.id}`]).length,
    0,
  );
  const goal = GOALS[profile.goal];
  const firstName = profile.name.trim().split(/\s+/)[0] || "Captain";
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={dateLabel}
        title={`${greetingFor(now)}, ${firstName}.`}
        description={
          <>
            {goal ? goal.label : "Storyteller"}
            {EXPERIENCES[profile.experience] ? ` · ${EXPERIENCES[profile.experience].label}` : ""}
            {profile.project ? (
              <>
                <span className="text-sea-500"> · </span>
                <span className="text-sea-200">Working on &ldquo;{profile.project}&rdquo;</span>
              </>
            ) : null}
          </>
        }
        actions={
          <ButtonLink href="/progress" variant="secondary" icon={<ScrollText className="size-4" aria-hidden />}>
            Captain&apos;s log
          </ButtonLink>
        }
      />

      <RankCard xp={xp} streak={streak} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <TodaysCourse recommendation={recommendation} lessonsCompleted={lessonsCompleted} totalLessons={totalLessons} />
          <DailyChallenge />
          <RecentActivity items={activity} />
        </div>
        <aside className="min-w-0 space-y-8" aria-label="Skills and tools">
          <SkillChartCard profile={skillProfile} observations={observations} />
          <LabQuickStart />
        </aside>
      </div>
    </div>
  );
}
