import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Any unknown URL, and any `notFound()` without a closer not-found page. */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in py-8">
      <EmptyState
        headingLevel={1}
        icon={<Compass className="size-10" aria-hidden />}
        title="Off the edge of the map"
        description="There's no page at this address. The link may be mistyped, or the page has moved. Chart a course back from here."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/">Home</ButtonLink>
            <ButtonLink href="/learn" variant="secondary">
              Learn
            </ButtonLink>
            <ButtonLink href="/practice" variant="secondary">
              Practice
            </ButtonLink>
            <ButtonLink href="/lab" variant="secondary">
              Story Lab
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
