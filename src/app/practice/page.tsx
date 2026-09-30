import type { Metadata } from "next";
import { ClipboardCheck, MessagesSquare, ScrollText } from "lucide-react";
import { PracticeCatalog } from "@/components/practice/practice-catalog";
import { toPublicScenario } from "@/components/practice/public-scenario";
import { PageHeader } from "@/components/ui/page-header";
import { SCENARIOS } from "@/content/scenarios";

export const metadata: Metadata = {
  title: "Practice",
  description:
    "Rehearse the rooms that matter: pitch a studio exec, direct an actor, break an episode with a showrunner — then get a scored breakdown of every line.",
};

const STEPS = [
  { icon: ScrollText, title: "Read the briefing", body: "Who you're facing, what you're after, and how you'll be judged." },
  { icon: MessagesSquare, title: "Play the scene", body: "Type or speak your lines. The persona pushes back like the real thing." },
  { icon: ClipboardCheck, title: "Get your scorecard", body: "Scores per skill, your best line, and rewrites you can use next time." },
];

export default function PracticePage() {
  const scenarios = SCENARIOS.map(toPublicScenario);
  return (
    <>
      <PageHeader
        eyebrow="Practice arena"
        title="Rehearse the rooms that matter"
        description="Every storyteller eventually faces the room: the exec with a hard out, the actor who needs a verb, the showrunner who wants the break by lunch. Rehearse it here, with personas who push back — and a coach who scores every line."
      />

      <ol className="mb-12 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex gap-3 rounded-2xl border border-sea-800 bg-sea-900/40 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-bronze-500/15 text-bronze-300" aria-hidden>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sea-100">
                <span className="sr-only">Step {i + 1}: </span>
                {title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-sea-400">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <PracticeCatalog scenarios={scenarios} />
    </>
  );
}
