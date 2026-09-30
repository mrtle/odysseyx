import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingFlow, OnboardingFlowFromUrl } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Set your course",
  description: "Tell OdysseusX who you are and what you're making, and your coach will chart a course around it.",
};

/**
 * Prerendered: where to return after saving (`?from=`) is read on the client.
 * The fallback renders the same flow (its loading state) until then.
 */
export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <Suspense fallback={<OnboardingFlow />}>
        <OnboardingFlowFromUrl />
      </Suspense>
    </div>
  );
}
