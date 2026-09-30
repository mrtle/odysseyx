"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, ChartLine, Flame, FlaskConical, House, Swords } from "lucide-react";
import { useAppStore, useHasHydrated } from "@/lib/store";
import { computeStreak, rankForXp } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { CoachModeBadge } from "./coach-status";
import { Logo } from "./logo";
import { StorageNotice } from "./storage-notice";

const NAV = [
  { href: "/", label: "Home", icon: House, match: (p: string) => p === "/" },
  { href: "/learn", label: "Learn", icon: BookOpen, match: (p: string) => p.startsWith("/learn") },
  { href: "/practice", label: "Practice", icon: Swords, match: (p: string) => p.startsWith("/practice") },
  { href: "/lab", label: "Story Lab", icon: FlaskConical, match: (p: string) => p.startsWith("/lab") },
  { href: "/progress", label: "Progress", icon: ChartLine, match: (p: string) => p.startsWith("/progress") },
] as const;

function RankAndStreak() {
  const hydrated = useHasHydrated();
  const xp = useAppStore((s) => s.xp);
  const activityDates = useAppStore((s) => s.activityDates);
  if (!hydrated) return <div className="h-8" />;
  const { rank, progress } = rankForXp(xp);
  const streak = computeStreak(activityDates);
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/progress"
        className="hidden items-center gap-2 rounded-full border border-sea-700 bg-sea-900/70 py-1 pr-3 pl-1 text-xs text-sea-200 hover:border-sea-500 sm:flex"
        title={`${xp.toLocaleString()} XP`}
        aria-label={`Rank ${rank.level}, ${rank.title}, ${xp.toLocaleString()} XP. View progress`}
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-bronze-500/20 font-display text-[11px] font-bold text-bronze-300">
          {rank.level}
        </span>
        <span className="font-medium">{rank.title}</span>
        <span className="h-1 w-12 overflow-hidden rounded-full bg-sea-700">
          <span className="block h-full bg-bronze-400" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      </Link>
      <span
        className={cn(
          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
          streak.activeToday
            ? "border-orange-400/40 bg-orange-500/10 text-orange-300"
            : "border-sea-700 bg-sea-900/70 text-sea-300",
        )}
        title={streak.activeToday ? "You practised today" : "Practise today to keep your streak"}
      >
        <Flame className="size-3.5" aria-hidden />
        {streak.current}
        <span className="sr-only">day streak</span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sea-800 bg-sea-950/80 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/" className="mb-10 px-2" aria-label="OdysseusX home">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-bronze-500/15 to-transparent text-bronze-300 ring-1 ring-bronze-500/25"
                    : "text-sea-300 hover:bg-sea-900 hover:text-sea-100",
                )}
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 px-2">
          <CoachModeBadge />
          <p className="text-xs leading-relaxed text-sea-400">
            &ldquo;Tell me, O Muse, of that ingenious hero…&rdquo;
            <br />— Homer, <em>The Odyssey</em>
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-sea-800/80 bg-sea-950/75 px-4 backdrop-blur-md sm:px-8">
          <Link href="/" className="lg:hidden" aria-label="OdysseusX home">
            <Logo compact />
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <CoachModeBadge />
            </div>
            <RankAndStreak />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-28 sm:px-8 lg:pb-16">
          <StorageNotice />
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sea-800 bg-sea-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-bronze-300" : "text-sea-400",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
