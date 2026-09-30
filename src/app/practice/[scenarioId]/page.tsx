import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lessonPicksBySkill } from "@/components/practice/lesson-picks";
import { PracticeSessionView } from "@/components/practice/practice-session";
import { toPublicScenario } from "@/components/practice/public-scenario";
import { SCENARIOS, getScenario } from "@/content/scenarios";

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ scenarioId: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/practice/[scenarioId]">): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) return { title: "Drill not found" };
  return {
    title: `${scenario.title} · Practice`,
    description: `${scenario.tagline} ${scenario.description}`,
  };
}

export default async function ScenarioPage({ params }: PageProps<"/practice/[scenarioId]">) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();
  return <PracticeSessionView scenario={toPublicScenario(scenario)} lessonPicks={lessonPicksBySkill()} />;
}
