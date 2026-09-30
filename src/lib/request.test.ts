import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { isSameOrigin, parseBody, resetRateLimits, takeToken } from "./request";

const Schema = z.object({ logline: z.string().min(3) });

function post(body: BodyInit, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/lab/logline", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
    body,
  });
}

const env = { mode: process.env.ODYSSEUSX_MODE, limit: process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE };
beforeEach(() => resetRateLimits());
afterEach(() => {
  if (env.mode === undefined) delete process.env.ODYSSEUSX_MODE;
  else process.env.ODYSSEUSX_MODE = env.mode;
  if (env.limit === undefined) delete process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE;
  else process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = env.limit;
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

  it("rate-limits live calls per client, but never demo calls", async () => {
    process.env.ODYSSEUSX_RATE_LIMIT_PER_MINUTE = "2";
    const body = JSON.stringify({ logline: "abc" });
    process.env.ODYSSEUSX_MODE = "demo";
    for (let i = 0; i < 4; i++) expect((await parseBody(post(body), Schema)).ok).toBe(true);

    process.env.ODYSSEUSX_MODE = "live";
    const ip = { "x-forwarded-for": "203.0.113.7" };
    expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
    expect((await parseBody(post(body, ip), Schema)).ok).toBe(true);
    const limited = await parseBody(post(body, ip), Schema);
    expect(limited.ok).toBe(false);
    if (limited.ok) return;
    expect(limited.response.status).toBe(429);
    expect(Number(limited.response.headers.get("retry-after"))).toBeGreaterThan(0);
    // Another client is unaffected.
    expect((await parseBody(post(body, { "x-forwarded-for": "198.51.100.1" }), Schema)).ok).toBe(true);
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
