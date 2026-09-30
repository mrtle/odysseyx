/**
 * Server-side Claude access for OdysseusX. Import only from route handlers
 * and other server code — never from client components.
 *
 * Two entry points:
 *  - `generateStructured` — a schema-validated JSON result (scorecards,
 *    Story Lab analyses). Streams under the hood so long analyses never hit
 *    HTTP timeouts, then returns the parsed object.
 *  - `streamText` — a plain-text stream for live roleplay replies.
 *
 * When no credentials are configured the app runs in demo mode and routes
 * use the offline coach in `@/lib/demo` instead; `coachMode()` decides.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import type { CoachMode } from "@/lib/types";

export const MODEL = process.env.ODYSSEUSX_MODEL?.trim() || "claude-opus-5-5";

/** Server-side refusal fallback: re-runs a declined request on the model Anthropic recommends. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * `ODYSSEUSX_MODE=live|demo` forces a mode. Otherwise we're live when an
 * API key or auth token is present, and demo when not.
 */
export function coachMode(): CoachMode {
  const forced = process.env.ODYSSEUSX_MODE?.trim().toLowerCase();
  if (forced === "demo" || forced === "live") return forced;
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? "live" : "demo";
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

/**
 * Server-side fallbacks are available on the Claude API directly. Set
 * `ODYSSEUSX_DISABLE_FALLBACKS=1` when routing through a gateway or cloud
 * platform that doesn't accept the `fallbacks` parameter.
 */
function fallbackParams(): { betas?: string[]; fallbacks?: "default" } {
  const disabled = process.env.ODYSSEUSX_DISABLE_FALLBACKS?.trim();
  if (disabled === "1" || disabled === "true") return {};
  return { betas: [FALLBACK_BETA], fallbacks: "default" };
}

export type CoachErrorCode =
  | "refusal"
  | "auth"
  | "rate_limit"
  | "unavailable"
  | "bad_request"
  | "bad_output"
  | "unknown";

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

/** Map SDK errors (most specific first) onto user-presentable CoachErrors. */
export function toCoachError(err: unknown): CoachError {
  if (err instanceof CoachError) return err;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new CoachError(
      "The AI coach isn't authorised. Check the ANTHROPIC_API_KEY on the server.",
      500,
      "auth",
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new CoachError("The AI coach is busy right now. Try again in a moment.", 429, "rate_limit");
  }
  if (err instanceof Anthropic.BadRequestError) {
    return new CoachError(`The AI coach couldn't process that request: ${err.message}`, 400, "bad_request");
  }
  if (err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError) {
    return new CoachError("The AI coach is temporarily unavailable. Try again shortly.", 503, "unavailable");
  }
  if (err instanceof Anthropic.APIError) {
    return new CoachError(`The AI coach returned an error (${err.status ?? "unknown"}).`, 502, "unknown");
  }
  console.error("[odysseusx] unexpected coach error", err);
  return new CoachError("Something went wrong talking to the AI coach.", 500, "unknown");
}

const REFUSAL_MESSAGE =
  "The coach can't help with that particular request. Try reframing the story or choosing different material.";

export interface GenerateOptions<S extends z.ZodType> {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: S;
  effort?: Effort;
  maxTokens?: number;
  /** Pass the route's `req.signal` so a cancelled request stops generating (and billing). */
  signal?: AbortSignal;
}

/** Ask Claude for a JSON result that validates against `schema`. */
export async function generateStructured<S extends z.ZodType>(
  opts: GenerateOptions<S>,
): Promise<z.infer<S>> {
  try {
    const stream = getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 32000,
      // The system prompt is stable per feature, so cache it.
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
      output_config: { effort: opts.effort ?? "high", format: betaZodOutputFormat(opts.schema) },
      ...fallbackParams(),
    }, { signal: opts.signal });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      throw new CoachError(REFUSAL_MESSAGE, 422, "refusal");
    }
    if (message.stop_reason === "max_tokens") {
      throw new CoachError("The coach's response was cut short. Try a shorter piece.", 502, "bad_output");
    }
    if (message.parsed_output == null) {
      throw new CoachError("The coach returned an unreadable response. Try again.", 502, "bad_output");
    }
    return message.parsed_output as z.infer<S>;
  } catch (err) {
    throw toCoachError(err);
  }
}

export interface StreamTextOptions {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  effort?: Effort;
  maxTokens?: number;
  /** Pass the route's `req.signal` so a disconnected client stops generation. */
  signal?: AbortSignal;
}

/**
 * Stream a plain-text reply as UTF-8 chunks. Errors that happen before the
 * first token reject (so the route can return a proper status); errors
 * mid-stream are appended as a short notice so the UI never hangs.
 */
export async function streamText(opts: StreamTextOptions): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const stream = getClient().beta.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
    messages: opts.messages,
    output_config: { effort: opts.effort ?? "low" },
    ...fallbackParams(),
  }, { signal: opts.signal });

  const iterator = stream[Symbol.asyncIterator]();
  // Pull the first event eagerly so auth/rate-limit errors surface as HTTP errors.
  let first: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>;
  try {
    first = await iterator.next();
  } catch (err) {
    throw toCoachError(err);
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let sawText = false;
      const handle = (event: Anthropic.Beta.BetaRawMessageStreamEvent) => {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          sawText = true;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      };
      try {
        if (!first.done) handle(first.value);
        for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
          handle(next.value);
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(`${sawText ? "\n\n" : ""}(${REFUSAL_MESSAGE})`));
        }
      } catch (err) {
        const coachErr = toCoachError(err);
        controller.enqueue(encoder.encode(`${sawText ? "\n\n" : ""}(${coachErr.message})`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
}

/** Build a JSON error response from any thrown value. */
export function coachErrorResponse(err: unknown): Response {
  const e = toCoachError(err);
  return Response.json({ error: e.message, code: e.code }, { status: e.status });
}
