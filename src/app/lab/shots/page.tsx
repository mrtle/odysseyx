import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToLab } from "@/components/lab/lab-ui";
import { ShotsTool, ShotsToolFromUrl } from "@/components/lab/shots-tool";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Shot Planner",
  description: "Turn a scene into a shot list with sizes, angles, movement, lenses and sound — each with a storytelling reason — plus coverage notes.",
};

/** Prerendered: "Run again" (`?from=`) is read on the client; the static HTML shows the empty form. */
export default function ShotsLabPage() {
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Shot Planner"
        title="From the page to the call sheet"
        description="Paste a scene and say what you want the audience to feel. You'll get coverage a crew could shoot — every size, angle and move with a reason — and notes on any shots you already have in mind."
      />
      <Suspense fallback={<ShotsTool />}>
        <ShotsToolFromUrl />
      </Suspense>
    </div>
  );
}
