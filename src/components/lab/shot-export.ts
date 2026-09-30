/**
 * Export a shot plan as plain text (for pasting into a doc or message) or
 * CSV (for a spreadsheet or scheduling tool).
 */
import type { Shot, ShotPlan } from "@/lib/ai/schemas";
import { CAMERA_ANGLE_INFO, CAMERA_MOVEMENT_INFO, SHOT_FRAMING_INFO, SHOT_SIZE_INFO } from "@/lib/film";

export function shotSizeLabel(shot: Pick<Shot, "size">): string {
  const info = SHOT_SIZE_INFO[shot.size];
  return info.abbr ? `${info.abbr} — ${info.label}` : info.label;
}

/** A one-line description of the camera set-up, e.g. "MCU · Over-the-Shoulder · Eye Level · Static · 50mm". */
export function shotSetup(shot: Shot): string {
  return [
    SHOT_SIZE_INFO[shot.size].abbr ?? SHOT_SIZE_INFO[shot.size].label,
    SHOT_FRAMING_INFO[shot.framing].label,
    CAMERA_ANGLE_INFO[shot.angle].label,
    CAMERA_MOVEMENT_INFO[shot.movement].label,
    shot.lens,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function shotPlanToText(plan: ShotPlan, title?: string): string {
  const lines: string[] = [];
  if (title) lines.push(title.toUpperCase(), "");
  lines.push(`SCENE: ${plan.sceneSummary}`, `INTENT: ${plan.emotionalIntent}`, `VISUAL CONCEPT: ${plan.visualConcept}`, "", "SHOT LIST");
  for (const shot of plan.shots) {
    lines.push("");
    lines.push(`${shot.number}. ${shotSetup(shot)}`);
    lines.push(`   ${shot.subject}${shot.action ? ` — ${shot.action}` : ""}`);
    lines.push(`   Why: ${shot.purpose}`);
    if (shot.sound.trim()) lines.push(`   Sound: ${shot.sound}`);
  }
  if (plan.coverageNotes.length > 0) {
    lines.push("", "COVERAGE NOTES");
    for (const note of plan.coverageNotes) lines.push(`- ${note}`);
  }
  if (plan.feedbackOnUserShots.length > 0) {
    lines.push("", "NOTES ON YOUR SHOT IDEAS");
    for (const f of plan.feedbackOnUserShots) lines.push(`- "${f.shot}": ${f.note}`);
  }
  return lines.join("\n");
}

/**
 * Quote a CSV cell. Cells that a spreadsheet would treat as a formula are
 * prefixed with an apostrophe so exported text can't execute.
 */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const CSV_HEADERS = ["Shot", "Size", "Framing", "Angle", "Movement", "Lens", "Subject", "Action", "Purpose", "Sound"] as const;

export function shotPlanToCsv(plan: ShotPlan): string {
  const rows = plan.shots.map((s) => [
    s.number,
    shotSizeLabel(s),
    SHOT_FRAMING_INFO[s.framing].label,
    CAMERA_ANGLE_INFO[s.angle].label,
    CAMERA_MOVEMENT_INFO[s.movement].label,
    s.lens,
    s.subject,
    s.action,
    s.purpose,
    s.sound,
  ]);
  return [CSV_HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** A filesystem-friendly slug for download names. */
export function fileSlug(text: string, fallback = "shot-plan"): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug || fallback;
}
