import type { Metadata } from "next";
import { BackToLab } from "@/components/lab/lab-ui";
import { StoryTool } from "@/components/lab/story-tool";
import { PageHeader } from "@/components/ui/page-header";
import { isFrameworkId } from "@/lib/frameworks";

export const metadata: Metadata = {
  title: "Story Doctor",
  description: "Map your story onto a structure framework, see which beats land, and get skill scores, line notes and a revision plan.",
};

export default async function StoryLabPage({ searchParams }: PageProps<"/lab/story">) {
  const { from, framework } = await searchParams;
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Story Doctor"
        title="Chart your story, beat by beat"
        description="Choose a structure framework and paste your draft — a personal story, a treatment, a scene. You'll see where each beat lands, what's missing, and which lines to revise first."
      />
      <StoryTool
        fromEntryId={typeof from === "string" ? from : undefined}
        initialFramework={isFrameworkId(framework) ? framework : undefined}
      />
    </div>
  );
}
