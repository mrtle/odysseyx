import type { Metadata } from "next";
import { Suspense } from "react";
import { BackToLab } from "@/components/lab/lab-ui";
import { LoglineTool, LoglineToolFromUrl } from "@/components/lab/logline-tool";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Logline Doctor",
  description: "Score your logline on protagonist, goal, obstacle, stakes, hook and specificity, and get three rewrites that keep your story.",
};

/**
 * Prerendered: "Run again" (`?from=`) is read on the client. The fallback —
 * the empty form — is what the static HTML shows until hydration.
 */
export default function LoglineLabPage() {
  return (
    <div className="animate-fade-in">
      <BackToLab />
      <PageHeader
        eyebrow="Story Lab · Logline Doctor"
        title="One sentence to sell the voyage"
        description="A logline is the promise of your story in a single breath. Paste yours and the doctor will check its six vital signs, then show you three ways to make it sharper — without changing your story."
      />
      <Suspense fallback={<LoglineTool />}>
        <LoglineToolFromUrl />
      </Suspense>
    </div>
  );
}
