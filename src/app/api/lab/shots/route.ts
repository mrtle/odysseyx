import { coachErrorResponse, coachMode, generateStructured } from "@/lib/ai/client";
import { SHOTS_SYSTEM_PROMPT, buildShotsPrompt } from "@/lib/ai/prompts/lab";
import { ShotPlanSchema, ShotsRequestSchema } from "@/lib/ai/schemas";
import { demoShots } from "@/lib/demo/lab";
import { parseBody } from "@/lib/request";
import { finalizeShotPlan } from "../finalize";

export const maxDuration = 300;

/** Shot Planner: turns a scene into a shot list with a visual concept and coverage notes. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, ShotsRequestSchema);
  if (!parsed.ok) return parsed.response;
  const mode = coachMode();
  try {
    const plan = finalizeShotPlan(
      mode === "live"
        ? await generateStructured({
            system: SHOTS_SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildShotsPrompt(parsed.data) }],
            schema: ShotPlanSchema,
            effort: "high",
            signal: req.signal,
          })
        : demoShots(parsed.data),
    );
    return Response.json({ plan, mode });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
