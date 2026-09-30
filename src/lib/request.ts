/**
 * Server-side request parsing for route handlers.
 *
 * `parseBody` is the single guard in front of every coach endpoint:
 *  1. same-origin only — browsers always send `Origin` (and usually
 *     `Sec-Fetch-Site`) on cross-site POSTs, so a drive-by form or
 *     `text/plain` "simple" request from another site is refused;
 *  2. a body size cap, checked against `content-length` and enforced while
 *     reading, so oversized bodies are never buffered or parsed;
 *  3. per-client and global token buckets: live calls cost API spend, demo
 *     calls cost server CPU (see "Rate limit" below).
 * Route handlers add `notFound`, `badRequest` and `demoLanguageGuard`.
 * Every error body has the shape `{ error, code }`.
 */
import type { z } from "zod";
import { coachMode } from "@/lib/ai/client";
import { DEMO_ENGLISH_ONLY, demoCanRead } from "@/lib/demo/language";
import type { CoachMode } from "@/lib/types";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export type RequestErrorCode = "forbidden" | "too_large" | "rate_limit" | "bad_request" | "not_found" | "unsupported_language";

/**
 * Default body cap. The largest schema-valid request in plain text — a
 * drill transcript of 80 messages × 8,000 characters, about 650 KB — fits;
 * the schemas count characters, not bytes, so the same transcript in a
 * script that takes 3 bytes a character is refused here with 413.
 * Real drills are a small fraction of this.
 */
export const MAX_BODY_BYTES = 1024 * 1024;

export function errorResponse(status: number, code: RequestErrorCode, error: string, headers?: HeadersInit): Response {
  return Response.json({ error, code }, { status, headers });
}

/** 404 for an id in a valid body that names nothing (a retired scenario or prompt). */
export function notFound(error: string): Response {
  return errorResponse(404, "not_found", error);
}

/** 400 for a body that parsed but can't be used (e.g. a transcript that doesn't end with the learner). */
export function badRequest(error: string): Response {
  return errorResponse(400, "bad_request", error);
}

/**
 * In demo mode, a 422 when the offline coach (English word lists) can't
 * read the learner's text, instead of confident feedback on text it didn't
 * understand. Returns null to go ahead; live mode always goes ahead.
 */
export function demoLanguageGuard(text: string, mode: CoachMode = coachMode()): Response | null {
  if (mode !== "demo" || demoCanRead(text)) return null;
  return errorResponse(422, "unsupported_language", DEMO_ENGLISH_ONLY);
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

/**
 * Token buckets: each client may burst up to its per-minute limit and
 * refills at that rate. Live calls cost API spend, demo calls cost CPU (the
 * offline coach runs synchronously), so both are limited, demo more
 * loosely. A global bucket per mode backs this up, so a client rotating
 * addresses still can't exceed a total budget. Limits come from:
 *  - ODYSSEUSX_RATE_LIMIT_PER_MINUTE        live, per client (default 20)
 *  - ODYSSEUSX_DEMO_RATE_LIMIT_PER_MINUTE   demo, per client (default 60)
 *  - ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE all clients together, per mode
 *                                           (default 10 × the per-client limit)
 * 0 turns a limit off.
 */
interface Bucket {
  tokens: number;
  updated: number;
}

/** Per-client buckets, kept in least-recently-used order: every touch re-inserts the key. */
const buckets = new Map<string, Bucket>();
/** One bucket per mode for all clients together; never evicted. */
const globalBuckets = new Map<string, Bucket>();
/** Hard cap on tracked clients; stale buckets are swept long before this. */
export const MAX_BUCKETS = 10_000;
/** An untouched bucket is full again after at most a minute, the same as no bucket. */
const STALE_AFTER_MS = 60_000;

const DEFAULT_LIVE_PER_MINUTE = 20;
const DEFAULT_DEMO_PER_MINUTE = 60;
const GLOBAL_MULTIPLIER = 10;

function envLimit(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export interface RateLimits {
  /** Calls per minute for one client (0 = unlimited). */
  perClient: number;
  /** Calls per minute for all clients together (0 = unlimited). */
  global: number;
}

/** The limits in force for a coach mode, read from the environment on each call. */
export function rateLimits(mode: CoachMode): RateLimits {
  const perClient =
    mode === "live"
      ? envLimit("ODYSSEUSX_RATE_LIMIT_PER_MINUTE", DEFAULT_LIVE_PER_MINUTE)
      : envLimit("ODYSSEUSX_DEMO_RATE_LIMIT_PER_MINUTE", DEFAULT_DEMO_PER_MINUTE);
  return { perClient, global: envLimit("ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE", perClient * GLOBAL_MULTIPLIER) };
}

/** How many proxies in front of the app append to X-Forwarded-For (default 1). */
function trustedProxyHops(): number {
  const value = envLimit("ODYSSEUSX_TRUSTED_PROXY_HOPS", 1);
  return Math.floor(value);
}

/** Key for clients the app can't tell apart (no trusted forwarding information). */
const UNIDENTIFIED = "unidentified";

/**
 * Who is calling, for rate limiting. Route handlers can't see the socket
 * address, only headers, and X-Forwarded-For is client-controlled at its
 * left end: Next.js keeps a header the client sent, and proxies append the
 * address they saw on the right. So:
 *  - on Vercel, the platform's own x-vercel-forwarded-for (overwritten, not appended);
 *  - with ODYSSEUSX_TRUSTED_PROXY_HOPS = N ≥ 1, the Nth X-Forwarded-For entry from
 *    the right (N = 1: the address the nearest proxy saw), never the spoofable leftmost;
 *  - with 0 (the app is exposed directly), forwarded headers are ignored and all
 *    clients share one bucket.
 */
export function clientKey(req: Request): string {
  if (process.env.VERCEL) {
    const vercel = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (vercel) return vercel;
  }
  const hops = trustedProxyHops();
  if (hops < 1) return UNIDENTIFIED;
  const hopsSeen = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (hopsSeen.length === 0) return UNIDENTIFIED;
  // Fewer entries than trusted proxies: the leftmost is the furthest address known.
  return hopsSeen[Math.max(0, hopsSeen.length - hops)];
}

/** Drop buckets untouched for a minute (they're full again anyway), oldest first; cap the rest. */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.updated < STALE_AFTER_MS && buckets.size <= MAX_BUCKETS) break;
    buckets.delete(key);
  }
}

