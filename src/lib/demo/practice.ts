/**
 * The offline demo coach for practice drills.
 *
 * `demoPersonaReply` plays each persona with a small, deterministic script:
 * it reacts to the learner's latest line (echoing a noun phrase they
 * actually used, never the same one twice), presses when an answer is thin,
 * rude or off-topic, skips questions the learner has already answered,
 * escalates through a per-scenario bank of pressure moves without repeating
 * itself, and wraps up in character after `suggestedTurns`. `demoEvaluate`
 * scores the learner's lines with text heuristics and returns an
 * `Evaluation` in the same shape as the live coach: engagement caps every
 * score (so shrugs, insults and tangents land well below real answers), and
 * a "Try saying" line is never something the learner already said.
 * Heuristics, not understanding — but specific and repeatable.
 */
import type { ChatMessageInput, Evaluation, Improvement, SkillScore } from "@/lib/ai/schemas";
import { clampScore } from "@/lib/ai/schemas";
import { SCENARIOS } from "@/content/scenarios";
import { SKILLS, type SkillId } from "@/lib/skills";
import type { Scenario } from "@/lib/types";
import {
  LEXICON,
  countTerms,
  firstLine,
  hasAny,
  lexicalVariety,
  pick,
  questionCount,
  sentenceLengthVariance,
  sentences,
  specificityMarkers,
  words,
} from "./text";

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

/**
 * Per-scenario lines for the demo persona. `{phrase}` is replaced with a
 * phrase from the learner's own words, `{hedge}` with a hedge they used and
 * `{buzz}` with a buzzword they used; every bank also has lines without
 * placeholders.
 */
export interface DemoScript {
  /** The question the opening line asks, restated when the learner's first answer misses it. */
  opener: string;
  /** Pressure moves asked in order, one per advancing learner turn. */
  questions: string[];
  /** Question index → terms that mean the learner already covered it (so the persona skips ahead). */
  skipIf?: Record<number, readonly string[]>;
  /** Used when the pressure moves run out before the wrap-up. */
  more?: string[];
  /** Reactions to a strong, specific move. */
  strong: string[];
  /** Acknowledgements for a solid, unremarkable move. */
  solid: string[];
  /** Leads for pressing a thin answer; the pending question follows (unless `pressRepeats` is false). They must not presuppose what the learner said. */
  press: string[];
  /** In-character reactions to a rude or dismissive line. */
  rude: string[];
  /** In-character redirects after a line that has nothing to do with the scene. */
  offTopic: string[];
  /** Reactions to a long, rambling turn. */
  long: string[];
  /** Reactions to hedging. */
  hedge: string[];
  /** When the learner asks the persona a question. */
  deflect: string[];
  /** Reactions when the learner says the quiet part out loud (subtext drills) or falls into the drill's anti-pattern. */
  onNose?: string[];
  wrapGood: string[];
  wrapMixed: string[];
  /** The wrap-up when the learner never really played the scene (shrugs, insults, tangents). */
  wrapPoor: string[];
  /** If the learner keeps talking after the wrap-up. */
  after: string[];
  /** Model lines used as "Try saying" examples on the scorecard. */
  examples: Partial<Record<SkillId, string>>;
  /** Scenario vocabulary that signals a specific, on-topic answer. */
  signal: readonly string[];
  /** Set false for personas who shouldn't quote the learner back (in-scene characters). */
  echo?: boolean;
  /** Who the learner was talking to, for scorecard copy (defaults to the persona's first name). */
  partner?: string;
  /** Treat on-the-nose moves as a press (repeat the pressure) rather than moving on. */
  flatPresses?: boolean;
  /** Set false when a press shouldn't restate the pending question (in-scene characters who don't interrogate). */
  pressRepeats?: boolean;
  /** Scenario-specific scorecard copy, overriding the generic per-skill lines. */
  improve?: Partial<Record<SkillId, { title: string; advice: string }>>;
  weak?: Partial<Record<SkillId, string>>;
  nextSteps?: Partial<Record<SkillId, { title: string; description: string }>>;
}

