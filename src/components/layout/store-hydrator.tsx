"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/** Reads persisted progress from localStorage once, after the first render. */
export function StoreHydrator() {
  useEffect(() => {
    void useAppStore.persist.rehydrate();
  }, []);
  return null;
}
