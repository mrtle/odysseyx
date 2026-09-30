import type { Metadata } from "next";
import { BackToLab } from "@/components/lab/lab-ui";
import { ShotsTool } from "@/components/lab/shots-tool";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Shot Planner",
  description: "Turn a scene into a shot list with sizes, angles, movement, lenses and sound — each with a storytelling reason — plus coverage notes.",
};

export default async function ShotsLabPage({ searchParams }: PageProps<"/lab/shots">) {
  const { from } = await searchParams;
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Shot Planner"
        title="From the page to the call sheet"
        description="Paste a scene and say what you want the audience to feel. You'll get coverage a crew could shoot — every size, angle and move with a reason — and notes on any shots you already have in mind."
      />
      <ShotsTool fromEntryId={typeof from === "string" ? from : undefined} />
    </div>
  );
}
