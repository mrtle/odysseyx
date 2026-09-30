import { useId } from "react";
import type { SkillStat } from "@/lib/progress";
import { SKILLS, SKILL_IDS, type SkillId } from "@/lib/skills";
import { cn } from "@/lib/utils";

const CENTER = 200;
const RADIUS = 112;
const LABEL_RADIUS = 136;
/** Wider than tall so side labels ("Character") never clip. */
const VIEW_BOX = "-24 8 448 384";
const RINGS = [25, 50, 75, 100];

export interface RadarPoint {
  skill: SkillId;
  /** 0–100, or null when unmeasured (plotted at 0). */
  score: number | null;
}

/** Axis angle in radians, starting at 12 o'clock and running clockwise. */
function angleFor(index: number, count: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / count;
}

function polar(index: number, count: number, r: number): [number, number] {
  const a = angleFor(index, count);
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function ringPoints(value: number, count: number): string {
  return Array.from({ length: count }, (_, i) =>
    polar(i, count, (RADIUS * value) / 100)
      .map(round)
      .join(","),
  ).join(" ");
}

/** Screen position and alignment for an axis label. */
export function labelLayout(index: number, count: number) {
  const [x, y] = polar(index, count, LABEL_RADIUS);
  const cos = Math.cos(angleFor(index, count));
  const sin = Math.sin(angleFor(index, count));
  const anchor: "start" | "middle" | "end" = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
  // Nudge labels above/below the chart so the two-line label clears the ring.
  const dy = sin < -0.5 ? -14 : sin > 0.5 ? 10 : -4;
  return { x: round(x), y: round(y + dy), anchor };
}

export function toRadarPoints(profile: Record<SkillId, SkillStat>): RadarPoint[] {
  return SKILL_IDS.map((skill) => ({ skill, score: profile[skill]?.score ?? null }));
}

/**
 * The learner's eight-skill profile as a radar chart. Pure SVG, scales to
 * its container. Unmeasured skills sit at the centre and read "—".
 */
export function SkillRadar({
  points,
  className,
  showScores = true,
  title = "Skill profile",
}: {
  points: RadarPoint[];
  className?: string;
  /** Print each axis's score (or "—") under its label. */
  showScores?: boolean;
  title?: string;
}) {
  const id = useId();
  const count = points.length;
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  const vertices = points.map((p, i) => polar(i, count, (RADIUS * clamp(p.score ?? 0)) / 100));
  const measured = points.filter((p) => p.score !== null);
  const description =
    points
      .map((p) => `${SKILLS[p.skill].name}: ${p.score === null ? "not yet measured" : `${Math.round(p.score)} out of 100`}`)
      .join("; ") + ".";

  return (
    <svg viewBox={VIEW_BOX} role="img" aria-labelledby={`${id}-title ${id}-desc`} className={cn("h-auto w-full", className)}>
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{description}</desc>

      {/* Grid rings and axes: solid hairlines, one step off the surface. */}
      <g aria-hidden>
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={ringPoints(ring, count)}
            className={cn("fill-none", ring === 100 ? "stroke-sea-600" : "stroke-sea-700/80")}
            strokeWidth={1}
          />
        ))}
        {points.map((p, i) => {
          const [x, y] = polar(i, count, RADIUS);
          return (
            <line
              key={p.skill}
              x1={CENTER}
              y1={CENTER}
              x2={round(x)}
              y2={round(y)}
              className="stroke-sea-700/80"
              strokeWidth={1}
            />
          );
        })}
        {[50, 100].map((ring) => (
          <text
            key={ring}
            x={CENTER + 5}
            y={round(CENTER - (RADIUS * ring) / 100 + 12)}
            className="fill-sea-500 text-[11px] tabular-nums"
          >
            {ring}
          </text>
        ))}
      </g>

      {/* The profile polygon. */}
      {measured.length > 0 ? (
        <polygon
          points={vertices.map((v) => v.map(round).join(",")).join(" ")}
          className="fill-bronze-400/20 stroke-bronze-400 transition-all duration-700"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ) : null}
      {points.map((p, i) =>
        p.score === null ? null : (
          <g key={p.skill}>
            <circle
              cx={round(vertices[i][0])}
              cy={round(vertices[i][1])}
              r={5}
              className="fill-bronze-300 stroke-sea-950"
              strokeWidth={2}
            />
            {/* Generous invisible hit target for the native tooltip. */}
            <circle cx={round(vertices[i][0])} cy={round(vertices[i][1])} r={14} className="fill-transparent">
              <title>{`${SKILLS[p.skill].name}: ${Math.round(p.score)}`}</title>
            </circle>
          </g>
        ),
      )}

      {/* Axis labels in text ink, with the score (or a dash) beneath. */}
      <g aria-hidden>
        {points.map((p, i) => {
          const { x, y, anchor } = labelLayout(i, count);
          return (
            <text key={p.skill} x={x} y={y} textAnchor={anchor} className="fill-sea-200 text-[15px] font-medium">
              <tspan x={x}>{SKILLS[p.skill].short}</tspan>
              {showScores ? (
                <tspan
                  x={x}
                  dy={18}
                  className={cn("text-[14px] tabular-nums", p.score === null ? "fill-sea-500" : "fill-sea-300")}
                >
                  {p.score === null ? "—" : Math.round(p.score)}
                </tspan>
              ) : null}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
