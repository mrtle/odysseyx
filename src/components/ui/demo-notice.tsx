import { Alert } from "./alert";
import type { CoachMode } from "@/lib/types";

/** Shown next to any AI result produced by the offline demo coach. */
export function DemoNotice({ mode, className }: { mode: CoachMode | undefined; className?: string }) {
  if (mode !== "demo") return null;
  return (
    <Alert tone="warning" title="Demo coach" className={className}>
      This feedback comes from OdysseusX&apos;s offline heuristic coach. Add an <code>ANTHROPIC_API_KEY</code> on the server for
      full AI coaching from Claude.
    </Alert>
  );
}
