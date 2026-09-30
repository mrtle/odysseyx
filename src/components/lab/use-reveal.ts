"use client";

import { useEffect, useRef } from "react";

/**
 * When `trigger` changes to a truthy value, scroll the returned element into
 * view and move keyboard focus to it — so a result that appears below the
 * form is announced and reachable.
 */
export function useRevealOnChange<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    ref.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    ref.current.focus({ preventScroll: true });
  }, [trigger]);
  return ref;
}
