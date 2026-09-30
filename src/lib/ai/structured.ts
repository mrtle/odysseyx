/**
 * Structured-output plumbing for `generateStructured` (server only).
 *
 *  - `outputJsonSchema` turns a zod output schema into the JSON schema sent
 *    as `output_config.format`. Unlike the SDK's `betaZodOutputFormat`, it
 *    keeps `enum` (which structured outputs enforce) instead of folding it
 *    into the description, and it carries no `parse` function, so the SDK
 *    never throws while assembling the message — we parse it ourselves.
 *  - `repairStructured` + `parseStructured` make parsing resilient: an
 *    off-vocabulary enum value (a fallback model, a near-miss like
 *    "Medium Close-Up") is mapped to the canonical id, replaced with the
 *    field's fallback, or — for items identified by that enum — dropped,
 *    so one stray value can't sink a whole analysis.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Enum repair metadata
// ---------------------------------------------------------------------------

export interface EnumRepair {
  /** Used when a value can't be matched. Without one, the enclosing array item is dropped (or the first option is used). */
  fallback?: string;
  /** Extra spellings (abbreviations, synonyms) mapped to canonical ids. Keys are matched case-insensitively. */
  aliases?: Record<string, string>;
}

/** Attach repair hints to enum schemas used in model output. */
export const enumRepairs = z.registry<EnumRepair>();

// ---------------------------------------------------------------------------
// JSON schema for output_config.format
// ---------------------------------------------------------------------------

type JsonSchema = Record<string, unknown>;

const SUPPORTED_STRING_FORMATS = new Set([
  "date-time",
  "time",
  "date",
  "duration",
  "email",
  "hostname",
  "uri",
  "ipv4",
  "ipv6",
  "uuid",
]);

/** Keep only the JSON-schema keywords structured outputs support. */
function toStrict(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStrict);
  if (!node || typeof node !== "object") return node;
  const src = node as JsonSchema;
  const out: JsonSchema = {};
  for (const key of ["type", "description", "title", "enum", "const", "$ref"] as const) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  for (const key of ["anyOf", "allOf"] as const) {
    if (Array.isArray(src[key])) out[key] = (src[key] as unknown[]).map(toStrict);
  }
  if (Array.isArray(src.oneOf)) out.anyOf = (src.oneOf as unknown[]).map(toStrict);
  if (src.$defs && typeof src.$defs === "object") {
    out.$defs = Object.fromEntries(Object.entries(src.$defs as JsonSchema).map(([k, v]) => [k, toStrict(v)]));
  }
  if (src.type === "object" || src.properties) {
    const properties = (src.properties ?? {}) as JsonSchema;
    out.properties = Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, toStrict(v)]));
    out.required = Array.isArray(src.required) ? src.required : Object.keys(properties);
    out.additionalProperties = false;
  }
  if (src.items !== undefined) out.items = toStrict(src.items);
  if (src.minItems === 0 || src.minItems === 1) out.minItems = src.minItems;
  if (typeof src.format === "string" && SUPPORTED_STRING_FORMATS.has(src.format)) out.format = src.format;
  return out;
}

/** The JSON schema to send as `output_config.format.schema`. */
export function outputJsonSchema(schema: z.ZodType): JsonSchema {
  return toStrict(z.toJSONSchema(schema, { io: "output", unrepresentable: "any" })) as JsonSchema;
}

// ---------------------------------------------------------------------------
// Repair
// ---------------------------------------------------------------------------

const DROP = Symbol("drop");

