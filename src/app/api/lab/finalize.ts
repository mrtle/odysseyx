/**
 * Final shaping of Story Lab results before they reach the client, applied
 * to live and demo output alike: clamp scores (via the shared normalize*
 * helpers), keep logline components in canonical order, and line the story
 * beats up exactly with the chosen framework so the beat map never drifts.
 */
import {
  LOGLINE_COMPONENTS,
  normalizeLogline,
  normalizeShotPlan,
  normalizeStory,
  type LoglineAnalysis,
  type ShotPlan,
  type StoryAnalysis,
} from "@/lib/ai/schemas";
import { FRAMEWORKS, type FrameworkId } from "@/lib/frameworks";

const nonEmpty = (s: string) => s.trim().length > 0;

export function finalizeLogline(analysis: LoglineAnalysis): LoglineAnalysis {
  const n = normalizeLogline(analysis);
  const components = LOGLINE_COMPONENTS.map(
    (key) => n.components.find((c) => c.key === key) ?? { key, score: 0, note: "The coach didn't assess this element — treat it as missing." },
  );
  return {
    ...n,
    components,
    rewrites: n.rewrites.filter((r) => nonEmpty(r.logline)).slice(0, 3),
    questions: n.questions.filter(nonEmpty).slice(0, 4),
  };
}

const beatKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

export function finalizeStory(analysis: StoryAnalysis, framework: FrameworkId): StoryAnalysis {
  const n = normalizeStory(analysis);
  const defs = FRAMEWORKS[framework].beats;
  const pool = [...n.beats];

  // First pass: exact (normalised) name matches, consumed in order so repeated
  // names like Story Spine's "Because of that…" map one-to-one.
  const matched: (StoryAnalysis["beats"][number] | null)[] = defs.map((def) => {
    const index = pool.findIndex((b) => beatKey(b.beat) === beatKey(def.name));
    if (index < 0) return null;
    const [beat] = pool.splice(index, 1);
    return { ...beat, beat: def.name };
  });

  // Second pass: if the model paraphrased names but returned the right count, keep its order.
  const gaps = matched.filter((b) => b === null).length;
  const fillInOrder = gaps > 0 && pool.length === gaps;

  const beats = defs.map((def, i) => {
    const hit = matched[i];
    if (hit) return hit;
    if (fillInOrder) {
      const next = pool.shift();
      if (next) return { ...next, beat: def.name };
    }
    return { beat: def.name, status: "missing" as const, evidence: "", suggestion: def.description };
  });

  return {
    ...n,
    framework,
    beats,
    lineNotes: n.lineNotes.filter((l) => nonEmpty(l.quote)).slice(0, 6),
    revisionPlan: n.revisionPlan.filter(nonEmpty).slice(0, 6),
  };
}

export function finalizeShotPlan(plan: ShotPlan): ShotPlan {
  return normalizeShotPlan({ ...plan, shots: plan.shots.slice(0, 24) });
}
