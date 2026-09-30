import type { Ref } from "react";
import { ChartColumn, CircleCheck, ListChecks, Map as MapIcon, Quote, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillBars } from "@/components/ui/skill-bars";
import type { StoryAnalysis } from "@/lib/ai/schemas";
import { FRAMEWORKS } from "@/lib/frameworks";
import type { CoachMode } from "@/lib/types";
import { BeatMap } from "./beat-map";
import { SectionHeading } from "./lab-ui";
import { RevisionChecklist } from "./revision-checklist";

/** The Story Doctor's notes: overall read, beat map, skills, strengths, fixes, line notes and a plan. */
export function StoryResult({
  analysis,
  mode,
  entryId,
  headingRef,
}: {
  analysis: StoryAnalysis;
  mode: CoachMode;
  /** The saved entry's id, used to remember revision-plan ticks. */
  entryId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const framework = FRAMEWORKS[analysis.framework];
  const landed = analysis.beats.filter((b) => b.status === "strong" || b.status === "present").length;

  return (
    <div className="animate-rise space-y-8">
      <Card className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-gradient-to-br from-aegean-400/15 to-transparent blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <ScoreRing score={analysis.overall} size={116} stroke={10} label="Overall" className="shrink-0 self-center sm:self-auto" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-aegean-300 uppercase">Story notes</p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-1 scroll-mt-24 font-display text-xl leading-snug font-semibold text-sea-100 focus:outline-none sm:text-2xl">
              {analysis.headline}
            </h2>
            <p className="mt-3 leading-relaxed text-sea-300">{analysis.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="aegean">{framework.name}</Badge>
              <Badge tone="neutral">
                {landed} of {analysis.beats.length} beats land
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <DemoNotice mode={mode} />

      <section aria-labelledby="story-beats">
        <SectionHeading
          id="story-beats"
          icon={<MapIcon className="size-4" />}
          title="Beat map"
          description={`Your story charted against ${framework.name}. Select a beat to see the evidence and the fix.`}
        />
        <Card>
          <BeatMap beats={analysis.beats} framework={analysis.framework} />
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="story-skills">
          <SectionHeading id="story-skills" icon={<ChartColumn className="size-4" />} title="Skill scores" />
          <Card>
            <SkillBars scores={analysis.skillScores} />
          </Card>
        </section>
        <section aria-labelledby="story-strengths">
          <SectionHeading id="story-strengths" icon={<CircleCheck className="size-4" />} title="What's working" />
          <Card>
            <ul className="space-y-3">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-sea-200">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      {analysis.improvements.length > 0 ? (
        <section aria-labelledby="story-improvements">
          <SectionHeading id="story-improvements" icon={<Wrench className="size-4" />} title="What to fix first" description="In order of impact." />
          <ol className="grid gap-3 md:grid-cols-2">
            {analysis.improvements.map((imp, i) => (
              <li key={i} className="flex flex-col rounded-xl border border-sea-700/80 bg-sea-900/60 p-4 sm:p-5">
                <h3 className="flex items-start gap-2 font-semibold text-sea-100">
                  <span className="font-display text-bronze-300">{i + 1}.</span>
                  <span>{imp.title}</span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-sea-300">{imp.detail}</p>
                {imp.example.trim() ? (
                  <div className="mt-3 rounded-lg border border-bronze-500/25 bg-bronze-500/[0.06] px-3 py-2">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-bronze-400 uppercase">Try</p>
                    <p className="mt-1 text-sm leading-relaxed text-bronze-100">{imp.example}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.lineNotes.length > 0 ? (
        <section aria-labelledby="story-lines">
          <SectionHeading id="story-lines" icon={<Quote className="size-4" />} title="Line notes" description="Specific lines, in the margin." />
          <Card className="p-0">
            <ul className="divide-y divide-sea-700/70">
              {analysis.lineNotes.map((n, i) => (
                <li key={i} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-6 sm:p-5">
                  <blockquote className="border-l-2 border-bronze-500/50 pl-3 font-display leading-relaxed text-sea-100 italic">“{n.quote}”</blockquote>
                  <p className="text-sm leading-relaxed text-sea-300">{n.note}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {analysis.revisionPlan.length > 0 ? (
        <section aria-labelledby="story-plan">
          <SectionHeading id="story-plan" icon={<ListChecks className="size-4" />} title="Revision plan" description="Your next draft, step by step." />
          <Card>
            <RevisionChecklist steps={analysis.revisionPlan} storageKey={entryId} />
          </Card>
        </section>
      ) : null}
    </div>
  );
}
