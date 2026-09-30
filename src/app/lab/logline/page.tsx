import type { Metadata } from "next";
import { BackToLab } from "@/components/lab/lab-ui";
import { LoglineTool } from "@/components/lab/logline-tool";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Logline Doctor",
  description: "Score your logline on protagonist, goal, obstacle, stakes, hook and specificity, and get three rewrites that keep your story.",
};

export default async function LoglineLabPage({ searchParams }: PageProps<"/lab/logline">) {
  const { from } = await searchParams;
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Logline Doctor"
        title="One sentence to sell the voyage"
        description="A logline is the promise of your story in a single breath. Paste yours and the doctor will check its six vital signs, then show you three ways to make it sharper — without changing your story."
      />
      <LoglineTool fromEntryId={typeof from === "string" ? from : undefined} />
    </div>
  );
}
