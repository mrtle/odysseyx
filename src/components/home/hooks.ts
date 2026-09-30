"use client";

/**
 * Client hooks shared by Home and Progress. Components using them render
 * only after the store has hydrated, so reading the clock here never causes
 * a server/client mismatch.
 */
import { useEffect, useMemo, useState } from "react";
import { collectSkillObservations, computeSkillProfile, type SkillStat } from "@/lib/progress";
import type { SkillId } from "@/lib/skills";
import { useAppStore } from "@/lib/store";

function currentTime(): Date {
  return new Date();
}

/** The current time, refreshed every `intervalMs`. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(currentTime);
  useEffect(() => {
    const id = window.setInterval(() => setNow(currentTime()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export interface SkillProfileResult {
  profile: Record<SkillId, SkillStat>;
  /** Total observations across all skills. */
  observations: number;
}

/** The learner's recency-weighted skill profile, from everything in the store. */
export function useSkillProfile(lessonSkills: Record<string, SkillId[]>): SkillProfileResult {
  const sessions = useAppStore((s) => s.sessions);
  const labEntries = useAppStore((s) => s.labEntries);
  const lessonProgress = useAppStore((s) => s.lessonProgress);
  const daily = useAppStore((s) => s.daily);
  return useMemo(() => {
    const observations = collectSkillObservations({ sessions, labEntries, lessonProgress, daily }, lessonSkills);
    return { profile: computeSkillProfile(observations), observations: observations.length };
  }, [sessions, labEntries, lessonProgress, daily, lessonSkills]);
}

/** "Good morning" / "Good afternoon" / "Good evening" for a local hour. */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 5 || hour >= 18) return "Good evening";
  return hour < 12 ? "Good morning" : "Good afternoon";
}
