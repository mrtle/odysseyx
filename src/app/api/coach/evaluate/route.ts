/**
 * POST /api/coach/evaluate — the scorecard for a finished practice drill.
 * Returns `{ evaluation, mode }`.
 */
import { coachErrorResponse, coachMode, generateStructured } from "@/lib/ai/client";
import {
  alignEvaluation,
  buildEvaluationSystemPrompt,
  buildEvaluationUserContent,
} from "@/lib/ai/prompts/practice";
import { CoachEvaluateRequestSchema, EvaluationSchema, normalizeEvaluation } from "@/lib/ai/schemas";
import { demoEvaluate } from "@/lib/demo/practice";
import { badRequest, demoLanguageGuard, notFound, parseBody } from "@/lib/request";
import { getScenario } from "@/content/scenarios";

export const maxDuration = 300;

const LANGUAGE_SAMPLE_PER_LINE = 500;

export async function POST(req: Request) {
  const parsed = await parseBody(req, CoachEvaluateRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { scenarioId, messages, profile } = parsed.data;

  const scenario = getScenario(scenarioId);
  if (!scenario) return notFound("That practice scenario doesn't exist.");

  const learnerLines = messages.filter((m) => m.role === "user" && m.content.trim());
  if (learnerLines.length === 0) return badRequest("Say at least one line in the scene before asking for a score.");

  const mode = coachMode();
  // A slice of every learner line, so a long first line can't decide for the whole drill.
  const unreadable = demoLanguageGuard(learnerLines.map((m) => m.content.slice(0, LANGUAGE_SAMPLE_PER_LINE)).join("\n"), mode);
  if (unreadable) return unreadable;
  try {
    const evaluation =
      mode === "live"
        ? alignEvaluation(
            normalizeEvaluation(
              await generateStructured({
                system: buildEvaluationSystemPrompt(scenario, profile),
                messages: [{ role: "user", content: buildEvaluationUserContent(scenario, messages) }],
                schema: EvaluationSchema,
                effort: "high",
                signal: req.signal,
              }),
            ),
            scenario,
          )
        : demoEvaluate(scenario, messages);
    return Response.json({ evaluation, mode });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
