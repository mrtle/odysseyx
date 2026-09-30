/**
 * Validation for progress read back from localStorage or an imported
 * backup. Stored data can be anything: an older or newer version of the
 * app, a manual edit, a half-written value. Each field is checked with
 * small hand-written guards (no zod, so client bundles stay light), and
 * values from closed vocabularies — skill ids, logline components, beat
 * statuses, frameworks, shot grammar — are checked against the lists the
 * pages look them up in, so an unknown value can never crash a page.
 * Invalid records and list items are dropped (and counted, so Import can
 * say how many), unknown enum values that have a safe neutral reading are
 * mapped to it, and invalid fields fall back to defaults: one bad entry
 * never crashes a page or wipes everything else.
 */
import { BEAT_STATUSES, EXPERIENCE_LEVELS, GOAL_IDS, LOGLINE_COMPONENTS } from "@/lib/constants";
import { CAMERA_ANGLES, CAMERA_MOVEMENTS, SHOT_FRAMINGS, SHOT_SIZES } from "@/lib/film";
import { FRAMEWORK_IDS } from "@/lib/frameworks";
import { SKILL_IDS } from "@/lib/skills";
import { TRACK_IDS } from "@/lib/types";
import type {
  ChatMessage,
  DailyEntry,
  LabEntry,
  LessonProgress,
  PracticeSession,
  Profile,
  XpEvent,
} from "@/lib/types";

/** Everything the store persists (mirrors `AppData` in ./store.ts). */
export interface PersistedData {
  profile: Profile | null;
  lessonProgress: Record<string, LessonProgress>;
  sessions: PracticeSession[];
  labEntries: LabEntry[];
  daily: Record<string, DailyEntry>;
  xp: number;
  xpLog: XpEvent[];
  activityDates: string[];
  settings: { autoSpeak: boolean };
}

/** What validation had to change. Pass one to `sanitizePersisted` to find out. */
export interface SanitizeReport {
  /** Records and list items left out: sessions, lab entries, messages, skill scores, beats, shots… */
  dropped: number;
  /** Values outside a closed vocabulary mapped to a neutral one (beat status → "present", shot size → "medium"…). */
  repaired: number;
}

type Rec = Record<string, unknown>;

const isRecord = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isOneOf = <T extends string>(values: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (values as readonly string[]).includes(v);
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

type FieldKind = "string" | "number" | "array" | "object";

/** True when `value` is an object whose listed fields have the listed kinds. */
function hasShape(value: unknown, shape: Record<string, FieldKind>): value is Rec {
  if (!isRecord(value)) return false;
  return Object.entries(shape).every(([key, kind]) => fieldOk(value[key], kind));
}

function fieldOk(field: unknown, kind: FieldKind): boolean {
  if (kind === "array") return Array.isArray(field);
  if (kind === "object") return isRecord(field);
  if (kind === "number") return isNumber(field);
  return isString(field);
}

const EMPTY: Record<FieldKind, () => unknown> = { string: () => "", number: () => 0, array: () => [], object: () => ({}) };

/**
 * Coerce a stored result toward `shape`: fields listed in `required` must be
 * valid (else null — the record is unusable); other listed fields that are
 * missing or mistyped get an empty default, so screens that map over them
 * don't crash. Extra fields are kept.
 */
function coerceShape(value: unknown, shape: Record<string, FieldKind>, required: readonly string[]): Rec | null {
  if (!isRecord(value)) return null;
  const out: Rec = { ...value };
  for (const [key, kind] of Object.entries(shape)) {
    if (fieldOk(value[key], kind)) continue;
    if (required.includes(key)) return null;
    out[key] = EMPTY[kind]();
  }
  return out;
}

/** Validation state threaded through one `sanitizePersisted` call. */
class Tally implements SanitizeReport {
  dropped = 0;
  repaired = 0;

  /** Keep the items `item` can read (null = drop), counting the rest. */
  list<T>(values: unknown[], item: (x: unknown, index: number) => T | null): T[] {
    const out: T[] = [];
    values.forEach((value, index) => {
      const read = item(value, index);
      if (read === null) this.dropped++;
      else out.push(read);
    });
    return out;
  }

  /** A value from a closed vocabulary, or `fallback` (counted as a repair). */
  oneOf<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
    if (isOneOf(values, value)) return value;
    this.repaired++;
    return fallback;
  }
}

