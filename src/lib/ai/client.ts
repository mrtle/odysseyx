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
import type { z } from "zod";
import type { CoachMode } from "@/lib/types";
import { NOTICE_MARKER } from "./stream-protocol";
import { outputJsonSchema, parseJsonCandidates, parseStructured } from "./structured";

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
  | "config"
  | "rate_limit"
  | "unavailable"
  | "bad_request"
  | "too_large"
  | "bad_output"
  | "cancelled"
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

const UNAVAILABLE_MESSAGE = "The AI coach is temporarily unavailable. Try again shortly.";
const TOO_LARGE_MESSAGE = "That piece is too long for the coach. Try a shorter excerpt.";

/** Server-side log line for an upstream error: status, type and request id, never shown to users. */
function logUpstream(label: string, err: InstanceType<typeof Anthropic.APIError>) {
  console.error(`[odysseusx] ${label}`, {
    status: err.status,
    type: err.type,
    requestId: err.requestID,
    message: err.message,
  });
}

/** Errors delivered as SSE `error` events mid-stream have no HTTP status, only an error type. */
function fromErrorType(err: InstanceType<typeof Anthropic.APIError>): CoachError | null {
  switch (err.type as string | null) {
    case "overloaded_error":
    case "api_error":
    case "timeout_error":
      return new CoachError(UNAVAILABLE_MESSAGE, 503, "unavailable");
    case "rate_limit_error":
      return new CoachError("The AI coach is busy right now. Try again in a moment.", 429, "rate_limit");
    case "request_too_large":
      return new CoachError(TOO_LARGE_MESSAGE, 413, "too_large");
    case "authentication_error":
    case "permission_error":
    case "billing_error":
      logUpstream("upstream auth error", err);
      return new CoachError("The AI coach isn't authorised. Check the ANTHROPIC_API_KEY on the server.", 500, "auth");
    case "invalid_request_error":
      logUpstream("upstream rejected the request", err);
      return new CoachError("The AI coach couldn't process that request. Try rephrasing or shortening it.", 400, "bad_request");
    default:
      return null;
  }
}

/**
 * Map SDK errors (most specific first) onto user-presentable CoachErrors.
 * Messages are fixed, friendly strings: raw API bodies and request ids are
 * logged on the server, never sent to the browser.
 */
