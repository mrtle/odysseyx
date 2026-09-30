"use client";

/**
 * Client-side helpers for calling the coach API routes.
 */
import type { CoachProfile } from "@/lib/ai/schemas";
import type { CoachMode, Profile } from "@/lib/types";
import { readError } from "@/lib/utils";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** POST JSON and return the parsed response, throwing ApiError with the server's message on failure. */
export async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Couldn't reach the coach. Check your connection and try again.", 0);
  }
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return (await res.json()) as T;
}

/** The mode header set by streaming routes. */
export function modeFromResponse(res: Response): CoachMode {
  return res.headers.get("x-odysseusx-mode") === "live" ? "live" : "demo";
}

/** The subset of the profile sent to the server for personalisation. */
export function toCoachProfile(profile: Profile | null | undefined): CoachProfile | undefined {
  if (!profile) return undefined;
  return { name: profile.name.slice(0, 80), goal: profile.goal, experience: profile.experience };
}