export const DEMO_SCRIPTS: Record<string, DemoScript> = {
  "studio-pitch": {
    opener: "What's the movie — who's it about, and what do they want?",
    questions: [
      "What are the comps — what's it like, and what's the budget feel?",
      "Walk me through it. What changes at the midpoint?",
      "Why do I care — what does your hero actually stand to lose?",
      "Here's a thought: what if the lead were twenty years younger and we added a love interest? Studios like a love interest.",
      "How does it end?",
      "Why are you the person to write this?",
    ],
    skipIf: {
      0: ["comps", "comp", "meets", "budget", "million"],
      1: ["midpoint", "halfway", "second act", "act two"],
      2: ["if she fails", "if he fails", "if they fail", "if she's wrong", "if he's wrong", "she loses", "he loses", "they lose", "lose everything", "last chance", "the last thing"],
      4: ["ends", "ending", "in the end", "the end", "finale", "climax", "final scene", "last scene"],
      5: ["my grandmother", "my grandfather", "my mother", "my father", "my mom", "my dad", "i grew up", "i spent", "why me"],
    },
    strong: [
      "“{phrase}.” Okay — now I'm listening.",
      "Huh. “{phrase}.” That I could repeat to Joel.",
      "“{phrase}” — see, that's specific, and specific sells.",
      "Good. That's specific, and specific sells.",
      "Okay, that's a movie. I can see the trailer.",
      "Now we're talking.",
      "That I can work with.",
    ],
    solid: ["Okay.", "Mm. Fine, I'm following.", "“{phrase}.” Got it.", "Noted.", "All right."],
    more: ["What else should I know before I take it upstairs?", "Who's it for — who buys the ticket?"],
    press: [
      "I'm going to need more than that.",
      "Give me something I can picture — a person, a problem, a clock.",
      "Specifics, please. If I can't picture it, my boss definitely can't.",
    ],
    rude: [
      "Okay. I've got eleven minutes, and I'd rather not spend them like this.",
      "I've been pitched by people who hated me more politely.",
      "Noted. Let's try that again, like professionals.",
    ],
    offTopic: ["Let's stay on the movie — I've got a hard out.", "Fun, but that's not a pitch.", "I'm going to steer us back, because my clock's running."],
    long: [
      "Let me stop you — I've got about a minute of attention per answer, and you just spent three.",
      "That was a lot of plot. Pull back to the spine for me.",
    ],
    hedge: [
      "You said “{hedge}.” It is or it isn't — commit.",
      "You sound unsure, and if you're unsure, my boss will be too.",
      "Say it like you've already sold it.",
    ],
    deflect: ["I'll tell you what we're buying when you tell me what you're selling.", "Fair question, but it's your meeting."],
    wrapGood: [
      "Okay, I'm going to stop you there, because I've heard what I need. “{phrase}” — that's the line I'd walk into Joel's office with. Send me pages by Friday.",
      "That's my quarter past. Honestly? This is one of the better ones this month. Get me the script and I'll read it this weekend.",
    ],
    wrapMixed: [
      "That's my quarter past. There's something in here, but I can't sell a feeling to my boss. Tighten the one-liner, figure out the ending, and come back to me.",
      "I have to run. Honest read: it's a pass for now — I couldn't repeat it to Joel in one sentence. Crack that and call my office.",
    ],
    wrapPoor: ["That's my quarter past. I never actually heard the movie — come back when you can pitch it.", "I have to run. Honestly, I still don't know what you're selling. Try me again when you do."],
    after: [
      "I really do have to go. Email my assistant.",
      "I'm late for my next one — send it over.",
      "My assistant will walk you out.",
      "That's all the time I've got. Thanks for coming in.",
    ],
    examples: {
      hook: "It's about a seventy-year-old lifeguard who's the only one who believes something is living in her retirement community's pool — and nobody will let her near the water.",
      structure:
        "At the midpoint she proves the creature is real — and learns the board knew all along. Now she's not fighting a monster, she's fighting her neighbours.",
      conflict: "If she's wrong, she loses the last thing she has: her daughter's trust, and the right to live on her own.",
      delivery:
        "That's a smart note. I think it's reaching for more heat — I'd get that by raising what she risks, not by making her younger.",
    },
    signal: ["logline", "midpoint", "ending", "ends", "comps", "budget", "act", "audience", "protagonist", "hero", "villain", "climax", "twist", "meets"],
  },

  "elevator-pitch": {
    opener: "What's it about?",
    questions: [
      "Why this story — why you?",
      "What's it like? Give me a comparison.",
      "That's twenty-five. So what do you want from me?",
      "Who do you see playing the lead?",
    ],
    skipIf: {
      0: ["my brother", "my sister", "my father", "my mother", "my dad", "my mom", "i grew up", "i spent", "i've spent"],
      1: ["meets", "crossed with", "comparison"],
      2: ["could i", "can i", "send you", "your email", "assistant's email", "coffee", "the script"],
      3: ["starring", "played by", "for the lead", "playing the lead"],
    },
    strong: [
      "“{phrase}.” Huh. Okay, that's a picture.",
      "“{phrase}” — okay, you've got me off my phone.",
      "Now that I haven't heard before.",
      "Okay — you've got me off my phone.",
      "Huh. Okay. Keep going.",
    ],
    solid: ["Mm-hm. That's twelve.", "Okay. Floor eighteen.", "“{phrase}.” Right.", "Floor twenty-two."],
    more: ["What else have you got?"],
    press: ["Headline, please.", "One sentence.", "You've got about ten floors."],
    rude: ["Wow. Okay — I'll just watch the numbers.", "That's a strange way to talk to a producer.", "Noted. The doors open either way."],
    offTopic: ["Ha. This elevator only has so many floors.", "Small talk's fine, but we're at twenty.", "I thought you had a project."],
    long: ["That's twenty-two, by the way. Shorter.", "You're losing me in the details. Headline."],
    hedge: [
      "“{hedge}” won't survive a financier. Say it like you mean it.",
      "You'll want to sound surer than that with a financier.",
      "Say it like you'd bet the rent on it.",
    ],
    deflect: ["Ha — I ask the questions in elevators. Keep going.", "Depends entirely on what you say next."],
    wrapGood: [
      "That's thirty-one. Here — my assistant's email. Put “{phrase}” in the subject line so she flags it.",
      "My floor. Send me the script, and tell my office we met in the elevator. I mean it.",
    ],
    wrapMixed: [
      "That's me. Good luck with it — really. Get it down to one line and you'll get a lot further.",
      "Thirty-one. I'll take a card, but tighten that pitch — I still couldn't tell my partner what it's about.",
    ],
    wrapPoor: ["That's my floor. Good luck with it.", "Thirty-one. Take care."],
    after: ["Doors are closing — take care.", "Have a good one.", "I've got to run. Good luck with it."],
    examples: {
      hook: "It's about a deaf drummer who loses his hearing aid the night before the audition of his life — Whiplash, but the silence is the villain.",
      delivery: "I'd love to send you the script. Could I get your assistant's email?",
    },
    signal: ["script", "send", "email", "card", "lead", "starring", "meets", "coffee", "read"],
    improve: {
      delivery: {
        title: "Land the ask",
        advice: "End with a specific, easy request before the doors open — the script, an email address, a coffee. No ask, no follow-up.",
      },
    },
  },

  "logline-gauntlet": {
    opener: "Read me the logline — one sentence, exactly as it's written.",
    questions: [
      "Who's the protagonist? Give me one adjective that makes this hard for them.",
      "What do they actually want? Give me a goal I could photograph.",
      "What's in the way — who's the opposition?",
      "What happens if they fail?",
      "Where's the irony — why is this the worst possible person for this problem?",
      "Now get it under thirty-five words and read me the new version.",
    ],
    skipIf: {
      0: ["disgraced", "washed-up", "burned-out", "former", "reformed", "widowed", "agoraphobic", "teenage", "prodigy"],
      1: ["must", "wants to", "needs to", "tries to", "sets out", "has to"],
      2: ["but", "until", "against", "rival", "enemy", "villain", "stolen", "stole", "blocks", "warden"],
      3: ["if she fails", "if he fails", "if they fail", "or else", "loses", "lose", "losing means", "or serve"],
      4: ["worst person", "worst possible", "the only one", "last person", "of all people"],
    },
    strong: [
      "“{phrase}” — good. Now I'm curious.",
      "Better. “{phrase}” is doing real work.",
      "Okay, “{phrase}” I'd remember on a Friday afternoon.",
      "That's tighter. Keep that.",
      "Better. Much better.",
      "Now that's a sentence.",
    ],
    solid: ["Okay. It's getting there.", "Fine. Next note.", "“{phrase}” — okay.", "Closer."],
    more: ["Read me the whole thing again, start to finish."],
    press: ["Not yet — make it specific.", "Try again — one sentence.", "Give me more than that."],
    rude: ["Charming. I still need the sentence.", "I've been called worse by better writers.", "Okay. Deep breath."],
    offTopic: ["We're here for the logline.", "I bill by the hour, and that wasn't a logline.", "Back to the page."],
    long: ["That's a paragraph, not a logline. One sentence.", "It got longer. Loglines only get shorter in this office."],
    hedge: ["Don't explain it to me — read me the sentence.", "No qualifiers. If it's a thriller, it's a thriller.", "Lose the throat-clearing."],
    deflect: ["I don't rewrite loglines, I read them. Try it again.", "Good question. Answer it in the logline."],
    wrapGood: [
      "Okay, stop. That one I'd put at the top of a coverage report — “{phrase}” is the phrase doing the work. Send me the script.",
      "That's a logline. I'd request the pages. Don't touch it again.",
    ],
    wrapMixed: [
      "We're out of time. It's better than where you started, but I wouldn't request it yet — the stakes are still soft. Send it again when they're not.",
      "Honest answer: not yet. The protagonist is sharper, but I still don't know what they lose. Fix that and query me again.",
    ],
    wrapPoor: ["We're out of time, and I never got a logline. Send it when you have one.", "That's the call. Query me again when there's a sentence to read."],
    after: ["I've got another call. Email me the final version.", "That's all for today.", "Send it over when it's clean."],
    examples: {
      hook: "A disgraced teenage chess prodigy must hustle games inside a Moscow prison to win back the tournament spot her father sold.",
      conflict: "…but the warden who runs the games is the man who framed her, and losing means five more years inside.",
    },
    signal: ["protagonist", "must", "when", "until", "before", "after", "disgraced", "only", "forced", "discovers"],
    improve: {
      hook: {
        title: "Sharpen the protagonist",
        advice: "One telling adjective that makes this goal hard for this person is worth ten words of plot. Then trim until every word earns its place.",
      },
    },
  },

  "founder-story": {
    opener: "Take me to that day — where were you, and who was there?",
    questions: [
      "Why you? Plenty of people have seen this problem.",
      "What do you believe that most smart people in this space don't?",
      "What's the hardest thing that's happened so far, and what did you do?",
      "Tell me about one customer — a person, not a segment.",
      "If this round doesn't come together, what do you do on Monday?",
    ],
    skipIf: {
      0: ["i spent", "i worked", "i grew up", "both sides", "firsthand", "i was a"],
      1: ["i believe", "most people think", "everyone thinks", "nobody believes"],
      2: ["hardest", "churned", "almost died", "nearly died", "ran out of money"],
      3: ["named", "her name", "his name"],
      4: ["on monday", "keep going", "i'd still"],
    },
    strong: [
      "“{phrase}.” That's the part I'd tell my partners.",
      "“{phrase}” — okay. That's real.",
      "Hm. “{phrase}.” Nobody put that in a deck.",
      "Okay. That's real. Keep going.",
      "Mm. That I believe.",
      "Huh. That's not in the deck.",
    ],
    solid: ["Okay.", "Got it.", "“{phrase}.” Mm-hm.", "Mm-hm."],
    more: ["What else should I know?", "Who else is on the team with you?"],
    press: ["Start simpler.", "Take your time — but give me something real.", "Plainer, please."],
    rude: ["Okay. I've sat across from angrier founders.", "I'll let that one go.", "Hm. That's not going to help either of us."],
    offTopic: ["Let's stay on the company.", "We can talk about that over coffee sometime.", "I'd rather hear about the business."],
    long: ["Let me slow you down. Pick one moment and stay in it.", "That's a lot of context. Give me the thirty-second version."],
    hedge: [
      "You sound like you're pitching yourself. Just tell me what happened.",
      "“{hedge}” isn't a strategy. Tell me what you actually believe.",
      "Say it like you'd say it to your co-founder.",
    ],
    deflect: [
      "We'll get to what I'm looking for. Right now I'm trying to understand you.",
      "Fair — but I'll ask the questions for another ten minutes.",
    ],
    wrapGood: [
      "Okay. I can retell that on Monday — “{phrase}” is the line my partners will remember. Let's get a second meeting on the calendar.",
      "I've heard enough to want to hear more. Send me the data room tonight.",
    ],
    wrapMixed: [
      "I'll be honest — I couldn't retell this to my partners yet. There's a real story in here; you're hiding it behind the deck. Come back when you lead with it.",
      "Not for us right now. But next time, tell the story about that day first — it's the part that stuck with me.",
    ],
    wrapPoor: ["I don't think this is the right time. Thanks for coming in.", "We're at time. Come back when you want to tell me the story."],
    after: ["I have to jump to my next one. Thanks for coming in.", "We're at time. My associate will follow up.", "Thanks again. I'll be in touch."],
    examples: {
      hook: "It was 4 a.m. in my dad's pharmacy in Fresno, and I watched him hand-copy three hundred prescriptions because the software had crashed again.",
      character:
        "I spent six years building pharmacy software that pharmacists hated. I'm the only founder in this space who's stood on both sides of that counter.",
      conflict:
        "Our biggest customer churned in month four. I drove to Bakersfield, sat behind their counter for a week, and rebuilt onboarding from what I saw.",
      delivery: "Here's what we do: we give independent pharmacies back two hours a day. Maria in Visalia now closes at six instead of nine.",
    },
    signal: ["customer", "customers", "founded", "started", "users", "revenue", "problem", "because", "years", "day", "moment", "first", "believe"],
    onNose: ["Say that again without the word “{buzz}.”", "That's the deck.", "That's deck-speak — I've heard it from ten founders this month."],
    flatPresses: true,
    weak: {
      hook: "the origin moment came too late",
      character: "we didn't learn why it had to be you",
      conflict: "the struggle stayed vague",
    },
    improve: {
      hook: {
        title: "Start with the day",
        advice: "Open on a specific moment — a date, a place, a person — before any market or mission. That's the story Ellis can retell.",
      },
      delivery: {
        title: "Drop the deck-speak",
        advice: "Tell it the way you'd tell a friend at dinner, with no buzzwords. Plain words sound like conviction.",
      },
    },
  },

  "campfire-story": {
    opener: "Where does it start — where are you, and what do you see?",
    questions: [
      "What did you want right then — and what were you scared of?",
      "When's the moment you can't go back?",
      "Give me one detail from that moment — a smell, an object, something someone said.",
      "What was at stake for you — what could you have lost?",
      "And after — who were you when it was over?",
    ],
    skipIf: {
      0: ["i wanted", "what i wanted", "scared of", "afraid of", "i was scared", "i was afraid"],
      1: ["the moment", "no going back", "couldn't go back", "can't go back", "point of no return", "never went back"],
      2: ["smelled", "smell", "the sound of"],
      3: ["could have lost", "could lose", "at stake", "i'd lose", "risked"],
      4: ["ever since", "these days", "i still"],
    },
    strong: [
      "Oh — “{phrase}.” Keep that. That's the story right there.",
      "Okay, wait. “{phrase}.” I've got chills.",
      "“{phrase}” — see, now I can see it.",
      "Oh no. Okay. I'm with you.",
      "Oh, wow. Okay.",
      "Mm. I felt that.",
      "Okay, now I'm there with you.",
    ],
    solid: ["Mm. Okay.", "Uh-huh. Go on.", "“{phrase}” — okay, I see it.", "Mm-hm."],
    more: ["Then what happened?", "What happened next?"],
    press: ["Give me the moment.", "Take me there.", "Slow down and put me in the room."],
    rude: ["Oof. Okay. Nerves do funny things before you go up.", "I'll pretend I didn't hear that. The circle won't.", "Okay — deep breath."],
    offTopic: ["Ha — save that for the snack table.", "I love a tangent, but tonight's about your story.", "Let's get back to the fire."],
    long: ["Okay, that's a lot of story. Find the one moment it turns on.", "You've got five minutes up there, not fifty. Pick the moment."],
    hedge: ["You keep saying “{hedge}.” Tell it like it happened — because it did.", "Don't apologise for it. Just tell it.", "Trust it. It's your story."],
    deflect: ["Oh, I've got a hundred of those, but tonight's yours. Keep going.", "Ha — ask me after. Keep going."],
    wrapGood: [
      "That's the applause — you're up. Build the whole thing around “{phrase}” and you'll have them. Go.",
      "They're clapping — that's you next. Honestly? It's ready. Start in the moment and trust it.",
    ],
    wrapMixed: [
      "That's your cue. It's close — start in the scene, not the background, and find the moment you couldn't go back. Go get 'em.",
      "You're up. One note: skip the setup and open on the moment. You've got this.",
    ],
    wrapPoor: ["That's the applause, and you're up. Find the true story on the walk to the mic.", "You're up. Go on — and trust the story, whatever it is."],
    after: ["Go, go — they're waiting for you!", "Mic's yours. Break a leg.", "Go on — they're clapping for you."],
    examples: {
      hook: "I'm nineteen, standing in a Greyhound station in Tulsa at 2 a.m., holding a one-way ticket and my mother's voicemail.",
      structure: "The moment I tore up the return ticket, I knew I wasn't going home — not that week, not ever.",
      character: "What I wanted was for her to call back and ask me to come home. What I was scared of was that she wouldn't.",
      delivery: "I still have the ticket stub. It's on my fridge. Some days it reminds me I left; most days it reminds me I stayed.",
    },
    signal: ["remember", "moment", "i wanted", "scared", "mom", "dad", "mother", "father", "home", "kitchen", "night", "morning", "standing", "holding"],
  },

  "festival-qa": {
    opener: "Where did this film begin for you?",
    questions: [
      "Tell us about the look of the film — why shoot it that way?",
      "There's a hand up in the front — he's asking why your main character makes that choice at the end.",
      "How did you work with your lead to get that performance?",
      "Someone in the back is asking whether the ending is ambiguous on purpose, or whether you just didn't know how to end it.",
      "What do you hope people carry out of the room tonight?",
    ],
    skipIf: {
      0: ["camera", "shot", "wide", "close-up", "lens", "palette", "colour", "color", "long take", "handheld", "frame"],
      1: ["chooses", "her choice", "his choice", "she decides", "he decides"],
      2: ["our lead", "the actor", "the actress", "rehearsal", "rehearsed", "i told"],
      3: ["ambiguous", "on purpose"],
      4: ["i hope", "carry out"],
    },
    strong: [
      "“{phrase}” — I love that.",
      "Mm, “{phrase}.” You can feel the room nodding.",
      "“{phrase}.” What a detail.",
      "Oh, that's lovely. You can feel the room nodding.",
      "That's exactly the kind of answer I hoped for.",
      "Beautiful.",
      "I think the whole room just leaned in.",
    ],
    solid: ["Thank you.", "Mm, great.", "“{phrase}” — thank you.", "Lovely, thank you."],
    more: ["Let's take one more — anything you'd like to add?"],
    press: ["Let's make it concrete.", "Give us a specific moment.", "In a sentence, if you can."],
    rude: ["Well! Let's keep it kind — it's a full house.", "I'll put that down to festival nerves.", "Okay. Let's be generous with each other."],
    offTopic: ["Let's keep it to the film — there are hands up.", "Ha. Maybe at the party.", "We'll get to the snacks later."],
    long: ["Let's keep these short so we can get a few more in.", "I'm going to jump in so we can get to more hands."],
    hedge: ["You don't have to be modest — you made the thing. Own it.", "It's okay to own it, you know.", "Say it like the director you are."],
    deflect: ["I'll let the audience answer that with their applause. Next question —", "Ha — I'm just the moderator. Let's keep going."],
    wrapGood: [
      "We're out of time — what a conversation. “{phrase}” is going to stay with me. Everyone, catch our filmmaker in the lobby. Thank you!",
      "That's time, I'm afraid. Thank you for such generous, specific answers. The filmmaker will be in the lobby — one more round of applause!",
    ],
    wrapMixed: [
      "And that's all the time we have. Thank you so much — you'll find the filmmaker in the lobby if you have more questions.",
      "We have to clear the house for the next block, so let's leave it there. Thank you for the film, and for your honesty.",
    ],
    wrapPoor: ["And we're out of time. Thank you all for coming — the lobby's open.", "Let's leave it there. Thank you, everyone."],
    after: ["The ushers are giving me the look — let's continue this in the lobby!", "Thank you, everyone. Drive safe.", "Thank you all — the lobby bar is open."],
    examples: {
      delivery: "It started with my grandmother's hands. She shelled peas every Sunday and never once looked at them — that's the whole film, really.",
      visual: "We held the camera still and wide in the kitchen because I wanted you to feel how small she'd become in her own house.",
      character: "What she wants is to be needed one more time. So I told our lead: every line is you asking them to stay, without ever asking.",
    },
    signal: ["shot", "shoot", "camera", "frame", "wide", "close", "light", "color", "colour", "performance", "actor", "rehearsal", "ending", "feel", "wanted"],
  },

  "actor-motivation": {
    opener: "What does Walter actually want from her?",
    questions: [
      "Does he mean it, though — what's he actually saying under the line?",
      "What happened right before she told him — what was I doing?",
      "Where's the turn — when does he decide to say “great”?",
      "What do I do with my hands — the tape gun, the dishes?",
      "Give me one word I can take into the take. A verb.",
    ],
    skipIf: {
      0: ["doesn't mean", "does not mean", "means", "under the line", "subtext", "really saying"],
      1: ["right before", "just before", "before she told", "wrapping", "packing"],
      2: ["the turn", "decides to say", "that's when he"],
      3: ["tape gun", "taping", "your hands", "his hands"],
    },
    strong: [
      "“{phrase}.” Oh, I can play that.",
      "Ooh. “{phrase}” — okay, I've got something now.",
      "“{phrase}.” Yes — that I can use.",
      "Ooh. Okay — so I can't let her see my face. I've got something now.",
      "Yes. That's a verb. That I can do to her.",
      "Oh, that's good. That's really good.",
      "Okay. Now I know what I'm doing in there.",
    ],
    solid: ["Okay. Okay, I'm listening.", "Mm. Say more.", "“{phrase}” — hm, okay.", "Hm. Okay."],
    more: ["What else do you want me to carry in?"],
    press: ["I can't play that yet.", "Give me something to do.", "I need something I can use."],
    rude: ["Whoa. Okay. Long day for both of us.", "I've been directed by screamers. It never helps the take.", "Let's keep it friendly — I'm on your side."],
    offTopic: ["Ha — later, at wrap.", "Focus, director. They're relighting.", "We've got about two minutes before they call us back."],
    long: ["You've lost me a little. Give it to me in one word.", "That's a lot to carry onto set. Boil it down for me."],
    hedge: ["You sound unsure — which is fine, but I need you to be sure for me.", "“{hedge}” is hard to act. Pick one.", "Commit to it. I'll commit with you."],
    deflect: [
      "Honestly, I think he's hiding something — but you're the director. You tell me.",
      "I have instincts, but I want yours first.",
    ],
    onNose: [
      "I can't play “sad,” though. What am I doing to her?",
      "That's a result, not an action. What does Walter want from her?",
    ],
    wrapGood: [
      "Okay. “{phrase}” — that's what I'm taking in with me. Let's go again; I think you're going to like this one.",
      "That's plenty. I know what I'm doing to her now. Let's go shoot it.",
    ],
    wrapMixed: [
      "Okay. I'll… try something. Let's just go again and see what happens.",
      "I think I'll find it on the take. Let's go — but next time, give me a verb, yeah?",
    ],
    wrapPoor: ["Okay. I'll just do what I did before, I guess. Let's go.", "They're calling us back. I'll figure something out."],
    after: ["They're calling us back — let's go shoot it.", "Let's do it. Back to one.", "Back to one. Let's make it count."],
    examples: {
      character: "He wants to give her permission to go. If she sees him crack, she'll stay — and he'd never forgive himself.",
      dialogue: "He doesn't mean “great.” He means “don't leave me” — and he'd rather die than let her hear that.",
      delivery: "Bless her. That's the verb. Bless her, and tape the box.",
    },
    signal: ["wants", "want", "trying", "protect", "reassure", "release", "bless", "hide", "hiding", "subtext", "means", "tape", "dishes", "box", "june", "walter", "lisbon", "verb", "action"],
    flatPresses: true,
    improve: {
      character: {
        title: "Give him an objective",
        advice: "Tell Theo what Walter wants from June in this moment, and what happened just before. Circumstances make the line playable.",
      },
      dialogue: {
        title: "Know what's under the line",
        advice: "Decide what Walter means when he says “great” — then give Theo the gap between the words and the meaning.",
      },
      delivery: {
        title: "Direct with verbs",
        advice: "Give Theo an action he can play on June — reassure, release, protect — instead of a mood or a result. One word beats a speech.",
      },
    },
    weak: {
      character: "Walter's want never came into focus",
      dialogue: "the subtext under “great” stayed unexplored",
      delivery: "the direction leaned on results instead of verbs",
    },
  },

  "dp-shot-planning": {
    opener: "In one sentence — what's this scene about, and whose scene is it?",
    questions: [
      "What's the first shot, and what does the audience need to feel?",
      "Where's the turn — and what does the camera do there?",
      "Handheld or sticks, wide lens or long — and why?",
      "We just lost an hour — the generator died. What do you cut, and what do you protect?",
      "What's the light doing — where's it coming from?",
      "What's the last image — what are they left with?",
    ],
    skipIf: {
      0: ["first shot", "open on", "we open", "opening shot", "we start", "start wide", "start close"],
      1: ["the turn", "when sam breaks", "when he breaks"],
      2: ["handheld", "sticks", "tripod", "long lens", "wide lens"],
      3: ["i drop", "we drop", "i cut", "we cut", "i'd cut", "protect"],
      4: ["practical", "light comes", "lit by", "motivated light"],
      5: ["last shot", "last image", "end on", "final shot", "final image"],
    },
    strong: [
      "“{phrase}.” Good — that I can light.",
      "“{phrase}” — okay, that's a reason. I like it.",
      "Mm. “{phrase}.” Now we're making a film instead of a shot list.",
      "Okay, that's a reason. I like it.",
      "Now we're making a film instead of a shot list.",
      "Good. That's a choice.",
      "Right. That I can build a day around.",
    ],
    solid: ["Fine.", "Okay, noted.", "“{phrase}.” Okay.", "Mm. Noted."],
    more: ["What else do we need to protect?", "Anything else before I build the list?"],
    press: ["I need a decision.", "Give me something I can light.", "Talk to me in shots."],
    rude: ["Right. I've shot for worse. Let's just do the work.", "Okay. It's late — let's not.", "Charming. The generator's still running, though."],
    offTopic: ["Focus. We've got four hours tomorrow.", "Later. Shot list first.", "It's midnight — stay with me."],
    long: ["You've just described fifteen setups and we have twelve. Prioritise.", "Slow down. One shot at a time."],
    hedge: [
      "Don't give me options, give me a decision. I'll tell you if it can't be done.",
      "“Maybe” means we light for both, which means we lose an hour. Pick.",
      "Pick one. We can be wrong on the day.",
    ],
    deflect: ["I've got opinions, but I want yours first. It's your film.", "I'll tell you what I'd do after you tell me what you want them to feel."],
    wrapGood: [
      "Right. “{phrase}” — that's the image I'll be thinking about tonight. If we lose light, we drop the geography and protect the turn. Call time's six.",
      "Okay — that's a scene with a point of view. I'll prep the kit tonight. Call time's six; don't be late.",
    ],
    wrapMixed: [
      "Okay. I'll build a shot list off this, but we'll be improvising at the turn, and I don't love that. Sleep on it. Call time's six.",
      "Right, it's late. I'll light for coverage and hope we find it on the day — which is exactly what I didn't want. Call time's six.",
    ],
    wrapPoor: ["It's late, and we don't have a plan. I'll light for coverage and we'll pray. Call time's six.", "Right. I'll see you at six, and we'll wing it. I hate winging it."],
    after: ["It's midnight. Go home.", "Save it for the tech scout.", "Sleep. Call time's six.", "I'm turning the lights off now."],
    examples: {
      visual:
        "We start wide from outside the window — neon on the glass, the two of them small in the booth — so we feel what Nadia's about to break open.",
      pacing: "If we lose an hour, I drop the two-shot and protect the close-up on Sam when he breaks. That's the whole scene.",
    },
    signal: ["shot", "wide", "close", "close-up", "medium", "insert", "lens", "handheld", "sticks", "dolly", "push", "static", "overhead", "window", "neon", "booth", "light", "frame", "coverage", "setups", "master", "two-shot", "reverse", "protect"],
    improve: {
      visual: {
        title: "Give every shot a why",
        advice: "Pair each setup with what it makes the audience feel, and save your strongest choice for the turn — the moment the scene breaks open.",
      },
      pacing: {
        title: "Protect the turn",
        advice: "Decide which two setups you'd keep if you lost half the day, and name your first and last images. That's the spine of the plan.",
      },
    },
  },

  "writers-room-break": {
    opener: "Whose episode is it, and what do they want by the end of the hour?",
    questions: [
      "What's the inciting incident — what kicks it off in the teaser?",
      "What's the act one break — what's the turn?",
      "What's the midpoint — what flips?",
      "What's the B-story, and how does it rhyme with the A?",
      "Would they really do that — what are they afraid of?",
      "What's the low point at the end of act four — and how do we end?",
      "What's the last image before we cut to black?",
    ],
    skipIf: {
      0: ["teaser", "cold open", "inciting", "kicks off"],
      1: ["act one", "act 1", "first act"],
      2: ["midpoint"],
      3: ["b-story", "b story"],
      4: ["afraid of", "scared of", "terrified of"],
      5: ["act four", "act 4", "low point"],
      6: ["last image", "final image", "cut to black"],
    },
    more: ["Keep going — what's the tag?", "Okay. What else is on the board?"],
    strong: [
      "Yes — “{phrase}.” Put that on the board.",
      "“{phrase}” — oh, that's good. That makes the next act harder.",
      "Okay, “{phrase}.” That's a turn. I love that.",
      "Oh, that's good. And it makes the next act harder, which is what we want.",
      "Okay, that's a turn. I love that.",
      "Yes. Card it — that's a real beat.",
      "Ooh. That's the episode.",
      "Now we're cooking.",
      "Yes — and that pays off later.",
    ],
    solid: ["Okay. Board it.", "Mm, fine. Let's keep moving.", "“{phrase}” — okay, card it.", "Fine. Card it."],
    press: ["I can't break it without the want.", "Give me the specific version.", "That's not a beat yet."],
    rude: ["Okay — room rules: we attack the story, not each other.", "I'll pretend that was the coffee talking.", "Noted. Now, the board."],
    offTopic: ["Parking lot — put it on the other board.", "Save it for lunch.", "Back to the break."],
    long: ["Let me stop you — that's three episodes of story. Give me this episode.", "Slow down. One beat at a time, one card at a time."],
    hedge: ["Don't pitch it with a question mark. Commit, and we'll fix it.", "“{hedge}” doesn't go on the board. Commit to something.", "Pitch it like you believe it."],
    deflect: ["It's your episode — you tell me, then I'll tell you why it's wrong.", "Ha. Good question. Pitch me the answer."],
    wrapGood: [
      "Okay — lunch. Reading it back, “{phrase}” is the strongest thing on the board. Outline it this weekend.",
      "That's lunch. This is a real episode — I can see the act breaks from here. Go to outline.",
    ],
    wrapMixed: [
      "Let's break for lunch. There's an episode in here, but the act breaks aren't turning yet. Nail down the want and we'll re-break it after.",
      "Lunch. Honest read: we've got events, not an episode. Figure out what she wants and everything else will line up.",
    ],
    wrapPoor: ["Lunch. We've got an empty board — come back with a want and we'll start over.", "Let's break. Nothing on the board yet. We try again at two."],
    after: ["Lunch, I said. Go eat.", "We'll pick it up at two.", "Go. The board will still be here.", "Seriously — lunch. Bring me back a coffee."],
    examples: {
      structure: "Act one break: Joanie signs the letter of intent — and that same night Rudy tells her he's put the motel in her name.",
      conflict: "End of act four, the developer's surveyors show up at the motel, and Rudy thinks Nico called them.",
      character: "Joanie wants the sale closed before Rudy's birthday, because she's afraid that if he finds out any later, it'll kill him.",
    },
    signal: ["act", "teaser", "cold open", "break", "midpoint", "turn", "reveal", "reversal", "b-story", "a-story", "cliffhanger", "ending", "joanie", "rudy", "nico", "wants", "afraid", "episode"],
  },

  "subtext-sparring": {
    opener: "Where'd you put the keys, Cal?",
    questions: [
      "He always said you were the only one who could dock her in a crosswind. Remember that?",
      "Funeral home sent the final bill, by the way. I put it on my card. Again.",
      "I drove past the marina yesterday.",
      "Found the spare key to the Margaret in his coat. You want it, or… no?",
      "Where's the title, Cal? He kept it in the fire safe, and the fire safe's empty.",
      "Is there something you want to tell me?",
    ],
    strong: ["Huh. Sure.", "Right. Of course.", "Mm. That's one way to put it.", "Wow. Okay.", "Funny.", "Sure you did."],
    solid: ["Okay.", "Fine.", "If you say so.", "Mm."],
    more: ["So what are we doing with his tools?"],
    press: ["You going to help, or just stand there?", "Hand me that box.", "Tape. Please."],
    rude: ["Wow. Okay. I'll do the boxes myself.", "Nice. Dad would've loved that.", "Say that again and you can clear the garage alone."],
    offTopic: [
      "Cal. Focus. The garage.",
      "That's what you want to talk about. Right now. Here.",
      "You always do this when things get hard.",
      "I'm not doing small talk in Dad's garage.",
      "Unbelievable. Okay.",
    ],
    long: ["You're doing that thing where you talk a lot so you don't have to say anything.", "Wow. That was a speech."],
    hedge: ["You always do that — “I mean, {hedge}.” Dad hated that.", "Just say what you mean for once.", "There it is. The shrug."],
    deflect: ["Don't answer a question with a question. Dad hated that too.", "Ask me that again when you've carried a box."],
    onNose: ["Okay. Well. Thanks for telling me, I guess.", "…Right. Cool. Good talk."],
    wrapGood: [
      "I'm taking his watch. You keep the tackle — you'll want something to remember the boat by. …Lock up when you're done.",
      "Yeah. That sounds like you. …I'll take the photo. You keep the rest.",
    ],
    wrapMixed: ["I'm done for today. Lock up when you're finished.", "Keep the tackle. I don't want it anymore."],
    wrapPoor: ["I'm done. Lock up when you're finished.", "Forget it. I'll come back for the rest tomorrow."],
    after: ["I said I'm done, Cal.", "Goodnight, Cal.", "Lock up.", "I'm going."],
    examples: {
      dialogue: "You want the tackle? Take the tackle. I'm not much of a fisherman these days.",
      character: "Here — you take Dad's watch. You were always better at keeping things.",
      conflict: "Marina's expensive this time of year. You'd be amazed what people let go of.",
    },
    signal: ["boat", "keys", "key", "tackle", "dad", "marina", "margaret", "box", "money", "title", "watch", "garage", "photo"],
    echo: false,
    partner: "Tess",
    pressRepeats: false,
    improve: {
      dialogue: {
        title: "Let the objects talk",
        advice: "When Tess gets close, route the answer through the tackle, the keys or a task — the feeling should leak out, never be announced.",
      },
      character: {
        title: "Play a want in every line",
        advice: "Decide what Cal wants from Tess right now — to change the subject, to be let off the hook — and make every line do that job.",
      },
      conflict: {
        title: "Keep the secret alive",
        advice: "Every time the truth surfaces, the scene deflates. Answer her pressure with evasions and double meanings, and let the tension keep climbing.",
      },
    },
    weak: {
      dialogue: "too much got said out loud",
      character: "Cal's want got lost",
      conflict: "the tension leaked out when the secret surfaced",
    },
    nextSteps: {
      conflict: {
        title: "Hold the secret longer",
        description: "Replay the scene with one rule: every time Tess gets close, answer with an object or a task. See how many turns you can hold the tension.",
      },
    },
  },
};

