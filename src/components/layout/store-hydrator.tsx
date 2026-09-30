"use client";

import { useEffect } from "react";
import { handleStorageEvent, useAppStore } from "@/lib/store";

/**
 * Reads persisted progress from localStorage after the first render, and
 * re-reads it whenever another tab saves, so open tabs stay in step.
 */
export function StoreHydrator() {
  useEffect(() => {
    void useAppStore.persist.rehydrate();
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, []);
  return null;
}
