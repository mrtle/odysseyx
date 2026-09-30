/**
 * Prompts for the daily challenge's micro-feedback.
 */
import type { DailyChallenge } from "@/content/daily-prompts";
import type { DailyFeedbackRequest } from "@/lib/ai/schemas";
import { checkConstraints, countWords, nonEmptyLines } from "@/lib/daily";
import { sentences } from "@/lib/demo/text";
import { SKILLS } from "@/lib/skills";
import { COACH_VOICE, MATERIAL_GUARD, asMaterial, describeLearner } from "./common";

export const DAILY_SYSTEM_PROMPT = `${COACH_VOICE}

Right now you're giving micro-feedback on the daily challenge: a short piece the learner wrote in a few minutes to a specific prompt and constraint. Treat it like a page from a sketchbook, not a manuscript — the point is one good repetition a day and one clear thing to carry into tomorrow.

What to return:
- score: 0–100 for how well the piece exercises the focus skill and honours the constraint, on the calibration above (50 is a solid first attempt, 70 is strong, 85+ is something a professional would be pleased with). A broken checkable constraint should weigh heavily — the constraint is the exercise.
- praise: one or two sentences on the best thing in the piece, quoting the learner's own words.
- nudge: the single most valuable fix, in one or two sentences. If a checkable constraint was broken, lead with that, plainly.
- tryThis: one concrete thing to try on the next pass — a rewrite of one of their lines, or a precise mini-exercise. Two sentences at most.
- skill: the challenge's focus skill.

The learner reads this on a phone in thirty seconds, so every sentence has to earn its place. Speak to them directly ("you"), and don't restate the prompt back to them.

The measured facts in each request are computed by code (word and sentence counts, constraint checks). Trust them over your own counting.

${MATERIAL_GUARD}`;

export function buildDailyPrompt(prompt: DailyChallenge, request: Pick<DailyFeedbackRequest, "response" | "profile">): string {
  const text = request.response.trim();
  const skill = SKILLS[prompt.skill];
  const checks = checkConstraints(prompt.rule, text);
  const facts = [
    `${countWords(text)} words, ${sentences(text).length} sentences, ${nonEmptyLines(text).length} non-empty lines.`,
    ...checks.map((c) => `${c.label}: ${c.met ? "met" : "NOT met"} (${c.detail}).`),
  ];
  const learner = describeLearner(request.profile);

  return [
    learner,
    `Today's challenge — "${prompt.title}"
Prompt: ${prompt.prompt}
Constraint: ${prompt.constraint}
Focus skill: ${prompt.skill} (${skill.name}) — ${skill.description} What good looks like: ${skill.lookFor}`,
    `Measured facts:\n${facts.map((f) => `- ${f}`).join("\n")}`,
    `The learner's response:\n${asMaterial("daily_response", text)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
