"use client";

import { useEffect } from "react";
import { LifeBuoy, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Error boundary for every page: the app shell stays, the page shows a way back. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in py-8">
      <EmptyState
        headingLevel={1}
        icon={<LifeBuoy className="size-10" aria-hidden />}
        title="This page hit rough water"
        description={
          <>
            Something went wrong while showing it. Your saved progress is untouched. Try again, or head home and pick
            up where you left off.
            {error.digest ? <span className="mt-2 block text-xs text-sea-400">Reference: {error.digest}</span> : null}
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => retry()} icon={<RotateCcw className="size-4" aria-hidden />}>
              Try again
            </Button>
            <ButtonLink href="/" variant="secondary">
              Back to Home
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
