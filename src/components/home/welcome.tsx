import Link from "next/link";
import { ArrowRight, BookOpen, ChartLine, FlaskConical, Quote, Sailboat, Swords, type LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";
import { SkillBars } from "@/components/ui/skill-bars";
import type { SkillScore } from "@/lib/ai/schemas";
import { SKILL_LIST } from "@/lib/skills";

interface Pillar {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const PILLARS: Pillar[] = [
  {
    icon: BookOpen,
    title: "Learn the craft",
    body: "Seven tracks from desire and stakes to structure, subtext, the camera and the cut — each lesson ends in a quiz and a real exercise.",
    href: "/learn",
    cta: "Browse the tracks",
  },
  {
    icon: Swords,
    title: "Rehearse with AI personas",
    body: "Pitch a studio exec with a hard out. Direct an actor who needs a verb. Break an episode with a showrunner. They push back like the real thing.",
    href: "/practice",
    cta: "See the rooms",
  },
  {
    icon: FlaskConical,
    title: "Get notes in the Story Lab",
    body: "Paste a logline, a story or a scene and get a story editor's read: scored, beat by beat, with rewrites you can actually use.",
    href: "/lab",
    cta: "Open the lab",
  },
  {
    icon: ChartLine,
    title: "Track the voyage",
    body: "Eight skills on one chart, a rank from Deckhand to Odysseus, and a daily challenge that keeps your streak — and your instincts — sharp.",
    href: "/onboarding",
    cta: "Start your log",
  },
];

const SAMPLE_SCORES: SkillScore[] = [
  { skill: "hook", score: 86, comment: "She repeated your one-liner back — the best sign in any room." },
  { skill: "structure", score: 74, comment: "" },
  { skill: "conflict", score: 58, comment: "The world is at stake; the hero isn't. Make it cost her." },
  { skill: "delivery", score: 81, comment: "" },
];

/** A static example of a practice scorecard, labelled as a sample. */
function SampleScorecard() {
  return (
    <Card className="relative overflow-hidden p-0" role="figure" aria-label="Sample scorecard from a practice drill">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-bronze-500/15 blur-3xl"
      />
      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="bronze">Sample scorecard</Badge>
          <span className="text-xs text-sea-400">Practice · The Studio Pitch</span>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <ScoreRing score={77} size={88} stroke={7} label="Overall" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-snug font-semibold text-sea-100">
              A hook she repeated back. Now make the stakes personal.
            </p>
            <p className="mt-1 text-xs text-sea-400">Scored against the development exec&apos;s rubric</p>
          </div>
        </div>
        <SkillBars scores={SAMPLE_SCORES} className="mt-5 space-y-3" />
        <figure className="mt-5 rounded-xl border border-sea-700 bg-sea-950/50 p-3.5">
          <figcaption className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-emerald-300 uppercase">
            <Quote className="size-3" aria-hidden /> Your best line
          </figcaption>
          <blockquote className="mt-1.5 text-sm leading-relaxed text-sea-200">
            &ldquo;A lighthouse keeper going blind has one night to guide her estranged son&apos;s boat through the storm she
            caused.&rdquo;
          </blockquote>
        </figure>
      </div>
    </Card>
  );
}

/** The landing page for visitors who haven't set up a profile yet. */
export function Welcome({ existingXp = 0 }: { existingXp?: number }) {
  return (
    <div className="animate-fade-in space-y-20 pb-4">
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]" aria-labelledby="welcome-heading">
        <div className="animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-bronze-500/30 bg-bronze-500/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-bronze-300 uppercase">
            <Sailboat className="size-3.5" aria-hidden /> Your AI storytelling coach
          </p>
          <h1
            id="welcome-heading"
            className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-sea-100 sm:text-5xl lg:text-6xl"
          >
            Every story is an <span className="text-bronze-300 italic">odyssey</span>.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-sea-300">
            OdysseusX is the coach for the whole voyage, from the first spark of an idea to the room where you pitch it. Learn the
            craft, rehearse with AI personas who push back like the real thing, and get specific, scored notes on your loglines,
            stories and shot lists.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/onboarding" size="lg" icon={<Sailboat className="size-5" aria-hidden />}>
              Begin your voyage
            </ButtonLink>
            <ButtonLink href="/learn" size="lg" variant="secondary">
              Browse the lessons
            </ButtonLink>
          </div>
          {existingXp > 0 ? (
            <Alert tone="tip" title={`Your log already holds ${existingXp.toLocaleString("en-US")} XP`} className="mt-5 max-w-xl">
              Finish setting your course and your dashboard, skill chart and daily challenge will pick up right where you left
              off.
            </Alert>
          ) : (
            <p className="mt-4 text-sm text-sea-400">Two minutes to set up. Your progress stays in this browser.</p>
          )}
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <SampleScorecard />
        </div>
      </section>

      <section aria-labelledby="pillars-heading">
        <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">How the coach trains you</p>
        <h2 id="pillars-heading" className="mt-2 font-display text-3xl font-semibold text-sea-100">
          Four ways to get better, every day
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, body, href, cta }, i) => (
            <li key={title} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-sea-700/80 bg-sea-900/60 p-5 shadow-xl shadow-black/20 transition-colors hover:border-bronze-500/50"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-xl bg-bronze-500/15 text-bronze-300"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <span className="mt-4 font-display text-lg font-semibold text-sea-100 group-hover:text-bronze-200">{title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-sea-300">{body}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-bronze-300">
                  {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="skills-heading" className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">What gets measured</p>
          <h2 id="skills-heading" className="mt-2 font-display text-3xl font-semibold text-sea-100">
            Eight skills, one chart
          </h2>
          <p className="mt-3 text-base leading-relaxed text-sea-300">
            Every lesson, drill and analysis maps onto the same eight skills, so you can see exactly where your storytelling is
            strong — and where the next voyage should take you.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SKILL_LIST.map((skill) => (
            <li key={skill.id} className="rounded-xl border border-sea-800 bg-sea-900/40 px-4 py-3">
              <p className="text-sm font-semibold text-sea-100">{skill.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-sea-400">{skill.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-bronze-500/30 bg-gradient-to-br from-sea-900 via-sea-900 to-bronze-700/20 px-6 py-10 text-center sm:px-10">
        <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-sea-100 italic sm:text-3xl">
          &ldquo;Tell me, O Muse, of that ingenious hero who travelled far and wide…&rdquo;
        </p>
        <p className="mt-3 text-sm text-sea-400">— Homer, the first storyteller we know by name</p>
        <p className="mx-auto mt-6 max-w-xl text-base text-sea-300">
          Your story deserves the same care. Set your course and meet your coach.
        </p>
        <ButtonLink href="/onboarding" size="lg" className="mt-6" icon={<Sailboat className="size-5" aria-hidden />}>
          Begin your voyage
        </ButtonLink>
      </section>
    </div>
  );
}
