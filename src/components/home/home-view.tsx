"use client";

import { useEffect } from "react";
import { Skeleton } from "@/components/ui/loading";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { Catalog } from "./catalog";
import { Dashboard } from "./dashboard";
import { writeProfileCookie } from "./profile-cookie";
import { Welcome } from "./welcome";

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your voyage" className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40 rounded-md" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Welcome for newcomers, the dashboard for returning learners.
 *
 * Before the store has hydrated, `profileHint` (from the `ox_profile` cookie)
 * picks what the server renders: the full Welcome page for newcomers, a
 * dashboard skeleton for returning learners. Saved progress has the final
 * say, and the cookie is re-synced to it whenever they disagree.
 */
export function HomeView({ catalog, profileHint = false }: { catalog: Catalog; profileHint?: boolean }) {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  const xp = useAppStore((s) => s.xp);
  const hasProfile = profile !== null;

  useEffect(() => {
    if (hydrated) writeProfileCookie(hasProfile);
  }, [hydrated, hasProfile]);

  if (!hydrated) return profileHint ? <HomeSkeleton /> : <Welcome />;
  if (!profile) return <Welcome existingXp={xp} />;
  return <Dashboard catalog={catalog} profile={profile} />;
}
