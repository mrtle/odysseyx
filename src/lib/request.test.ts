import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { DEMO_ENGLISH_ONLY } from "@/lib/demo/language";
import {
  MAX_BUCKETS,
  badRequest,
  checkRateLimit,
  clientKey,
  demoLanguageGuard,
  isSameOrigin,
  notFound,
  parseBody,
  rateLimitBucketCount,
  rateLimits,
  resetRateLimits,
  takeToken,
} from "./request";

const Schema = z.object({ logline: z.string().min(3) });

function post(body: BodyInit, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/lab/logline", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
    body,
  });
}

const ENV_KEYS = [
  "ODYSSEUSX_MODE",
  "ODYSSEUSX_RATE_LIMIT_PER_MINUTE",
  "ODYSSEUSX_DEMO_RATE_LIMIT_PER_MINUTE",
  "ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE",
  "ODYSSEUSX_TRUSTED_PROXY_HOPS",
  "VERCEL",
] as const;
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
beforeEach(() => {
  resetRateLimits();
  for (const key of ENV_KEYS) delete process.env[key];
});
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("isSameOrigin", () => {
  it("accepts same-origin browsers and non-browser clients", () => {
    expect(isSameOrigin(post("{}"))).toBe(true);
    expect(isSameOrigin(post("{}", { origin: "http://localhost:3000" }))).toBe(true);
    expect(isSameOrigin(post("{}", { "sec-fetch-site": "same-origin", origin: "http://localhost:3000" }))).toBe(true);
  });

  it("refuses cross-site requests", () => {
    expect(isSameOrigin(post("{}", { origin: "https://evil.example" }))).toBe(false);
    expect(isSameOrigin(post("{}", { "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(isSameOrigin(post("{}", { "sec-fetch-site": "same-site", origin: "http://app.localhost:3000" }))).toBe(false);
    expect(isSameOrigin(post("{}", { origin: "null" }))).toBe(false);
  });

  it("honours x-forwarded-host behind a proxy", () => {
    expect(isSameOrigin(post("{}", { origin: "https://odysseusx.app", host: "internal:8080", "x-forwarded-host": "odysseusx.app" }))).toBe(true);
  });
});

describe("parseBody", () => {
  it("parses a valid body", async () => {
    const result = await parseBody(post(JSON.stringify({ logline: "A sommelier…" })), Schema);
    expect(result).toEqual({ ok: true, data: { logline: "A sommelier…" } });
  });

  it("returns 403 for a cross-site text/plain simple request", async () => {
    const req = post(JSON.stringify({ logline: "abc" }), { origin: "https://evil.example", "content-type": "text/plain;charset=UTF-8" });
    const result = await parseBody(req, Schema);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toMatchObject({ code: "forbidden" });
  });

  it("returns 413 from content-length before reading, and while streaming without it", async () => {
    const big = JSON.stringify({ logline: "x".repeat(2000) });
    const declared = await parseBody(post(big, { "content-length": String(big.length) }), Schema, { maxBytes: 1000 });
    expect(!declared.ok && declared.response.status).toBe(413);

    const encoder = new TextEncoder();
    const streamed = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 10; i++) controller.enqueue(encoder.encode("x".repeat(500)));
        controller.close();
      },
    });
    const req = new Request("http://localhost:3000/api", { method: "POST", body: streamed, duplex: "half" } as RequestInit);
    const result = await parseBody(req, Schema, { maxBytes: 1000 });
    expect(!result.ok && result.response.status).toBe(413);
    if (!result.ok) expect(await result.response.json()).toMatchObject({ code: "too_large" });
  });

  it("returns 400 with a code for malformed JSON and invalid fields", async () => {
    const bad = await parseBody(post("{not json"), Schema);
    expect(!bad.ok && (await bad.response.json())).toMatchObject({ code: "bad_request" });
    const invalid = await parseBody(post(JSON.stringify({ logline: "x" })), Schema);
    expect(!invalid.ok && invalid.response.status).toBe(400);
  });

  it("rate-limits live calls per client", async () => {
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "2";
    process.env.ODYSSEUSX_MODE = "live";
    const body = JSON.stringify({ logline: "abc" });
    const ip = { "x-forwarded-for": "203.0.113.7" };
    expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
    expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
    const limited = await parseBody(post(body, ip), Schema);
    expect(limited.ok).toBe(false);
    if (limited.ok) return;
    expect(limited.response.status).toBe(429);
    expect(await limited.response.json()).toMatchObject({ code: "rate_limit" });
    expect(Number(limited.response.headers.get("retry-after"))).toBeGreaterThan(0);
    // Another client is unaffected.
    expect((await parseBody(post(body, { "x-forwarded-for": "198.51.100.1" }), Schema)).ok).toBe(true);
  });

  it("rate-limits demo calls too, more loosely (they cost server CPU)", async () => {
    process.env.ODYSSEUSX_MODE = "demo";
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "2";
    const body = JSON.stringify({ logline: "abc" });
    const ip = { "x-forwarded-for": "203.0.113.7" };
    expect(rateLimits("demo").perClient).toBeGreaterThan(rateLimits("live").perClient);
    for (let i = 0; i < rateLimits("demo").perClient; i++) expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
    const limited = await parseBody(post(body, ip), Schema);
    expect(!limited.ok && limited.response.status).toBe(429);

    process.env.ODYSSEUSX_DEMO_RATE_LIMIT_PER_MINUTE = "0"; // off
    resetRateLimits();
    for (let i = 0; i < 100; i++) expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
  });

  it("never spends a token on an invalid or cross-site request", async () => {
    process.env.ODYSSEUSX_MODE = "live";
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "1";
    const ip = { "x-forwarded-for": "203.0.113.7" };
    for (let i = 0; i < 5; i++) {
      expect((await parseBody(post("{not json", ip), Schema)).ok).toBe(false);
      expect((await parseBody(post(JSON.stringify({ logline: "abc" }), { ...ip, origin: "https://evil.example" }), Schema)).ok).toBe(false);
    }
    expect((await parseBody(post(JSON.stringify({ logline: "abc" }), ip), Schema)).ok).toBe(true);
  });
});

