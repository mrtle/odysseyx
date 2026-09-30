import type { Metadata } from "next";
import { LabHistory } from "@/components/lab/lab-history";
import { LAB_TOOL_LIST } from "@/components/lab/lab-meta";
import { ToolCard } from "@/components/lab/tool-card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Story Lab",
  description:
    "Bring your own work aboard: scored feedback on loglines, beat-by-beat story notes against six structure frameworks, and shot lists planned from your scenes.",
};

export default function LabPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Story Lab"
        title="Bring your own work aboard"
        description="Lessons teach the craft; the Lab puts your pages on the table. Paste a logline, a story or a scene and get the notes a story editor, a development exec or a cinematographer would give you."
      />

      <section aria-labelledby="lab-tools-heading">
        <h2 id="lab-tools-heading" className="sr-only">
          Tools
        </h2>
        <ul role="list" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LAB_TOOL_LIST.map((tool, i) => (
            <li key={tool.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
              <ToolCard tool={tool} index={i} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lab-history-heading" className="mt-12">
        <div className="mb-5">
          <h2 id="lab-history-heading" className="font-display text-2xl font-semibold text-sea-100">
            Your logbook
          </h2>
          <p className="mt-1 text-sm text-sea-300">
            Every analysis is saved in this browser and feeds your skill profile. Revisit the notes, or run a revision through again.
          </p>
        </div>
        <LabHistory />
      </section>
    </div>
  );
}
