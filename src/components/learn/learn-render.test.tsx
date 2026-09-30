/**
 * Server-render smoke tests: every LessonBlock variant renders, and the
 * store-backed islands render their pre-hydration state without throwing.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LessonBlock, QuizQuestion, TrackId } from "@/lib/types";
import { headingIds, LessonBlocks } from "./lesson-blocks";
import { LessonQuiz } from "./lesson-quiz";
import { ContinueBanner, type TrackLook } from "./continue-banner";
import { VoyageMap } from "./voyage-map";
import type { LessonSummary } from "./learn-helpers";

const ALL_BLOCKS: LessonBlock[] = [
  { type: "heading", text: "Why *desire* matters" },
  { type: "text", body: "First **paragraph**.\n\nSecond paragraph with `code`." },
  { type: "list", items: ["One", "Two"], ordered: true },
  { type: "list", items: ["Bullet"] },
  { type: "callout", tone: "tip", body: "A tip body." },
  { type: "callout", tone: "warning", title: "Careful", body: "A warning body." },
  { type: "callout", tone: "insight", body: "An insight body." },
  { type: "example", title: "The shark", source: "Jaws (1975)", body: "Spielberg hides the shark." },
  { type: "quote", text: "Drama is life with the dull bits cut out.", attribution: "Alfred Hitchcock" },
  { type: "compare", weak: "A man wants money.", strong: "A disgraced locksmith has 48 hours…", note: "Specificity wins." },
  { type: "compare", weakLabel: "On the nose", weak: "I am angry.", strongLabel: "Subtext", strong: "Nice tie." },
  {
    type: "beats",
    frameworkId: "story-circle",
    beats: [
      { name: "You", description: "Comfort." },
      { name: "Need", description: "Want." },
      { name: "Go", description: "Unfamiliar." },
    ],
  },
  {
    type: "beats",
    title: "Save the Cat, compressed",
    beats: Array.from({ length: 8 }, (_, i) => ({ name: `Beat ${i + 1}`, description: `Description ${i + 1}` })),
  },
  { type: "exercise-inline", prompt: "Write a one-line **want**.", placeholder: "She wants…" },
  { type: "heading", text: "Why desire matters" },
];

describe("LessonBlocks", () => {
  it("renders every block variant", () => {
    const html = renderToStaticMarkup(<LessonBlocks blocks={ALL_BLOCKS} />);
    expect(html).toContain("<em>desire</em>");
    expect(html).toContain("<strong");
    expect(html).toContain("<ol");
    expect(html).toContain("Careful");
    expect(html).toContain(">Tip<");
    expect(html).toContain(">Insight<");
    expect(html).toContain("Jaws (1975)");
    expect(html).toContain("<blockquote");
    expect(html).toContain("Alfred Hitchcock");
    expect(html).toContain(">Weaker<");
    expect(html).toContain(">Stronger<");
    expect(html).toContain(">On the nose<");
    expect(html).toContain("Specificity wins.");
    expect(html).toContain('href="/lab/story?framework=story-circle"');
    expect(html).toContain("Story Circle");
    expect(html).toContain("Save the Cat, compressed");
    expect(html).toContain("Beat 8");
    expect(html).toContain("<textarea");
    expect(html).toContain('placeholder="She wants…"');
  });

  it("gives duplicate headings unique anchors", () => {
    const ids = headingIds(ALL_BLOCKS);
    expect(ids.get(0)).toBe("why-desire-matters");
    expect(ids.get(ALL_BLOCKS.length - 1)).toBe("why-desire-matters-2");
  });

  it("renders nothing for an empty lesson body", () => {
    expect(renderToStaticMarkup(<LessonBlocks blocks={[]} />)).toBe('<div class="space-y-6"></div>');
  });
});

const QUESTIONS: QuizQuestion[] = [
  { id: "q1", prompt: "What drives a story?", options: ["Desire", "Scenery"], answerIndex: 0, explanation: "Want creates motion." },
  { id: "q2", prompt: "What raises stakes?", options: ["Consequences", "Adjectives"], answerIndex: 0, explanation: "Loss matters." },
];

describe("LessonQuiz", () => {
  it("renders the first question with radio options", () => {
    const html = renderToStaticMarkup(
      <LessonQuiz trackId="foundations" lessonId="x" questions={QUESTIONS} trackHref="/learn/foundations" trackTitle="Foundations" hasExercise />,
    );
    expect(html).toContain("Question <span");
    expect(html).toContain("What drives a story?");
    expect(html).toContain('type="radio"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain("Check answer");
    expect(html).not.toContain("What raises stakes?");
  });

  it("offers direct completion when there is no quiz (disabled until hydrated)", () => {
    const html = renderToStaticMarkup(
      <LessonQuiz trackId="foundations" lessonId="x" questions={[]} trackHref="/learn/foundations" trackTitle="Foundations" hasExercise={false} />,
    );
    expect(html).toContain("No quiz on this stop");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Complete lesson/);
  });
});

const SUMMARIES: LessonSummary[] = [
  {
    trackId: "foundations",
    id: "a",
    title: "The four elements",
    summary: "Desire, obstacle, stakes, change.",
    minutes: 12,
    level: "beginner",
    skills: ["hook", "conflict"],
    trackTitle: "Story Foundations",
    number: 1,
    quizCount: 3,
  },
  {
    trackId: "foundations",
    id: "b",
    title: "Hooks",
    summary: "The first ten seconds.",
    minutes: 9,
    level: "intermediate",
    skills: ["hook"],
    trackTitle: "Story Foundations",
    number: 2,
    quizCount: 0,
  },
];

describe("store-backed islands (pre-hydration)", () => {
  it("VoyageMap renders every stop with links", () => {
    const html = renderToStaticMarkup(<VoyageMap lessons={SUMMARIES} trackTitle="Story Foundations" />);
    expect(html).toContain('href="/learn/foundations/a"');
    expect(html).toContain('href="/learn/foundations/b"');
    expect(html).toContain("3 questions");
    expect(html).toContain("Intermediate");
    expect(html).toContain("Harbour");
  });

  it("ContinueBanner shows a skeleton until hydrated", () => {
    const looks = { foundations: { accent: "from-bronze-300 to-bronze-600", icon: "compass" } } as Record<TrackId, TrackLook>;
    const html = renderToStaticMarkup(<ContinueBanner lessons={SUMMARIES} looks={looks} />);
    expect(html).toContain("animate-pulse");
  });
});
