import type { Metadata } from "next";
import { lessonPicksBySkill } from "@/components/practice/lesson-picks";
import { toPublicScenario } from "@/components/practice/public-scenario";
import { SessionReview } from "@/components/practice/session-review";
import { SCENARIOS } from "@/content/scenarios";

export const metadata: Metadata = {
  title: "Session review · Practice",
  description: "Reread a practice drill line by line, with its scorecard.",
};

export default async function SessionReviewPage({ params }: PageProps<"/practice/review/[sessionId]">) {
  const { sessionId } = await params;
  return (
    <SessionReview sessionId={sessionId} scenarios={SCENARIOS.map(toPublicScenario)} lessonPicks={lessonPicksBySkill()} />
  );
}
