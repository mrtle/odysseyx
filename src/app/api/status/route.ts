import { MODEL, coachMode } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ mode: coachMode(), model: MODEL });
}