/**
 * An object whose `strings` fields are strings: `required` ones must be
 * present (else null), the others default to "". Extra fields are kept.
 */
function stringRecord(value: unknown, required: readonly string[], optional: readonly string[] = []): Rec | null {
  if (!isRecord(value) || !required.every((key) => isString(value[key]))) return null;
  const out: Rec = { ...value };
  for (const key of optional) if (!isString(out[key])) out[key] = "";
  return out;
}

const text = (v: unknown): string | null => (isString(v) ? v : null);

/** Skill scores for known skills only (the pages look each id up in SKILLS), one per skill. */
function skillScores(t: Tally, values: unknown[]): Rec[] {
  const seen = new Set<string>();
  return t.list(values, (s) => {
    if (!isRecord(s) || !isOneOf(SKILL_IDS, s.skill) || !isNumber(s.score) || seen.has(s.skill)) return null;
    seen.add(s.skill);
    return { ...s, comment: isString(s.comment) ? s.comment : "" };
  });
}

const improvement = (v: unknown) => stringRecord(v, ["title", "detail"], ["example"]);

function sanitizeEvaluation(t: Tally, v: unknown): Rec | null {
  const e = coerceShape(
    v,
    {
      overall: "number",
      headline: "string",
      summary: "string",
      skillScores: "array",
      strengths: "array",
      improvements: "array",
      bestMoment: "string",
      nextStep: "object",
    },
    ["overall", "skillScores"],
  );
  if (!e) return null;
  e.skillScores = skillScores(t, e.skillScores as unknown[]);
  e.strengths = t.list(e.strengths as unknown[], text);
  e.improvements = t.list(e.improvements as unknown[], improvement);
  const next = e.nextStep as Rec;
  e.nextStep = { title: isString(next.title) ? next.title : "", description: isString(next.description) ? next.description : "" };
  return e;
}

function sanitizeLogline(t: Tally, v: unknown): Rec | null {
  const r = coerceShape(
    v,
    { overall: "number", verdict: "string", genreRead: "string", components: "array", rewrites: "array", questions: "array" },
    ["overall", "components"],
  );
  if (!r) return null;
  const seen = new Set<string>();
  r.components = t.list(r.components as unknown[], (c) => {
    if (!isRecord(c) || !isOneOf(LOGLINE_COMPONENTS, c.key) || !isNumber(c.score) || seen.has(c.key)) return null;
    seen.add(c.key);
    return { ...c, note: isString(c.note) ? c.note : "" };
  });
  r.rewrites = t.list(r.rewrites as unknown[], (w) => stringRecord(w, ["logline"], ["angle"]));
  r.questions = t.list(r.questions as unknown[], text);
  return r;
}

function sanitizeStory(t: Tally, v: unknown): Rec | null {
  const r = coerceShape(
    v,
    {
      overall: "number",
      headline: "string",
      summary: "string",
      framework: "string",
      beats: "array",
      skillScores: "array",
      strengths: "array",
      improvements: "array",
      lineNotes: "array",
      revisionPlan: "array",
    },
    ["overall", "beats"],
  );
  if (!r) return null;
  r.beats = t.list(r.beats as unknown[], (b) => {
    const beat = stringRecord(b, ["beat"], ["evidence", "suggestion"]);
    if (beat) beat.status = t.oneOf(BEAT_STATUSES, beat.status, "present");
    return beat;
  });
  r.skillScores = skillScores(t, r.skillScores as unknown[]);
  r.strengths = t.list(r.strengths as unknown[], text);
  r.improvements = t.list(r.improvements as unknown[], improvement);
  r.lineNotes = t.list(r.lineNotes as unknown[], (n) => stringRecord(n, ["quote"], ["note"]));
  r.revisionPlan = t.list(r.revisionPlan as unknown[], text);
  return r;
}

