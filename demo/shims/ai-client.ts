/**
 * Static-demo stand-in for "@/lib/ai/client". The demo build runs the API
 * routes in the browser without credentials, so every route takes its
 * offline demo-coach path and the Anthropic SDK is left out of the bundle.
 */
import type { CoachMode } from "@/lib/types";

export const MODEL = "claude-opus-5-5";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export function coachMode(): CoachMode {
  return "demo";
}

export type CoachErrorCode = "refusal" | "auth" | "rate_limit" | "unavailable" | "bad_request" | "bad_output" | "unknown";

export class CoachError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: CoachErrorCode,
  ) {
    super(message);
    this.name = "CoachError";
  }
}

export function toCoachError(err: unknown): CoachError {
  if (err instanceof CoachError) return err;
  return new CoachError("Something went wrong in the demo coach.", 500, "unknown");
}

export function coachErrorResponse(err: unknown): Response {
  const e = toCoachError(err);
  return Response.json({ error: e.message, code: e.code }, { status: e.status });
}

const LIVE_ONLY = "The live AI coach isn't available in the static demo.";

export async function generateStructured(): Promise<never> {
  throw new CoachError(LIVE_ONLY, 503, "unavailable");
}

export async function streamText(): Promise<never> {
  throw new CoachError(LIVE_ONLY, 503, "unavailable");
}
