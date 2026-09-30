import { coachErrorResponse, coachMode, generateStructured } from "@/lib/ai/client";
import { LOGLINE_SYSTEM_PROMPT, buildLoglinePrompt } from "@/lib/ai/prompts/lab";
import { LoglineAnalysisSchema, LoglineRequestSchema } from "@/lib/ai/schemas";
import { demoLogline } from "@/lib/demo/lab";
import { parseBody } from "@/lib/request";
import { finalizeLogline } from "../finalize";

export const maxDuration = 300;

/** Logline Doctor: scores the six logline components and proposes three rewrites. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, LoglineRequestSchema);
  if (!parsed.ok) return parsed.response;
  const mode = coachMode();
  try {
    const analysis = finalizeLogline(
      mode === "live"
        ? await generateStructured({
            system: LOGLINE_SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildLoglinePrompt(parsed.data) }],
            schema: LoglineAnalysisSchema,
            effort: "high",
          })
        : demoLogline(parsed.data),
    );
    return Response.json({ analysis, mode });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
