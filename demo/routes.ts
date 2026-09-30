/**
 * The app's pages, matched by path for the static demo build.
 */
import type { ReactNode } from "react";
import * as Home from "@/app/page";
import * as Learn from "@/app/learn/page";
import * as Track from "@/app/learn/[trackId]/page";
import * as Lesson from "@/app/learn/[trackId]/[lessonId]/page";
import * as Practice from "@/app/practice/page";
import * as Scenario from "@/app/practice/[scenarioId]/page";
import * as Review from "@/app/practice/review/[sessionId]/page";
import * as Lab from "@/app/lab/page";
import * as Logline from "@/app/lab/logline/page";
import * as Story from "@/app/lab/story/page";
import * as Shots from "@/app/lab/shots/page";
import * as Entry from "@/app/lab/entry/[id]/page";
import * as Onboarding from "@/app/onboarding/page";
import * as Progress from "@/app/progress/page";
import RootNotFound from "@/app/not-found";
import LearnNotFound from "@/app/learn/not-found";

export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

type PageFn = (props: PageProps) => ReactNode | Promise<ReactNode>;

interface PageModule {
  default: unknown;
  metadata?: { title?: unknown };
}

export interface DemoRoute {
  pattern: string;
  segments: string[];
  page: PageFn;
  title: string | null;
}

function route(pattern: string, mod: PageModule): DemoRoute {
  const title = typeof mod.metadata?.title === "string" ? mod.metadata.title : null;
  return { pattern, segments: pattern.split("/").filter(Boolean), page: mod.default as PageFn, title };
}

export const ROUTES: DemoRoute[] = [
  route("/", Home),
  route("/learn", Learn),
  route("/learn/:trackId", Track),
  route("/learn/:trackId/:lessonId", Lesson),
  route("/practice", Practice),
  route("/practice/review/:sessionId", Review),
  route("/practice/:scenarioId", Scenario),
  route("/lab", Lab),
  route("/lab/logline", Logline),
  route("/lab/story", Story),
  route("/lab/shots", Shots),
  route("/lab/entry/:id", Entry),
  route("/onboarding", Onboarding),
  route("/progress", Progress),
];

export interface RouteMatch {
  route: DemoRoute;
  params: Record<string, string>;
}

export function matchRoute(pathname: string): RouteMatch | null {
  const parts = pathname.split("/").filter(Boolean);
  for (const candidate of ROUTES) {
    if (candidate.segments.length !== parts.length) continue;
    const params: Record<string, string> = {};
    const ok = candidate.segments.every((segment, i) => {
      if (segment.startsWith(":")) {
        params[segment.slice(1)] = parts[i];
        return true;
      }
      return segment === parts[i];
    });
    if (ok) return { route: candidate, params };
  }
  return null;
}

export { LearnNotFound, RootNotFound };
