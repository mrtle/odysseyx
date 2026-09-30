/**
 * Server-side request parsing for route handlers.
 */
import type { z } from "zod";

export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Parse and validate a JSON body, returning a 400 response on failure. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<ParseResult<z.infer<S>>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, response: Response.json({ error: "Request body must be JSON." }, { status: 400 }) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return {
      ok: false,
      response: Response.json({ error: `Invalid request — ${where}${issue?.message ?? "bad input"}` }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}