describe("clientKey", () => {
  const req = (headers: Record<string, string>) => post("{}", headers);

  it("uses the address the nearest proxy saw, not the client-supplied leftmost hop", () => {
    expect(clientKey(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientKey(req({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" }))).toBe("203.0.113.7");
    expect(clientKey(req({ "x-forwarded-for": " 1.1.1.1 ,2.2.2.2,  203.0.113.7 " }))).toBe("203.0.113.7");
    // x-real-ip is just as forgeable, so it's ignored.
    expect(clientKey(req({ "x-real-ip": "9.9.9.9" }))).toBe(clientKey(req({})));
  });

  it("honours ODYSSEUSX_TRUSTED_PROXY_HOPS", () => {
    process.env.ODYSSEUSX_TRUSTED_PROXY_HOPS = "2";
    expect(clientKey(req({ "x-forwarded-for": "6.6.6.6, 203.0.113.7, 10.0.0.2" }))).toBe("203.0.113.7");
    expect(clientKey(req({ "x-forwarded-for": "203.0.113.7" }))).toBe("203.0.113.7");
    process.env.ODYSSEUSX_TRUSTED_PROXY_HOPS = "0";
    expect(clientKey(req({ "x-forwarded-for": "203.0.113.7" }))).toBe(clientKey(req({ "x-forwarded-for": "198.51.100.1" })));
    process.env.ODYSSEUSX_TRUSTED_PROXY_HOPS = "nonsense";
    expect(clientKey(req({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("prefers Vercel's own header on Vercel", () => {
    const headers = { "x-vercel-forwarded-for": "203.0.113.7", "x-forwarded-for": "6.6.6.6, 10.0.0.1" };
    expect(clientKey(req(headers))).toBe("10.0.0.1");
    process.env.VERCEL = "1";
    expect(clientKey(req(headers))).toBe("203.0.113.7");
    expect(clientKey(req({ "x-forwarded-for": "6.6.6.6, 10.0.0.1" }))).toBe("10.0.0.1");
  });

  it("can't be bypassed by rotating the leftmost X-Forwarded-For hop (the reported probe)", async () => {
    process.env.ODYSSEUSX_MODE = "live";
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "20";
    const body = JSON.stringify({ logline: "abc" });
    let limited = 0;
    for (let i = 0; i < 200; i++) {
      const res = await parseBody(post(body, { "x-forwarded-for": `10.0.${i >> 8}.${i & 255}, 203.0.113.7` }), Schema);
      if (!res.ok) limited++;
    }
    expect(limited).toBe(180);
  });
});

describe("global budget", () => {
  it("caps all clients together, so rotating real addresses still hits a ceiling", () => {
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "5";
    process.env.ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE = "30";
    const now = 1_000_000;
    let allowed = 0;
    for (let i = 0; i < 100; i++) {
      if (checkRateLimit(post("{}", { "x-forwarded-for": `198.51.100.${i}` }), "live", now) === 0) allowed++;
    }
    expect(allowed).toBe(30);
    // It refills over time.
    expect(checkRateLimit(post("{}", { "x-forwarded-for": "192.0.2.1" }), "live", now + 60_000)).toBe(0);
  });

  it("defaults to ten times the per-client limit, per mode", () => {
    expect(rateLimits("live")).toEqual({ perClient: 20, global: 200 });
    expect(rateLimits("demo")).toEqual({ perClient: 60, global: 600 });
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "0";
    expect(rateLimits("live")).toEqual({ perClient: 0, global: 0 });
    process.env.ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE = "50";
    expect(rateLimits("live").global).toBe(50);
  });

  it("doesn't charge the client for a call the global budget refused", () => {
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "2";
    process.env.ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE = "1";
    const now = 5_000_000;
    const a = post("{}", { "x-forwarded-for": "198.51.100.1" });
    const b = () => post("{}", { "x-forwarded-for": "198.51.100.2" });
    expect(checkRateLimit(a, "live", now)).toBe(0);
    expect(checkRateLimit(b(), "live", now)).toBeGreaterThan(0);
    // Once the global budget refills, b still has its full burst of two.
    expect(checkRateLimit(b(), "live", now + 60_000)).toBe(0);
    expect(checkRateLimit(b(), "live", now + 120_000)).toBe(0);
  });
});

describe("bucket map", () => {
  it("sweeps idle clients and never tracks more than MAX_BUCKETS", () => {
    const t0 = 10_000_000;
    for (let i = 0; i < 500; i++) takeToken(`idle-${i}`, 20, t0);
    expect(rateLimitBucketCount()).toBe(500);
    // A minute later every idle bucket is full again, so they're dropped.
    takeToken("fresh", 20, t0 + 61_000);
    expect(rateLimitBucketCount()).toBe(1);

    for (let i = 0; i < MAX_BUCKETS + 2_000; i++) takeToken(`flood-${i}`, 20, t0 + 70_000);
    expect(rateLimitBucketCount()).toBeLessThanOrEqual(MAX_BUCKETS);
  });

  it("keeps a limited client's state while it keeps calling", () => {
    const t0 = 20_000_000;
    expect(takeToken("busy", 1, t0)).toBe(0);
    for (let i = 0; i < 50; i++) takeToken(`other-${i}`, 20, t0 + 500);
    expect(takeToken("busy", 1, t0 + 1000)).toBeGreaterThan(0);
  });
});

describe("route error helpers", () => {
  it("always use the { error, code } shape", async () => {
    const missing = notFound("No such scenario.");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "No such scenario.", code: "not_found" });
    const bad = badRequest("Say something first.");
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: "Say something first.", code: "bad_request" });
  });

  it("refuses text the demo coach can't read, in demo mode only", async () => {
    const spanish = "Cuando una capitana de ferry deshonrada descubre que su tripulación trafica refugiados, debe elegir entre su carrera y la verdad.";
    const refused = demoLanguageGuard(spanish, "demo");
    expect(refused?.status).toBe(422);
    expect(await refused?.json()).toEqual({ error: DEMO_ENGLISH_ONLY, code: "unsupported_language" });
    expect(demoLanguageGuard(spanish, "live")).toBeNull();
    expect(demoLanguageGuard("A shy librarian must win a trivia tournament to save her library.", "demo")).toBeNull();
  });
});

describe("takeToken", () => {
  it("refills over time", () => {
    const t0 = 1_000_000;
    expect(takeToken("k", 1, t0)).toBe(0);
    expect(takeToken("k", 1, t0 + 1000)).toBeGreaterThan(0);
    expect(takeToken("k", 1, t0 + 61_000)).toBe(0);
  });
});
