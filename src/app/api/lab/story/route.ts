import { coachErrorResponse, coachMode, generateStructured } from "@/lib/ai/client";
import { STORY_SYSTEM_PROMPT, buildStoryPrompt } from "@/lib/ai/prompts/lab";
import { StoryAnalysisSchema, StoryRequestSchema } from "@/lib/ai/schemas";
import { demoStory } from "@/lib/demo/lab";
import { parseBody } from "@/lib/request";
import { finalizeStory } from "../finalize";

export const maxDuration = 300;

/** Story Doctor: maps a story onto a framework's beats and gives skill scores and line notes. */
export async function POST(req: Request) {
  const parsed = await parseBody(req, StoryRequestSchema);
  if (!parsed.ok) return parsed.response;
  const mode = coachMode();
  try {
    const analysis = finalizeStory(
      mode === "live"
        ? await generateStructured({
            system: STORY_SYSTEM_PROMPT,
            messages: [{ role: "user", content: buildStoryPrompt(parsed.data) }],
            schema: StoryAnalysisSchema,
            effort: "high",
            signal: req.signal,
          })
        : demoStory(parsed.data),
      parsed.data.framework,
    );
    return Response.json({ analysis, mode });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
