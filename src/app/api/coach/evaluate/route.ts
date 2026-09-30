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
import { parseBody } from "@/lib/request";
import { getScenario } from "@/content/scenarios";

export const maxDuration = 300;

export async function POST(req: Request) {
  const parsed = await parseBody(req, CoachEvaluateRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { scenarioId, messages, profile } = parsed.data;

  const scenario = getScenario(scenarioId);
  if (!scenario) return Response.json({ error: "That practice scenario doesn't exist." }, { status: 404 });

  if (!messages.some((m) => m.role === "user" && m.content.trim())) {
    return Response.json({ error: "Say at least one line in the scene before asking for a score." }, { status: 400 });
  }

  const mode = coachMode();
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