function refill(store: Map<string, Bucket>, key: string, limit: number, now: number): Bucket {
  const bucket = store.get(key) ?? { tokens: limit, updated: now };
  const elapsed = Math.max(0, now - bucket.updated);
  bucket.tokens = Math.min(limit, bucket.tokens + (elapsed * limit) / 60_000);
  bucket.updated = now;
  store.delete(key); // re-insert so the Map stays ordered by recency
  store.set(key, bucket);
  return bucket;
}

function take(store: Map<string, Bucket>, key: string, limit: number, now: number): number {
  if (limit <= 0) return 0; // disabled
  const bucket = refill(store, key, limit, now);
  if (store === buckets) sweep(now);
  if (bucket.tokens < 1) return waitSeconds(bucket, limit);
  bucket.tokens -= 1;
  return 0;
}

function waitSeconds(bucket: Bucket, limit: number): number {
  return Math.max(1, Math.ceil(((1 - bucket.tokens) * 60) / limit));
}

/**
 * Take one token for this key. Bursts up to `limit` calls, refilling at
 * `limit` per minute. Returns seconds to wait when empty, else 0.
 */
export function takeToken(key: string, limit: number, now = Date.now()): number {
  return take(buckets, key, limit, now);
}

/**
 * Charge one call to the client and to the mode's global budget. Returns
 * seconds to wait (0 = go ahead). A call refused by the global budget
 * doesn't cost the client a token.
 */
export function checkRateLimit(req: Request, mode: CoachMode, now = Date.now()): number {
  const { perClient, global } = rateLimits(mode);
  const clientBucket = `${mode}:${clientKey(req)}`;
  const clientWait = takeToken(clientBucket, perClient, now);
  if (clientWait > 0) return clientWait;
  const globalWait = take(globalBuckets, mode, global, now);
  if (globalWait > 0 && perClient > 0) {
    const bucket = buckets.get(clientBucket);
    if (bucket) bucket.tokens = Math.min(perClient, bucket.tokens + 1);
  }
  return globalWait;
}

/** Number of tracked buckets (for tests). */
export function rateLimitBucketCount(): number {
  return buckets.size;
}

/** For tests. */
export function resetRateLimits(): void {
  buckets.clear();
  globalBuckets.clear();
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

  // Only valid requests spend tokens: they're the ones that reach Claude (live) or the offline coach (demo).
  const wait = checkRateLimit(req, coachMode());
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
  return { ok: true, data: result.data };
}
