/**
 * End-to-end server renders of the Learn routes against a fixture curriculum
 * (the real lesson files may still be empty while content is written).
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
  type AnyLesson = import("@/lib/types").Lesson;
  type AnyTrack = import("@/lib/types").Track;
  const mk = (trackId: AnyTrack["id"], id: string, extra: Partial<AnyLesson> = {}): AnyLesson => ({
    id,
    trackId,
    title: `Title ${id}`,
    summary: `Summary of ${id}.`,
    minutes: 12,
    level: "beginner",
    skills: ["hook", "conflict"],
    blocks: [
      { type: "heading", text: "The engine of story" },
      { type: "text", body: "Every story runs on **desire**." },
      { type: "compare", weak: "A woman goes on a trip.", strong: "A widowed ferry pilot must cross a strait she swore never to sail again." },
    ],
    keyTakeaways: ["Desire drives story.", "Stakes make us care."],
    quiz: [
      { id: "q1", prompt: "What drives a story?", options: ["Desire", "Weather"], answerIndex: 0, explanation: "Want creates motion." },
    ],
    exercise: { prompt: "Write a logline.", tips: ["Be specific."], practiceScenarioId: "logline-gauntlet", labTool: "logline" },
    ...extra,
  });
  const foundations = [mk("foundations", "four-elements"), mk("foundations", "hooks", { quiz: [], level: "advanced" })];
  const structure = [mk("structure", "three-acts")];
  const tracks: AnyTrack[] = [
    {
      id: "foundations",
      title: "Story Foundations",
      subtitle: "What makes a story a story",
      description: "Desire, obstacle, stakes and change.",
      icon: "compass",
      accent: "from-bronze-300 to-bronze-600",
      skills: ["hook", "conflict", "character"],
      lessons: foundations,
    },
    {
      id: "structure",
      title: "Structure & Plot",
      subtitle: "Charting the voyage",
      description: "The maps storytellers use.",
      icon: "map",
      accent: "from-aegean-300 to-aegean-500",
      skills: ["structure", "pacing"],
      lessons: structure,
    },
    {
      id: "character",
      title: "Character",
      subtitle: "Want, need, wound, change",
      description: "Protagonists who drive the story.",
      icon: "users",
      accent: "from-wine-400 to-wine-600",
      skills: ["character"],
      lessons: [],
    },
  ];
  return { tracks };
});

vi.mock("@/content/tracks", () => {
  const TRACKS = fixture.tracks;
  const ALL_LESSONS = TRACKS.flatMap((t) => t.lessons);
  const getTrack = (id: string) => TRACKS.find((t) => t.id === id);
  return {
    TRACKS,
    ALL_LESSONS,
    LESSON_SKILLS: {},
    getTrack,
    getLesson: (trackId: string, lessonId: string) => getTrack(trackId)?.lessons.find((l) => l.id === lessonId),
    getNextLesson: (trackId: string, lessonId: string) => {
      const i = ALL_LESSONS.findIndex((l) => l.trackId === trackId && l.id === lessonId);
      return i >= 0 ? ALL_LESSONS[i + 1] : undefined;
    },
  };
});

const { default: LearnPage } = await import("./page");
const trackRoute = await import("./[trackId]/page");
const lessonRoute = await import("./[trackId]/[lessonId]/page");

type TrackProps = Parameters<typeof trackRoute.default>[0];
type LessonProps = Parameters<typeof lessonRoute.default>[0];

const trackProps = (trackId: string) => ({ params: Promise.resolve({ trackId }), searchParams: Promise.resolve({}) }) as unknown as TrackProps;
const lessonProps = (trackId: string, lessonId: string) =>
  ({ params: Promise.resolve({ trackId, lessonId }), searchParams: Promise.resolve({}) }) as unknown as LessonProps;

describe("/learn", () => {
  it("renders every track card with lesson counts", () => {
    const html = renderToStaticMarkup(<LearnPage />);
    expect(html).toContain("Chart your course");
    expect(html).toContain('href="/learn/foundations"');
    expect(html).toContain('href="/learn/structure"');
    expect(html).toContain("2 lessons");
    expect(html).toContain("24 min");
    expect(html).toContain("Coming soon");
    expect(html).toContain("Lessons are still being charted for this track.");
  });
});

describe("/learn/[trackId]", () => {
  it("generates params for every track", () => {
    expect(trackRoute.generateStaticParams()).toEqual([{ trackId: "foundations" }, { trackId: "structure" }, { trackId: "character" }]);
  });

  it("renders the voyage map", async () => {
    const html = renderToStaticMarkup(await trackRoute.default(trackProps("foundations")));
    expect(html).toContain("<h1");
    expect(html).toContain("Story Foundations");
    expect(html).toContain('href="/learn/foundations/four-elements"');
    expect(html).toContain('href="/learn/foundations/hooks"');
    expect(html).toContain("Advanced");
    expect(html).toContain("Next track");
    expect(html).toContain('href="/learn/structure"');
  });

  it("shows an empty state for a track without lessons", async () => {
    const html = renderToStaticMarkup(await trackRoute.default(trackProps("character")));
    expect(html).toContain("still being charted");
  });

  it("404s for unknown tracks", async () => {
    await expect(trackRoute.default(trackProps("nope"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("builds metadata", async () => {
    expect((await trackRoute.generateMetadata(trackProps("structure"))).title).toBe("Structure & Plot");
    expect((await trackRoute.generateMetadata(trackProps("nope"))).title).toBe("Track not found");
  });
});

describe("/learn/[trackId]/[lessonId]", () => {
  it("generates params for every lesson", () => {
    expect(lessonRoute.generateStaticParams()).toEqual([
      { trackId: "foundations", lessonId: "four-elements" },
      { trackId: "foundations", lessonId: "hooks" },
      { trackId: "structure", lessonId: "three-acts" },
    ]);
  });

  it("renders the reader: header, blocks, takeaways, quiz, exercise and pager", async () => {
    const html = renderToStaticMarkup(await lessonRoute.default(lessonProps("foundations", "hooks")));
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain("Title hooks");
    expect(html).toContain("Lesson 2 of 2");
    expect(html).toContain("The engine of story");
    expect(html).toContain(">Weaker<");
    expect(html).toContain("Key takeaways");
    expect(html).toContain("No quiz on this stop");
    expect(html).toContain('href="/practice/logline-gauntlet"');
    expect(html).toContain('href="/lab/logline"');
    expect(html).toContain('rel="prev"');
    expect(html).toContain('href="/learn/foundations/four-elements"');
    expect(html).toContain('rel="next"');
    expect(html).toContain("Next track · Structure &amp; Plot");
  });

  it("renders the quiz for lessons that have one", async () => {
    const html = renderToStaticMarkup(await lessonRoute.default(lessonProps("foundations", "four-elements")));
    expect(html).toContain("What drives a story?");
    expect(html).toContain("Check answer");
    expect(html).not.toContain('rel="prev"');
  });

  it("404s for unknown lessons, and for lessons requested under the wrong track", async () => {
    await expect(lessonRoute.default(lessonProps("foundations", "nope"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    await expect(lessonRoute.default(lessonProps("structure", "hooks"))).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it("builds metadata from the lesson", async () => {
    const meta = await lessonRoute.generateMetadata(lessonProps("structure", "three-acts"));
    expect(meta.title).toBe("Title three-acts · Structure & Plot");
    expect(meta.description).toBe("Summary of three-acts.");
  });
});
