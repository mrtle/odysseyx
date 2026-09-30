/**
 * Server-side request parsing for route handlers.
 *
 * `parseBody` is the single guard in front of every coach endpoint:
 *  1. same-origin only — browsers always send `Origin` (and usually
 *     `Sec-Fetch-Site`) on cross-site POSTs, so a drive-by form or
 *     `text/plain` "simple" request from another site is refused;
 *  2. a body size cap, checked against `content-length` and enforced while
 *     reading, so oversized bodies are never buffered or parsed;
 *  3. a per-client token bucket in front of paid (live-mode) calls.
 * Every error body has the shape `{ error, code }`.
 */
import type { z } from "zod";
import { coachMode } from "@/lib/ai/client";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export type RequestErrorCode = "forbidden" | "too_large" | "rate_limit" | "bad_request";

/** Default body cap: comfortably above the largest valid request (a long drill transcript). */
export const MAX_BODY_BYTES = 512 * 1024;

export function errorResponse(status: number, code: RequestErrorCode, error: string, headers?: HeadersInit): Response {
  return Response.json({ error, code }, { status, headers });
}

// ---------------------------------------------------------------------------
// Same-origin check
// ---------------------------------------------------------------------------

function requestHost(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwarded || req.headers.get("host");
  if (host) return host.toLowerCase();
  try {
    return new URL(req.url).host.toLowerCase();
  } catch {
    return null;
  }
}

/** True unless the browser tells us the request came from another site. */
export function isSameOrigin(req: Request): boolean {
  // Browser-set and unforgeable from page scripts; trusted over Host, which proxies may rewrite.
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients (curl, server-side fetch, tests)
  if (origin === "null") return false;
  try {
    return new URL(origin).host.toLowerCase() === requestHost(req);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rate limit (in-memory, per server instance)
// ---------------------------------------------------------------------------

interface Bucket {
  tokens: number;
  updated: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function perMinute(): number {
  const raw = Number(process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE);
  return Number.isFinite(raw) && raw >= 0 ? raw : 20;
}

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "local";
}

/**
 * Take one token for this client. Bursts up to `limit` calls, refilling at
 * `limit` per minute. Returns seconds to wait when empty, else 0.
 */
export function takeToken(key: string, limit = perMinute(), now = Date.now()): number {
  if (limit <= 0) return 0; // disabled
  const refillPerMs = limit / 60_000;
  const bucket = buckets.get(key) ?? { tokens: limit, updated: now };
  bucket.tokens = Math.min(limit, bucket.tokens + (now - bucket.updated) * refillPerMs);
  bucket.updated = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / 1000));
  }
  bucket.tokens -= 1;
  buckets.delete(key); // re-insert so the Map stays ordered by recency
  buckets.set(key, bucket);
  if (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  return 0;
}

/** For tests. */
export function resetRateLimits(): void {
  buckets.clear();
}

// ---------------------------------------------------------------------------
// Body reading
// ---------------------------------------------------------------------------

class BodyTooLargeError extends Error {}

async function readLimited(req: Request, maxBytes: number): Promise<string> {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export interface ParseOptions {
  /** Body size cap in bytes (default MAX_BODY_BYTES). */
  maxBytes?: number;
}

/** Guard the request, then parse and validate its JSON body. */
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  options: ParseOptions = {},
): Promise<ParseResult<z.infer<S>>> {
  const maxBytes = options.maxBytes ?? MAX_BODY_BYTES;
  const tooLarge = () =>
    errorResponse(413, "too_large", "That's more text than the coach can take in one go. Try a shorter piece.");

  if (!isSameOrigin(req)) {
    return { ok: false, response: errorResponse(403, "forbidden", "Requests must come from the OdysseusX app.") };
  }

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, response: tooLarge() };

  let text: string;
  try {
    text = await readLimited(req, maxBytes);
  } catch (err) {
    if (err instanceof BodyTooLargeError) return { ok: false, response: tooLarge() };
    return { ok: false, response: errorResponse(400, "bad_request", "Couldn't read the request body.") };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, response: errorResponse(400, "bad_request", "Request body must be JSON.") };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return {
      ok: false,
      response: errorResponse(400, "bad_request", `Invalid request — ${where}${issue?.message ?? "bad input"}`),
    };
  }

  // Only valid requests that will reach Claude spend tokens from the bucket.
  if (coachMode() === "live") {
    const wait = takeToken(clientKey(req));
    if (wait > 0) {
      return {
        ok: false,
        response: errorResponse(
          429,
          "rate_limit",
          `You're sending requests faster than the coach can keep up. Try again in ${wait} second${wait === 1 ? "" : "s"}.`,
          { "retry-after": String(wait) },
        ),
      };
    }
  }
  return { ok: true, data: result.data };
}