const FALLBACK_SCRIPT: DemoScript = {
  opener: "Where does it start?",
  questions: ["Tell me more — what happens next?", "What's at stake?", "Why does it matter to you?", "How does it end?"],
  strong: ["“{phrase}.” Okay, I'm with you.", "Good. That's specific."],
  solid: ["Okay.", "Go on."],
  press: ["Give me something specific — a person, a place, a moment."],
  rude: ["Okay. Let's keep it civil."],
  offTopic: ["Let's get back to the story."],
  long: ["Let me stop you there. Give me the short version."],
  hedge: ["You sound unsure. Commit to it."],
  deflect: ["It's your story — you tell me."],
  wrapGood: ["That's time. “{phrase}” — that's the part I'll remember. Nice work."],
  wrapMixed: ["That's time. There's something here; keep working on it."],
  wrapPoor: ["That's time. Let's try again another day."],
  after: ["We're done for today."],
  examples: {},
  signal: [],
};

export function demoScriptFor(scenario: Scenario): DemoScript {
  return DEMO_SCRIPTS[scenario.id] ?? FALLBACK_SCRIPT;
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** Saying the quiet part out loud — fatal in a subtext drill. */
const ON_THE_NOSE = [
  "i sold",
  "sold the boat",
  "sold it",
  "the truth is",
  "i need to tell you",
  "i have to tell you",
  "i have something to tell you",
  "i feel",
  "i'm sorry",
  "i am sorry",
  "i'm so sorry",
  "i'm angry",
  "i'm hurt",
  "i'm upset",
  "i'm ashamed",
  "i feel guilty",
  "confess",
  "i lied",
] as const;

/** Result direction: asks an actor for an outcome instead of an action. */
const RESULT_DIRECTION = [
  "be sad",
  "sadder",
  "more sad",
  "more emotional",
  "angrier",
  "more angry",
  "just be",
  "be natural",
  "more natural",
  "make it land",
  "more energy",
  "feel it",
  "like you mean it",
  "more intense",
  "cry",
] as const;

/** Playable actions: transitive verbs one character can do to another. */
const ACTIONS = [
  "reassure",
  "reassuring",
  "release",
  "bless",
  "blessing",
  "protect",
  "protecting",
  "comfort",
  "convince",
  "charm",
  "provoke",
  "test",
  "warn",
  "beg",
  "plead",
  "dismiss",
  "stall",
  "stalling",
  "hide",
  "hiding",
  "tease",
  "punish",
  "seduce",
  "soothe",
  "challenge",
  "flatter",
  "needle",
  "placate",
  "encourage",
  "let her go",
  "hold on",
  "push her",
  "wants her",
  "wants to",
  "trying to",
] as const;

/** Given circumstances in the actor drill. */
const CIRCUMSTANCES = [
  "right before",
  "just before",
  "happened",
  "first christmas",
  "christmas",
  "alone",
  "her mother",
  "mother's",
  "dishes",
  "three hours",
  "drove",
  "retired",
  "widower",
  "since",
  "lisbon",
] as const;

const SUBTEXT_TERMS = [
  "subtext",
  "under the line",
  "underneath",
  "doesn't mean",
  "does not mean",
  "really means",
  "really saying",
  "means",
  "lie",
  "lying",
  "pretend",
  "pretending",
  "mask",
  "cover",
  "covering",
  "hiding",
  "unsaid",
] as const;

const STRUCTURE_TERMS = [
  "act",
  "act one",
  "act two",
  "act three",
  "first act",
  "second act",
  "third act",
  "midpoint",
  "turn",
  "turning point",
  "break",
  "climax",
  "ending",
  "ends",
  "inciting",
  "teaser",
  "cold open",
  "b-story",
  "a-story",
  "b story",
  "a story",
  "reversal",
  "reveal",
  "cliffhanger",
  "twist",
  "setup",
  "payoff",
  "low point",
  "finally",
  "so then",
  "that's when",
  "until",
  "because of that",
  "the moment",
  "i knew",
  "not ever",
  "from then on",
  "after that",
  "that same night",
  "the next morning",
  "at the midpoint",
  "learns",
  "so now",
  "now she's",
  "now he's",
  "it ends",
  "we end",
  "in the end",
  "i still",
  "to this day",
  "these days",
  "some days",
  "for years",
  "wasn't going",
] as const;

const CHARACTER_TERMS = [
  "she wants",
  "he wants",
  "they want",
  "chooses",
  "decides",
  "choice",
  "wants",
  "wanted",
  "afraid",
  "fear",
  "flaw",
  "wound",
  "needs",
  "secret",
  "ashamed",
  "guilt",
  "believes",
  "believed",
  "why me",
  "grew up",
  "my dad",
  "my mom",
  "my father",
  "my mother",
  "scared",
  "scared of",
  "what i wanted",
  "terrified",
  "permission",
  "forgive",
  "i wanted",
] as const;

const FILM_TERMS = [
  "close",
  "close-up",
  "wide",
  "medium",
  "insert",
  "two-shot",
  "over-the-shoulder",
  "ots",
  "pov",
  "lens",
  "mm",
  "handheld",
  "sticks",
  "tripod",
  "dolly",
  "push in",
  "push-in",
  "track",
  "tracking",
  "static",
  "steadicam",
  "crane",
  "overhead",
  "profile",
  "silhouette",
  "rack focus",
  "shallow",
  "depth of field",
  "backlight",
  "practical",
  "practicals",
  "neon",
  "window",
  "reflection",
  "long take",
  "oner",
  "palette",
] as const;

/** Language that ties a craft choice to its effect. */
const MOTIVATION = ["so that", "so we", "so you", "so the audience", "because", "to feel", "feel", "to show", "makes us", "we feel", "you feel", "in order to"] as const;

const ECONOMY = [
  "cut",
  "drop",
  "protect",
  "lose",
  "combine",
  "one take",
  "oner",
  "long take",
  "hold",
  "linger",
  "beat",
  "master",
  "coverage",
  "setups",
  "setup",
  "order",
  "first shot",
  "last shot",
  "open on",
  "end on",
  "priority",
  "prioritise",
  "prioritize",
] as const;

/** Trouble words the shared lexicon misses. */
const CONFLICT_EXTRA = [
  "crashed",
  "churned",
  "hated",
  "failed",
  "failure",
  "broke",
  "broken",
  "lost",
  "loses",
  "quit",
  "rejected",
  "nobody",
  "struggled",
  "hardest",
  "ran out",
  "bankrupt",
  "debt",
  "debts",
  "died",
  "dying",
  "sick",
  "mistake",
  "finds out",
  "discovers",
  "betray",
  "betrays",
  "caught",
  "confronts",
  "threatens",
  "deadline",
  "stolen",
  "stole",
  "blames",
  "finds",
  "low point",
  "realises",
  "realizes",
  "pressure",
  "framed",
  "bulldoze",
  "blame",
  "drown",
  "drowns",
  "drowned",
  "kill",
  "kills",
  "murdered",
  "missing",
  "storm",
  "custody",
  "evicted",
  "prison",
  "jail",
  "arrested",
] as const;

/** The moments a story turns on — preferred when quoting structure. */
const TURN_TERMS = [
  "midpoint",
  "turn",
  "turning point",
  "reversal",
  "reveal",
  "realises",
  "realizes",
  "realised",
  "realized",
  "learns",
  "discovers",
  "the moment",
  "that's when",
  "until",
  "i knew",
  "no going back",
  "flips",
] as const;

/** Drive in a premise: someone who has to do something. */
const HOOK_DRIVE = ["has to", "have to", "needs to", "must", "wants to", "sets out", "tries to", "is forced to", "fights to"] as const;

/** What a founder did about the hard part — honesty about a struggle, not spin. */
const FOUNDER_STRUGGLE = [
  "i drove",
  "i sat",
  "rebuilt",
  "what i did",
  "so i",
  "i fixed",
  "we fixed",
  "i called",
  "we almost",
  "we lost",
  "i lost",
  "mistake",
  "we failed",
  "i failed",
  "hardest",
  "keep going",
  "i'd keep",
] as const;

/** A before-and-after: how the teller (or the character) is different now. */
const CHANGE_EXTRA = ["i still", "most days", "some days", "to this day", "i left", "i stayed", "i became", "anymore", "never again", "from then on", "wasn't going"] as const;

/** How a director got the performance (the festival Q&A asks). */
const DIRECTING_ACTORS = ["our lead", "told her", "told him", "i told", "rehearsal", "rehearsed", "every line", "i asked her", "i asked him"] as const;

/** Taking a note or a hard question gracefully. */
const GRACE = ["thank you for", "smart note", "good question", "great question", "fair question", "that's fair", "i see why", "i hear you", "you're right", "reaching for"] as const;

/** Signs of founder–problem fit: lived experience with the problem. */
const FOUNDER_FIT = ["i spent", "years", "my dad", "my mom", "my father", "my mother", "i was", "i've been", "both sides", "i grew up", "i worked", "i built", "i watched", "firsthand", "myself"] as const;

/** Background-first openings that delay a spoken story. */
const BACKGROUND_OPENERS = ["growing up", "let me start", "some background", "a little background", "to give you context", "so basically", "my whole life", "i've always"] as const;

const IRONY = [
  "but",
  "only",
  "until",
  "despite",
  "even though",
  "who must",
  "the one person",
  "last person",
  "worst",
  "nobody will",
  "nobody believes",
  "no one believes",
  "the only one",
  "of all people",
] as const;

/** What's lost if it goes wrong, said as a phrase ("she loses the last thing she has"), not a lone word. */
const STAKE_PHRASES = [
  "if she fails",
  "if he fails",
  "if they fail",
  "if i fail",
  "if it fails",
  "if this fails",
  "if she's wrong",
  "if he's wrong",
  "if they're wrong",
  "she loses",
  "he loses",
  "they lose",
  "i lose",
  "i'd lose",
  "would lose",
  "could lose",
  "could have lost",
  "the last thing",
  "losing means",
  "or serve",
  "more years",
  "or else",
  "lose everything",
  "last chance",
  "no going back",
  "can't go back",
  "it'll kill",
  "for good",
] as const;

const CONFIDENT = ["i will", "we will", "i'll", "we'll", "here's", "the answer is", "i know", "i believe", "exactly", "absolutely", "simply", "the point is"] as const;

const ASK = ["could i", "can i", "would you", "send you", "send it", "coffee", "email", "card", "read it", "the script", "meeting", "follow up"] as const;

const BUZZWORDS = ["revolutionize", "revolutionise", "disrupt", "disruptive", "platform", "synergy", "leverage", "game-changer", "game changer", "uber for", "paradigm", "innovative", "cutting-edge", "world-class", "scalable", "ecosystem", "ai-powered"] as const;

const OBJECTS = ["box", "boxes", "keys", "key", "tackle", "watch", "photo", "tape", "coat", "jacket", "wrench", "lamp", "shelf", "bag", "rope"] as const;

const PLAY_WANT = ["hand me", "give me", "let's", "can we", "help me", "come on", "leave it", "forget it", "never mind", "anyway", "whatever", "you want"] as const;

/** Contempt for the drill or the partner. Always rude. */
const RUDE_PHRASES = [
  "shut up",
  "waste of my time",
  "waste of time",
  "leave me alone",
  "screw you",
  "screw this",
  "go away",
  "hate you",
  "i'm not doing this",
  "not doing this",
  "give me a good score",
  "give me a high score",
  "just give me a score",
  "this is stupid",
  "this is dumb",
  "this sucks",
  "you suck",
  "you're an idiot",
  "you idiot",
  "you're stupid",
  "you're useless",
  "you're boring",
  "so boring",
] as const;

/** Rudeness aimed at the drill itself: rude even from a character (subtext scenes allow in-scene hostility). */
const RUDE_OUT_OF_SCENE = [
  "waste of my time",
  "waste of time",
  "give me a good score",
  "give me a high score",
  "just give me a score",
  "this is stupid",
  "this is dumb",
  "this sucks",
  "i'm not doing this",
  "so boring",
] as const;

/** Dismissive words that read as rudeness only in a short line ("Boring."), not inside a story. */
const SHORT_INSULTS = ["don't care", "who cares", "idiot", "stupid", "dumb", "boring", "pathetic", "moron", "loser", "useless", "lame"] as const;

/** A line made only of these is a shrug, not an answer. */
const FILLER = new Set(
  (
    "idk dunno i don't know yeah yes yep yup no nope nah ok okay k sure fine whatever maybe um uh hmm mm guess so not lol meh " +
    "nothing eh cool alright right well like just really it is that good great mean think idea thing"
  ).split(" "),
);

/** Words too generic to show a line is about the scene. */
const GENERIC_TERMS = new Set([
  "but",
  "however",
  "until",
  "must",
  "can't",
  "cannot",
  "won't",
  "only",
  "never",
  "everything",
  "life",
  "now",
  "then",
  "when",
  "after",
  "before",
  "later",
  "finally",
  "time",
  "feel",
  "because",
  "first",
  "day",
]);

/** Story-talk that marks a line as part of the conversation, whatever the details. */
const STORY_WORDS = [
  "it's about",
  "about a",
  "about an",
  "character",
  "protagonist",
  "hero",
  "heroine",
  "script",
  "scene",
  "logline",
  "pitch",
  "audience",
  "ending",
  "begins",
  "episode",
  "shot",
  "movie",
  "film",
  "genre",
  "thriller",
  "comedy",
  "drama",
  "horror",
  "romance",
  "western",
  "documentary",
  "musical",
  "heist",
  "mystery",
  "noir",
  "fantasy",
] as const;

/** Story words that don't make a question about something else relevant ("Seen the new Marvel movie?"). */
const CHATTY_STORY_WORDS = new Set(["movie", "film"]);

/** The world of the garage scene: family, the boat, the chores, the money. */
const SUBTEXT_WORLD = [
  "he",
  "his",
  "him",
  "mom",
  "mother",
  "father",
  "sister",
  "brother",
  "family",
  "funeral",
  "always",
  "never",
  "remember",
  "used to",
  "pay",
  "owe",
  "sell",
  "keep",
  "keeping",
  "kept",
  "stay",
  "done",
  "shelves",
  "dark",
  "fish",
  "fishing",
  "water",
  "dock",
  "crosswind",
  "crosswinds",
  "safe",
  "flowers",
  "bill",
] as const;

/** Words that make an echoed phrase tone-deaf ("I love that" after a death). */
const GRIEF = new Set(["die", "died", "dies", "dying", "dead", "death", "funeral", "killed", "grief", "grieving", "cancer", "suicide", "buried", "overdose", "miscarriage"]);

const NUMBER_WORDS = new Set(
  (
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen " +
    "twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion dozen half"
  ).split(" "),
);

const IRREGULAR_PAST = new Set(
  (
    "said told went came saw took gave got made found felt kept left lost won sold bought brought thought taught caught fought sought " +
    "ran sat stood met paid led fed fled held hid bit broke spoke woke drove rode wrote grew threw knew flew drew wore tore swore stole " +
    "froze chose rose fell sang rang sank swam began drank shook forgot forgave hung dug stuck struck spun sent spent built lent meant " +
    "dealt slept swept wept crept"
  ).split(" "),
);

/** Common verbs: an echo that starts or pivots on one ("believe independent", "break open") sounds broken. */
const BASE_VERBS = new Set(
  (
    "believe believes serve serves break breaks make makes take takes give gives tell tells show shows need needs love loves hate hates " +
    "know knows think thinks keep keeps let lets put puts find finds lose loses win wins run runs walk walks drive drives call calls " +
    "ask asks try tries pay pays hold holds bring brings buy buys sell sells send sends build builds open opens close closes stop stops " +
    "start starts move moves leave leaves stay stays meet meets write writes play plays cut cuts drop drops protect protects push pushes " +
    "pull pulls hide hides forgive forgives tear tears learn learns decide decides realise realises realize realizes remember remembers " +
    "deserve deserves happen happens become becomes seem seems help helps smell smells"
  ).split(" "),
);

/** Nouns too vague to echo on their own merits ("whole point", "whole version"). */
const BLAND = new Set(["whole", "entire", "rest", "point", "part", "version", "bit", "piece", "sort", "kind"]);

/** Nouns that happen to end in -ly (so they aren't trimmed as adverbs). */
const LY_NOUNS = new Set(["family", "belly", "jelly", "bully", "lily", "rally", "ally", "holly", "folly", "assembly", "anomaly", "monopoly", "supply", "reply", "butterfly", "fly"]);

const STOPWORDS = new Set(
  (
    "a an the and but or nor so yet for of to in on at by as from with without into onto over under after before about above below between through during " +
    "is are was were be been being am do does did done have has had having will would shall should can could may might must " +
    "i me my mine myself we us our ours you your yours he him his she her hers they them their theirs it its it's itself " +
    "i'm i've i'll i'd you're you've you'll he's she's we're we've they're they've that's there's what's who's let's " +
    "this that these those there here where when what which who whom whose why how because if then than too also very just really " +
    "not no yes okay ok um uh well actually basically literally kind sort like thing things stuff lot lots maybe guess mean means " +
    "gonna wanna gotta can't won't don't doesn't didn't isn't wasn't aren't weren't couldn't wouldn't shouldn't " +
    "one ones way even still only own same other another such some any every each all both more most much many few " +
    "get gets got make makes made say says said know knew think thought feel felt want wants wanted need needs go goes went going " +
    "tell told see saw take took come came try tries trying give gave put look looks " +
    "named called never always ever getting being doing having coming making keep keeps kept let lets use used find found start started " +
    "saying telling talking thinking feeling looking taking working seeing knowing trying goes " +
    "behind beside across around inside outside toward towards against along among upon within near past off out up down away back " +
    "again once alone instead together until since while though although whether else now today yesterday tomorrow later soon already almost " +
    "slowly finally suddenly quickly honestly totally completely exactly probably definitely loud " +
    "story movie film idea something someone everything everyone anything nothing somebody great good bad big little new old sure right " +
    "either neither rather"
  ).split(/\s+/),
);

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** One-dot leader: stands in for the full stops in abbreviations so sentence splitting ignores them. */
const ABBR_DOT = "\u2024";
const ABBREVIATIONS = /\b(a\.m\.|p\.m\.|e\.g\.|i\.e\.|vs\.|mr\.|mrs\.|ms\.|dr\.|st\.|u\.s\.)/gi;

function normalize(text: string): string {
  return text
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(ABBREVIATIONS, (m) => m.replaceAll(".", ABBR_DOT))
    .trim();
}

/** Undo `normalize`'s abbreviation protection for text shown to the learner. */
function restore(text: string): string {
  return text.replaceAll(ABBR_DOT, ".");
}

/** Sum of distinct-term hits per line — rewards using a vocabulary across turns. */
function sumTerms(lines: string[], terms: readonly string[]): number {
  return lines.reduce((n, line) => n + countTerms(line, terms), 0);
}

function trimWords(text: string, max: number): string {
  const parts = text.trim().split(/\s+/);
  return parts.length > max ? `${parts.slice(0, max).join(" ")}…` : text.trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const TITLE_BRIDGES = new Set(["of", "the", "and", "de", "in"]);

const DETERMINERS = new Set(["a", "an", "the", "my", "his", "her", "their", "our", "your", "this", "that", "these", "those"]);

interface Token {
  word: string;
  /** First word of its sentence (so its capital letter says nothing). */
  initial: boolean;
}

function isProper(t: Token): boolean {
  return !t.initial && /^[A-Z]/.test(t.word);
}

/** A token that ends a candidate phrase: contractions ("she'd", "who'll"), number words and bland nouns. */
function breaksPhrase(lower: string): boolean {
  return /'(?:d|ll|ve|re|m)$|n't$/.test(lower) || NUMBER_WORDS.has(lower) || BLAND.has(lower);
}

/** A lowercase word that reads as a verb in an echo. */
function isVerbLike(t: Token, position: "first" | "middle" | "last", afterDeterminer: boolean): boolean {
  if (isProper(t)) return false;
  const lower = t.word.toLowerCase();
  if (IRREGULAR_PAST.has(lower)) return true;
  // "the turn", "a cut": a verb form right after a determiner is a noun.
  if (BASE_VERBS.has(lower)) return !(position === "first" && afterDeterminer);
  // "a retired lifeguard" is fine; "station smelled" and "decided either" aren't.
  return /.{3}ed$/.test(lower) && (position === "last" || (position === "first" && !afterDeterminer));
}

/**
 * A short phrase from the learner's own words worth echoing back: the
 * strongest run of consecutive content words, up to four long. Names,
 * numbers and phrases that follow a determiner ("the burned-out vice cop")
 * score higher. Runs are cut at verbs, so an echo is a noun phrase rather
 * than a broken fragment ("station smelled", "serves five"). Returns null
 * when nothing is distinctive enough to quote — a lone common word sounds
 * robotic when echoed — or when the phrase touches grief, where a bright
 * "I love that" would be tone-deaf.
 */
export function keyPhrase(text: string): string | null {
  let best: { phrase: string; score: number } | null = null;
  const consider = (segment: Token[], afterDeterminer: boolean) => {
    const run = [...segment];
    // "the midpoint Doris proves" → "Doris": trim a verb after a name, and a common noun before one.
    while (run.length > 1 && !isProper(run[run.length - 1]) && isProper(run[run.length - 2])) run.pop();
    while (run.length > 1 && !isProper(run[0]) && isProper(run[1])) run.shift();
    // "the world presses" → "world": a lowercase word ending in -s after a lowercase noun is usually a verb.
    const looksLikeVerb = (t: Token, prev: Token) =>
      !isProper(t) && !isProper(prev) && /[^su]s$/.test(t.word) && !/s$/.test(prev.word) && !prev.word.endsWith("'s");
    while (run.length > 1 && looksLikeVerb(run[run.length - 1], run[run.length - 2])) run.pop();
    const trailing = (t: Token) => {
      const lower = t.word.toLowerCase();
      return !isProper(t) && (/.{3}ing$/.test(lower) || (/.{2}ly$/.test(lower) && !LY_NOUNS.has(lower)) || isVerbLike(t, "last", false));
    };
    while (run.length > 0 && trailing(run[run.length - 1])) run.pop();
    // Up to four meaningful words; title connectors ("of", "and") ride along but don't count.
    const kept: Token[] = [];
    for (const t of run) {
      if (kept.filter((k) => !TITLE_BRIDGES.has(k.word.toLowerCase())).length >= 4) break;
      kept.push(t);
    }
    while (kept.length > 0 && TITLE_BRIDGES.has(kept[kept.length - 1].word.toLowerCase())) kept.pop();
    if (kept.length === 0) return;
    if (kept.some((t) => GRIEF.has(t.word.toLowerCase()))) return;
    const single = kept.length === 1;
    const t0 = kept[0];
    // A lone word only earns an echo when it's a compound or a number ("seventy-year-old", "1987").
    if (single && !/\d/.test(t0.word) && !t0.word.includes("-")) return;
    const phrase = kept
      .map((t) => t.word)
      .join(" ")
      .replace(/^['-]+|['-]+$/g, "");
    if (phrase.length < 4) return;
    let score = kept.reduce((n, t) => n + Math.min(t.word.length, 9), 0);
    score += kept.filter(isProper).length * 4;
    score += kept.filter((t) => /\d/.test(t.word)).length * 3;
    if (!single) score += 6;
    if (afterDeterminer) score += 6;
    if (!best || score > best.score) best = { phrase, score };
  };
  /** Cut a run at verbs (unless they join two names, as in "Jaws meets Cocoon") and weigh each piece. */
  const splitAndConsider = (run: Token[], afterDeterminer: boolean) => {
    let piece: Token[] = [];
    let pieceAfterDeterminer = afterDeterminer;
    run.forEach((t, i) => {
      const position = i === 0 ? "first" : i === run.length - 1 ? "last" : "middle";
      const betweenNames = i > 0 && i < run.length - 1 && isProper(run[i - 1]) && isProper(run[i + 1]);
      if (!betweenNames && isVerbLike(t, position, afterDeterminer)) {
        if (piece.length > 0) consider(piece, pieceAfterDeterminer);
        piece = [];
        pieceAfterDeterminer = false;
        return;
      }
      piece.push(t);
    });
    if (piece.length > 0) consider(piece, pieceAfterDeterminer);
  };

  for (const sentence of sentences(normalize(text))) {
    const tokens = sentence.match(/[A-Za-z0-9][A-Za-z0-9'-]*|[^\sA-Za-z0-9]/g) ?? [];
    let run: Token[] = [];
    let afterDeterminer = false;
    let previous = "";
    let wordIndex = 0;
    const flush = () => {
      if (run.length > 0) splitAndConsider(run, afterDeterminer);
      run = [];
    };
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!/^[A-Za-z0-9]/.test(token)) {
        // In-word hyphens and apostrophes are part of the token; other punctuation ends a phrase.
        flush();
        previous = "";
        continue;
      }
      const lower = token.toLowerCase();
      const initial = wordIndex === 0;
      wordIndex++;
      // Keep connectors inside titles and names: "Sound of Metal", "Bonnie and Clyde".
      const bridge =
        TITLE_BRIDGES.has(lower) && run.length > 0 && isProper(run[run.length - 1]) && /^[A-Z]/.test(tokens[i + 1] ?? "");
      if (bridge) {
        run.push({ word: token, initial: false });
        previous = lower;
        continue;
      }
      if (STOPWORDS.has(lower) || breaksPhrase(lower) || (token.length < 3 && !/\d/.test(token))) {
        flush();
        previous = lower;
        continue;
      }
      if (run.length === 0) afterDeterminer = DETERMINERS.has(previous);
      run.push({ word: token, initial });
      previous = lower;
    }
    flush();
  }
  const found = best as { phrase: string; score: number } | null;
  return found ? found.phrase : null;
}

/** Hedges worth quoting back ("um" and "just" aren't). */
const HEDGE_ECHO = ["kind of", "sort of", "i guess", "maybe", "i think", "basically", "probably", "actually", "literally"] as const;

function hedgeEcho(text: string): string | null {
  const found = HEDGE_ECHO.find((h) => countTerms(text, [h]) > 0);
  return found ? found.replace(/\bi\b/g, "I") : null;
}

/** The buzzword the learner actually used, for "Say that again without the word …". */
function buzzEcho(text: string): string | null {
  return BUZZWORDS.find((b) => countTerms(text, [b]) > 0) ?? null;
}

interface LineVars {
  phrase?: string | null;
  hedge?: string | null;
  buzz?: string | null;
}

const PLACEHOLDERS = ["phrase", "hedge", "buzz"] as const;

/** The longest literal stretch of a template, used to spot a line the persona already said. */
function templateCore(template: string): string {
  return template
    .split(/\{(?:phrase|hedge|buzz)\}/)
    .map((part) => part.replace(/^[\s“”.,—-]+|[\s“”.,—-]+$/g, ""))
    .reduce((a, b) => (b.length > a.length ? b : a), "")
    .toLowerCase();
}

/**
 * Pick a template whose placeholders we can fill, and fill it. Lines the
 * persona hasn't said yet in this scene come first (preferring ones that use
 * `prefer`); once a bank is used up, the line said longest ago.
 */
function chooseLine(bank: readonly string[], vars: LineVars, seed: string, prefer?: keyof LineVars, said: readonly string[] = []): string {
  const history = said.map((line) => line.toLowerCase());
  const lastUse = (line: string) => {
    const core = templateCore(line);
    if (core.length < 4) return -1;
    for (let i = history.length - 1; i >= 0; i--) if (history[i].includes(core)) return i;
    return -1;
  };
  const fillable = (line: string) => PLACEHOLDERS.every((key) => !line.includes(`{${key}}`) || !!vars[key]);
  const candidates = [bank.filter(fillable), bank.filter((l) => !l.includes("{"))].find((list) => list.length > 0) ?? [...bank];
  const uses = new Map(candidates.map((line) => [line, lastUse(line)]));
  const fresh = candidates.filter((line) => uses.get(line) === -1);
  const freshPreferred = prefer && vars[prefer] ? fresh.filter((line) => line.includes(`{${prefer}}`)) : [];
  const oldest = Math.min(...uses.values());
  const pool = freshPreferred.length > 0 ? freshPreferred : fresh.length > 0 ? fresh : candidates.filter((line) => uses.get(line) === oldest);
  let line = pick(pool, seed);
  for (const key of PLACEHOLDERS) {
    const value = vars[key];
    if (!value || !line.includes(`{${key}}`)) continue;
    const index = line.indexOf(`{${key}}`);
    const atStart = index <= 1 || /[.!?…]\s*“?$/.test(line.slice(0, index));
    line = line.replaceAll(`{${key}}`, atStart ? capitalize(value) : value);
  }
  return line;
}

// ---------------------------------------------------------------------------
// Reading the learner
// ---------------------------------------------------------------------------

export type DemoMove = "strong" | "solid" | "thin" | "long" | "hedgy" | "question" | "flat" | "rude" | "offtopic";
export type DemoTurnKind = "reply" | "press" | "wrap" | "after";

export interface DemoTurn {
  kind: DemoTurnKind;
  move: DemoMove;
  text: string;
}

const MOVE_QUALITY: Record<DemoMove, number> = {
  strong: 1,
  solid: 0.65,
  question: 0.5,
  long: 0.35,
  hedgy: 0.3,
  thin: 0.15,
  flat: 0.1,
  offtopic: 0.05,
  rude: 0,
};

/** Moves that earn one press (the persona repeats the pressure) before it moves on. */
const PRESSING_MOVES = new Set<DemoMove>(["thin", "rude", "offtopic"]);

/** Moves that never count as a highlight. */
const WEAK_MOVES = new Set<DemoMove>(["thin", "hedgy", "flat", "rude", "offtopic"]);

function isSubtextDrill(scenario: Scenario): boolean {
  return scenario.id === "subtext-sparring";
}

const TITLE_WORD = /^(?!I(?:'|’|$))[A-Z][\p{L}'’-]*$/u;
const TITLE_JOINERS = new Set(["of", "the", "and", "by", "is", "in", "a", "an", "at", "on", "to", "for"]);

/**
 * Remove multi-word capitalised spans (film titles and names like "All Is
 * Lost" or "Manchester by the Sea") so their words aren't read as story
 * vocabulary — "Lost" in a comp title isn't a stake.
 */
export function stripTitles(text: string): string {
  return sentences(text)
    .map((sentence) => {
      const tokens = sentence.split(/\s+/);
      const out: string[] = [];
      for (let i = 0; i < tokens.length; i++) {
        const bare = tokens[i].replace(/^[("“'‘]+|[)"”'’.,;:!?—–-]+$/g, "");
        if (i > 0 && TITLE_WORD.test(bare)) {
          // Extend over further capitalised words, allowing small joiners between them.
          let j = i + 1;
          let caps = 1;
          let end = i;
          while (j < tokens.length) {
            const next = tokens[j].replace(/^[("“'‘]+|[)"”'’.,;:!?—–-]+$/g, "");
            if (TITLE_WORD.test(next)) {
              caps++;
              end = j;
            } else if (!TITLE_JOINERS.has(next.toLowerCase())) break;
            if (/[.,;:!?—–]$/.test(tokens[j]) && end === j) break;
            j++;
          }
          if (caps >= 2 && !/[.,;:!?—–]$/.test(tokens[i])) {
            const tail = tokens[end].match(/[)"”'’.,;:!?—–-]+$/)?.[0] ?? "";
            out.push(tail);
            i = end;
            continue;
          }
        }
        out.push(tokens[i]);
      }
      return out.join(" ").replace(/\s+([.,;:!?])/g, "$1");
    })
    .join(" ");
}

/** A comparison line ("Jaws meets Cocoon", "comps are…"): its words describe other films, not this one. */
function isCompsLine(text: string): boolean {
  return /\b(comps?|comparables?)\b/i.test(text) || /\b[A-Z][\p{L}'’-]*\s+meets\s+[A-Z]/u.test(text);
}

function signalScore(script: DemoScript, text: string): number {
  const plain = stripTitles(text);
  return (
    Math.min(4, specificityMarkers(text)) +
    countTerms(plain, script.signal) +
    countTerms(plain, LEXICON.conflict) +
    countTerms(plain, LEXICON.stakes) +
    countTerms(plain, LEXICON.sensory) +
    countTerms(plain, LEXICON.desire) +
    countTerms(plain, STAKE_PHRASES) +
    countTerms(plain, CONFLICT_EXTRA)
  );
}

const HEDGES = LEXICON.hedges.filter((h) => h !== "like");
/** "like" as filler ("it's, like, a thriller"), not as a comparison ("smelled like diesel"). */
const FILLER_LIKE = /(?:^|[,;—–]\s*)like\b|\blike\s*[,;—–]/i;

/** Distinct hedges in a line. */
function hedgeCount(text: string): number {
  return countTerms(text, HEDGES) + (FILLER_LIKE.test(text) ? 1 : 0);
}

/** Words that carry meaning (not stopwords), a rough measure of concreteness. */
function contentWords(text: string): number {
  return words(text).filter((w) => w.length >= 3 && !STOPWORDS.has(w)).length;
}

const RELEVANCE_TERMS: readonly string[] = [
  ...LEXICON.conflict,
  ...LEXICON.stakes,
  ...LEXICON.desire,
  ...LEXICON.change,
  ...LEXICON.sensory,
  ...LEXICON.emotion,
  ...LEXICON.visual,
  ...CONFLICT_EXTRA,
  ...STAKE_PHRASES,
  ...CHARACTER_TERMS,
  ...STRUCTURE_TERMS,
  ...FILM_TERMS,
  ...ACTIONS,
  ...STORY_WORDS,
].filter((term) => !GENERIC_TERMS.has(term));

const vocabularies = new Map<string, Set<string>>();

/** Content words from the scenario's own briefing and pressure moves: what this room is about. */
function scenarioVocabulary(scenario: Scenario, script: DemoScript): Set<string> {
  const cached = vocabularies.get(scenario.id);
  if (cached) return cached;
  const source = [
    scenario.title,
    scenario.description,
    scenario.userRole,
    scenario.objective,
    scenario.openingLine,
    ...scenario.rubric.map((r) => r.description),
    script.opener,
    ...script.questions,
    ...script.signal,
  ].join(" ");
  const vocabulary = new Set(words(source).filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !GENERIC_TERMS.has(w)));
  vocabularies.set(scenario.id, vocabulary);
  return vocabulary;
}

/** "I tore up the ticket", "we rebuilt onboarding": someone telling what happened to them. */
function isNarrative(text: string): boolean {
  const w = words(text);
  return w.some((word) => word === "i" || word === "we" || word === "my") && w.some((word) => IRREGULAR_PAST.has(word) || /^[a-z]{3,}ed$/.test(word));
}

const RELEVANCE_TERMS_FOR_QUESTIONS = RELEVANCE_TERMS.filter((term) => !CHATTY_STORY_WORDS.has(term));

/** Does the line engage with this scene at all (its world, its questions, story-talk, or a lived story where one was asked for)? */
function isRelevant(scenario: Scenario, script: DemoScript, text: string, question = false): boolean {
  const plain = stripTitles(text);
  if (countTerms(plain, script.signal) + countTerms(plain, question ? RELEVANCE_TERMS_FOR_QUESTIONS : RELEVANCE_TERMS) > 0) return true;
  if (isSubtextDrill(scenario) && countTerms(plain, [...OBJECTS, ...PLAY_WANT, ...SUBTEXT_WORLD]) > 0) return true;
  if ((scenario.category === "oral" || scenario.id === "founder-story") && isNarrative(text)) return true;
  const vocabulary = scenarioVocabulary(scenario, script);
  return words(text).some((w) => vocabulary.has(w));
}

/** Sibling banter that's still playing the scene ("Oh, shut up and hand me the tape."). */
const PLAYING_THROUGH = ["hand me", "give me", "let's", "help me", "can we", "come on"] as const;

function isRude(text: string, subtext: boolean, wordCount: number): boolean {
  if (countTerms(text, RUDE_OUT_OF_SCENE) > 0) return true;
  if (subtext && countTerms(text, [...PLAYING_THROUGH, ...OBJECTS]) > 0) return false;
  return countTerms(text, RUDE_PHRASES) > 0 || (wordCount <= 14 && countTerms(text, SHORT_INSULTS) > 0);
}

/** A shrug: every word is filler ("idk", "yeah ok", "I guess so, maybe"). */
function isLazy(text: string): boolean {
  const w = words(text);
  return w.length > 0 && w.every((word) => FILLER.has(word));
}

/** Classify a learner line into the kind of move a real listener would react to. */
export function classifyMove(scenario: Scenario, raw: string): DemoMove {
  const script = demoScriptFor(scenario);
  const text = normalize(raw);
  const w = words(text).length;
  const subtext = isSubtextDrill(scenario);
  if (w === 0) return "thin";
  if (isRude(text, subtext, w)) return "rude";
  if (isLazy(text)) return "thin";
  if (subtext && countTerms(text, ON_THE_NOSE) > 0) return "flat";
  if (scenario.id === "actor-motivation" && countTerms(text, RESULT_DIRECTION) > 0 && countTerms(text, ACTIONS) === 0) return "flat";
  if (scenario.id === "founder-story" && countTerms(text, BUZZWORDS) > 0 && specificityMarkers(text) < 2) return "flat";
  // A playable verb is the best possible note for an actor, however short.
  if (scenario.id === "actor-motivation" && w <= 40 && countTerms(text, ACTIONS) > 0 && hedgeCount(text) < 2) return "strong";
  if (w > (subtext ? 70 : 170)) return "long";
  const question = /\?["')\]]*$/.test(text) && w <= 30;
  if (!isRelevant(scenario, script, text, question)) return subtext || question || w >= 7 ? "offtopic" : "thin";
  const hedges = hedgeCount(text);
  if (hedges >= 2 && hedges / w > 0.05) return "hedgy";
  if (question) return "question";
  if (subtext) {
    if (w < 2) return "thin";
    return signalScore(script, text) >= 1 || countTerms(text, PLAY_WANT) > 0 ? "strong" : "solid";
  }
  if (w < 7) return "thin";
  const signal = signalScore(script, text);
  const content = contentWords(text);
  if ((signal >= 3 && w >= 14) || (signal >= 2 && content >= 7)) return "strong";
  if (signal <= 1 && content < 5) return "thin";
  return "solid";
}

function reactionBank(script: DemoScript, move: DemoMove): readonly string[] {
  switch (move) {
    case "strong":
      return script.strong;
    case "solid":
      return script.solid;
    case "long":
      return script.long;
    case "hedgy":
      return script.hedge;
    case "question":
      return script.deflect;
    case "flat":
      return script.onNose ?? script.press;
    case "rude":
      return script.rude;
    case "offtopic":
      return script.offTopic;
    case "thin":
      // In-scene presses are complete lines ("Hand me that box."), so they can't lead into the next pressure move.
      return script.pressRepeats === false ? script.solid : script.press;
  }
}

/** Score a single learner line for "best moment" and wrap-up tone. */
function lineScore(scenario: Scenario, line: string): number {
  const script = demoScriptFor(scenario);
  const w = words(line).length;
  const lengthFit = w < 6 ? 0 : w <= 90 ? 1 : w <= 160 ? 0.6 : 0.3;
  const hedges = hedgeCount(line);
  let score = signalScore(script, line) * 1.5 + lengthFit * 4 + lexicalVariety(line) * 2 - hedges * 1.5;
  if (isSubtextDrill(scenario)) score -= countTerms(line, ON_THE_NOSE) * 6;
  // A list of other films is rarely anyone's best line.
  if (isCompsLine(line)) score -= 4;
  return score;
}

/** The learner's turns: non-empty, with back-to-back lines merged (as a listener hears them). */
function learnerTurns(messages: ChatMessageInput[]): string[] {
  const turns: string[] = [];
  let previousWasUser = false;
  for (const m of messages) {
    const text = normalize(m.content);
    if (!text) continue;
    if (m.role === "user") {
      if (previousWasUser) turns[turns.length - 1] = `${turns[turns.length - 1]}\n\n${text}`;
      else turns.push(text);
    }
    previousWasUser = m.role === "user";
  }
  return turns;
}

// ---------------------------------------------------------------------------
// Persona replies
// ---------------------------------------------------------------------------

/**
 * The demo persona's next turn. Deterministic: the same transcript always
 * produces the same reply.
 */
export function demoPersonaTurn(scenario: Scenario, messages: ChatMessageInput[]): DemoTurn {
  const script = demoScriptFor(scenario);
  const userLines = learnerTurns(messages);
  const said = messages.filter((m) => m.role === "persona").map((m) => m.content);
  const repeats = script.pressRepeats !== false;
  const turn = userLines.length;
  if (turn === 0) {
    const lead = chooseLine(script.press, {}, scenario.id, undefined, said);
    return { kind: "press", move: "thin", text: repeats ? `${lead} ${script.opener}` : lead };
  }

  // Walk the learner's turns to find where the conversation stands: a thin,
  // rude or off-topic answer earns one press (repeating the pending question)
  // before the persona moves on, and questions the learner has already
  // answered are skipped.
  const covered = (index: number, upTo: number) => {
    const terms = script.skipIf?.[index];
    return !!terms && userLines.slice(0, upTo + 1).some((l) => countTerms(l, terms) > 0);
  };
  const moves = userLines.map((line) => classifyMove(scenario, line));
  let questionIndex = 0;
  let lastWasPress = false;
  let kind = "reply" as DemoTurnKind;
  let askIndex = 0;
  let pending = script.opener;
  for (let i = 0; i < userLines.length; i++) {
    const move = moves[i];
    const turnNumber = i + 1;
    if (turnNumber > scenario.suggestedTurns) kind = "after";
    else if (turnNumber === scenario.suggestedTurns) kind = "wrap";
    else if ((PRESSING_MOVES.has(move) || (move === "flat" && script.flatPresses)) && !lastWasPress) {
      kind = "press";
      lastWasPress = true;
    } else {
      kind = "reply";
      // Answering the current question with the next one in the same breath ("…and the midpoint is…") skips it too.
      while (questionIndex < script.questions.length && covered(questionIndex, i)) questionIndex++;
      askIndex = questionIndex;
      questionIndex++;
      lastWasPress = false;
      pending = script.questions[askIndex] ?? pending;
    }
  }

  const move = moves[moves.length - 1];
  const last = userLines[userLines.length - 1];
  const seed = `${scenario.id}|${turn}|${move}|${last}`;
  // Quote the learner back only with something new: echoing the same phrase twice in a row sounds canned.
  const echo = script.echo === false ? null : keyPhrase(last);
  const fresh = echo && !said.some((line) => line.toLowerCase().includes(echo.toLowerCase())) ? echo : null;
  const vars: LineVars = { phrase: fresh, hedge: hedgeEcho(last), buzz: buzzEcho(last) };

  if (kind === "after") return { kind, move, text: restore(chooseLine(script.after, {}, seed, undefined, said)) };

  if (kind === "wrap") {
    const quality = moves.reduce((n, m) => n + MOVE_QUALITY[m], 0) / moves.length;
    const highlights = userLines.filter((_, i) => !WEAK_MOVES.has(moves[i]));
    const bestLine = highlights.reduce<string | null>((a, b) => (a === null || lineScore(scenario, b) > lineScore(scenario, a) ? b : a), null);
    const bank = quality >= 0.55 ? script.wrapGood : quality >= 0.3 ? script.wrapMixed : script.wrapPoor;
    const phrase = script.echo === false || !bestLine ? null : keyPhrase(bestLine);
    return { kind, move, text: restore(chooseLine(bank, { phrase }, seed, "phrase", said)) };
  }

  if (kind === "press") {
    const bank = move === "thin" ? script.press : reactionBank(script, move);
    const lead = chooseLine(bank, vars, seed, move === "flat" ? "buzz" : undefined, said);
    const text = repeats && !lead.includes("?") ? `${lead} ${pending}` : lead;
    return { kind, move, text: restore(text) };
  }

  const prefer = move === "hedgy" ? "hedge" : move === "flat" ? "buzz" : move === "strong" || move === "solid" ? "phrase" : undefined;
  const reaction = chooseLine(reactionBank(script, move), vars, seed, prefer, said);
  const question =
    askIndex < script.questions.length ? script.questions[askIndex] : chooseLine(script.more ?? ["Keep going.", "Go on."], {}, seed, undefined, said);
  return { kind, move, text: restore(`${reaction} ${question}`) };
}

export function demoPersonaReply(scenario: Scenario, messages: ChatMessageInput[]): string {
  return demoPersonaTurn(scenario, messages).text;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

interface Context {
  scenario: Scenario;
  script: DemoScript;
  /** Every learner turn. */
  lines: string[];
  all: string;
  moves: DemoMove[];
  /** Turns that engaged with the scene: not rude, off-topic or a shrug. */
  on: string[];
  onAll: string;
  turns: number;
  words: number;
  /** Words in engaged turns. */
  onWords: number;
  avgWords: number;
  maxWords: number;
  hedges: number;
  /** Hedge terms per 100 words. */
  hedgeRate: number;
  /** Every sentence from an engaged turn. */
  sentencePool: string[];
  /** Learner lines that said the quiet part out loud (subtext drills). */
  noseLines: number;
  /** Learner lines that gave an actor a result instead of an action. */
  resultLines: number;
  /** 0–1: how fully the learner played the scene, from the kind of move each turn was. */
  engagement: number;
  rudeLines: string[];
  offTopicLines: string[];
  /** Sentences already quoted as evidence, so one line doesn't carry every skill. */
  quoted: Set<string>;
}

function buildContext(scenario: Scenario, messages: ChatMessageInput[]): Context {
  const lines = learnerTurns(messages);
  const moves = lines.map((l) => classifyMove(scenario, l));
  const on = lines.filter((l, i) => moves[i] !== "rude" && moves[i] !== "offtopic" && !isLazy(l));
  const all = lines.join("\n");
  const counts = lines.map((l) => words(l).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const hedges = lines.reduce((n, l) => n + hedgeCount(l), 0);
  return {
    scenario,
    script: demoScriptFor(scenario),
    lines,
    all,
    moves,
    on,
    onAll: on.join("\n"),
    turns: lines.length,
    words: total,
    onWords: on.reduce((n, l) => n + words(l).length, 0),
    avgWords: lines.length ? total / lines.length : 0,
    maxWords: counts.length ? Math.max(...counts) : 0,
    hedges,
    hedgeRate: total ? (hedges / total) * 100 : 0,
    sentencePool: on.flatMap((l) => sentences(l)),
    noseLines: lines.filter((l) => countTerms(l, ON_THE_NOSE) > 0).length,
    resultLines: lines.filter((l) => countTerms(l, RESULT_DIRECTION) > 0).length,
    engagement: moves.length ? moves.reduce((n, m) => n + MOVE_QUALITY[m], 0) / moves.length : 0,
    rudeLines: lines.filter((_, i) => moves[i] === "rude"),
    offTopicLines: lines.filter((_, i) => moves[i] === "offtopic"),
    quoted: new Set(),
  };
}

/**
 * The learner sentence that best evidences a vocabulary, trimmed for
 * quoting. Film titles don't count as vocabulary, comparison lines are
 * avoided when asked, and a sentence already quoted for another skill is
 * used again only when nothing else fits.
 */
function evidence(c: Context, terms: readonly string[], options: { fallback?: boolean; avoidComps?: boolean } = {}): string | null {
  const { fallback = true, avoidComps = false } = options;
  const unique = [...new Set(terms)];
  let best: { s: string; n: number } | null = null;
  for (const s of c.sentencePool) {
    if (words(s).length < 3) continue;
    const hits = countTerms(stripTitles(s), unique);
    if (hits === 0) continue;
    let n = hits * 3 + Math.min(2, specificityMarkers(s));
    if (avoidComps && isCompsLine(s)) n -= 4;
    if (c.quoted.has(s)) n -= 4;
    if (n > 0 && (!best || n > best.n)) best = { s, n };
  }
  const found = best as { s: string; n: number } | null;
  if (found) {
    c.quoted.add(found.s);
    return trimWords(found.s, 22);
  }
  return fallback && c.on[0] ? firstLine(c.on[0], 18) : null;
}

/** Word counts below which a transcript is too thin to score highly (subtext drills run on short lines). */
function thinThresholds(scenario: Scenario): { tiny: number; short: number } {
  if (isSubtextDrill(scenario)) return { tiny: 10, short: 28 };
  if (scenario.id === "elevator-pitch") return { tiny: 15, short: 40 };
  return { tiny: 25, short: 60 };
}

/**
 * Clamp a raw skill score. Thin transcripts can't score high, and neither can
 * a scene the learner didn't really play: the ceiling falls with engagement,
 * so rude, off-topic or one-word runs land well below thoughtful ones.
 */
function finalize(raw: number, c: Context): number {
  let s = raw;
  const { tiny, short } = thinThresholds(c.scenario);
  if (c.onWords < tiny) s = Math.min(s, 36);
  else if (c.onWords < short) s = Math.min(s, 55);
  if (c.turns < 2) s = Math.min(s, 48);
  s = Math.min(s, 28 + 72 * c.engagement);
  return clampScore(Math.max(12, Math.min(96, s)));
}

function band(score: number): "good" | "mid" | "low" {
  return score >= 70 ? "good" : score >= 50 ? "mid" : "low";
}

function rubricLabel(c: Context, skill: SkillId): string {
  return c.scenario.rubric.find((r) => r.skill === skill)?.label ?? SKILLS[skill].name;
}

/** "…the boat.”." → "…the boat.”" — quotes that already end a sentence don't need another full stop. */
function tidy(text: string): string {
  return restore(text).replace(/([.!?…])”([.,])/g, "$1”").replace(/\s{2,}/g, " ");
}

/** A skill score plus the learner sentence its comment quotes (reused by the strengths list). */
interface Scored extends SkillScore {
  quote: string | null;
}

type Scorer = (c: Context) => Scored;

/** Build a score whose comment leads with the rubric criterion it speaks to. */
function scored(c: Context, skill: SkillId, score: number, body: string, quote: string | null, labelled = true): Scored {
  const clean = tidy(body);
  return { skill, score, quote, comment: labelled ? `${rubricLabel(c, skill)}: ${clean}` : clean };
}

/** The first sentence with some substance ("Hi!" doesn't count as an opening). */
function firstSubstantive(line: string): string {
  const all = sentences(line);
  return all.find((sen) => words(sen).length >= 5) ?? all[0] ?? line;
}

/** "a seventy-year-old lifeguard who…", "a deaf drummer who…": a specific person in a situation, in one breath. */
const PROTAGONIST_SHAPE = /\b(?:a|an|the)\s+(?:[\p{L}'-]+\s+){1,4}(?:who|whose|must)\b/iu;

/** Openings that put the listener in a moment: a time, a place, a body in a room. */
const SCENE_OPENERS = ["it was", "i'm standing", "standing", "sitting", "holding", "a.m", "p.m", "that day", "that night", "one night", "one morning", "in my"] as const;

const scoreHook: Scorer = (c) => {
  const gauntlet = c.scenario.id === "logline-gauntlet";
  const line = (gauntlet ? (c.on[c.on.length - 1] ?? c.lines[c.lines.length - 1]) : c.lines[0]) ?? "";
  const plain = stripTitles(line);
  const first = firstSubstantive(line);
  const fw = words(first).length;
  let s = 38;
  s += Math.min(3, specificityMarkers(first)) * 5;
  s += Math.min(3, countTerms(plain, LEXICON.conflict) + countTerms(plain, CONFLICT_EXTRA)) * 4;
  s += Math.min(2, countTerms(plain, LEXICON.desire) + countTerms(plain, HOOK_DRIVE)) * 4;
  s += Math.min(2, countTerms(plain, LEXICON.stakes) + countTerms(plain, STAKE_PHRASES)) * 3;
  s += Math.min(3, countTerms(plain, c.script.signal)) * 2;
  s += fw >= 8 && fw <= 38 ? 8 : fw > 50 ? -10 : fw < 5 ? -8 : 0;
  s -= Math.min(3, hedgeCount(line)) * 4;
  if (lexicalVariety(line) >= 0.75) s += 4;
  s += Math.min(2, countTerms(plain, IRONY)) * 3;
  if (PROTAGONIST_SHAPE.test(first)) s += 6;
  s -= Math.min(2, countTerms(line, BUZZWORDS)) * 6;
  const background = hasAny(line, BACKGROUND_OPENERS);
  if ((c.scenario.category === "oral" || c.scenario.id === "founder-story") && !background && hasAny(first, SCENE_OPENERS)) s += 6;
  if (c.scenario.category === "oral" && background) s -= 8;
  if (gauntlet) {
    const w = words(line).length;
    s += w >= 15 && w <= 40 ? 8 : w > 60 ? -8 : 0;
    if (c.lines.length >= 3 && w < words(c.lines[0]).length) s += 4;
  }
  const score = finalize(s, c);
  const q = trimWords(first, 20);
  if (q) c.quoted.add(first);
  const where = gauntlet ? "Your final version" : "Your opening";
  const body = {
    good: `${where} — “${q}” — puts a specific person and a problem up front, fast. That's a premise someone could repeat.`,
    mid: `“${q}” gets us into the story, but the irony or the one specific detail that would make it unforgettable isn't there yet.`,
    low:
      c.scenario.category === "oral" && background
        ? `${where} — “${q}” — starts with background. Start in the moment instead: where you are, what you see, what's about to happen.`
        : `${where} — “${q}” — ${fw > 38 ? "takes too long to reach" : "doesn't yet give us"} a specific person, what they want and what's in the way.`,
  }[band(score)];
  return scored(c, "hook", score, body, q, false);
};

const scoreStructure: Scorer = (c) => {
  const coverage = Math.min(1, c.on.length / c.scenario.suggestedTurns);
  let s = 34;
  s += Math.min(6, sumTerms(c.on, LEXICON.time)) * 3;
  s += Math.min(6, sumTerms(c.on, STRUCTURE_TERMS)) * 4;
  s += Math.min(3, sumTerms(c.on, LEXICON.change) + sumTerms(c.on, CHANGE_EXTRA)) * 4;
  s += coverage * 10;
  if (c.avgWords > 150) s -= 8;
  const score = finalize(s, c);
  const q = evidence(c, TURN_TERMS, { fallback: false }) ?? evidence(c, [...STRUCTURE_TERMS, ...LEXICON.time, ...LEXICON.change], { fallback: false });
  const body = {
    good: `You gave it a shape the listener could follow${q ? ` — “${q}” lands as a real turn` : ""}.`,
    mid: `There's an order of events${q ? ` (“${q}”)` : ""}, but the turns — the moments where everything changes — need more weight.`,
    low: `The events didn't yet add up to a shape. Signal the turn — "until", "and that's when" — the moment nothing could go back.`,
  }[band(score)];
  return scored(c, "structure", score, body, q);
};

const scoreCharacter: Scorer = (c) => {
  const id = c.scenario.id;
  let s = 36;
  s += Math.min(4, sumTerms(c.on, LEXICON.desire)) * 4;
  s += Math.min(3, sumTerms(c.on, LEXICON.emotion)) * 3;
  s += Math.min(3, sumTerms(c.on, LEXICON.change)) * 3;
  s += Math.min(4, specificityMarkers(c.onAll)) * 2;
  s += Math.min(5, sumTerms(c.on, CHARACTER_TERMS)) * 3;
  if (id === "festival-qa") s += Math.min(2, sumTerms(c.on, DIRECTING_ACTORS)) * 4;
  // Naming both what someone wants and what they fear is the heart of it.
  if (hasAny(c.onAll, LEXICON.desire) && hasAny(c.onAll, ["afraid", "scared", "fear", "terrified", "dread"])) s += 8;
  let terms: readonly string[] = [...LEXICON.desire, ...CHARACTER_TERMS];
  if (id === "actor-motivation") {
    s += Math.min(4, sumTerms(c.on, ACTIONS)) * 4;
    s += Math.min(4, sumTerms(c.on, CIRCUMSTANCES)) * 3;
    s -= Math.min(2, c.resultLines) * 6;
    terms = [...ACTIONS, ...LEXICON.desire];
  }
  if (id === "founder-story") {
    s += Math.min(4, sumTerms(c.on, FOUNDER_FIT)) * 4;
    terms = [...FOUNDER_FIT, ...CHARACTER_TERMS];
  }
  if (id === "subtext-sparring") {
    s =
      44 +
      Math.min(4, sumTerms(c.on, PLAY_WANT)) * 5 +
      Math.min(3, sumTerms(c.on, OBJECTS)) * 4 +
      Math.min(3, questionCount(c.onAll)) * 3 +
      Math.min(3, sumTerms(c.on, SUBTEXT_WORLD)) * 2;
    s -= Math.min(3, c.noseLines) * 9;
    terms = [...PLAY_WANT, ...OBJECTS];
  }
  const score = finalize(s, c);
  const q = evidence(c, terms, { fallback: false });
  const copy =
    id === "subtext-sparring"
      ? {
          good: `Cal was always after something${q ? ` — “${q}”` : ""} — even when he wouldn't say what.`,
          mid: `${q ? `“${q}” plays a want, but ` : ""}some lines only reacted instead of pursuing something from Tess.`,
          low: "Cal mostly reacted. Decide what he wants from Tess in each line — to stall, to charm, to escape — and play it.",
        }
      : id === "founder-story"
        ? {
            good: `You made the case for why it had to be you${q ? ` — “${q}”` : ""}.`,
            mid: `${q ? `“${q}” hints at it, but ` : ""}the thread from your history to this problem needs to be explicit: why you, and why you won't quit.`,
            low: "We didn't learn why it had to be you. Connect your own history to the problem in one plain sentence.",
          }
        : id === "actor-motivation"
          ? {
              good: `Theo got an objective he could play${q ? ` — “${q}”` : ""} — and the circumstances to make it matter.`,
              mid: `${q ? `“${q}” is a start, but ` : ""}Theo needed a sharper sense of what Walter wants from June and what just happened.`,
              low: "Theo never got an objective. Tell him what Walter wants from June in this moment, and what happened just before.",
            }
          : {
              good: `We knew what was driving the character${q ? ` — “${q}”` : ""}.`,
              mid: `${q ? `“${q}” hints at it, but ` : ""}the want needs to be concrete and the fear underneath it visible.`,
              low: "We never quite learned what the character wants or fears. Name the want in plain words, then let every line serve it.",
            };
  return scored(c, "character", score, copy[band(score)], q);
};

const scoreConflict: Scorer = (c) => {
  const subtext = isSubtextDrill(c.scenario);
  const plain = c.on.map(stripTitles);
  let s = 36;
  s += Math.min(6, sumTerms(plain, LEXICON.conflict) + sumTerms(plain, CONFLICT_EXTRA)) * 4;
  s += Math.min(4, sumTerms(plain, LEXICON.stakes)) * 4;
  s += Math.min(2, sumTerms(plain, STAKE_PHRASES)) * 5;
  let terms: readonly string[] = [...STAKE_PHRASES, ...LEXICON.stakes, ...LEXICON.conflict, ...CONFLICT_EXTRA];
  if (c.scenario.id === "founder-story") {
    s += Math.min(3, sumTerms(c.on, FOUNDER_STRUGGLE)) * 6;
    terms = [...CONFLICT_EXTRA, ...FOUNDER_STRUGGLE, ...LEXICON.conflict];
  }
  if (subtext) {
    const engaged = c.on.length;
    s =
      46 +
      Math.min(3, questionCount(c.onAll)) * 4 +
      Math.min(3, sumTerms(c.on, OBJECTS)) * 3 +
      Math.min(3, sumTerms(c.on, c.script.signal)) * 3 +
      Math.min(3, sumTerms(c.on, SUBTEXT_WORLD)) * 2;
    s += engaged >= 4 ? 6 : 0;
    s -= Math.min(3, c.noseLines) * 12;
    terms = [...OBJECTS, ...c.script.signal];
  }
  const score = finalize(s, c);
  // Stake phrases first: "if she fails, her son drowns" beats a comp title that happens to contain "Lost".
  const q = subtext ? evidence(c, terms, { fallback: false }) : (evidence(c, STAKE_PHRASES, { fallback: false, avoidComps: true }) ?? evidence(c, terms, { fallback: false, avoidComps: true }));
  const body = subtext
    ? {
        good: `The pressure kept building under the surface${q ? ` — “${q}” keeps the secret alive` : ""}.`,
        mid: `Some exchanges crackled${q ? ` (“${q}”)` : ""}, but the tension leaked out whenever the secret got close to the surface.`,
        low: `The tension collapsed. Keep the secret alive with evasions, objects and double meanings rather than confession.`,
      }[band(score)]
    : {
        good: `The stakes had teeth${q ? ` — “${q}” makes it clear what could be lost` : ""}.`,
        mid: `There's real opposition${q ? ` in “${q}”` : ""} — now make the cost land harder: say what, specifically and personally, is lost.`,
        low: `The obstacles and stakes stayed abstract. Name the opposing force and what's lost if it wins.`,
      }[band(score)];
  return scored(c, "conflict", score, body, q);
};

const scoreDialogue: Scorer = (c) => {
  const id = c.scenario.id;
  let s: number;
  let terms: readonly string[];
  if (id === "subtext-sparring") {
    const engagedAvg = c.on.length ? c.onWords / c.on.length : 0;
    s = 55;
    s -= Math.min(3, c.noseLines) * 22;
    s -= Math.min(3, sumTerms(c.lines, LEXICON.emotion)) * 5;
    s += Math.min(3, questionCount(c.onAll)) * 4;
    s += engagedAvg >= 4 && engagedAvg <= 30 ? 10 : engagedAvg > 45 ? -12 : 0;
    s += Math.min(3, sumTerms(c.on, OBJECTS)) * 4;
    s += c.on.length >= 4 ? 5 : 0;
    terms = [...OBJECTS, ...PLAY_WANT];
  } else if (id === "actor-motivation") {
    s = 42;
    s += Math.min(3, sumTerms(c.on, SUBTEXT_TERMS)) * 8;
    s += hasAny(c.onAll, ["great", "kiddo"]) ? 6 : 0;
    s += Math.min(3, sumTerms(c.on, ACTIONS)) * 3;
    s -= Math.min(2, c.resultLines) * 6;
    terms = SUBTEXT_TERMS;
  } else {
    s = 40 + Math.min(3, c.on.reduce((n, l) => n + (l.match(/"[^"]{2,}"/g)?.length ?? 0), 0)) * 6;
    s += Math.min(3, sumTerms(c.on, SUBTEXT_TERMS)) * 5;
    terms = SUBTEXT_TERMS;
  }
  const score = finalize(s, c);
  const q = evidence(c, terms, { fallback: false });
  const nose = id === "subtext-sparring" ? evidence(c, ON_THE_NOSE, { fallback: false }) : null;
  const copy =
    id === "subtext-sparring"
      ? {
          good: `You kept it under the surface${q ? ` — “${q}” says more than a confession would` : ""}.`,
          mid: `Some lines played beautifully under the surface, but others named the thing outright${nose ? ` — “${nose}”` : ""}.`,
          low: nose
            ? `Too much got said out loud — “${nose}”. The scene lives in what goes unsaid.`
            : "Cal never really played the scene with Tess. Stay in the garage: answer her through the boxes, the tackle, the keys.",
        }
      : id === "actor-motivation"
        ? {
            good: `You found what's under the line${q ? ` — “${q}”` : ""} — and gave Theo the gap between the words and the meaning.`,
            mid: `${q ? `“${q}” points at the subtext, but ` : ""}Theo needed a clearer sense of what Walter means versus what he says.`,
            low: "The subtext under “That's great, kiddo” stayed unexplored. Decide what Walter really means, then direct the gap.",
          }
        : {
            good: `Your lines carried more than they said${q ? ` — “${q}”` : ""}.`,
            mid: `${q ? `“${q}” has an edge, but ` : ""}more of the meaning could live between the lines.`,
            low: "The dialogue said everything outright. Let the characters want things from each other and talk around them.",
          };
  return scored(c, "dialogue", score, copy[band(score)], q);
};

const scoreVisual: Scorer = (c) => {
  let s = 34;
  s += Math.min(6, sumTerms(c.on, LEXICON.visual) + sumTerms(c.on, FILM_TERMS)) * 4;
  s += Math.min(4, sumTerms(c.on, LEXICON.sensory)) * 3;
  s += Math.min(3, sumTerms(c.on, MOTIVATION)) * 4;
  // A craft choice explained by its effect, in the same breath, is the real skill.
  const motivated = c.sentencePool.filter((sen) => hasAny(sen, [...FILM_TERMS, ...LEXICON.visual]) && hasAny(sen, MOTIVATION)).length;
  s += Math.min(2, motivated) * 10 + (motivated > 0 ? 4 : 0);
  const score = finalize(s, c);
  const q = evidence(c, [...FILM_TERMS, ...LEXICON.visual, ...LEXICON.sensory], { fallback: false });
  const body = {
    good: `Your images carried meaning${q ? ` — “${q}” ties the picture to a feeling` : ""}.`,
    mid: `${q ? `“${q}” names what we'd see, but ` : ""}not every choice came with a why. Pair each image with the feeling it creates.`,
    low: `The visual choices stayed generic. Name a shot size, a lens or a light source — and what it makes the audience feel.`,
  }[band(score)];
  return scored(c, "visual", score, body, q);
};

const scorePacing: Scorer = (c) => {
  let s: number;
  if (c.scenario.id === "dp-shot-planning") {
    const first = hasAny(c.onAll, ["first shot", "open on", "opening shot", "we open", "start on", "start wide", "start close", "begin"]);
    const last = hasAny(c.onAll, ["last shot", "last image", "end on", "final shot", "final image", "we end", "closing shot"]);
    const tradeOff = hasAny(c.onAll, ["cut", "drop", "lose"]) && hasAny(c.onAll, ["protect", "keep", "save"]);
    s = 36 + Math.min(4, sumTerms(c.on, ECONOMY)) * 6 + (first ? 8 : 0) + (last ? 8 : 0) + (tradeOff ? 8 : 0);
    s += Math.min(2, sumTerms(c.on, MOTIVATION)) * 3;
    if (c.maxWords > 180) s -= 6;
  } else {
    const rhythm = (sentenceLengthVariance(c.onAll) - 2) / 7;
    const concise = c.avgWords > 0 && c.avgWords <= 120 ? 1 : 0.4;
    s = 36 + Math.max(0, Math.min(1, rhythm)) * 30 + concise * 14;
  }
  const score = finalize(s, c);
  const q = evidence(c, ECONOMY, { fallback: false });
  const body = {
    good: `You made real trade-offs${q ? ` — “${q}”` : ""} — protecting what carries the scene and letting the rest go.`,
    mid: `${q ? `“${q}” shows you're thinking about time, but ` : ""}the plan doesn't yet say what you'd protect and what you'd cut.`,
    low: `No priorities yet. Decide the one moment you'd protect if you lost half your time, and your first and last images.`,
  }[band(score)];
  return scored(c, "pacing", score, body, q);
};

/** The answer length (in words) that reads as concise in each drill. */
function deliveryRange(scenario: Scenario): [number, number] {
  if (scenario.id === "elevator-pitch") return [10, 60];
  if (isSubtextDrill(scenario)) return [3, 35];
  if (scenario.id === "actor-motivation") return [5, 70];
  return [18, 110];
}

/** Answers too short to carry anything: the delivery problem is thinness, not hedging or rambling. */
function tooThin(c: Context): boolean {
  return c.avgWords < deliveryRange(c.scenario)[0];
}

const scoreDelivery: Scorer = (c) => {
  const id = c.scenario.id;
  const [lo, hi] = deliveryRange(c.scenario);
  const avg = c.avgWords;
  const concision = avg >= lo && avg <= hi ? 1 : avg < lo ? avg / lo : Math.max(0, 1 - (avg - hi) / hi);
  const minFirst = id === "subtext-sparring" ? 1 : id === "actor-motivation" ? 2 : 4;
  const direct =
    c.on.filter((l) => {
      const first = sentences(l)[0] ?? l;
      const fw = words(first).length;
      return fw >= minFirst && fw <= 28;
    }).length / Math.max(1, c.turns);
  let s = 34 + concision * 20 + direct * 12 - Math.min(20, c.hedgeRate * 4);
  s += Math.min(3, sumTerms(c.on, CONFIDENT)) * 3;
  s += Math.min(2, sumTerms(c.on, GRACE)) * 4;
  s += Math.min(1, c.on.length / c.scenario.suggestedTurns) * 6;
  if (id === "elevator-pitch") s += hasAny(c.on.slice(-2).join(" "), ASK) ? 12 : -4;
  if (id === "founder-story") s -= Math.min(3, sumTerms(c.lines, BUZZWORDS)) * 5;
  if (id === "actor-motivation") {
    s += Math.min(3, sumTerms(c.on, ACTIONS)) * 4;
    s -= Math.min(2, c.resultLines) * 7;
  }
  const score = finalize(s, c);
  const hedgy = c.sentencePool.find((sen) => hedgeCount(sen) >= 2) ?? null;
  const confident = evidence(c, [...CONFIDENT, ...ACTIONS, ...ASK], { fallback: false });
  const midReason = tooThin(c)
    ? "several answers were too short to carry a specific detail"
    : c.hedgeRate > 2 && hedgy
      ? `hedges like “${trimWords(hedgy, 14)}” soften your authority`
      : c.maxWords > 150
        ? `your longest answer ran ${c.maxWords} words before landing`
        : "a few answers circled before they landed";
  const body = {
    good: `Clear and confident${confident ? ` — “${confident}” lands without a hedge` : ""}.`,
    mid: `Mostly clear, but ${midReason}.`,
    low: tooThin(c)
      ? "The answers were too thin to land. Give each one a specific detail — a person, a place, a moment — then stop."
      : `Hedges and long answers blunted the delivery${hedgy ? ` — “${trimWords(hedgy, 14)}”` : ""}. Answer in your first sentence, then stop.`,
  }[band(score)];
  return scored(c, "delivery", score, body, confident);
};

const SCORERS: Record<SkillId, Scorer> = {
  hook: scoreHook,
  structure: scoreStructure,
  character: scoreCharacter,
  conflict: scoreConflict,
  dialogue: scoreDialogue,
  visual: scoreVisual,
  pacing: scorePacing,
  delivery: scoreDelivery,
};

const STRONG_PHRASE: Record<SkillId, string> = {
  hook: "A hook that lands fast",
  structure: "A story with real shape",
  character: "A character we can feel",
  conflict: "Stakes with teeth",
  dialogue: "Subtext that crackles",
  visual: "Images with a reason",
  pacing: "Smart control of time",
  delivery: "Clear, confident delivery",
};

const MID_PHRASE: Record<SkillId, string> = {
  hook: "A promising premise",
  structure: "A story that's taking shape",
  character: "Glimpses of real character",
  conflict: "Real obstacles on the table",
  dialogue: "Some lines with real subtext",
  visual: "Some strong images",
  pacing: "A sense of priorities",
  delivery: "Mostly clear delivery",
};

const WEAK_PHRASE: Record<SkillId, string> = {
  hook: "the premise took too long to surface",
  structure: "the story's shape stayed blurry",
  character: "we never quite learned what the character wants",
  conflict: "the stakes stayed abstract",
  dialogue: "too much got said out loud",
  visual: "the images stayed generic",
  pacing: "the priorities weren't clear",
  delivery: "hedges and long answers blunted the delivery",
};

/** Praise for a skill that scored in the strong band. */
const POSITIVE_GOOD: Record<SkillId, string> = {
  hook: "you put a specific person and a problem up front, fast",
  structure: "the story had a shape the listener could follow, with turns that landed",
  character: "we always knew what was driving the character",
  conflict: "the stakes had teeth — we knew what could be lost",
  dialogue: "you kept the important things under the surface",
  visual: "your images carried meaning, not just information",
  pacing: "you made real trade-offs and protected what carries the scene",
  delivery: "you were clear, direct and confident",
};

/** Positive framing for a skill that scored in the solid middle band. */
const POSITIVE_MID: Record<SkillId, string> = {
  hook: "your opening got us into the story quickly",
  structure: "you gave the listener an order of events to hold onto",
  character: "there were real glimpses of what drives the character",
  conflict: "you put real obstacles on the table",
  dialogue: "several lines played nicely under the surface",
  visual: "you gave us concrete images to see",
  pacing: "you were already thinking about time and priorities",
  delivery: "most answers were clear and to the point",
};

const IMPROVE: Record<SkillId, { title: string; advice: string }> = {
  hook: {
    title: "Lead with the collision",
    advice: "Open with who it's about, what they want and the irony that makes it hard — in one sentence, before any context.",
  },
  structure: {
    title: "Make the turns visible",
    advice: "Mark the moments where everything changes. A listener follows a story by its turns, not its events.",
  },
  character: {
    title: "Name the want and the fear",
    advice: "Say plainly what the character wants and what they're afraid of. Every beat should push on that.",
  },
  conflict: {
    title: "Make the stakes personal",
    advice: "Tell us what is lost — specifically, personally — if this fails. Abstract stakes don't move a room.",
  },
  dialogue: {
    title: "Let the subtext carry it",
    advice: "Route the feeling through an action, an object or a change of subject instead of naming it.",
  },
  visual: {
    title: "Pair every image with a feeling",
    advice: "For each shot or image, say what it makes the audience feel. A choice without a why is decoration.",
  },
  pacing: {
    title: "Decide what you'd protect",
    advice: "Name the one moment you'd protect if you lost half your time, and what you'd cut first. That's your plan.",
  },
  delivery: {
    title: "Answer, then stop",
    advice: "Put the answer in your first sentence, add one example, and stop. Let the other person pull for more.",
  },
};

const GENERIC_EXAMPLES: Record<SkillId, string> = {
  hook: "It's about a lighthouse keeper who's been faking the light for ten years — and tonight a ship is coming in.",
  structure: "Everything changes at the midpoint, when she learns the letter was never sent.",
  character: "What she wants is to be forgiven. What she's afraid of is that she doesn't deserve it.",
  conflict: "If he loses this fight, he loses custody of his daughter — and part of him knows he'd deserve it.",
  dialogue: "“Nice car.” — said by a man whose brother just bought it with their father's savings.",
  visual: "Close on her hands, still holding the ring box, while the party carries on out of focus behind her.",
  pacing: "Cut straight from the proposal to the empty chair at the wedding.",
  delivery: "Here's the short version: it's a heist film where the vault is a person's memory.",
};

const NEXT_STEPS: Record<SkillId, { title: string; description: string }> = {
  hook: {
    title: "Drill your one-liner",
    description:
      "Write five versions of your opening sentence, each under 30 words, each naming a specific person, a goal and the irony. Say the best one out loud until it takes one breath.",
  },
  structure: {
    title: "Find the turns",
    description:
      "Retell the story in five sentences starting with \"Once…\", \"Until one day…\", \"Because of that…\", \"Until finally…\" and \"Ever since…\". The Story Spine makes the shape visible.",
  },
  character: {
    title: "Name the want and the fear",
    description: "Before your next run, write one line — \"___ wants ___ because they're afraid of ___\" — and make every answer serve it.",
  },
  conflict: {
    title: "Make the stakes personal",
    description: "Finish \"If this fails, they lose ___\" three different ways. Keep the most personal one, and say it early.",
  },
  dialogue: {
    title: "Practise the unsaid",
    description: "Rewrite three of your lines so the feeling is carried by an action, an object or a change of subject — never named.",
  },
  visual: {
    title: "Pair every shot with a feeling",
    description:
      "List five shots for your key scene and write the emotion each one creates beside it. Cut any shot with nothing written next to it.",
  },
  pacing: {
    title: "Enter late, leave early",
    description: "Cut the first and last quarter of your plan, then decide the one moment you'd protect if you lost half your time.",
  },
  delivery: {
    title: "Answer in the first sentence",
    description:
      "Record yourself answering three questions from this drill: headline first, one example, stop. No \"kind of\", no \"basically\".",
  },
};

/** Remove hedges from a sentence to show the confident version. */
export function stripHedges(sentence: string): string {
  let out = ` ${sentence} `;
  for (const hedge of ["i mean", "i don't know", "kind of", "sort of", "basically", "i guess", "i think", "you know", "just", "really", "very", "actually", "literally", "probably", "maybe", "um", "uh", "like,"]) {
    out = out.replace(new RegExp(`([\\s,])${hedge.replace(" ", "\\s+")}(?=[\\s,.!?])`, "gi"), "$1");
  }
  out = out
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*([.!?])/g, "$1")
    .replace(/^\s*,\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return capitalize(out);
}

function drillFor(skill: SkillId, current: Scenario): Scenario | undefined {
  return SCENARIOS.filter((s) => s.id !== current.id && s.skills.includes(skill)).sort((a, b) => a.difficulty - b.difficulty)[0];
}

/** Content words of a line, for comparing a model answer with what the learner said. */
function contentSet(text: string): Set<string> {
  return new Set(words(text).filter((w) => w.length >= 3 && !STOPWORDS.has(w)));
}

/** Token overlap (Jaccard) between two lines' content words. */
export function lineSimilarity(a: string, b: string): number {
  const left = contentSet(a);
  const right = contentSet(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const w of left) if (right.has(w)) shared++;
  return shared / (left.size + right.size - shared);
}

/** Did the learner already say (nearly) this? Then it can't be offered back to them as a better line. */
function learnerSaid(c: Context, example: string): boolean {
  return [...c.lines, ...c.sentencePool].some((line) => lineSimilarity(line, example) > 0.6);
}

/**
 * A "Try saying" line for a skill: the scene's own model answer, or a
 * generic one where the scene has none. Null when the learner already said
 * it — they get credit, not their own line handed back as a fix (and not an
 * off-scene generic line either).
 */
function exampleFor(c: Context, skill: SkillId): string | null {
  const example = c.script.examples[skill] ?? GENERIC_EXAMPLES[skill];
  return learnerSaid(c, example) ? null : example;
}

/** The drill's own anti-pattern (a confession, a result direction, deck-speak): hedging isn't its real problem. */
function isAntiPattern(scenario: Scenario, sentence: string): boolean {
  if (isSubtextDrill(scenario)) return countTerms(sentence, ON_THE_NOSE) > 0;
  if (scenario.id === "actor-motivation") return countTerms(sentence, RESULT_DIRECTION) > 0;
  if (scenario.id === "founder-story") return countTerms(sentence, BUZZWORDS) > 0;
  return false;
}

/**
 * Score a finished drill from the learner's lines. The result validates
 * against `EvaluationSchema`, with one skill score per scenario skill.
 */
export function demoEvaluate(scenario: Scenario, messages: ChatMessageInput[]): Evaluation {
  const c = buildContext(scenario, messages);
  const script = c.script;
  const partner = script.partner ?? scenario.persona.name.split(" ")[0];
  const improveFor = (skill: SkillId) =>
    skill === "delivery" && tooThin(c)
      ? {
          title: "Say something specific",
          advice: `Every answer needs one concrete detail — a person, a place, a moment. A word or two gives ${partner} nothing to react to.`,
        }
      : (script.improve?.[skill] ?? IMPROVE[skill]);
  const weakFor = (skill: SkillId) =>
    skill === "delivery" && tooThin(c) ? "the answers were too thin to land" : (script.weak?.[skill] ?? WEAK_PHRASE[skill]);
  const disengaged = c.turns > 0 && c.engagement < 0.35;
  const strayed = c.rudeLines.length + c.offTopicLines.length;

  const scoredSkills = scenario.skills.map((skill) => SCORERS[skill](c));
  const skillScores: SkillScore[] = scoredSkills.map(({ skill, score, comment }) => ({ skill, score, comment }));
  // Skills the rubric leans on (several criteria) weigh more in the overall.
  const weight = (skill: SkillId) => 1 + scenario.rubric.filter((r) => r.skill === skill).length * 0.5;
  const totalWeight = skillScores.reduce((n, s) => n + weight(s.skill), 0);
  let overall = skillScores.reduce((n, s) => n + s.score * weight(s.skill), 0) / Math.max(1, totalWeight);
  if (c.on.length >= scenario.suggestedTurns && !disengaged) overall += 2;
  else if (c.on.length < Math.ceil(scenario.suggestedTurns / 2)) overall -= 6;
  overall = clampScore(overall);

  const ranked = [...scoredSkills].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const weakest = ranked[ranked.length - 1];

  // Headline
  let headline: string;
  if (c.turns === 0 || c.words < 12) headline = "Barely out of the harbour — say more next time so there's something to coach.";
  else if (disengaged && c.rudeLines.length > c.offTopicLines.length)
    headline = `You spent the scene pushing ${partner} away instead of playing it.`;
  else if (disengaged && c.offTopicLines.length > 0) headline = `The conversation kept drifting away from the scene — stay with what ${partner} asks.`;
  else if (disengaged) headline = `Too thin to coach yet — give ${partner} real answers and the scorecard gets specific.`;
  else if (ranked.every((s) => s.score >= 75)) headline = `A confident, well-shaped performance — ${partner} would want another round.`;
  else if (ranked.every((s) => s.score < 45)) headline = "A tentative first pass — the raw material is there, but it needs specifics.";
  else if (weakest.score >= 68) headline = `${STRONG_PHRASE[best.skill]} — and ${SKILLS[weakest.skill].name.toLowerCase()} isn't far behind.`;
  else if (best.score - weakest.score < 6) headline = "Solid all round — now push every answer from good to specific.";
  else headline = `${best.score >= 70 ? STRONG_PHRASE[best.skill] : MID_PHRASE[best.skill]}, but ${weakFor(weakest.skill)}.`;

  // Strengths: positive notes only, each tied to something the learner said.
  const strengths: string[] = [];
  const quoted = new Set<string>();
  for (const s of ranked.slice(0, 2)) {
    if (s.score < 58) continue;
    const praise = s.score >= 70 ? POSITIVE_GOOD[s.skill] : POSITIVE_MID[s.skill];
    const quote = s.quote && !quoted.has(s.quote) ? s.quote : null;
    if (quote) quoted.add(quote);
    strengths.push(tidy(`${SKILLS[s.skill].name}: ${capitalize(praise)}${quote ? ` — “${quote}”` : ""}.`));
  }
  if (c.on.length >= scenario.suggestedTurns && c.engagement >= 0.5 && strayed === 0) {
    strengths.push(`You stayed in the scene for all ${c.turns} turns and kept answering ${partner} head-on.`);
  }
  if (c.onWords >= 60 && c.hedgeRate < 1 && c.engagement >= 0.5) strengths.push("Almost no hedging — you sounded like someone who knows their material.");
  if (strengths.length === 0 && c.on[0] && !disengaged) {
    strengths.push(
      tidy(`You stepped into the room and put real material on the table — “${firstLine(firstSubstantive(c.on[0]), 16)}” is a starting point to build from.`),
    );
  }
  if (strengths.length === 0) strengths.push("You started the drill — next time, stay in the scene long enough to get real feedback.");

  // Improvements: staying in the scene first, then hedging when it (and not the drill's anti-pattern) cost the learner, then the weakest skills.
  const improvements: Improvement[] = [];
  const offered = new Set<string>();
  /** Each model line is offered once per card. */
  const once = (example: string | null) => {
    if (!example || offered.has(example)) return "";
    offered.add(example);
    return example;
  };
  /** Thin answers are fixed by a specific answer to the opening question, not by a delivery tip. */
  const exampleForSkill = (skill: SkillId) => once(skill === "delivery" && tooThin(c) ? exampleFor(c, scenario.skills[0]) : exampleFor(c, skill));
  if (strayed > 0) {
    const stray = c.rudeLines[0] ?? c.offTopicLines[0];
    improvements.push({
      title: "Stay in the scene",
      detail: tidy(
        `“${trimWords(stray, 16)}” ${c.rudeLines.length > 0 ? `pushed ${partner} away` : "stepped out of the scene"}. Every line is part of the conversation — answer what ${partner} asks, in the room you're in.`,
      ),
      example: once(exampleFor(c, scenario.skills[0])),
    });
  }
  const hedgySentence = c.sentencePool.find((sen) => hedgeCount(sen) >= 2 && !isAntiPattern(scenario, sen));
  if (hedgySentence && c.hedgeRate > 2.5) {
    const cleaned = stripHedges(hedgySentence);
    const usable = cleaned !== hedgySentence.trim() && words(cleaned).length >= 8 && !isAntiPattern(scenario, cleaned);
    improvements.push({
      title: "Cut the hedges",
      detail: tidy(
        `You said “${trimWords(hedgySentence, 24)}”. Qualifiers like that tell ${partner} you're not sure — and then they won't be either.`,
      ),
      example: usable ? cleaned : exampleForSkill("delivery"),
    });
  }
  for (const s of [...ranked].reverse()) {
    if (improvements.length >= 3) break;
    if (s.score >= 82 && improvements.length >= 2) break;
    // No model line to offer (the learner already said it): only worth a note if the card would otherwise be short.
    const example = exampleForSkill(s.skill);
    if (!example && improvements.length >= 2) continue;
    const strong = s.score >= 70;
    const opening = !strong && s.skill === "hook" && c.lines[0] ? firstLine(firstSubstantive(c.lines[0]), 16) : null;
    improvements.push({
      title: improveFor(s.skill).title,
      detail: tidy(`${strong ? "Already working — for the next level: " : ""}${opening ? `You opened with “${opening}”. ` : ""}${improveFor(s.skill).advice}`),
      example,
    });
  }
  if (improvements.length < 4 && c.maxWords > 160) {
    // Lead with the sentence that was buried inside the longest answer.
    const longest = c.lines.reduce((a, b) => (words(b).length > words(a).length ? b : a), c.lines[0] ?? "");
    const parts = sentences(longest);
    const buried = parts
      .map((sen, i) => ({ sen, i, n: signalScore(script, sen) }))
      .filter((p) => p.i > 0 && words(p.sen).length >= 5)
      .sort((a, b) => b.n - a.n)[0];
    const example = buried && buried.n > signalScore(script, parts[0] ?? "") ? trimWords(buried.sen, 28) : exampleForSkill("delivery");
    improvements.push({
      title: "Headline first",
      detail: `Your longest answer ran ${c.maxWords} words. ${partner} needed the headline up front — the detail can come when they ask for it.`,
      example,
    });
  }
  if (improvements.length < 2 && !improvements.some((i) => i.title === improveFor("delivery").title)) {
    const fallback = improveFor("delivery");
    improvements.push({ title: fallback.title, detail: fallback.advice, example: exampleForSkill("delivery") });
  }

  // Best moment: the strongest engaged line, trimmed to its best sentences — or nothing, if nothing landed.
  let bestMoment = "";
  const candidates = c.lines
    .map((line, i) => ({ line, move: c.moves[i], signal: signalScore(script, line) }))
    .filter(({ move, signal }) => !WEAK_MOVES.has(move) && signal > 0 && (move !== "question" || signal >= 2))
    .map((h) => ({ ...h, score: lineScore(scenario, h.line) }))
    .sort((a, b) => b.score - a.score);
  // A list of other films is a highlight only if there's nothing else.
  const ownWords = candidates.filter((h) => !isCompsLine(h.line));
  const highlights = ownWords.length > 0 ? ownWords : candidates;
  if (highlights.length > 0) {
    // Prefer a line the scorecard hasn't already quoted, if one is nearly as good.
    const fresh = highlights.find((h) => h.score >= highlights[0].score * 0.75 && !sentences(h.line).some((sen) => c.quoted.has(sen)));
    const chosen = (fresh ?? highlights[0]).line;
    const ordered = sentences(chosen)
      .map((sen, i) => ({ sen, i, n: signalScore(script, sen) - hedgeCount(sen) - (isCompsLine(sen) ? 2 : 0) }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 2)
      .sort((a, b) => a.i - b.i)
      .map((p) => p.sen)
      .join(" ");
    bestMoment = words(ordered).length >= (isSubtextDrill(scenario) ? 2 : 4) ? trimWords(ordered, 40) : "";
  }

  // Next step
  const step = script.nextSteps?.[weakest.skill] ?? NEXT_STEPS[weakest.skill];
  const drill = drillFor(weakest.skill, scenario);
  const nextStep = disengaged
    ? {
        title: "Play the scene",
        description: `Run “${scenario.title}” again and give ${partner} a real answer to every question — one specific detail each time. That's what the scorecard can coach.`,
      }
    : {
        title: step.title,
        description: drill ? `${step.description} Then run “${drill.title}”, which trains the same muscle.` : step.description,
      };

  // Summary
  const bestSentence =
    best.score >= 60
      ? `Your strongest area was ${SKILLS[best.skill].name.toLowerCase()} (${best.score}).`
      : `Nothing fully landed yet — ${SKILLS[best.skill].name.toLowerCase()} came closest (${best.score}).`;
  const weakSentence =
    weakest.skill === best.skill
      ? ""
      : weakest.score >= 68
        ? `Even your lowest score, ${SKILLS[weakest.skill].name.toLowerCase()} (${weakest.score}), is strong — the next gain is polish.`
        : `The biggest gain is in ${SKILLS[weakest.skill].name.toLowerCase()} (${weakest.score}): ${weakFor(weakest.skill)}.`;
  const closer = disengaged
    ? `Run it again and answer what ${partner} actually asks — that alone will change the scene.`
    : overall >= 70
      ? `${partner} would leave this conversation wanting more.`
      : overall >= 50
        ? `Tighten that and you'll feel ${partner} lean in.`
        : `Run it again with one specific detail in every answer — that alone will change how ${partner} responds.`;
  const strayNote =
    strayed > 0
      ? `${strayed === c.turns ? "All" : strayed} of those turns ${c.rudeLines.length > 0 ? "pushed back at the scene" : "wandered off topic"}, which cost you.`
      : "";
  const summary = [
    `Across ${c.turns} turn${c.turns === 1 ? "" : "s"} (${c.words} words) with ${partner}, you ${
      c.turns < scenario.suggestedTurns ? "ended the scene early" : disengaged ? "stayed to the end but never really played the scene" : "saw the scene through"
    }.`,
    strayNote,
    bestSentence,
    weakSentence,
    closer,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    overall,
    headline,
    summary: restore(summary),
    skillScores: skillScores.map((sc) => ({ ...sc, comment: restore(sc.comment) })),
    strengths: strengths.slice(0, 4).map(restore),
    improvements: improvements.slice(0, 4).map((i) => ({ title: i.title, detail: restore(i.detail), example: restore(i.example) })),
    bestMoment: restore(bestMoment),
    nextStep,
  };
}
