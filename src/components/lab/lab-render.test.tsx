/**
 * Server-render smoke tests: every result component renders the demo
 * coach's output without throwing and shows the key content.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoLogline, demoShots, demoStory } from "@/lib/demo/lab";
import { LoglineResult } from "./logline-result";
import { SAMPLE_LOGLINES, SAMPLE_SCENES, SAMPLE_STORIES } from "./samples";
import { ShotPlanResult } from "./shot-plan-result";
import { StoryResult } from "./story-result";
import { ToolCard } from "./tool-card";
import { LAB_TOOL_LIST } from "./lab-meta";
import { SavedNotice } from "./lab-ui";
import { SHOT_FRAMING_INFO } from "@/lib/film";

describe("Story Lab result components", () => {
  it("renders a logline diagnosis with the demo notice", () => {
    const sample = SAMPLE_LOGLINES[1];
    const analysis = demoLogline({ logline: sample.logline, genre: sample.genre });
    const html = renderToStaticMarkup(<LoglineResult analysis={analysis} mode="demo" logline={sample.logline} />);
    expect(html).toContain("Vital signs");
    expect(html).toContain("Demo coach");
    expect(html).toContain(`${analysis.overall} out of 100`);
    for (const r of analysis.rewrites) expect(html).toContain(r.angle);
    expect(html).toContain("Protagonist: ");
  });

  it("renders story notes with a beat map for every sample", () => {
    for (const sample of SAMPLE_STORIES) {
      const analysis = demoStory({ text: sample.text, framework: sample.framework, format: sample.format, title: sample.title });
      const html = renderToStaticMarkup(<StoryResult analysis={analysis} mode="live" entryId="test" />);
      expect(html).toContain('role="tablist"');
      expect(html).toContain("Revision plan");
      expect(html).not.toContain("Demo coach");
      for (const beat of analysis.beats) expect(html).toContain(beat.beat.replace("&", "&amp;"));
    }
  });

  it("renders a shot plan as a table and as cards", () => {
    const sample = SAMPLE_SCENES[0];
    const plan = demoShots({ scene: sample.scene, intent: sample.intent, userShots: sample.userShots });
    const html = renderToStaticMarkup(<ShotPlanResult plan={plan} mode="demo" title="The Envelope" />);
    expect(html).toContain("<table");
    expect(html).toContain(`Shot list with ${plan.shots.length} shots`);
    expect(html).toContain("Notes on your shot ideas");
    expect(html).toContain("Download CSV");
    expect(html).toContain("Film grammar in this plan");
  });

  it("makes camera terms explain themselves on tap or keyboard, not just on hover", () => {
    const sample = SAMPLE_SCENES[0];
    const plan = demoShots({ scene: sample.scene, intent: sample.intent });
    const html = renderToStaticMarkup(<ShotPlanResult plan={plan} mode="demo" />);
    // Each term is a toggle button tied to its (initially hidden) explanation.
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"[^>]*>/);
    const framing = SHOT_FRAMING_INFO[plan.shots[1].framing];
    expect(html).toContain(framing.effect.replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    expect(html).not.toContain("Hover or tap");
  });

  it("fits the shot table in a 1280px layout and lets the keyboard scroll it", () => {
    const plan = demoShots({ scene: SAMPLE_SCENES[0].scene });
    const html = renderToStaticMarkup(<ShotPlanResult plan={plan} mode="live" />);
    expect(html).toMatch(/<div role="region" aria-labelledby="shot-list" tabindex="0"/);
    expect(html).toContain("min-w-[56rem]");
    expect(html).not.toContain("min-w-[64rem]");
  });

  it("reports the XP a save actually earned", () => {
    const earned = renderToStaticMarkup(<SavedNotice entryId="a" xpGained={40} />);
    expect(earned).toContain("+40 XP");
    expect(earned).toContain("Saved to your Story Lab logbook");

    const repeat = renderToStaticMarkup(<SavedNotice entryId="a" xpGained={0} replaced />);
    expect(repeat).not.toContain("XP</span>");
    expect(repeat).toContain("Updated in your Story Lab logbook");
    expect(repeat).toContain("no new XP");

    const capped = renderToStaticMarkup(<SavedNotice entryId="a" xpGained={0} />);
    expect(capped).toContain("today&#x27;s Story Lab XP");
  });

  it("renders the hub tool cards", () => {
    const html = LAB_TOOL_LIST.map((tool, i) => renderToStaticMarkup(<ToolCard tool={tool} index={i} />)).join("");
    expect(html).toContain('href="/lab/logline"');
    expect(html).toContain('href="/lab/story"');
    expect(html).toContain('href="/lab/shots"');
  });
});
