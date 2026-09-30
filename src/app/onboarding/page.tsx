import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = {
  title: "Set your course",
  description: "Tell OdysseusX who you are and what you're making, and your coach will chart a course around it.",
};

/** Where to go after saving: only known in-app destinations are allowed. */
const RETURN_TO: Record<string, string> = { progress: "/progress", home: "/" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const { from } = await searchParams;
  const returnTo = (typeof from === "string" && RETURN_TO[from]) || "/";
  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <OnboardingFlow returnTo={returnTo} />
    </div>
  );
}
