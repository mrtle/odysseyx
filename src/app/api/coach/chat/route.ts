/**
 * POST /api/coach/chat — the persona's next line in a practice drill,
 * streamed as plain text. The `x-odysseusx-mode` header says whether Claude
 * ("live") or the offline demo persona ("demo") is speaking.
 */
import { MODEL, coachErrorResponse, coachMode, streamText } from "@/lib/ai/client";
import { buildDirectorNote, buildPersonaSystemPrompt, supportsSystemMessages, toAnthropicMessages } from "@/lib/ai/prompts/practice";
import { CoachChatRequestSchema } from "@/lib/ai/schemas";
import { demoPersonaReply } from "@/lib/demo/practice";
import { badRequest, demoLanguageGuard, notFound, parseBody } from "@/lib/request";
import { getScenario } from "@/content/scenarios";
import type { CoachMode } from "@/lib/types";

export const maxDuration = 300;

function streamHeaders(mode: CoachMode): HeadersInit {
  return {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-odysseusx-mode": mode,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Stream the demo persona's reply a word at a time so it reads like a live reply. */
function streamDemoReply(text: string, signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = text.match(/\S+\s*/g) ?? [text];
  let index = 0;
  let cancelled = false;
  const finish = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    try {
      controller.close();
    } catch {
      // Already closed or cancelled by the client.
    }
  };
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (cancelled || signal.aborted) return finish(controller);
      // A short beat before the first word, like someone drawing breath.
      await sleep(index === 0 ? 380 : 20 + (chunks[index - 1].length % 5) * 5);
      if (cancelled || signal.aborted) return finish(controller);
      controller.enqueue(encoder.encode(chunks[index]));
      index++;
      if (index >= chunks.length) finish(controller);
    },
    cancel() {
      cancelled = true;
    },
  });
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, CoachChatRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { scenarioId, messages, profile } = parsed.data;

  const scenario = getScenario(scenarioId);
  if (!scenario) return notFound("That practice scenario doesn't exist.");

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return badRequest("Say something first — the last message must be yours.");
  }

  const mode = coachMode();
  // Only the new line: an earlier line the demo coach couldn't read shouldn't block the rest of the drill.
  const unreadable = demoLanguageGuard(last.content, mode);
  if (unreadable) return unreadable;
  if (mode === "demo") {
    return new Response(streamDemoReply(demoPersonaReply(scenario, messages), req.signal), { headers: streamHeaders(mode) });
  }

  try {
    const stream = await streamText({
      system: buildPersonaSystemPrompt(scenario, profile),
      messages: toAnthropicMessages(messages, {
        directorNote: buildDirectorNote(scenario, messages),
        noteAsSystem: supportsSystemMessages(MODEL),
      }),
      effort: "low",
      signal: req.signal,
    });
    return new Response(stream, { headers: streamHeaders(mode) });
  } catch (err) {
    return coachErrorResponse(err);
  }
}