function sanitizeShot(t: Tally, v: unknown, index: number): Rec | null {
  // A shot needs something to show; the rest has neutral defaults.
  if (!isRecord(v) || !(isString(v.subject) || isString(v.action))) return null;
  const shot = stringRecord(v, [], ["lens", "subject", "action", "purpose", "sound"]) as Rec;
  shot.number = isNumber(v.number) ? v.number : index + 1;
  shot.size = t.oneOf(SHOT_SIZES, v.size, "medium");
  shot.framing = t.oneOf(SHOT_FRAMINGS, v.framing, "single");
  shot.angle = t.oneOf(CAMERA_ANGLES, v.angle, "eye-level");
  shot.movement = t.oneOf(CAMERA_MOVEMENTS, v.movement, "static");
  return shot;
}

function sanitizeShots(t: Tally, v: unknown): Rec | null {
  const r = coerceShape(
    v,
    { sceneSummary: "string", emotionalIntent: "string", visualConcept: "string", shots: "array", coverageNotes: "array", feedbackOnUserShots: "array" },
    ["shots"],
  );
  if (!r) return null;
  r.shots = t.list(r.shots as unknown[], (s, i) => sanitizeShot(t, s, i));
  r.coverageNotes = t.list(r.coverageNotes as unknown[], text);
  r.feedbackOnUserShots = t.list(r.feedbackOnUserShots as unknown[], (f) => stringRecord(f, ["shot", "note"]));
  return r;
}

function sanitizeLabResult(t: Tally, tool: unknown, v: unknown): Rec | null {
  if (tool === "logline") return sanitizeLogline(t, v);
  if (tool === "story") return sanitizeStory(t, v);
  if (tool === "shots") return sanitizeShots(t, v);
  return null;
}

function sanitizeProfile(v: unknown): Profile | null | undefined {
  if (v === null) return null;
  if (!isRecord(v) || !isString(v.name)) return undefined;
  return {
    name: v.name,
    goal: isOneOf(GOAL_IDS, v.goal) ? v.goal : "writer",
    experience: isOneOf(EXPERIENCE_LEVELS, v.experience) ? v.experience : "beginner",
    ...(isString(v.project) ? { project: v.project } : {}),
    createdAt: isString(v.createdAt) ? v.createdAt : new Date().toISOString(),
  };
}

function sanitizeMessage(v: unknown): ChatMessage | null {
  if (!isRecord(v) || !isString(v.id) || !isString(v.content) || !isString(v.at)) return null;
  if (v.role !== "user" && v.role !== "persona") return null;
  return { id: v.id, role: v.role, content: v.content, at: v.at };
}

function sanitizeSession(t: Tally, v: unknown): PracticeSession | null {
  if (!isRecord(v) || !isString(v.id) || !isString(v.scenarioId) || !isString(v.startedAt) || !Array.isArray(v.messages)) {
    return null;
  }
  const session: PracticeSession = {
    id: v.id,
    scenarioId: v.scenarioId,
    startedAt: v.startedAt,
    messages: t.list(v.messages, sanitizeMessage),
  };
  if (isString(v.endedAt)) session.endedAt = v.endedAt;
  if (v.evaluation !== undefined) {
    const evaluation = sanitizeEvaluation(t, v.evaluation);
    if (evaluation) session.evaluation = evaluation as unknown as PracticeSession["evaluation"];
    else t.dropped++;
  }
  if (v.mode === "live" || v.mode === "demo") session.mode = v.mode;
  return session;
}

function sanitizeLabEntry(t: Tally, v: unknown): LabEntry | null {
  if (!hasShape(v, { id: "string", tool: "string", createdAt: "string", title: "string", input: "string" })) return null;
  const result = sanitizeLabResult(t, v.tool, v.result);
  if (!result) return null;
  const entry: Rec = { ...v, result, mode: v.mode === "live" ? "live" : "demo" };
  if (v.tool === "story") {
    // The result's beats follow its own framework, so it wins; the entry's is the fallback.
    const framework = isOneOf(FRAMEWORK_IDS, result.framework) ? result.framework : isOneOf(FRAMEWORK_IDS, v.framework) ? v.framework : null;
    if (!framework) return null;
    if (result.framework !== framework || v.framework !== framework) t.repaired++;
    result.framework = framework;
    entry.framework = framework;
  }
  return entry as unknown as LabEntry;
}

