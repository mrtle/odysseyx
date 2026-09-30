import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToLab } from "@/components/lab/lab-ui";
import { StoryTool, StoryToolFromUrl } from "@/components/lab/story-tool";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Story Doctor",
  description: "Map your story onto a structure framework, see which beats land, and get skill scores, line notes and a revision plan.",
};

/** Prerendered: `?from=` and `?framework=` are read on the client; the static HTML shows the empty form. */
export default function StoryLabPage() {
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Story Doctor"
        title="Chart your story, beat by beat"
        description="Choose a structure framework and paste your draft — a personal story, a treatment, a scene. You'll see where each beat lands, what's missing, and which lines to revise first."
      />
      <Suspense fallback={<StoryTool />}>
        <StoryToolFromUrl />
      </Suspense>
    </div>
  );
}
