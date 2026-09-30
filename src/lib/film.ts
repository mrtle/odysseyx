/**
 * Film grammar vocabulary shared by the Shot Planner, the cinematography
 * lessons, the AI prompts and the offline demo coach.
 */
export const SHOT_SIZES = [
  "extreme-wide",
  "wide",
  "full",
  "medium-wide",
  "medium",
  "medium-close-up",
  "close-up",
  "extreme-close-up",
] as const;
export type ShotSize = (typeof SHOT_SIZES)[number];

export const SHOT_FRAMINGS = [
  "single",
  "two-shot",
  "group",
  "over-the-shoulder",
  "pov",
  "insert",
  "establishing",
] as const;
export type ShotFraming = (typeof SHOT_FRAMINGS)[number];

export const CAMERA_ANGLES = [
  "eye-level",
  "high",
  "low",
  "birds-eye",
  "worms-eye",
  "dutch",
  "overhead",
] as const;
export type CameraAngle = (typeof CAMERA_ANGLES)[number];

export const CAMERA_MOVEMENTS = [
  "static",
  "pan",
  "tilt",
  "push-in",
  "pull-out",
  "tracking",
  "crane",
  "handheld",
  "steadicam",
  "zoom",
  "whip-pan",
] as const;
export type CameraMovement = (typeof CAMERA_MOVEMENTS)[number];

export interface FilmTerm {
  label: string;
  abbr?: string;
  /** What the choice communicates emotionally/narratively. */
  effect: string;
}

export const SHOT_SIZE_INFO: Record<ShotSize, FilmTerm> = {
  "extreme-wide": { label: "Extreme Wide", abbr: "EWS", effect: "Scale and isolation — the world dwarfs the character." },
  wide: { label: "Wide", abbr: "WS", effect: "Geography and context — where we are and who is here." },
  full: { label: "Full", abbr: "FS", effect: "Whole body in frame — physical action and body language." },
  "medium-wide": { label: "Medium Wide", abbr: "MWS", effect: "Knees up — character within their environment." },
  medium: { label: "Medium", abbr: "MS", effect: "Waist up — the workhorse of conversation and behaviour." },
  "medium-close-up": { label: "Medium Close-Up", abbr: "MCU", effect: "Chest up — intimacy while keeping gesture." },
  "close-up": { label: "Close-Up", abbr: "CU", effect: "The face — emotion, thought, the moment of decision." },
  "extreme-close-up": { label: "Extreme Close-Up", abbr: "ECU", effect: "A detail — eyes, hands, an object charged with meaning." },
};

export const SHOT_FRAMING_INFO: Record<ShotFraming, FilmTerm> = {
  single: { label: "Single", effect: "One character owns the frame." },
  "two-shot": { label: "Two-Shot", effect: "The relationship itself is the subject." },
  group: { label: "Group", effect: "Dynamics and hierarchy within a group." },
  "over-the-shoulder": { label: "Over-the-Shoulder", abbr: "OTS", effect: "Connects speakers; places us in the conversation." },
  pov: { label: "Point of View", abbr: "POV", effect: "We see exactly what the character sees." },
  insert: { label: "Insert", effect: "Isolates a crucial object or action." },
  establishing: { label: "Establishing", effect: "Orients the audience in time and place." },
};

export const CAMERA_ANGLE_INFO: Record<CameraAngle, FilmTerm> = {
  "eye-level": { label: "Eye Level", effect: "Neutral, honest — we meet the character as an equal." },
  high: { label: "High Angle", effect: "Looking down — vulnerability, smallness, being judged." },
  low: { label: "Low Angle", effect: "Looking up — power, menace, heroism." },
  "birds-eye": { label: "Bird's-Eye", effect: "Godlike detachment; patterns and fate." },
  "worms-eye": { label: "Worm's-Eye", effect: "Extreme low — awe or overwhelming threat." },
  dutch: { label: "Dutch Tilt", effect: "Unease, madness, a world off its axis." },
  overhead: { label: "Overhead", effect: "Straight down — clinical observation or design." },
};

export const CAMERA_MOVEMENT_INFO: Record<CameraMovement, FilmTerm> = {
  static: { label: "Static", effect: "Stillness and composure; lets performance carry the moment." },
  pan: { label: "Pan", effect: "Reveals space horizontally; follows or connects." },
  tilt: { label: "Tilt", effect: "Reveals vertically — scale, power, discovery." },
  "push-in": { label: "Push In", effect: "Growing intensity; we lean into a realisation." },
  "pull-out": { label: "Pull Out", effect: "Withdrawal, isolation, a reveal of context." },
  tracking: { label: "Tracking", effect: "Moves with the character — momentum and journey." },
  crane: { label: "Crane", effect: "Grand vertical movement — openings, endings, epic scope." },
  handheld: { label: "Handheld", effect: "Immediacy, chaos, documentary intimacy." },
  steadicam: { label: "Steadicam", effect: "Floating, dreamlike continuity through space." },
  zoom: { label: "Zoom", effect: "Optical, self-aware emphasis; can feel voyeuristic." },
  "whip-pan": { label: "Whip Pan", effect: "Energy, surprise, a kinetic transition." },
};
