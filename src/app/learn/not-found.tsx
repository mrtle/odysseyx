import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function LearnNotFound() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in py-8">
      <EmptyState
        headingLevel={1}
        icon={<Compass className="size-10" aria-hidden />}
        title="Off the edge of the map"
        description="We couldn't find that track or lesson. It may have been renamed, or the link has drifted. The full curriculum is one click away."
        action={<ButtonLink href="/learn">Back to the curriculum</ButtonLink>}
      />
    </div>
  );
}
