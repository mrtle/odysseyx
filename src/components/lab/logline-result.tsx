import type { Ref } from "react";
import { CircleHelp, HeartPulse, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillChip } from "@/components/ui/skill-chip";
import type { LoglineAnalysis } from "@/lib/ai/schemas";
import { LOGLINE_SKILL_MAP } from "@/lib/progress";
import type { CoachMode } from "@/lib/types";
import { cn, SCORE_TONE_CLASS, scoreTone, wordCount } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { LOGLINE_COMPONENT_META } from "./lab-meta";
import { SectionHeading } from "./lab-ui";

const SEGMENT_TONE: Record<ReturnType<typeof scoreTone>, string> = {
  low: "bg-rose-400",
  mid: "bg-amber-300",
  good: "bg-emerald-300",
  great: "bg-sky-300",
};

function ComponentMeter({ item }: { item: LoglineAnalysis["components"][number] }) {
  const meta = LOGLINE_COMPONENT_META[item.key];
  const score = Math.max(0, Math.min(10, Math.round(item.score)));
  const tone = scoreTone(score * 10);
  return (
    <li className="flex flex-col rounded-xl border border-sea-700/80 bg-sea-950/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-sea-100">{meta.label}</h3>
        <span className={cn("font-display text-lg font-bold tabular-nums", SCORE_TONE_CLASS[tone])}>
          {score}
          <span className="text-xs font-medium text-sea-400">/10</span>
        </span>
      </div>
      <div role="img" aria-label={`${meta.label}: ${score} out of 10`} className="mt-2 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full", i < score ? SEGMENT_TONE[tone] : "bg-sea-800")} />
        ))}
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-sea-200">{item.note}</p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-sea-400">
        <span>Feeds</span>
        <SkillChip skill={LOGLINE_SKILL_MAP[item.key]} />
      </div>
    </li>
  );
}

/** The Logline Doctor's diagnosis: overall score, vital signs, rewrites and questions. */
export function LoglineResult({
  analysis,
  mode,
  logline,
  headingRef,
}: {
  analysis: LoglineAnalysis;
  mode: CoachMode;
  /** The logline that was analysed, shown for context. */
  logline?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="animate-rise space-y-8">
      <Card className="relative overflow-clip">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-gradient-to-br from-bronze-400/15 to-transparent blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={analysis.overall} size={116} stroke={10} label="Overall" className="shrink-0 self-center sm:self-auto" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Diagnosis</p>
            <h2 ref={headingRef} tabIndex={-1} className="mt-1 scroll-mt-12 font-display text-xl leading-snug font-semibold text-sea-100 focus:outline-none sm:text-2xl">
              {analysis.verdict}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sea-300">
              <Badge tone="aegean" className="mr-2 align-middle">
                Genre read
              </Badge>
              {analysis.genreRead}
            </p>
          </div>
        </div>
        {logline ? (
          <blockquote className="relative mt-5 border-l-2 border-bronze-500/50 pl-4 font-display text-base leading-relaxed text-sea-200 italic">
            {logline}
          </blockquote>
        ) : null}
      </Card>

      <DemoNotice mode={mode} />

      <section aria-labelledby="logline-vitals">
        <SectionHeading
          id="logline-vitals"
          icon={<HeartPulse className="size-4" />}
          title="Vital signs"
          description="Each element a logline needs, scored out of 10."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analysis.components.map((c) => (
            <ComponentMeter key={c.key} item={c} />
          ))}
        </ul>
      </section>

      {analysis.rewrites.length > 0 ? (
        <section aria-labelledby="logline-rewrites">
          <SectionHeading
            id="logline-rewrites"
            icon={<PenLine className="size-4" />}
            title="Three ways forward"
            description="Your story, restructured. Brackets mark what only you can fill in."
          />
          <ol className="space-y-3">
            {analysis.rewrites.map((r, i) => (
              <li key={`${r.angle}-${i}`} className="rounded-xl border border-sea-700/80 bg-sea-900/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="bronze">
                    <span className="font-display">{i + 1}</span>
                    <span aria-hidden>·</span>
                    {r.angle}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sea-400 tabular-nums">{wordCount(r.logline)} words</span>
                    <CopyButton text={r.logline} srLabel={`Copy rewrite ${i + 1}: ${r.angle}`} />
                  </div>
                </div>
                <p className="mt-3 font-display text-lg leading-relaxed text-sea-100">{r.logline}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {analysis.questions.length > 0 ? (
        <section aria-labelledby="logline-questions">
          <SectionHeading
            id="logline-questions"
            icon={<CircleHelp className="size-4" />}
            title="Questions before the next draft"
            description="Answer these honestly and the next version will write itself."
          />
          <Card>
            <ol className="space-y-3">
              {analysis.questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sea-200">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bronze-500/15 font-display text-sm font-bold text-bronze-300" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{q}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
