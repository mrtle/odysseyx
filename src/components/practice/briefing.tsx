"use client";

import { ArrowLeft, Clock, Lightbulb, MessagesSquare, Play, RotateCcw, Target, UserRound, Volume2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SkillChip } from "@/components/ui/skill-chip";
import type { PracticeSession } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";
import { CATEGORY_META } from "./category";
import { DifficultyPips } from "./difficulty-pips";
import { PersonaAvatar } from "./persona-avatar";
import { firstName, type PublicScenario } from "./public-scenario";
import { lastActivity } from "./session-time";

/** Section titles sit directly under the page's h1, so they're h2s styled like card titles. */
const SECTION_TITLE = "font-display text-lg font-semibold text-sea-100";

export interface BriefingProps {
  scenario: PublicScenario;
  /** False until saved progress has loaded; starting before then would be overwritten. */
  ready: boolean;
  onStart: () => void;
  resumable?: PracticeSession;
  onResume: (sessionId: string) => void;
  voice: { supported: boolean; enabled: boolean; onToggle: () => void };
}

function VoiceSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-sea-700 bg-sea-900/60 px-3.5 py-2.5 text-left text-sm text-sea-200 transition-colors hover:border-sea-500"
    >
      <span className="flex items-center gap-2">
        <Volume2 className="size-4 text-sea-400" aria-hidden />
        Read replies aloud
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-bronze-500" : "bg-sea-700",
        )}
      >
        <span className={cn("absolute size-4 rounded-full bg-sea-100 shadow transition-transform", enabled ? "translate-x-4.5" : "translate-x-0.5")} />
      </span>
    </button>
  );
}

export function Briefing({ scenario, ready, onStart, resumable, onResume, voice }: BriefingProps) {
  const meta = CATEGORY_META[scenario.category];
  const { persona } = scenario;
  const resumeTurns = resumable?.messages.filter((m) => m.role === "user").length ?? 0;

  const startButton = (className?: string) => (
    <Button size="lg" className={cn("w-full", className)} onClick={onStart} disabled={!ready} icon={<Play className="size-4" aria-hidden />}>
      Enter the room
    </Button>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow={`${meta.label} drill · briefing`}
        title={scenario.title}
        description={scenario.description}
        actions={
          <ButtonLink href="/practice" variant="ghost" size="sm" icon={<ArrowLeft className="size-4" aria-hidden />}>
            All drills
          </ButtonLink>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Persona and start — first on mobile, sticky sidebar on desktop */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:order-2 lg:self-start" aria-label={`About ${persona.name}`}>
          <Card>
            <div className="flex items-center gap-4">
              <PersonaAvatar persona={persona} category={scenario.category} size="lg" />
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-sea-100">{persona.name}</p>
                <p className="text-sm text-sea-400">{persona.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-sea-300">{persona.bio}</p>
            <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-sea-800 pt-4 text-center text-xs text-sea-400">
              <div>
                <dt className="sr-only">Difficulty</dt>
                <dd className="flex flex-col items-center gap-1.5">
                  <DifficultyPips difficulty={scenario.difficulty} showLabel className="flex-col" />
                </dd>
              </div>
              <div>
                <dt className="sr-only">Length</dt>
                <dd className="flex flex-col items-center gap-1.5">
                  <Clock className="size-4 text-sea-300" aria-hidden />~{scenario.minutes} min
                </dd>
              </div>
              <div>
                <dt className="sr-only">Exchanges</dt>
                <dd className="flex flex-col items-center gap-1.5">
                  <MessagesSquare className="size-4 text-sea-300" aria-hidden />~{scenario.suggestedTurns} turns
                </dd>
              </div>
            </dl>
            <div className="mt-5 space-y-3">
              {voice.supported ? <VoiceSwitch enabled={voice.enabled} onToggle={voice.onToggle} /> : null}
              {startButton()}
              <p className="text-center text-xs leading-relaxed text-sea-400">
                Type or dictate your lines. End the scene any time after two turns to get your scorecard.
              </p>
            </div>
          </Card>

          {resumable ? (
            <Card className="border-bronze-500/30 bg-bronze-500/5">
              <p className="text-sm font-semibold text-bronze-200">Pick up where you left off</p>
              <p className="mt-1 text-sm text-sea-300">
                You left this scene {formatRelative(lastActivity(resumable))} after {resumeTurns} turn{resumeTurns === 1 ? "" : "s"}.{" "}
                {firstName(persona.name)} is still waiting.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => onResume(resumable.id)} icon={<RotateCcw className="size-3.5" aria-hidden />}>
                  Resume scene
                </Button>
                <ButtonLink href={`/practice/review/${resumable.id}`} size="sm" variant="ghost">
                  Review
                </ButtonLink>
              </div>
            </Card>
          ) : null}
        </aside>

        <div className="space-y-6 lg:order-1">
          <Card>
            <h2 className={cn(SECTION_TITLE, "flex items-center gap-2")}>
              <UserRound className="size-4 text-bronze-400" aria-hidden />
              Your role
            </h2>
            <p className="mt-2 leading-relaxed text-sea-200">{scenario.userRole}</p>
            <h2 className={cn(SECTION_TITLE, "mt-6 flex items-center gap-2")}>
              <Target className="size-4 text-bronze-400" aria-hidden />
              Your objective
            </h2>
            <p className="mt-2 leading-relaxed text-sea-200">{scenario.objective}</p>
            <div className="mt-6 rounded-xl border border-sea-700 bg-sea-950/40 p-4">
              <p className="text-xs font-semibold tracking-wider text-sea-400 uppercase">{firstName(persona.name)} opens with</p>
              <p className="mt-2 font-display text-lg leading-snug text-sea-100 italic">&ldquo;{scenario.openingLine}&rdquo;</p>
            </div>
          </Card>

          <Card>
            <h2 className={SECTION_TITLE}>How you&apos;ll be scored</h2>
            <ul className="mt-4 space-y-4">
              {scenario.rubric.map((criterion) => (
                <li key={criterion.label} className="flex gap-3">
                  <SkillChip skill={criterion.skill} className="mt-0.5 h-fit" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sea-100">{criterion.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-sea-300">{criterion.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className={cn(SECTION_TITLE, "flex items-center gap-2")}>
              <Lightbulb className="size-4 text-bronze-400" aria-hidden />
              Coach&apos;s tips
            </h2>
            <ul className="mt-4 space-y-3">
              {scenario.tips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm leading-relaxed text-sea-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-bronze-400" aria-hidden />
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <div className="lg:hidden">{startButton()}</div>
        </div>
      </div>
    </div>
  );
}