/** Lowercase, strip apostrophes, and join words with hyphens: "Bird's Eye" → "birds-eye". */
function canon(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map a near-miss onto one of `options`, or null. */
export function matchEnum(value: string, options: readonly string[], aliases: Record<string, string> = {}): string | null {
  if (options.includes(value)) return value;
  const c = canon(value);
  if (!c) return null;
  const byCanon = new Map(options.map((o) => [canon(o), o]));
  const aliasMap = new Map(Object.entries(aliases).map(([k, v]) => [canon(k), v]));
  const lookup = (key: string) => byCanon.get(key) ?? aliasMap.get(key) ?? null;

  const direct = lookup(c) ?? lookup(c.replace(/-/g, "")) ?? (c.endsWith("s") ? lookup(c.slice(0, -1)) : null);
  if (direct) return direct;
  const compact = c.replace(/-/g, "");
  for (const [key, option] of [...byCanon, ...aliasMap]) {
    if (key.replace(/-/g, "") === compact) return option;
  }
  // "medium-close-up-shot" → "medium-close-up", "slow-push-in" → "push-in": the longest option
  // that forms a whole-word prefix or suffix of the value.
  let best: { option: string; length: number } | null = null;
  for (const [key, option] of [...byCanon, ...aliasMap]) {
    if ((c.startsWith(`${key}-`) || c.endsWith(`-${key}`)) && key.length > (best?.length ?? 0)) {
      best = { option, length: key.length };
    }
  }
  return best?.option ?? null;
}

export interface RepairNote {
  path: string;
  from: unknown;
  to: unknown;
}

function repairNode(schema: z.ZodType, value: unknown, path: string, canDrop: boolean, notes: RepairNote[]): unknown {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    if (value === undefined || value === null) return value;
    return repairNode(schema.unwrap() as z.ZodType, value, path, canDrop, notes);
  }
  if (schema instanceof z.ZodEnum) {
    const options = schema.options.map(String);
    const hints = enumRepairs.get(schema) ?? {};
    const matched = typeof value === "string" ? matchEnum(value, options, hints.aliases) : null;
    if (matched !== null) {
      if (matched !== value) notes.push({ path, from: value, to: matched });
      return matched;
    }
    if (hints.fallback !== undefined) {
      notes.push({ path, from: value, to: hints.fallback });
      return hints.fallback;
    }
    if (canDrop) {
      notes.push({ path, from: value, to: "(dropped item)" });
      return DROP;
    }
    notes.push({ path, from: value, to: options[0] });
    return options[0];
  }
  if (schema instanceof z.ZodString) {
    if (value === null || value === undefined) return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return value;
  }
  if (schema instanceof z.ZodNumber) {
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
    return value;
  }
  if (schema instanceof z.ZodArray) {
    if (value === null || value === undefined) return [];
    if (!Array.isArray(value)) return value;
    const element = schema.element as z.ZodType;
    return value.map((item, i) => repairNode(element, item, `${path}[${i}]`, true, notes)).filter((item) => item !== DROP);
  }
  if (schema instanceof z.ZodObject) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const input = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(schema.shape as Record<string, z.ZodType>)) {
      const repaired = repairNode(field, input[key], path ? `${path}.${key}` : key, canDrop, notes);
      if (repaired === DROP) return DROP;
      if (repaired !== undefined) out[key] = repaired;
    }
    return out;
  }
  return value;
}

/** Best-effort repair of model output toward `schema` (see file comment). */
export function repairStructured(schema: z.ZodType, value: unknown): { value: unknown; notes: RepairNote[] } {
  const notes: RepairNote[] = [];
  const repaired = repairNode(schema, value, "", false, notes);
  return { value: repaired === DROP ? value : repaired, notes };
}

export type StructuredParse<T> = { ok: true; data: T; notes: RepairNote[] } | { ok: false; error: z.ZodError; notes: RepairNote[] };

/** Repair, then validate. */
export function parseStructured<S extends z.ZodType>(schema: S, value: unknown): StructuredParse<z.infer<S>> {
  const { value: repaired, notes } = repairStructured(schema, value);
  const result = schema.safeParse(repaired);
  return result.success ? { ok: true, data: result.data, notes } : { ok: false, error: result.error, notes };
}

// ---------------------------------------------------------------------------
// Reading the text of a (possibly fallback-served) message
// ---------------------------------------------------------------------------

interface ContentBlockLike {
  type: string;
  text?: string;
}

/**
 * Candidate JSON strings from a message's content, most likely first.
 *
 * After a mid-stream server-side fallback the content is
 * `[text (partial), fallback, text (continuation)]`: the fallback model
 * continues from the partial, so the full answer is the concatenation of
 * every text block. As a safety net we also try the text after the last
 * fallback boundary and each text block on its own.
 */
export function jsonCandidates(content: readonly ContentBlockLike[]): string[] {
  const texts = content.filter((b) => b.type === "text").map((b) => b.text ?? "");
  const lastFallback = content.map((b) => b.type).lastIndexOf("fallback");
  const afterFallback =
    lastFallback >= 0
      ? content
          .slice(lastFallback + 1)
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("")
      : "";
  const candidates = [texts.join(""), afterFallback, ...texts.slice().reverse()]
    .map((t) => t.trim())
    .filter(Boolean);
  return [...new Set(candidates)];
}

/** Parse the first candidate that is valid JSON, or undefined. */
export function parseJsonCandidates(content: readonly ContentBlockLike[]): unknown {
  for (const candidate of jsonCandidates(content)) {
    try {
      return JSON.parse(candidate);
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}