export function toCoachError(err: unknown): CoachError {
  if (err instanceof CoachError) return err;
  // Subclasses of APIError, so check them first.
  if (err instanceof Anthropic.APIUserAbortError) {
    return new CoachError("The request was cancelled.", 499, "cancelled");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new CoachError(UNAVAILABLE_MESSAGE, 503, "unavailable");
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    logUpstream("upstream auth error", err);
    return new CoachError(
      "The AI coach isn't authorised. Check the ANTHROPIC_API_KEY on the server.",
      500,
      "auth",
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new CoachError("The AI coach is busy right now. Try again in a moment.", 429, "rate_limit");
  }
  if (err instanceof Anthropic.NotFoundError) {
    logUpstream("upstream 404 (model or endpoint not found)", err);
    return new CoachError(
      "The AI coach's model isn't available. Check ODYSSEUSX_MODEL on the server.",
      500,
      "config",
    );
  }
  if (err instanceof Anthropic.APIError && err.status === 413) {
    return new CoachError(TOO_LARGE_MESSAGE, 413, "too_large");
  }
  if (err instanceof Anthropic.BadRequestError) {
    return (
      fromErrorType(err) ?? new CoachError("The AI coach couldn't process that request. Try rephrasing or shortening it.", 400, "bad_request")
    );
  }
  if (err instanceof Anthropic.InternalServerError) {
    return new CoachError(UNAVAILABLE_MESSAGE, 503, "unavailable");
  }
  if (err instanceof Anthropic.APIError) {
    const byType = fromErrorType(err);
    if (byType) return byType;
    logUpstream("unexpected upstream error", err);
    return new CoachError("The AI coach returned an error. Try again.", 502, "unknown");
  }
  if (err instanceof Anthropic.AnthropicError) {
    // Stream-level failures: a dropped connection, an out-of-order or unparseable event.
    console.error("[odysseusx] coach stream error", err.message);
    return new CoachError("The AI coach's response was interrupted. Try again.", 502, "unavailable");
  }
  console.error("[odysseusx] unexpected coach error", err);
  return new CoachError("Something went wrong talking to the AI coach.", 500, "unknown");
}

const REFUSAL_MESSAGE =
  "The coach can't help with that particular request. Try reframing the story or choosing different material.";
const CUT_SHORT_MESSAGE = "The coach's response was cut short. Try a shorter piece.";
const UNREADABLE_MESSAGE = "The coach returned an unreadable response. Try again.";

export interface GenerateOptions<S extends z.ZodType> {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  schema: S;
  effort?: Effort;
  maxTokens?: number;
  /** Pass the route's `req.signal` so a cancelled request stops generating (and billing). */
  signal?: AbortSignal;
}

/** The subset of a finished message that `readStructured` looks at. */
export type StructuredMessage = Pick<Anthropic.Beta.BetaMessage, "content" | "stop_reason">;

/**
 * Turn a finished message into a validated result, or a CoachError.
 *
 * Order matters: stop reasons first (a refusal or a truncated answer is
 * never valid JSON), then the text — joined across a server-side fallback
 * boundary, since the fallback model continues the declined partial — then
 * repair + validation.
 */
export function readStructured<S extends z.ZodType>(message: StructuredMessage, schema: S): z.infer<S> {
  if (message.stop_reason === "refusal") {
    throw new CoachError(REFUSAL_MESSAGE, 422, "refusal");
  }
  if (message.stop_reason === "max_tokens" || message.stop_reason === "model_context_window_exceeded") {
    throw new CoachError(CUT_SHORT_MESSAGE, 502, "bad_output");
  }
  const json = parseJsonCandidates(message.content);
  if (json === undefined) {
    console.error("[odysseusx] structured output was not valid JSON", { stop_reason: message.stop_reason });
    throw new CoachError(UNREADABLE_MESSAGE, 502, "bad_output");
  }
  const result = parseStructured(schema, json);
  if (result.notes.length > 0) {
    console.warn("[odysseusx] repaired structured output", result.notes.slice(0, 10));
  }
  if (!result.ok) {
    console.error(
      "[odysseusx] structured output failed validation",
      result.error.issues.slice(0, 5).map((i) => ({ path: i.path.join("."), message: i.message })),
    );
    throw new CoachError(UNREADABLE_MESSAGE, 502, "bad_output");
  }
  return result.data;
}

/** Ask Claude for a JSON result that validates against `schema`. */
export async function generateStructured<S extends z.ZodType>(
  opts: GenerateOptions<S>,
): Promise<z.infer<S>> {
  let message: Anthropic.Beta.BetaMessage;
  try {
    const stream = getClient().beta.messages.stream(
      {
        model: MODEL,
        // Streamed, so a generous cap costs nothing; thinking tokens count toward it.
        max_tokens: opts.maxTokens ?? 64000,
        // The system prompt is stable per feature, so cache it.
        system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
        messages: opts.messages,
        // A plain JSON schema (no `parse`), so the SDK doesn't validate each text block on its
        // own — that throws on a fallback-split answer before we can inspect stop_reason.
        output_config: {
          effort: opts.effort ?? "high",
          format: { type: "json_schema", schema: outputJsonSchema(opts.schema) },
        },
        ...fallbackParams(),
      },
      { signal: opts.signal },
    );
    message = await stream.finalMessage();
  } catch (err) {
    throw toCoachError(err);
  }
  return readStructured(message, opts.schema);
}

export interface StreamTextOptions {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  effort?: Effort;
  maxTokens?: number;
  /** Pass the route's `req.signal` so a disconnected client stops generation. */
  signal?: AbortSignal;
}

function textOf(event: Anthropic.Beta.BetaRawMessageStreamEvent): string {
  return event.type === "content_block_delta" && event.delta.type === "text_delta" ? event.delta.text : "";
}

/**
 * Stream a plain-text reply as UTF-8 chunks (wire format: ./stream-protocol.ts).
 *
 * Nothing is sent until the first text arrives, so a refusal or error
 * before any dialogue (including while the model is thinking) rejects with
 * a CoachError and the route returns a proper JSON error status. After text
 * has started, a failure or refusal ends the stream with NOTICE_MARKER and
 * an out-of-character notice, which clients show apart from the dialogue.
 */
export async function streamText(opts: StreamTextOptions): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const stream = getClient().beta.messages.stream(
    {
      model: MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: opts.messages,
      output_config: { effort: opts.effort ?? "low" },
      ...fallbackParams(),
    },
    { signal: opts.signal },
  );
  const iterator = stream[Symbol.asyncIterator]();

  /** Next text chunk, or null when the stream is finished. Errors surface via finalMessage(). */
  const nextText = async (): Promise<string | null> => {
    for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
      const text = textOf(next.value);
      if (text) return text;
    }
    return null;
  };

  let first: string | null;
  try {
    first = await nextText();
    if (first === null) {
      // The iterator ends quietly on errors; finalMessage() rethrows them.
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") throw new CoachError(REFUSAL_MESSAGE, 422, "refusal");
      throw new CoachError("The coach didn't reply. Try again.", 502, "bad_output");
    }
  } catch (err) {
    stream.abort();
    throw toCoachError(err);
  }

  let cancelled = false;
  let finished = false;
  const notice = (text: string) => encoder.encode(`${NOTICE_MARKER}${text}`);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(first));
    },
    async pull(controller) {
      if (finished) return;
      try {
        const text = await nextText();
        if (cancelled) return;
        if (text !== null) {
          controller.enqueue(encoder.encode(text));
          return;
        }
        const final = await stream.finalMessage();
        if (cancelled) return;
        if (final.stop_reason === "refusal") controller.enqueue(notice(REFUSAL_MESSAGE));
      } catch (err) {
        if (cancelled) return;
        const coachErr = toCoachError(err);
        if (coachErr.code === "cancelled") return;
        controller.enqueue(notice(coachErr.message));
      }
      finished = true;
      controller.close();
    },
    cancel() {
      cancelled = true;
      stream.abort();
    },
  });
}

/** Build a JSON error response from any thrown value. */
export function coachErrorResponse(err: unknown): Response {
  const e = toCoachError(err);
  return Response.json({ error: e.message, code: e.code }, { status: e.status });
}