function sanitizeFeedback(v: unknown): DailyEntry["feedback"] | null {
  if (!hasShape(v, { score: "number", praise: "string", nudge: "string", tryThis: "string" }) || !isOneOf(SKILL_IDS, v.skill)) return null;
  return v as unknown as DailyEntry["feedback"];
}

function sanitizeDaily(t: Tally, v: unknown): Record<string, DailyEntry> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, DailyEntry> = {};
  for (const [key, d] of Object.entries(v)) {
    if (!hasShape(d, { promptId: "string", date: "string", response: "string" })) {
      t.dropped++;
      continue;
    }
    const entry: DailyEntry = { promptId: d.promptId as string, date: d.date as string, response: d.response as string };
    if (d.feedback !== undefined) {
      const feedback = sanitizeFeedback(d.feedback);
      if (feedback) entry.feedback = feedback;
      else t.dropped++;
    }
    if (d.mode === "live" || d.mode === "demo") entry.mode = d.mode;
    out[key] = entry;
  }
  return out;
}

function sanitizeLessonProgress(t: Tally, v: unknown): Record<string, LessonProgress> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, LessonProgress> = {};
  for (const [key, p] of Object.entries(v)) {
    if (!isRecord(p) || !isOneOf(TRACK_IDS, p.trackId) || !isString(p.lessonId) || !isString(p.completedAt)) {
      t.dropped++;
      continue;
    }
    out[key] = {
      trackId: p.trackId,
      lessonId: p.lessonId,
      completedAt: p.completedAt,
      quizScore: isNumber(p.quizScore) ? Math.max(0, Math.min(1, p.quizScore)) : 0,
    };
  }
  return out;
}

/**
 * Validate a persisted state object. Returns only the fields that could be
 * read; missing keys mean "keep the current/default value". Pass `report`
 * to learn how many records and list items were dropped or repaired.
 */
export function sanitizePersisted(raw: unknown, report?: SanitizeReport): Partial<PersistedData> {
  const t = new Tally();
  const out = sanitizeAll(t, raw);
  if (report) {
    report.dropped += t.dropped;
    report.repaired += t.repaired;
  }
  return out;
}

function sanitizeAll(t: Tally, raw: unknown): Partial<PersistedData> {
  if (!isRecord(raw)) return {};
  const out: Partial<PersistedData> = {};

  const profile = sanitizeProfile(raw.profile);
  if (profile !== undefined) out.profile = profile;

  const lessonProgress = sanitizeLessonProgress(t, raw.lessonProgress);
  if (lessonProgress) out.lessonProgress = lessonProgress;

  if (Array.isArray(raw.sessions)) out.sessions = t.list(raw.sessions, (s) => sanitizeSession(t, s));

  if (Array.isArray(raw.labEntries)) out.labEntries = t.list(raw.labEntries, (e) => sanitizeLabEntry(t, e));

  const daily = sanitizeDaily(t, raw.daily);
  if (daily) out.daily = daily;

  if (isNumber(raw.xp)) out.xp = Math.max(0, Math.round(raw.xp));

  if (Array.isArray(raw.xpLog)) {
    out.xpLog = t.list(raw.xpLog, (e) =>
      hasShape(e, { at: "string", amount: "number", reason: "string" }) ? ({ at: e.at, amount: e.amount, reason: e.reason } as XpEvent) : null,
    );
  }

  if (Array.isArray(raw.activityDates)) {
    out.activityDates = Array.from(new Set(raw.activityDates.filter((d): d is string => isString(d) && DATE_KEY.test(d)))).sort();
  }

  if (isRecord(raw.settings)) {
    out.settings = { autoSpeak: raw.settings.autoSpeak === true };
  }

  return out;
}
