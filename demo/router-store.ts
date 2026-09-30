/**
 * Hash-based location for the static demo build: "#/learn/foundations?x=1"
 * is the path "/learn/foundations" with search "?x=1". A bare fragment
 * ("#exercise") is an in-page anchor, not a route change.
 */

export interface DemoLocation {
  pathname: string;
  search: string;
  /** Fragment inside the route, without "#" ("" when none). */
  fragment: string;
}

const BASE = "http://odysseusx.local";

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function parseRoute(raw: string): DemoLocation {
  const url = new URL(raw, BASE);
  return { pathname: normalizePath(url.pathname), search: url.search, fragment: url.hash.slice(1) };
}

function readHash(): DemoLocation {
  const hash = window.location.hash;
  return hash.startsWith("#/") ? parseRoute(hash.slice(1)) : parseRoute("/");
}

function toHash(loc: DemoLocation): string {
  return `#${loc.pathname}${loc.search}${loc.fragment ? `#${loc.fragment}` : ""}`;
}

let current: DemoLocation = typeof window === "undefined" ? parseRoute("/") : readHash();
const listeners = new Set<() => void>();

function emit(next: DemoLocation) {
  current = next;
  listeners.forEach((fn) => fn());
}

export function subscribeLocation(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLocation(): DemoLocation {
  return current;
}

export function scrollToFragment(id: string) {
  const target = document.getElementById(decodeURIComponent(id));
  if (target) target.scrollIntoView({ block: "start" });
}

/** Navigate to an app path ("/learn", "../x", "/lab?from=1#notes") or scroll to a bare "#fragment". */
export function navigate(href: string, { replace = false }: { replace?: boolean } = {}) {
  if (href.startsWith("#")) {
    scrollToFragment(href.slice(1));
    return;
  }
  const next = parseRoute(new URL(href, `${BASE}${current.pathname}${current.search}`).href.slice(BASE.length));
  const hash = toHash(next);
  try {
    if (replace) window.history.replaceState(null, "", hash);
    else window.history.pushState(null, "", hash);
  } catch {
    // Some sandboxed frames refuse history writes; the in-memory location still updates.
  }
  const samePage = next.pathname === current.pathname && next.search === current.search;
  emit(next);
  if (next.fragment) requestAnimationFrame(() => scrollToFragment(next.fragment));
  else if (!samePage) window.scrollTo(0, 0);
}

if (typeof window !== "undefined") {
  const sync = () => {
    const hash = window.location.hash;
    if (hash && !hash.startsWith("#/")) {
      // A plain in-page anchor: scroll to it and keep the current route in the URL.
      const id = hash.slice(1);
      try {
        window.history.replaceState(null, "", toHash(current));
      } catch {
        // ignore
      }
      scrollToFragment(id);
      return;
    }
    const next = readHash();
    if (next.pathname !== current.pathname || next.search !== current.search || next.fragment !== current.fragment) {
      emit(next);
      window.scrollTo(0, 0);
    }
  };
  window.addEventListener("hashchange", sync);
  window.addEventListener("popstate", sync);
}
