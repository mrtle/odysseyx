"use client";

import { BookOpen, FlaskConical, Sailboat, Sparkles, Swords, type LucideIcon } from "lucide-react";
import type { Catalog } from "@/components/home/catalog";
import { useNow, useSkillProfile } from "@/components/home/hooks";
import { formatXp } from "@/components/home/rank-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { computeStreak } from "@/lib/progress";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { StreakCard } from "./activity-heatmap";
import { DataControls } from "./data-controls";
import { DailyHistory, LabHistory, PracticeHistory } from "./history";
import { ProfileSettings } from "./profile-settings";
import { RankLadder } from "./rank-ladder";
import { SkillsSection } from "./skills-section";
import { TrackProgress } from "./track-progress";
import { XpLog } from "./xp-log";

const HEADER = {
  eyebrow: "Progress",
  title: "Captain's log",
  description:
    "Every lesson, drill and draft, charted — where your storytelling is strong, and where the next voyage should take you.",
};

function ProgressSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your log" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-sea-700/80 bg-sea-900/60 p-4 shadow-xl shadow-black/20">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sea-400 uppercase">
        <Icon className="size-3.5 text-bronze-400" aria-hidden /> {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold text-sea-100">{value}</p>
      <p className="text-xs text-sea-400">{detail}</p>
    </div>
  );
}

/** The full captain's log: rank, streak, skills, lessons, history, settings and data. */
export function ProgressView({ catalog }: { catalog: Catalog }) {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const hasActivity = useAppStore((s) => s.activityDates.length > 0 || s.xp > 0);

  return (
    <div className="animate-fade-in">
      <PageHeader {...HEADER} />
      {!hydrated ? (
        <ProgressSkeleton />
      ) : !profile && !hasActivity ? (
        <EmptyState
          icon={<Sailboat className="size-8" aria-hidden />}
          title="The log is empty — for now"
          description="Set your course and every lesson, drill, analysis and daily challenge will be charted here."
          action={<ButtonLink href="/onboarding">Begin your voyage</ButtonLink>}
        />
      ) : (
        <ProgressLog catalog={catalog} />
      )}
    </div>
  );
}

export function ProgressLog({ catalog }: { catalog: Catalog }) {
  const now = useNow(60_000);
  const profile = useAppStore((s) => s.profile);
  const xp = useAppStore((s) => s.xp);
  const xpLog = useAppStore((s) => s.xpLog);
  const activityDates = useAppStore((s) => s.activityDates);
  const lessonProgress = useAppStore((s) => s.lessonProgress);
  const sessions = useAppStore((s) => s.sessions);
  const labEntries = useAppStore((s) => s.labEntries);
  const daily = useAppStore((s) => s.daily);
  const { profile: skillProfile } = useSkillProfile(catalog.lessonSkills);
  const streak = computeStreak(activityDates, now);

  const totalLessons = catalog.tracks.reduce((n, t) => n + t.lessons.length, 0);
  const lessonsDone = Object.keys(lessonProgress).length;
  const drillsScored = sessions.filter((s) => s.evaluation).length;
  const dailyDone = Object.values(daily).filter((d) => d.feedback).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Sparkles}
          label="Experience"
          value={`${formatXp(xp)} XP`}
          detail={`${xpLog.length > 0 ? xpLog.length : "No"} XP events logged`}
        />
        <StatTile
          icon={BookOpen}
          label="Lessons"
          value={String(lessonsDone)}
          detail={totalLessons > 0 ? `of ${totalLessons} complete` : "complete"}
        />
        <StatTile icon={Swords} label="Drills" value={String(drillsScored)} detail="scored rehearsals" />
        <StatTile
          icon={FlaskConical}
          label="Lab & daily"
          value={String(labEntries.length + dailyDone)}
          detail={`${labEntries.length} analyses · ${dailyDone} dailies`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <RankLadder xp={xp} className="lg:col-span-2" />
        <StreakCard streak={streak} activityDates={activityDates} xpLog={xpLog} today={now} className="lg:col-span-3" />
      </div>

      <SkillsSection profile={skillProfile} />

      <TrackProgress catalog={catalog} lessonProgress={lessonProgress} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PracticeHistory sessions={sessions} catalog={catalog} />
        <LabHistory labEntries={labEntries} catalog={catalog} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyHistory daily={daily} />
        <XpLog xpLog={xpLog} catalog={catalog} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {profile ? (
          <ProfileSettings profile={profile} />
        ) : (
          <EmptyState
            title="No profile yet"
            description="Tell the coach your goal and level so feedback fits the stories you tell."
            action={<ButtonLink href="/onboarding?from=progress">Set up your profile</ButtonLink>}
          />
        )}
        <DataControls />
      </div>
    </div>
  );
}
