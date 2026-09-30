/**
 * Validation for progress read back from localStorage. Stored data can be
 * anything: an older version of the app, a manual edit, a half-written
 * value. Each field is checked with small hand-written guards (no zod, so
 * client bundles stay light); invalid records are dropped and invalid
 * fields fall back to defaults, so one bad entry never crashes a page or
 * wipes everything else.
 */
import { EXPERIENCE_LEVELS, GOAL_IDS } from "@/lib/constants";
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

const validSkillScore = (s: unknown) => hasShape(s, { skill: "string", score: "number" });

function sanitizeEvaluation(v: unknown): Rec | null {
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
  e.skillScores = (e.skillScores as unknown[]).filter(validSkillScore);
  const next = e.nextStep as Rec;
  e.nextStep = { title: isString(next.title) ? next.title : "", description: isString(next.description) ? next.description : "" };
  return e;
}

function sanitizeLabResult(tool: unknown, v: unknown): Rec | null {
  switch (tool) {
    case "logline": {
      const r = coerceShape(
        v,
        { overall: "number", verdict: "string", genreRead: "string", components: "array", rewrites: "array", questions: "array" },
        ["overall", "components"],
      );
      if (r) r.components = (r.components as unknown[]).filter((c) => hasShape(c, { key: "string", score: "number" }));
      return r;
    }
    case "story": {
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
      if (r) r.skillScores = (r.skillScores as unknown[]).filter(validSkillScore);
      return r;
    }
    case "shots":
      return coerceShape(
        v,
        { sceneSummary: "string", emotionalIntent: "string", visualConcept: "string", shots: "array", coverageNotes: "array", feedbackOnUserShots: "array" },
        ["shots"],
      );
    default:
      return null;
  }
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

function sanitizeLessonProgress(v: unknown): Record<string, LessonProgress> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, LessonProgress> = {};
  for (const [key, p] of Object.entries(v)) {
    if (!isRecord(p) || !isOneOf(TRACK_IDS, p.trackId) || !isString(p.lessonId) || !isString(p.completedAt)) continue;
    out[key] = {
      trackId: p.trackId,
      lessonId: p.lessonId,
      completedAt: p.completedAt,
      quizScore: isNumber(p.quizScore) ? Math.max(0, Math.min(1, p.quizScore)) : 0,
    };
  }
  return out;
}

function sanitizeMessage(v: unknown): ChatMessage | null {
  if (!isRecord(v) || !isString(v.id) || !isString(v.content) || !isString(v.at)) return null;
  if (v.role !== "user" && v.role !== "persona") return null;
  return { id: v.id, role: v.role, content: v.content, at: v.at };
}

function sanitizeSession(v: unknown): PracticeSession | null {
  if (!isRecord(v) || !isString(v.id) || !isString(v.scenarioId) || !isString(v.startedAt) || !Array.isArray(v.messages)) {
    return null;
  }
  const session: PracticeSession = {
    id: v.id,
    scenarioId: v.scenarioId,
    startedAt: v.startedAt,
    messages: v.messages.map(sanitizeMessage).filter((m): m is ChatMessage => m !== null),
  };
  if (isString(v.endedAt)) session.endedAt = v.endedAt;
  const evaluation = v.evaluation === undefined ? null : sanitizeEvaluation(v.evaluation);
  if (evaluation) session.evaluation = evaluation as unknown as PracticeSession["evaluation"];
  if (v.mode === "live" || v.mode === "demo") session.mode = v.mode;
  return session;
}

function sanitizeLabEntry(v: unknown): LabEntry | null {
  if (!hasShape(v, { id: "string", tool: "string", createdAt: "string", title: "string", input: "string" })) return null;
  const result = sanitizeLabResult(v.tool, v.result);
  if (!result) return null;
  if (v.tool === "story" && !isString(v.framework)) return null;
  const mode = v.mode === "live" ? "live" : "demo";
  return { ...v, result, mode } as unknown as LabEntry;
}

function sanitizeDaily(v: unknown): Record<string, DailyEntry> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, DailyEntry> = {};
  for (const [key, d] of Object.entries(v)) {
    if (!hasShape(d, { promptId: "string", date: "string", response: "string" })) continue;
    const entry: DailyEntry = { promptId: d.promptId as string, date: d.date as string, response: d.response as string };
    if (hasShape(d.feedback, { score: "number", praise: "string", nudge: "string", tryThis: "string", skill: "string" })) {
      entry.feedback = d.feedback as unknown as DailyEntry["feedback"];
    }
    if (d.mode === "live" || d.mode === "demo") entry.mode = d.mode;
    out[key] = entry;
  }
  return out;
}

function sanitizeList<T>(v: unknown, item: (x: unknown) => T | null): T[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map(item).filter((x): x is T => x !== null);
}

/**
 * Validate a persisted state object. Returns only the fields that could be
 * read; missing keys mean "keep the current/default value".
 */
export function sanitizePersisted(raw: unknown): Partial<PersistedData> {
  if (!isRecord(raw)) return {};
  const out: Partial<PersistedData> = {};

  const profile = sanitizeProfile(raw.profile);
  if (profile !== undefined) out.profile = profile;

  const lessonProgress = sanitizeLessonProgress(raw.lessonProgress);
  if (lessonProgress) out.lessonProgress = lessonProgress;

  const sessions = sanitizeList(raw.sessions, sanitizeSession);
  if (sessions) out.sessions = sessions;

  const labEntries = sanitizeList(raw.labEntries, sanitizeLabEntry);
  if (labEntries) out.labEntries = labEntries;

  const daily = sanitizeDaily(raw.daily);
  if (daily) out.daily = daily;

  if (isNumber(raw.xp)) out.xp = Math.max(0, Math.round(raw.xp));

  const xpLog = sanitizeList(raw.xpLog, (e) =>
    hasShape(e, { at: "string", amount: "number", reason: "string" }) ? ({ at: e.at, amount: e.amount, reason: e.reason } as XpEvent) : null,
  );
  if (xpLog) out.xpLog = xpLog;

  if (Array.isArray(raw.activityDates)) {
    out.activityDates = Array.from(new Set(raw.activityDates.filter((d): d is string => isString(d) && DATE_KEY.test(d)))).sort();
  }

  if (isRecord(raw.settings)) {
    out.settings = { autoSpeak: raw.settings.autoSpeak === true };
  }

  return out;
}
