import { getDailyPrompt } from "@/content/daily-prompts";
import { coachErrorResponse, coachMode, generateStructured } from "@/lib/ai/client";
import { DAILY_SYSTEM_PROMPT, buildDailyPrompt } from "@/lib/ai/prompts/daily";
import { DailyFeedbackRequestSchema, MicroFeedbackSchema, normalizeMicro } from "@/lib/ai/schemas";
import { demoDailyFeedback } from "@/lib/demo/daily";
import { demoLanguageGuard, notFound, parseBody } from "@/lib/request";

export const maxDuration = 300;

/** Daily challenge: quick scored feedback on today's micro-story. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, DailyFeedbackRequestSchema);
  if (!parsed.ok) return parsed.response;

  const prompt = getDailyPrompt(parsed.data.promptId);
  if (!prompt) return notFound("That daily challenge doesn't exist (it may have been retired). Reload for today's prompt.");

  const mode = coachMode();
  const unreadable = demoLanguageGuard(parsed.data.response, mode);
  if (unreadable) return unreadable;
  try {
    const feedback =
      mode === "live"
        ? {
            ...normalizeMicro(
              await generateStructured({
                system: DAILY_SYSTEM_PROMPT,
                messages: [{ role: "user", content: buildDailyPrompt(prompt, parsed.data) }],
                schema: MicroFeedbackSchema,
                effort: "medium",
                signal: req.signal,
              }),
            ),
            // The challenge defines which skill it trains, so the skill profile stays consistent.
            skill: prompt.skill,
          }
        : demoDailyFeedback(prompt, parsed.data);
    return Response.json({ feedback, mode });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
