/**
 * A saved Story Lab entry keeps its input as a single string. Optional
 * fields (genre, format, directing intent, shot ideas) are appended as
 * labelled sections so the original can be shown in full and restored into
 * the form for "Run again".
 */

export interface LabInputExtra {
  label: string;
  value: string;
}

export interface LabInputParts {
  main: string;
  extras: LabInputExtra[];
}

export const INPUT_LABELS = {
  genre: "Genre",
  format: "Format",
  intent: "Directing intent",
  userShots: "Your shot ideas",
} as const;

const MARKER_RE = /\n\n⟦([^⟧\n]{1,40})⟧\n/;
const MARKER_SPLIT_RE = /\n\n⟦([^⟧\n]{1,40})⟧\n/g;

function marker(label: string): string {
  return `\n\n⟦${label}⟧\n`;
}

/** Join the main text with any non-empty labelled extras. */
export function composeLabInput(main: string, extras: LabInputExtra[] = []): string {
  const body = main.trim();
  return extras
    .map((e) => ({ label: e.label.trim(), value: e.value.trim() }))
    .filter((e) => e.label && e.value)
    .reduce((acc, e) => `${acc}${marker(e.label)}${e.value}`, body);
}

/** Split a composed input back into its main text and labelled extras. */
export function parseLabInput(input: string): LabInputParts {
  if (!MARKER_RE.test(input)) return { main: input.trim(), extras: [] };
  const parts = input.split(MARKER_SPLIT_RE);
  const extras: LabInputExtra[] = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    extras.push({ label: parts[i], value: parts[i + 1].trim() });
  }
  return { main: parts[0].trim(), extras };
}

export function extraValue(parts: LabInputParts, label: string): string | undefined {
  return parts.extras.find((e) => e.label === label)?.value;
}
