"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton, ThinkingDots } from "@/components/ui/loading";
import { useSpeechSynthesis } from "@/lib/hooks/use-speech";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { CoachMode } from "@/lib/types";
import { Briefing } from "./briefing";
import type { LessonPicks } from "./lesson-picks";
import { PersonaAvatar } from "./persona-avatar";
import { PracticeChat } from "./practice-chat";
import { firstName, type PublicScenario } from "./public-scenario";
import { Scorecard } from "./scorecard";
import { byLastActivity } from "./session-time";
import { useSessionScoring } from "./use-session-scoring";

type Stage =
  | { name: "briefing" }
  | { name: "chat"; sessionId: string; fresh: boolean }
  | { name: "scoring"; sessionId: string }
  | { name: "scorecard"; sessionId: string; xp: number; mode: CoachMode };

function ScoringPanel({
  scenario,
  error,
  onRetry,
  onBack,
}: {
  scenario: PublicScenario;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const name = firstName(scenario.persona.name);
  if (error) {
    return (
      <Card className="mx-auto max-w-xl animate-fade-in">
        <Alert tone="error" title="We couldn't score that scene">
          {error}
        </Alert>
        <p className="mt-4 text-sm text-sea-300">Your transcript is saved. Try again, or step back into the scene and keep going.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onRetry} icon={<RotateCcw className="size-4" aria-hidden />}>
            Try scoring again
          </Button>
          <Button variant="ghost" onClick={onBack} icon={<ArrowLeft className="size-4" aria-hidden />}>
            Back to the scene
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <div className="animate-fade-in space-y-6" aria-busy="true">
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <PersonaAvatar persona={scenario.persona} category={scenario.category} size="lg" />
        <div>
          <h1 className="font-display text-2xl font-semibold text-sea-100">{name} has left the room</h1>
          <p className="mt-2 text-sea-300">Your coach is reviewing the tape — every line, against the rubric.</p>
        </div>
        <ThinkingDots label="Scoring your scene" />
      </Card>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-56 lg:col-span-3" />
        <Skeleton className="h-56 lg:col-span-2" />
      </div>
    </div>
  );
}

export function PracticeSessionView({ scenario, lessonPicks }: { scenario: PublicScenario; lessonPicks: LessonPicks }) {
  const hydrated = useHasHydrated();
  const sessions = useAppStore((s) => s.sessions);
  const startSession = useAppStore((s) => s.startSession);
  const deleteSession = useAppStore((s) => s.deleteSession);
  const autoSpeak = useAppStore((s) => s.settings.autoSpeak);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const synth = useSpeechSynthesis();
  const scoring = useSessionScoring();
  const [stage, setStage] = useState<Stage>({ name: "briefing" });

  // The unfinished attempt the learner touched most recently.
  const resumable = useMemo(
    () =>
      sessions
        .filter((s) => s.scenarioId === scenario.id && !s.evaluation && s.messages.some((m) => m.role === "user"))
        .sort(byLastActivity)[0],
    [sessions, scenario.id],
  );

  // Each stage starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage.name]);

  const start = () => {
    if (!hydrated) return;
    // Clear out abandoned attempts that never got past the opening line.
    for (const s of useAppStore.getState().sessions) {
      if (s.scenarioId === scenario.id && !s.evaluation && !s.messages.some((m) => m.role === "user")) deleteSession(s.id);
    }
    const sessionId = startSession(scenario.id, scenario.openingLine);
    setStage({ name: "chat", sessionId, fresh: true });
  };

  const score = async (sessionId: string) => {
    setStage({ name: "scoring", sessionId });
    const result = await scoring.score(sessionId);
    if (result) setStage({ name: "scorecard", sessionId, xp: result.xp, mode: result.mode });
  };

  if (stage.name === "chat") {
    return (
      <PracticeChat
        key={stage.sessionId}
        scenario={scenario}
        sessionId={stage.sessionId}
        speakOpening={stage.fresh}
        onEnd={() => void score(stage.sessionId)}
      />
    );
  }

  if (stage.name === "scoring") {
    return (
      <ScoringPanel
        scenario={scenario}
        error={scoring.error}
        onRetry={() => void score(stage.sessionId)}
        onBack={() => {
          scoring.clearError();
          setStage({ name: "chat", sessionId: stage.sessionId, fresh: false });
        }}
      />
    );
  }

  if (stage.name === "scorecard") {
    const evaluation = sessions.find((s) => s.id === stage.sessionId)?.evaluation;
    if (evaluation) {
      return (
        <Scorecard
          scenario={scenario}
          evaluation={evaluation}
          mode={stage.mode}
          xpGained={stage.xp}
          lessonPicks={lessonPicks}
          onTryAgain={start}
          transcriptHref={`/practice/review/${stage.sessionId}`}
          autoFocus
          headingLevel={1}
        />
      );
    }
  }

  return (
    <Briefing
      scenario={scenario}
      ready={hydrated}
      onStart={start}
      resumable={hydrated ? resumable : undefined}
      onResume={(sessionId) => setStage({ name: "chat", sessionId, fresh: false })}
      voice={{
        supported: synth.supported,
        enabled: autoSpeak,
        onToggle: () => updateSettings({ autoSpeak: !autoSpeak }),
      }}
    />
  );
}
