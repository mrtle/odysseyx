import type { Lesson } from "@/lib/types";

/**
 * Track 6 — Editing & Sound: story is rewritten in the cut.
 * The Kuleshov effect, continuity versus expressive cutting, rhythm and
 * pacing, J-cuts, L-cuts and sound bridges, and sound design and score.
 */
export const editingSoundLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. The Kuleshov effect
  // -------------------------------------------------------------------------
  {
    id: "kuleshov-effect",
    trackId: "editing-sound",
    title: "The Kuleshov Effect: Meaning Between Shots",
    summary:
      "A neutral face cut against a bowl of soup reads as hunger; the same face cut against a coffin reads as grief. Why audiences create meaning from juxtaposition, and how to use that power on purpose.",
    minutes: 6,
    level: "beginner",
    skills: ["visual", "character"],
    blocks: [
      { type: "heading", text: "The shot you don't see" },
      {
        type: "text",
        body: "There's an old saying that a film is written three times: in the script, on set, and in the cutting room. The third draft is where something strange happens. Put two shots side by side and they create a meaning that neither contains on its own, and the audience builds that meaning in their own heads, without being told.",
      },
      {
        type: "example",
        title: "The experiment",
        source: "Lev Kuleshov, Soviet film pioneer (1910s–1920s)",
        body: "As the story is usually told, Kuleshov took a shot of the actor Ivan Mosjoukine gazing at nothing in particular with a neutral expression, and cut it together with three different images: a bowl of soup, a girl in a coffin, and a woman lying on a divan. Audiences praised the actor's subtle performance, his hunger, his grief, his desire. But it was the same shot of his face each time.\n\nThe original footage hasn't survived, accounts of the details vary, and modern replications suggest the effect is real but subtler than the legend. Its lesson has shaped filmmaking ever since: **the audience reads a shot through the shots around it.**",
      },
      {
        type: "beats",
        title: "The Kuleshov sequence",
        beats: [
          { name: "The look", description: "A character gazes off-screen with a neutral, unreadable expression." },
          { name: "What they see", description: "A bowl of soup, a coffin, a lover. The object supplies the emotion." },
          { name: "The look again", description: "The same face, now read as hunger, grief or desire." },
        ],
      },
      {
        type: "text",
        body: "This is why editing is a storytelling act, not a technical one. The cut works like a silent *therefore*. Show a woman glancing at her watch, then a train pulling out of the station, and the audience concludes she has missed it. Nobody filmed her missing a train. The meaning lives in the gap between the shots, and the audience fills it.",
      },
      {
        type: "example",
        title: "Hitchcock's smile",
        source: "Alfred Hitchcock, interviewed on CBC's Telescope (1964)",
        body: "Hitchcock explained the effect using his own face. A shot of him squinting, then smiling, cut after a shot of a mother with her baby makes him a kindly old man. Swap the baby for a young woman in a bikini, and the very same smile makes him, as he put it, a dirty old man.\n\nHe built *Rear Window* (1954) on this idea. A photographer stuck in a wheelchair looks out of his window, we see what he sees, and we cut back to his face. His reactions, and our judgement of him, are constructed in the edit.",
      },
      { type: "heading", text: "Juxtaposition beyond faces" },
      {
        type: "text",
        body: "The principle works at every scale. Sergei Eisenstein, another Soviet pioneer, argued that meaning comes from the *collision* of shots. At the climax of *Strike* (1925), he intercuts the massacre of striking workers with the slaughter of a bull, and the audience draws a comparison no caption could make as forcefully. A cut can compare, contrast, imply cause, or deliver irony.",
      },
      {
        type: "compare",
        weakLabel: "Telling in the edit",
        weak: "A man reads a letter. Close-up of his face as he says aloud, “She's not coming back.” He sighs sadly.",
        strongLabel: "Letting the cut do it",
        strong:
          "A man reads a letter, his face unreadable. Cut to the second toothbrush in the cup by the sink. Cut back to him, still, folding the letter very neatly.",
        note: "The second version never states the loss. The audience assembles it from the juxtaposition, and feels it more because they did the work.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "The audience always connects",
        body: "Given two images in a row, audiences assume a relationship between them: cause, comparison or point of view. As an editor or director, you never choose *whether* the audience interprets a cut, only *what* they'll conclude from it.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "It cuts both ways",
        body: "Juxtaposition can create meanings you never intended. Cut from your grieving hero to a stranger laughing and the audience may decide he's being mocked. Watch every cut and ask what the pairing implies.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Imagine one neutral shot of a person looking off-screen. Write three different shots to cut to next, each making the audience read a different emotion into the same face.",
        placeholder: "1. A letter with a hospital letterhead… 2. … 3. …",
      },
    ],
    keyTakeaways: [
      "Two shots side by side create a meaning neither holds alone, and the audience builds it themselves.",
      "The same performance can read as hunger, grief or desire depending on what it's cut against.",
      "Every cut implies a connection (cause, comparison, point of view or irony), whether you intend one or not.",
      "Letting the audience assemble meaning from juxtaposition is often more powerful than stating it.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "An actor gives a completely neutral look. In the edit, you cut it next to a shot of an empty playground swing moving in the wind. What does the Kuleshov effect predict?",
        options: [
          "The audience will notice the actor isn't really doing anything",
          "The audience will read the swing as a new scene, with no link to the face before it",
          "The audience will read a feeling, perhaps loss or longing, into the actor's face",
          "The audience will look at the swing and forget about the actor entirely",
        ],
        answerIndex: 2,
        explanation:
          "Audiences read a shot through the shots around it. The neutral face borrows emotion from what it's cut against, so the swing suggests loss or memory, and the actor gets credit for a performance the cut created. Far from seeing two unrelated shots, the audience connects them without being asked.",
      },
      {
        id: "q2",
        prompt: "Why does the Kuleshov effect make editing a storytelling act rather than a purely technical one?",
        options: [
          "Because the pairing of shots creates meaning the audience infers",
          "Because it shows that faces carry all the meaning, so the editor's job is to pick the best takes",
          "Because every cut has to hide a continuity error, and choosing what to hide is creative",
          "Because editors decide how long each shot lasts, which sets the film's running time",
        ],
        answerIndex: 0,
        explanation:
          "Meaning lives between the shots: cause, emotion, point of view. The editor decides which images meet, and the audience draws conclusions from each meeting. That's authorship, not assembly, and it's the opposite of the idea that a face carries its meaning on its own.",
      },
      {
        id: "q3",
        prompt:
          "In *Strike*, Eisenstein intercuts the massacre of workers with the slaughter of a bull. What kind of meaning does this create?",
        options: [
          "A match on action, carrying one movement across the cut",
          "A flashback to a worker's life before the strike",
          "Cross-cutting, showing two events happening at once",
          "A metaphor: the workers are being slaughtered like cattle",
        ],
        answerIndex: 3,
        explanation:
          "The bull isn't in the story's physical space, and it isn't a parallel event we need to follow; it's there to be compared. The collision of the two images makes an argument the audience feels: these people are being butchered. Juxtaposition can build metaphors, not just links of time and place.",
      },
      {
        id: "q4",
        prompt:
          "In a rough cut, you've gone from your grieving heroine straight to a shot of a stranger laughing across the room. What's the risk?",
        options: [
          "None; audiences treat shots that seem unrelated as separate moments",
          "The audience may decide the stranger is laughing at her",
          "The cut will break the 180-degree rule, since the stranger faces the other way",
          "The change of mood will make the scene feel faster",
        ],
        answerIndex: 1,
        explanation:
          "Audiences assume every cut means something. Pairing her grief with laughter implies a relationship (mockery, cruelty or irony) that you never intended. Check what every pairing implies before you lock the cut.",
      },
    ],
    exercise: {
      prompt:
        "Design a Kuleshov sequence of your own: a neutral shot of a character looking off-screen, the thing they see, and the same face again. Write it twice, changing only the middle shot, so the character's feeling changes completely. Then enter one version in the Shot Planner and see how it shapes the sequence.",
      tips: [
        "Keep the face shot identical in both versions; only the middle shot changes.",
        "Choose middle shots with specific, charged details rather than generic ones.",
        "Try one version where the juxtaposition creates irony rather than emotion.",
        "Note the sound for each shot too, because sound is juxtaposition as well.",
      ],
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 2. Continuity versus expressive cuts
  // -------------------------------------------------------------------------
  {
    id: "invisible-and-expressive-cuts",
    trackId: "editing-sound",
    title: "Invisible Cuts & Cuts You're Meant to Notice",
    summary:
      "Continuity editing (the 180-degree rule, eyeline matches, match on action) keeps the audience lost in the story. Match cuts, jump cuts and cross-cutting make them feel the cut on purpose. Learn both, and when to switch.",
    minutes: 8,
    level: "beginner",
    skills: ["visual", "pacing"],
    blocks: [
      { type: "heading", text: "Two philosophies of the cut" },
      {
        type: "text",
        body: "Most cuts in a film are designed to disappear. Continuity editing stitches shots together so smoothly that the audience never notices the camera has moved; they simply feel they're watching events unfold. Other cuts are designed to be felt: a leap across millions of years, a jarring skip in time, two storylines hammering against each other. Good editors use both, and know which one a moment needs.",
      },
      { type: "heading", text: "The invisible toolkit" },
      {
        type: "list",
        items: [
          "**The 180-degree rule:** imagine a line running through two characters in a conversation. Keep the camera on one side of it and A always looks screen right while B always looks screen left. Cross the line carelessly and they suddenly seem to face the same way, and the audience's sense of space flips.",
          "**Shot/reverse shot:** alternating between two characters, usually in matching sizes, to build a conversation from separate angles.",
          "**Eyeline match:** a character looks off-screen, and the next shot shows what they're looking at, from roughly their direction. The audience reads the second shot as their view.",
          "**Match on action:** cut in the middle of a movement (a door opening, a glass raised) and continue it in the next shot. The motion carries the eye across the cut, and the cut vanishes.",
        ],
      },
      {
        type: "example",
        title: "One actor, two characters",
        source: "The Lord of the Rings: The Two Towers (2002), dir. Peter Jackson",
        body: "When Sméagol argues with his darker self, Gollum, Jackson cuts between the two personalities as if they were two people in a conversation, one consistently on one side of the frame and the other facing him from the opposite side, in classic shot/reverse shot. It's one actor and one body, but the continuity grammar we normally use for two people convinces us there are two.\n\nThe rules designed to make cuts invisible become a way of showing a divided mind.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Hide cuts inside motion",
        body: "The eye is busy following movement, so cutting mid-action is the easiest way to make a cut invisible. Rather than cutting before a move starts or after it ends, cut a few frames into it and let the next shot finish it.",
      },
      { type: "heading", text: "Cuts that want to be seen" },
      {
        type: "list",
        items: [
          "**Match cut:** two shots linked by a similar shape, movement or sound, so the cut creates a connection or comparison.",
          "**Jump cut:** a cut between two shots of the same subject from nearly the same angle, so time visibly skips. It feels restless, modern, unsettled.",
          "**Cross-cutting (parallel action):** alternating between events in different places, usually happening at the same time, so each comments on or raises the tension of the other.",
        ],
      },
      {
        type: "example",
        title: "Millions of years in one cut",
        source: "2001: A Space Odyssey (1968), dir. Stanley Kubrick",
        body: "A prehistoric ape-man, having discovered that a bone can be a weapon, hurls it into the air. As it spins, Kubrick cuts to a spacecraft of a similar shape drifting in orbit. The cut leaps across the whole of human history, and it makes an argument: from the first tool to the most advanced technology, it's the same impulse. No dialogue could say it so quickly.",
      },
      {
        type: "example",
        title: "The doorbell rings",
        source: "The Silence of the Lambs (1991), dir. Jonathan Demme",
        body: "Near the climax, the film cross-cuts between an FBI team surrounding a house and the killer, Buffalo Bill, in his basement. A doorbell rings; we see an agent at a front door and Bill heading upstairs to answer. The parallel editing tells us the rescue is seconds away.\n\nThen Bill opens his door to find Clarice Starling, alone, while the agents burst into an empty house in another state. The cross-cutting built an expectation purely through juxtaposition, and the film turns it into a gut-punch.",
      },
      {
        type: "text",
        body: "Jump cuts broke into the mainstream with Jean-Luc Godard's *Breathless* (1960), where they give scenes a restless, improvised energy that matches its careless young characters. Today they're the native grammar of vlogs and video essays, compressing a talking head into its best moments. Either way, a jump cut announces: *time has been removed, and we don't mind if you notice*.",
      },
      {
        type: "compare",
        weakLabel: "Cross-cutting as scheduling",
        weak: "We cut from the heist crew setting up, to the detective eating lunch, to the crew again, simply because both things happen that afternoon.",
        strongLabel: "Cross-cutting as a race",
        strong:
          "We cut between the crew drilling toward the vault and the detective across town, slowly realising which bank they've chosen. Each cut comes sooner than the last, and each thread raises the stakes of the other.",
        note: "Cross-cutting works when the two lines collide in meaning or in time. If they don't affect each other, it's just a schedule.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Think of two things happening at the same time in a story you know or are writing. How would cross-cutting between them create tension, irony or comparison? Where do the two lines finally meet?",
        placeholder: "While she's… he's… and they collide when…",
      },
    ],
    keyTakeaways: [
      "Continuity editing makes cuts disappear: stay on one side of the 180-degree line, match eyelines, and cut on action.",
      "Expressive cuts want to be felt: match cuts compare, jump cuts compress and unsettle, cross-cutting builds tension or irony.",
      "The rules that make continuity invisible can be bent to create meaning, as when one actor becomes two characters.",
      "Cross-cutting only works when the two storylines affect each other in time or meaning.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "In a two-person conversation, Anna looks screen right and Ben looks screen left. After a cut, both seem to be looking screen right. What most likely happened?",
        options: [
          "The shot sizes don't match, which confuses their eyelines",
          "The camera crossed the 180-degree line, flipping the screen direction",
          "The editor used an eyeline match, so both look at the same thing",
          "The scene switched to handheld, letting the frame drift",
        ],
        answerIndex: 1,
        explanation:
          "Keeping the camera on one side of the imaginary line between the characters keeps their screen directions consistent. Cross it without a reason and they appear to face the same way, as if talking to someone else, which breaks the audience's sense of space.",
      },
      {
        id: "q2",
        prompt:
          "A character reaches for a door handle in a wide shot, and you want the cut to a close-up of her hand to feel seamless. Where should you cut?",
        options: [
          "Before she starts moving, so the close-up begins cleanly on a still frame",
          "Just after the door opens, once the action is complete and settled",
          "On the click of the handle, since a sharp sound will cover any cut",
          "Midway through the reach, continuing the motion in the close-up",
        ],
        answerIndex: 3,
        explanation:
          "Match on action hides the cut inside movement. The eye follows the motion across the cut and doesn't register the change of angle. Cutting on stillness or after the action has finished leaves the cut exposed, and a sound can help but can't hide a jump in position.",
      },
      {
        id: "q3",
        prompt:
          "At the climax of *The Godfather*, Michael stands as godfather at his nephew's baptism, renouncing Satan, while the film cross-cuts to the murders of his rivals that he has ordered. What does the cross-cutting create?",
        options: [
          "Irony: his sacred vows play against the killings he has ordered",
          "Suspense: we wait to see whether the killings can be stopped in time",
          "Simple timing: it shows everything happens at once",
          "Comic relief, lightening a dark film with a family celebration",
        ],
        answerIndex: 0,
        explanation:
          "Cross-cutting lets two lines comment on each other. Michael's promises before God, intercut with the killings, make the audience feel both his hypocrisy and the completeness of his transformation, without a word of explanation. There's no race against time here: he ordered the killings, and the cutting shows us who he has become.",
      },
      {
        id: "q4",
        prompt: "What does a jump cut usually communicate to the audience?",
        options: [
          "That we're drifting into a dream or a memory",
          "That two characters are in different places at the same moment",
          "That time has been skipped, often with a restless feeling",
          "That we've switched to a character's point of view, seeing what they see",
        ],
        answerIndex: 2,
        explanation:
          "Cutting between two near-identical framings of the same subject makes time visibly jump. Godard used it for restless energy in *Breathless*; vloggers use it to compress a talk into its best moments. Either way, the cut is meant to be noticed.",
      },
    ],
    exercise: {
      prompt:
        "Plan coverage for a two-person scene so that it can be cut invisibly: mark the 180-degree line, plan matching shot/reverse shots, and find one action to cut on. Then add one expressive cut, such as a match cut into or out of the scene, or cross-cutting with something happening elsewhere. Defend every setup in the DP drill, then refine the plan in the Shot Planner.",
      tips: [
        "Sketch a quick overhead diagram with the line between the characters before you choose any angle.",
        "Match shot sizes in the shot/reverse shot, unless you want one character to dominate.",
        "Plan a movement you can cut on: standing, pouring, turning.",
        "Give your expressive cut a reason: a comparison, a time jump or a collision.",
      ],
      practiceScenarioId: "dp-shot-planning",
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Rhythm and pacing
  // -------------------------------------------------------------------------
  {
    id: "rhythm-and-pacing",
    trackId: "editing-sound",
    title: "Rhythm & Pacing in the Edit",
    summary:
      "When to cut and when to hold. Walter Murch's case for emotion above all, shot length as tempo, the courage of the held shot, and montage as time compressed into feeling.",
    minutes: 8,
    level: "intermediate",
    skills: ["pacing", "structure"],
    blocks: [
      { type: "heading", text: "Editing is music you watch" },
      {
        type: "text",
        body: "Every cut is a beat. Short shots cut quickly raise the pulse; long shots held patiently slow it down. Editors talk about rhythm the way musicians do, because audiences feel it the same way, in the body, before they think about it. Pacing is not about making a film fast. It's about making it feel the right speed at every moment.",
      },
      {
        type: "text",
        body: "The best-known framework comes from Walter Murch, whose editing and sound work shaped *Apocalypse Now* and *The English Patient*. In his book *In the Blink of an Eye*, he ranks what an ideal cut should respect, and gives each criterion a weight:",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "**Emotion (51%):** is the cut true to what the audience should feel at this moment?",
          "**Story (23%):** does it move the story forward?",
          "**Rhythm (10%):** does it happen at the rhythmically right moment?",
          "**Eye-trace (7%):** does it respect where the audience's eye is on the screen?",
          "**Two-dimensional plane of the screen (5%):** does it respect screen direction, such as the 180-degree line?",
          "**Three-dimensional space (4%):** is it true to where people physically are?",
        ],
      },
      {
        type: "callout",
        tone: "insight",
        title: "Emotion outranks continuity",
        body: "Murch's point is that when you must sacrifice something, you sacrifice from the bottom of the list. A cut with a small continuity slip that lands the emotion beats a technically perfect cut that feels wrong. Audiences forgive a glass in the wrong hand. They don't forgive a moment that fails to move them.",
      },
      { type: "heading", text: "Cutting for emotion" },
      {
        type: "example",
        title: "The shower",
        source: "Psycho (1960), dir. Alfred Hitchcock",
        body: "The shower murder lasts well under a minute, but it's built from dozens of brief shots: the silhouette through the curtain, the raised knife, Marion's screaming mouth, her hand, the water, the drain. The knife is barely ever seen touching her. The speed and fragmentation of the cutting, driven by Bernard Herrmann's shrieking strings, make the audience *feel* the violence as shock and chaos, far more than any single graphic image could.\n\nThen the rhythm collapses into stillness: a slow, spiralling pull-back from her lifeless eye.",
      },
      { type: "heading", text: "The courage to hold" },
      {
        type: "text",
        body: "Cutting away is easy; holding is brave. A shot held longer than expected forces the audience to sit in a moment, study a face, feel time pass. Chantal Akerman's *Jeanne Dielman, 23 quai du Commerce, 1080 Bruxelles* (1975), which topped the 2022 *Sight and Sound* critics' poll of the greatest films, watches a woman's household routines in long, static takes: peeling potatoes, making coffee. Because we've lived through her routine at its real pace, the smallest disruption to it feels seismic.",
      },
      {
        type: "compare",
        weakLabel: "Cutting away too soon",
        weak: "A father is told his son didn't survive surgery. We see his face for one second, then cut to the doctor, the corridor, the mother arriving.",
        strongLabel: "Holding the moment",
        strong:
          "We stay on the father's face for a long, uncomfortable beat after the news: no cut, no music, just a man trying to hold his expression together and failing. Only when he finally looks away do we cut.",
        note: "Holding tells the audience *this matters; don't look away*. Cutting too soon rescues them from the emotion you've spent the whole film earning.",
      },
      { type: "heading", text: "Montage: time compressed into feeling" },
      {
        type: "example",
        title: "Married Life",
        source: "Up (2009), dir. Pete Docter",
        body: "In about four minutes, without a line of dialogue, Pixar's montage carries Carl and Ellie from their wedding through decades of marriage: fixing up their house, saving for a trip to Paradise Falls and breaking open the savings jar again and again for life's emergencies, learning they can't have children, growing old, and finally Ellie's illness and death.\n\nMichael Giacchino's waltz returns in shifting moods as the years pass. Each shot is one specific moment chosen to stand for years, and the rhythm lets a lifetime play out in a few minutes.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "The montage test",
        body: "A montage should show *change*, not just time passing. If you could shuffle the shots without losing anything, it's a slideshow. Build it so each shot moves the story one step further, like the savings jar in *Up* that keeps getting smashed for something more urgent than the dream.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Pick a stretch of time in a story: a year of training, a friendship slowly falling apart, one long night shift. List five montage shots in which each shot shows a step of change, not just the passing of time.",
        placeholder: "1. … 2. … 3. … 4. … 5. …",
      },
    ],
    keyTakeaways: [
      "Shot length is tempo: fast cutting raises the pulse, while long takes slow it and deepen attention.",
      "Murch's Rule of Six puts emotion first. When you must compromise, sacrifice continuity before feeling.",
      "Holding a shot longer than expected makes the audience sit in the moment, so don't cut away from what you've earned.",
      "A good montage shows change, with each shot moving the story a step, not just time passing.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "You have two takes of a climactic line. Take A has perfect continuity but feels flat. Take B has the actor's hand in a slightly different position but devastating emotion. Following Murch's Rule of Six, which do you use?",
        options: [
          "Take B, because emotion outranks continuity",
          "Take A, because a visible continuity error pulls audiences out of the story",
          "Neither; reshoot it, since a climax deserves both emotion and continuity",
          "Take A, and add the missing emotion with music and a slower cut",
        ],
        answerIndex: 0,
        explanation:
          "Emotion sits at the top of Murch's list at 51%, and physical continuity at the bottom. Audiences rarely notice a small mismatch when they're moved, but they always notice a moment that feels false, and music can't supply a feeling the performance doesn't have.",
      },
      {
        id: "q2",
        prompt: "What is the main effect of cutting rapidly between many brief shots, as in *Psycho*'s shower scene?",
        options: [
          "It makes the geography of the bathroom easier to follow",
          "It hides the violence, so the scene feels less disturbing",
          "It turns the attack into shock and chaos, felt more than seen",
          "It gives the audience time to study each image",
        ],
        answerIndex: 2,
        explanation:
          "Fast, fragmented cutting overwhelms and disorients. The knife is barely seen touching her, but that doesn't make the scene gentler: the audience assembles the violence in their heads from glimpses, which is often more disturbing than a single explicit shot.",
      },
      {
        id: "q3",
        prompt:
          "A character receives devastating news, and the editor cuts away after one second. What's the strongest argument for holding longer?",
        options: [
          "Long takes feel more realistic, and realism makes any scene more believable",
          "It gives the audience time to take in the set",
          "The actor's performance deserves to be seen in full, out of respect for the work",
          "Holding keeps us inside the emotion instead of rescuing us from it",
        ],
        answerIndex: 3,
        explanation:
          "A held shot says *don't look away*. Cutting too soon releases the tension you've built, while staying on the face lets the audience experience the moment alongside the character. The case for holding isn't realism or respect for the take; it's about not letting the audience off the hook.",
      },
      {
        id: "q4",
        prompt:
          "You're cutting a training montage in the spirit of *Rocky*. Which approach makes it feel like a story rather than a slideshow?",
        options: [
          "Cut every shot on the beat of the music, so the energy never drops",
          "Each shot shows progress, building to a clear high point",
          "Show a wide variety of exercises, so it feels like months of work have passed",
          "Keep every shot the same length, so the rhythm feels steady and relentless",
        ],
        answerIndex: 1,
        explanation:
          "A montage should show change, not just energy or time passing. Rocky's run ends with him bounding up the museum steps that left him gasping earlier in the film. Ordering the shots as a progression with a peak at the end turns compressed time into an arc; without that, you could shuffle the shots and lose nothing.",
      },
    ],
    exercise: {
      prompt:
        "Choose a scene with a strong emotional turn and write an edit plan: where the cutting speeds up, where it slows, and the one shot you'll hold longer than feels comfortable. Then step into the Festival Q&A drill and explain your pacing choices to an audience, in under a minute per answer.",
      tips: [
        "Map the scene's tension first: where does it rise, peak and release?",
        "Save the fastest cutting for peak chaos and the longest hold for the emotional peak.",
        "When you explain a choice, name the feeling: “I held on him so you couldn't escape his face.”",
        "Cut anything that doesn't earn its screen time, then check you haven't cut the breaths.",
      ],
      practiceScenarioId: "festival-qa",
    },
  },

  // -------------------------------------------------------------------------
  // 4. J-cuts, L-cuts and sound bridges
  // -------------------------------------------------------------------------
  {
    id: "j-and-l-cuts",
    trackId: "editing-sound",
    title: "J-Cuts, L-Cuts & Sound Bridges",
    summary:
      "Let sound lead or linger across a cut and scenes flow into each other like thought. How J-cuts, L-cuts and sound bridges smooth conversations, build anticipation and link ideas.",
    minutes: 7,
    level: "intermediate",
    skills: ["pacing", "structure"],
    blocks: [
      { type: "heading", text: "Picture and sound don't have to cut together" },
      {
        type: "text",
        body: "Beginners cut sound and picture at the same instant, and the result feels choppy, like a slideshow with audio. Experienced editors split them. Letting the sound of the next shot arrive early, or the sound of the last shot linger, makes cuts feel like natural shifts of attention rather than mechanical switches.",
      },
      {
        type: "list",
        items: [
          "**J-cut:** the audio of the next shot begins *before* the picture cuts to it. On an editing timeline, the incoming audio reaches back under the previous shot, making the shape of a J.",
          "**L-cut:** the picture cuts, but the audio of the previous shot *continues* under the new image. The outgoing audio trails beneath the next shot, making an L.",
          "**Sound bridge:** any sound that carries across a cut or transition to link two scenes, whether dialogue, music or an effect.",
        ],
      },
      {
        type: "beats",
        title: "Anatomy of a J-cut",
        beats: [
          { name: "Picture A, sound A", description: "We're at a quiet kitchen table, hearing the kitchen." },
          { name: "Picture A, sound B", description: "Still in the kitchen, but the roar of a stadium crowd begins to rise. We lean forward." },
          { name: "Picture B, sound B", description: "Cut to the stadium. The picture catches up with the sound we've already heard." },
        ],
      },
      { type: "heading", text: "Why split edits feel natural" },
      {
        type: "text",
        body: "In life we often hear before we see. A door slams in the next room and we turn our heads; someone calls our name and we look. A J-cut mimics that: the sound pulls our attention and the picture follows.\n\nAn L-cut mimics something else we do constantly in conversation: we watch the listener while someone else is still talking. That's why dialogue scenes are full of L-cuts. We hear the question, but we watch the face receiving it.",
      },
      {
        type: "compare",
        weakLabel: "Hard cuts on every line",
        weak: "The boss says, “You're fired.” Cut to the employee, who says, “Why?” Cut to the boss, who answers. Each shot begins and ends exactly with its speaker's line.",
        strongLabel: "Split edits",
        strong:
          "Halfway through the boss's “You're fired,” we cut to the employee's face as the words land (an L-cut). Later, her quiet “Why?” begins while we're still on the boss (a J-cut), so we see him flinch before she's even on screen.",
        note: "Split edits put the camera where the emotion is, often on the listener, not just on whoever happens to be speaking.",
      },
      {
        type: "example",
        title: "Rotor blades into a ceiling fan",
        source: "Apocalypse Now (1979), dir. Francis Ford Coppola",
        body: "The film opens on a jungle treeline, the thud of helicopter blades and an eruption of napalm, then dissolves to Captain Willard lying in a Saigon hotel room. The whir of the ceiling fan above him blends with the helicopter sound, and we understand, without a word, that the war is still spinning in his head.\n\nWalter Murch's sound work on the film was so central that he received what's widely cited as the first screen credit for *sound designer*.",
      },
      {
        type: "example",
        title: "A scream becomes a whistle",
        source: "The 39 Steps (1935), dir. Alfred Hitchcock",
        body: "A woman discovers a murdered body in Richard Hannay's London flat and opens her mouth to scream. Instead of her voice, we hear the shriek of a train whistle as the film cuts to the train carrying Hannay north. The sound bridge links the discovery of the crime to the man who'll be blamed for it, and hurls us straight into the chase.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Lead into a scene with sound",
        body: "A J-cut into a new scene is one of the simplest ways to create anticipation. Let us hear a crowd's roar, a phone ringing or an argument through a wall over the end of the previous scene, and the audience leans forward, wanting to see what the sound belongs to.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Don't split everything",
        body: "A hard cut, with picture and sound switching together, is abrupt, and sometimes that's exactly what you want: a shock, a punchline, a slammed door. Split edits carry the audience; hard cuts jolt them. Choose deliberately.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write a transition between two scenes in your story using a sound bridge. What sound ends the first scene, what sound or image begins the second, and what connection will the audience make between them?",
        placeholder: "The kettle's whistle becomes…",
      },
    ],
    keyTakeaways: [
      "A J-cut lets the next shot's sound arrive before its picture; an L-cut lets a shot's sound linger over the next image.",
      "Split edits feel natural because we often hear before we look, and we watch listeners while others talk.",
      "Sound bridges link scenes and ideas across a cut, turning transitions into meaning.",
      "Hard cuts still matter. Use them when you want the audience jolted, not carried.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "At the end of a quiet breakfast scene, we start to hear roaring engines and a stadium announcer before the picture cuts to a racetrack. What kind of edit is this?",
        options: ["An L-cut", "A jump cut", "A match on action", "A J-cut"],
        answerIndex: 3,
        explanation:
          "The incoming scene's audio begins before its picture, which makes it a J-cut. It builds anticipation and makes the transition feel like our attention being pulled toward the sound.",
      },
      {
        id: "q2",
        prompt: "In a dialogue scene, why might an editor cut to the listener while the speaker is still talking?",
        options: [
          "To give the scene a faster rhythm by cutting more often",
          "Because the emotion is often on the face receiving the words",
          "Because the 180-degree rule requires a reverse angle after each line of dialogue",
          "Because audiences get bored if they watch one face for too long",
        ],
        answerIndex: 1,
        explanation:
          "The meaning of a line often lives in its effect. An L-cut keeps the speaker's voice while showing the reaction, putting the camera where the emotion is. The 180-degree rule doesn't demand it, and it isn't about pace: it's a choice to show the reaction.",
      },
      {
        id: "q3",
        prompt:
          "In *Apocalypse Now*, the sound of helicopter blades blends into the whir of a hotel ceiling fan. What does this sound bridge tell the audience?",
        options: [
          "That Willard's mind is still at war, even in a quiet room",
          "That a helicopter is about to land on the hotel roof",
          "That the war is over and he's safely home at last",
          "That he's dreaming, and the jungle was never real",
        ],
        answerIndex: 0,
        explanation:
          "The bridge links an external image of war to an internal state. Without dialogue, we understand that Willard can't escape what he's seen; the sound tells us more than the picture does.",
      },
      {
        id: "q4",
        prompt:
          "You're cutting a horror film. A character opens a cupboard and a cat leaps out. Which transition gives the biggest jolt?",
        options: [
          "An L-cut, letting the previous scene's quiet music carry over the shock",
          "A slow crossfade of sound and picture, for a dreamlike unease",
          "A hard cut, with picture and sound switching at the same instant",
          "A J-cut, so the cat's hiss arrives a beat before we see it",
        ],
        answerIndex: 2,
        explanation:
          "Split edits smooth transitions; hard cuts jolt. For a shock you want sound and picture to hit together with no warning. Hearing the hiss in advance would spoil the surprise, and carrying the old music over would cushion it.",
      },
    ],
    exercise: {
      prompt:
        "Take a two-person argument scene and mark where you'd use L-cuts (to stay on the listener) and J-cuts (to let a line or a sound pull us to the next shot), plus one sound bridge into the following scene. Enter the scene in the Shot Planner and use each shot's sound notes to describe your split edits.",
      tips: [
        "For every line, ask: is the emotion on the speaker or the listener?",
        "Use a J-cut when you want the audience to anticipate what they're about to see.",
        "Look for one sound that can transform into another across a scene change.",
        "Keep at least one hard cut for the moment that should jolt.",
      ],
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Sound design and score
  // -------------------------------------------------------------------------
  {
    id: "sound-design-and-score",
    trackId: "editing-sound",
    title: "Sound Design, Score & Silence",
    summary:
      "Diegetic and non-diegetic sound, the power of silence, and leitmotifs that let music carry character and memory. Much of what an audience feels, they hear.",
    minutes: 9,
    level: "advanced",
    skills: ["pacing", "character"],
    blocks: [
      { type: "heading", text: "Much of what we feel, we hear" },
      {
        type: "text",
        body: "Audiences believe they watch films. In truth, a huge share of what they feel arrives through their ears: the room tone that makes a space feel empty, the distant siren that makes a city feel dangerous, the music that tells them how to feel about what they're seeing. Sound works on us when we're not paying attention, which makes it one of the most powerful storytelling tools you have.",
      },
      { type: "heading", text: "Inside and outside the story's world" },
      {
        type: "list",
        items: [
          "**Diegetic sound** exists in the world of the story: dialogue, footsteps, a car radio, a band playing in the room. The characters can hear it.",
          "**Non-diegetic sound** exists only for the audience: the score, a narrator's voice-over, an effect added purely for emphasis. The characters can't hear it.",
        ],
      },
      {
        type: "text",
        body: "The border between the two is a creative playground. A song can start on a character's car radio and swell into the score; music we took for score can turn out to be playing in the scene. When a film deliberately crosses that border, it tells the audience something about whose experience they're inside.",
      },
      {
        type: "example",
        title: "The orchestra in the desert",
        source: "Blazing Saddles (1974), dir. Mel Brooks",
        body: "Sheriff Bart rides across the prairie to lush big-band jazz, which we assume is the score, until he rides past Count Basie and his orchestra playing in the middle of the desert. The joke is a lesson in itself: it only works because we've spent a lifetime accepting non-diegetic music without question. Revealing its source breaks the convention and gets the laugh.",
      },
      {
        type: "example",
        title: "A train instead of a score",
        source: "The Godfather (1972), dir. Francis Ford Coppola",
        body: "In the restaurant where Michael Corleone is about to kill Sollozzo and the police captain McCluskey, there's no music as the tension builds. Instead, as Michael hesitates, the screech of a passing elevated train grows louder and louder, until he finally acts.\n\nThe train is diegetic (it exists in the world), but it's used the way a score would be, voicing the pressure inside Michael's head. Only after the killings does music arrive. Withholding the score lets the sound design do all the emotional work.",
      },
      { type: "heading", text: "Silence is a sound" },
      {
        type: "text",
        body: "Because we're surrounded by sound, its absence is startling. Dropping the soundtrack out, or narrowing it to a single heartbeat or a ringing ear, is one of the strongest forms of emphasis a film has. In *Saving Private Ryan* (1998), when Captain Miller is dazed by an explosion on Omaha Beach, the battle turns muffled and distant, and we experience his shock from the inside.\n\nIn *A Quiet Place* (2018), where making a noise means death, scenes from the perspective of Regan, the deaf daughter played by deaf actor Millicent Simmonds, drop into near-total silence, so we share both her world and its danger.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Earn your silence",
        body: "Silence works by contrast. If your soundtrack is wall-to-wall music and effects, a sudden drop to nothing lands like a scream. If everything is already quiet, silence can't do its job. Plan your loudest and quietest moments together.",
      },
      { type: "heading", text: "Leitmotif: music that remembers" },
      {
        type: "text",
        body: "A **leitmotif** is a short musical idea attached to a character, place or idea, then transformed as the story changes. The technique is most closely associated with Richard Wagner's operas, and you may know a simpler version from Prokofiev's *Peter and the Wolf*, where each character is played by an instrument with a tune of its own. Once the audience has learned a motif, you can play it softly, slowly or in a minor key, and they'll feel a character's change, or their absence, without being told.",
      },
      {
        type: "example",
        title: "Two notes that mean shark",
        source: "Jaws (1975), dir. Steven Spielberg, music by John Williams",
        body: "Williams built the shark's theme on a simple alternating two-note figure in the low strings. Slow and quiet, it's a distant threat; faster and louder, it's the shark closing in. Because the mechanical shark kept malfunctioning and Spielberg could show it only sparingly, the music often *is* the shark.\n\nWhen we hear those two notes, we know it's near, even when the water looks empty, and our own dread does the rest.",
      },
      {
        type: "compare",
        weakLabel: "Music that tells",
        weak: "Every emotional moment gets a swelling score: sad strings when the dog dies, triumphant brass when the hero wins, tense drones whenever anyone opens a door.",
        strongLabel: "Sound that tells a story",
        strong:
          "The hero's late mother gets a simple music-box melody in the first scene. It returns, half-remembered, whenever he thinks of her. At the climax, when he finally forgives his father, there's no score at all, just rain, and then the melody played once, slowly, on a single piano.",
        note: "Wall-to-wall score tells the audience what to feel until it stops working. A motif they've learned and a silence you've saved let them feel it for themselves.",
      },
    ],
    keyTakeaways: [
      "Diegetic sound belongs to the story's world; non-diegetic sound exists only for the audience, and crossing between them is a creative choice.",
      "Sound design can do the emotional work of a score, as the rising train does in *The Godfather*.",
      "Silence is one of the loudest tools you have, but only if you've built the contrast for it to land.",
      "A leitmotif ties music to a character or idea, so later variations carry meaning without a word.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A character switches on her car radio, and the song that's playing carries on over a montage of her driving across the country. What is happening to the sound?",
        options: [
          "It stays non-diegetic throughout, since the audience hears it the whole time",
          "It stays diegetic throughout, because it started on her radio",
          "It begins as diegetic sound in her world and becomes non-diegetic score",
          "It starts as score and turns diegetic once she's on the road",
        ],
        answerIndex: 2,
        explanation:
          "The song starts inside the story, where she can hear it, then carries on over images where it's no longer coming from her radio, working as score. Crossing from diegetic to non-diegetic lets a character's world become the film's mood.",
      },
      {
        id: "q2",
        prompt:
          "In *Reservoir Dogs*, a cheerful pop song plays on the radio while a character tortures a policeman. Why does this make the scene more disturbing rather than less?",
        options: [
          "Its breezy indifference makes the cruelty feel casual, and so more horrifying",
          "The song signals that the scene is a joke, so we can relax into it",
          "The song's fast tempo makes the violence feel frantic and chaotic",
          "Audiences at the time linked seventies pop music with horror films",
        ],
        answerIndex: 0,
        explanation:
          "Music that ignores a scene's emotion, which the theorist Michel Chion called *anempathetic* sound, creates a chilling counterpoint. The song's cheerfulness makes the cruelty feel casual, and the audience fills the gap with horror.",
      },
      {
        id: "q3",
        prompt:
          "Your thriller has constant music and effects from start to finish. You want one moment, a betrayal, to hit hardest. What's the most powerful sound choice?",
        options: [
          "Bring the music up even louder at the betrayal, so nobody can miss it",
          "Hit the moment with a sting, a sudden loud chord, as the truth comes out",
          "Keep the same music as every other scene, so the betrayal takes us by surprise",
          "Drop the soundtrack to near silence at the betrayal",
        ],
        answerIndex: 3,
        explanation:
          "Silence works by contrast. After wall-to-wall sound, sudden emptiness is startling and forces total attention onto the moment. Louder music or a sting has little room to escalate when everything is already loud.",
      },
      {
        id: "q4",
        prompt:
          "A composer gives the hero's lost sister a simple five-note melody early in the film. What's the storytelling advantage?",
        options: [
          "It gives the film a catchy theme for the trailer",
          "Later variations can evoke her, or her absence, without a word",
          "It tells the audience that she's the film's real protagonist",
          "It saves the composer writing new music for later scenes",
        ],
        answerIndex: 1,
        explanation:
          "Once the audience links a motif to a character, the music becomes a memory. Played softly, slowly or in a minor key later on, it lets them feel absence or change instantly.",
      },
    ],
    exercise: {
      prompt:
        "Write a sound plan for your key scene: what the audience hears that's diegetic, what (if anything) is non-diegetic, where the silence falls, and one recurring sound or motif that carries meaning. Then enter the scene in the Shot Planner and compare its sound ideas, shot by shot, with yours.",
      tips: [
        "Start with the world: what does this place sound like when nobody is talking?",
        "Decide where your quietest moment is, and build contrast toward it.",
        "Give one recurring sound or melody a meaning, and change it by the end.",
        "Ask of every music cue: is it telling the audience what to feel, or helping them feel it?",
      ],
      labTool: "shots",
    },
  },
];
