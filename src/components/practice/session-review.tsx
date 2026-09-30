"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, Gauge, MessageSquareDashed, Play, RotateCcw, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, ThinkingDots } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { PracticeSession } from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import type { LessonPicks } from "./lesson-picks";
import { firstName, type PublicScenario } from "./public-scenario";
import { Scorecard } from "./scorecard";
import { lastActivity } from "./session-time";
import { Transcript } from "./transcript";
import { useSessionScoring } from "./use-session-scoring";

function ReviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading session">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}

/**
 * Delete with an inline confirm. Focus lands on the safe choice (Cancel),
 * Escape backs out, and backing out returns focus to the Delete button.
 */
function DeleteSession({ onDelete }: { onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (confirming || !returnFocus.current) return;
    returnFocus.current = false;
    triggerRef.current?.focus();
  }, [confirming]);

  const cancel = () => {
    returnFocus.current = true;
    setConfirming(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  };

  if (!confirming) {
    return (
      <Button ref={triggerRef} variant="ghost" size="sm" onClick={() => setConfirming(true)} icon={<Trash2 className="size-4" aria-hidden />}>
        Delete
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2" role="group" aria-label="Confirm delete" onKeyDown={onKeyDown}>
      <Button variant="danger" size="sm" onClick={onDelete}>
        Delete session
      </Button>
      <Button variant="ghost" size="sm" autoFocus onClick={cancel}>
        Cancel
      </Button>
    </span>
  );
}

function ScorePrompt({
  session,
  scenario,
  onScored,
}: {
  session: PracticeSession;
  scenario: PublicScenario | undefined;
  onScored: (xp: number) => void;
}) {
  const scoring = useSessionScoring();
  const turns = session.messages.filter((m) => m.role === "user").length;

  if (turns === 0) {
    return (
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <MessageSquareDashed className="size-8 shrink-0 text-sea-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <CardTitle as="h2">Nothing to score yet</CardTitle>
          <CardDescription>You left before saying a line. Step back in and give it a go.</CardDescription>
        </div>
        {scenario ? (
          <ButtonLink href={`/practice/${scenario.id}`} icon={<Play className="size-4" aria-hidden />}>
            Start the drill
          </ButtonLink>
        ) : null}
      </Card>
    );
  }

  return (
    <Card>
      {scoring.pending ? (
        <div className="flex items-center gap-3 py-2" aria-live="polite">
          <ThinkingDots label="Scoring" />
          <p className="text-sea-200">Your coach is reviewing the tape…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Gauge className="size-8 shrink-0 text-bronze-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <CardTitle as="h2">This scene hasn&apos;t been scored</CardTitle>
            <CardDescription>
              {turns} turn{turns === 1 ? "" : "s"} on the record. Get your scorecard now, or step back in and finish the scene first.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                const result = await scoring.score(session.id);
                if (result) onScored(result.xp);
              }}
              icon={<Gauge className="size-4" aria-hidden />}
            >
              Get scored
            </Button>
            {scenario ? (
              <ButtonLink href={`/practice/${scenario.id}`} variant="secondary" icon={<RotateCcw className="size-4" aria-hidden />}>
                Back to the scene
              </ButtonLink>
            ) : null}
          </div>
        </div>
      )}
      {scoring.error ? (
        <Alert tone="error" title="Scoring failed" className="mt-4">
          {scoring.error}
        </Alert>
      ) : null}
    </Card>
  );
}

export function SessionReview({
  sessionId,
  scenarios,
  lessonPicks,
}: {
  sessionId: string;
  scenarios: PublicScenario[];
  lessonPicks: LessonPicks;
}) {
  const hydrated = useHasHydrated();
  const session = useAppStore((s) => s.sessions.find((x) => x.id === sessionId));
  const deleteSession = useAppStore((s) => s.deleteSession);
  const router = useRouter();
  const [xpJustEarned, setXpJustEarned] = useState<number | undefined>(undefined);
  const [deleted, setDeleted] = useState(false);

  if (!hydrated) return <ReviewSkeleton />;

  if (deleted) {
    return (
      <p className="text-sea-300" role="status">
        Session deleted. Heading back to Practice…
      </p>
    );
  }

  if (!session) {
    return (
      <EmptyState
        headingLevel={1}
        icon={<MessageSquareDashed className="size-8" aria-hidden />}
        title="That session has drifted off the map"
        description="It may have been deleted, or it was recorded in another browser — practice history lives on this device."
        action={
          <ButtonLink href="/practice" icon={<ArrowLeft className="size-4" aria-hidden />}>
            Back to Practice
          </ButtonLink>
        }
      />
    );
  }

  const scenario = scenarios.find((s) => s.id === session.scenarioId);
  const persona = scenario?.persona ?? { name: "Scene partner", avatar: "🎬" };
  const turns = session.messages.filter((m) => m.role === "user").length;
  const when = formatRelative(lastActivity(session));

  return (
    <div className="animate-fade-in">
      <ButtonLink href="/practice" variant="ghost" size="sm" className="mb-4 -ml-3" icon={<ArrowLeft className="size-4" aria-hidden />}>
        All drills
      </ButtonLink>
      <PageHeader
        eyebrow="Session review"
        title={scenario?.title ?? "Practice session"}
        description={`With ${persona.name} · ${when} · ${turns} turn${turns === 1 ? "" : "s"}`}
        actions={
          <>
            {scenario ? (
              <ButtonLink href={`/practice/${scenario.id}`} size="sm" variant="secondary" icon={<RotateCcw className="size-4" aria-hidden />}>
                Run it again
              </ButtonLink>
            ) : null}
            <DeleteSession
              onDelete={() => {
                setDeleted(true);
                deleteSession(session.id);
                router.push("/practice");
              }}
            />
          </>
        }
      />

      {session.evaluation && scenario ? (
        <Scorecard
          scenario={scenario}
          evaluation={session.evaluation}
          mode={session.mode}
          xpGained={xpJustEarned}
          lessonPicks={lessonPicks}
          transcriptHref="#transcript"
          autoFocus={xpJustEarned !== undefined}
        />
      ) : session.evaluation ? (
        <Alert tone="info" title="This drill has been retired">
          It scored {session.evaluation.overall}/100: {session.evaluation.headline}
        </Alert>
      ) : (
        <ScorePrompt session={session} scenario={scenario} onScored={setXpJustEarned} />
      )}

      <section id="transcript" aria-labelledby="transcript-heading" className="mt-12 scroll-mt-24">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 id="transcript-heading" className="font-display text-2xl font-semibold text-sea-100">
            Transcript
          </h2>
          <p className="text-sm text-sea-400">
            You and {scenario ? firstName(persona.name) : persona.name}
          </p>
        </div>
        <Card className="p-4 sm:p-6">
          <Transcript messages={session.messages} persona={persona} category={scenario?.category ?? "craft"} />
        </Card>
      </section>
    </div>
  );
}
