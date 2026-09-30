import type { Lesson } from "@/lib/types";

/**
 * Track 1 — Story Foundations: what makes a story a story.
 * Desire, obstacle, stakes and change; the dramatic question; the hook;
 * and showing instead of telling.
 */
export const foundationsLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. What makes a story a story
  // -------------------------------------------------------------------------
  {
    id: "what-makes-a-story",
    trackId: "foundations",
    title: "What Makes a Story a Story",
    summary:
      "Desire, obstacle, stakes and change: the four timbers every story is built from, and a quick test that separates a story from an anecdote.",
    minutes: 6,
    level: "beginner",
    skills: ["character", "structure", "conflict"],
    blocks: [
      { type: "heading", text: "A situation is not a story" },
      {
        type: "text",
        body: "Most stories that fall flat don't fail because the sentences are clumsy. They fail because they aren't stories at all. They're situations, anecdotes or lists of things that happened in order. A haunted lighthouse is a situation. A keeper who must keep the lamp lit through one last storm, even though the light is what draws the ghosts in, is the start of a story.",
      },
      {
        type: "text",
        body: "Here's a working definition to carry through every lesson that follows: **a story is a character who wants something, meets obstacles in getting it, and is changed by the struggle.** Take away any one of those and the audience's attention starts to drift, even if they couldn't tell you why.",
      },
      {
        type: "list",
        items: [
          "**Desire**: someone wants something specific, badly enough to act.",
          "**Obstacle**: something or someone stands in the way and forces choices.",
          "**Stakes**: something meaningful is lost if they fail.",
          "**Change**: by the end, the character (or their world) is different from how we found them.",
        ],
      },
      {
        type: "compare",
        weakLabel: "Anecdote",
        weak: "Last summer I went to Lisbon. The custard tarts were incredible, the old trams were adorable, and I got sunburned on the last day.",
        strongLabel: "Story",
        strong:
          "Last summer I went to Lisbon to scatter my father's ashes from the tram where he proposed to my mother. Halfway up the hill, the conductor spotted the urn and ordered me off.",
        note: "Same city, same trip. The second version has a want, an obstacle, and a question we suddenly need answered: does she find another way?",
      },
      { type: "heading", text: "Swap “and then” for “but” and “therefore”" },
      {
        type: "text",
        body: "Trey Parker and Matt Stone, the creators of *South Park*, have described a rule of thumb for outlining. If the beats of your story are joined by “and then”, you have a dull sequence of events. They should be joined by “but” or “therefore”, so that each event either complicates the last one or is caused by it. **Causality is what turns a timeline into a plot.**",
      },
      {
        type: "example",
        title: "Rick Blaine sticks his neck out",
        source: "Casablanca (1942), dir. Michael Curtiz",
        body: "Rick runs a nightclub in wartime Casablanca and insists he sticks his neck out for nobody. **Desire:** at first he just wants to be left alone. Then Ilsa, the woman who broke his heart in Paris, walks into his bar, and he wants her back. **Obstacle:** she's married to Victor Laszlo, a Resistance leader who desperately needs the letters of transit Rick happens to be holding.\n\n**Stakes:** Laszlo's freedom, Ilsa's future, and whatever is left of Rick's conscience. **Change:** in the final scene, the man who backed no one puts Ilsa on the plane with her husband and walks off into the fog to rejoin the fight. The plot and the transformation are the same journey. Every obstacle forces Rick to decide who he is.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Sometimes the world changes instead",
        body: "Not every protagonist transforms. Some hold steady and change the people around them, which writers call a *flat arc*. What matters is that something is different at the end. A story that returns everyone to exactly where they started feels like a voyage that never left the harbour.",
      },
      { type: "heading", text: "The four-question test" },
      {
        type: "list",
        ordered: true,
        items: [
          "Who wants what, specifically?",
          "What stands in the way, and does it get harder?",
          "What happens if they fail?",
          "What is different at the end?",
        ],
      },
      {
        type: "exercise-inline",
        prompt:
          "Pick something that happened to you this week. Rewrite it as one sentence: *[someone] wanted [something], but [obstacle], so [what they did], and in the end [what changed].*",
        placeholder: "My neighbour wanted…",
      },
    ],
    keyTakeaways: [
      "A story is a character who wants something, meets obstacles in getting it, and is changed by the struggle.",
      "Situations, settings and anecdotes are raw material. They become stories when someone pursues something at a cost.",
      "Join your beats with *but* and *therefore*, not *and then*. Causality is what makes a plot.",
      "Something must be different at the end, either in the character or in the world around them.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which of these is a story rather than a situation?",
        options: [
          "A retired astronaut lives alone in a farmhouse full of space memorabilia.",
          "A retired astronaut must persuade her estranged son to drive her to one last rocket launch before her eyesight fails for good.",
          "A farmhouse in Kansas is rumoured to be haunted by an astronaut's ghost.",
          "An astronaut's memoir covers forty years of spaceflight history.",
        ],
        answerIndex: 1,
        explanation:
          "Only the second option has a character pursuing something specific (getting to the launch), obstacles (an estranged son, failing eyesight) and built-in stakes (a deadline and a broken relationship). The others are settings, premises or topics: good raw material, but nobody is pursuing anything yet.",
      },
      {
        id: "q2",
        prompt:
          "Your outline reads: “Sam loses his job. And then he goes to his sister's wedding. And then he runs into an old friend.” What's the most useful fix?",
        options: [
          "Add richer description to each scene.",
          "Add more events so the story feels bigger.",
          "Link the beats causally: he loses his job, so he can't afford the trip, but the old friend offers him a ride, which means…",
          "Tell the events in reverse order.",
        ],
        answerIndex: 2,
        explanation:
          "The problem isn't a shortage of detail or incident. The beats simply don't affect each other. Connecting them with *but* and *therefore* makes each event cause or complicate the next, and that chain of cause and effect is what an audience experiences as plot.",
      },
      {
        id: "q3",
        prompt: "Why does Rick's final choice in *Casablanca* land so powerfully?",
        options: [
          "The obstacles have forced him to decide who he really is, and the choice completes that change.",
          "It comes out of nowhere, so it catches the audience off guard.",
          "He finally wins Ilsa back from Laszlo.",
          "It resolves the plot without asking anything of him.",
        ],
        answerIndex: 0,
        explanation:
          "Rick's choice is the end point of his change: the cynic who stuck his neck out for nobody sacrifices what he wants for something larger. It's powerful because the whole story has pressed him toward that decision. It's earned rather than random, and it costs him the thing he wanted most.",
      },
      {
        id: "q4",
        prompt:
          "A friend's story has a clear goal, real obstacles and plenty at risk. But at the end, the character and their world are exactly as they were at the start. Which element is missing?",
        options: ["Desire", "Obstacle", "Stakes", "Change"],
        answerIndex: 3,
        explanation:
          "Without change, the struggle doesn't mean anything. The audience finishes the story wondering why they went on the journey. The change can belong to the protagonist or, in a flat arc, to the people and world around them, but something has to be different at the end.",
      },
    ],
    exercise: {
      prompt:
        "Tell a true story from your own life, about 90 seconds out loud, that passes the four-question test. Then try it on a live listener in the Campfire Story drill.",
      tips: [
        "Open with what you wanted, not with background.",
        "Name one obstacle that got worse before it got better.",
        "End on what changed, whether in you or in the way you see something.",
        "If you catch yourself saying “and then”, try “but” or “so” instead.",
      ],
      practiceScenarioId: "campfire-story",
    },
  },

  // -------------------------------------------------------------------------
  // 2. Desire and the dramatic question
  // -------------------------------------------------------------------------
  {
    id: "desire-and-the-dramatic-question",
    trackId: "foundations",
    title: "Desire & the Dramatic Question",
    summary:
      "Why a specific want is the engine of every story, how it raises the question that keeps an audience watching, and the difference between what a character wants and what they need.",
    minutes: 7,
    level: "beginner",
    skills: ["character", "structure"],
    blocks: [
      { type: "heading", text: "Wants are engines" },
      {
        type: "quote",
        text: "Every character should want something, even if it is only a glass of water.",
        attribution: "Kurt Vonnegut, from his eight rules for writing short stories",
      },
      {
        type: "text",
        body: "The moment a character wants something, the audience starts asking a question: *will they get it?* That question is the story's **central dramatic question**. It's the invisible thread that pulls people through a feature film, a novel or a five-minute wedding toast. When the want goes vague, the thread goes slack.",
      },
      {
        type: "text",
        body: "A strong want has three properties. It's **specific**: you could film the moment it's achieved. It's **active**: the character goes after it rather than waiting for it. And it's **urgent**: there's a reason it has to happen now.",
      },
      {
        type: "compare",
        weak: "Nadia wants to be happy and find herself.",
        strong: "Nadia wants to buy back her grandmother's bakery before the developer who bought it knocks it down on Friday.",
        note: "You can't photograph “happy”. You can photograph a signature on a deed at 4:55 on a Friday afternoon.",
      },
      { type: "heading", text: "The question the ending answers" },
      {
        type: "text",
        body: "Frame your dramatic question as a yes-or-no: *Will Nadia save the bakery?* The climax is the moment it gets answered. If the ending doesn't answer the question the opening raised, audiences feel short-changed, however beautiful the ending is.",
      },
      {
        type: "example",
        title: "Rocky changes the question",
        source: "Rocky (1976), dir. John G. Avildsen",
        body: "Going into the fight, the obvious question is whether an unknown club fighter can beat the heavyweight champion, Apollo Creed. But the night before the bout, Rocky admits to Adrian that he can't win. All he wants is to go the distance: to still be standing at the final bell and prove he isn't just another bum from the neighbourhood.\n\nThat quiet scene swaps the dramatic question for one that is more personal and more answerable. Rocky loses the fight on a split decision, yet the ending plays as a triumph, because the question we care about by then has been answered. Yes, he went the distance.",
      },
      { type: "heading", text: "Want versus need" },
      {
        type: "text",
        body: "The **want** is the goal the character consciously chases. The **need** is what they actually require to be whole, and it's usually something they can't see yet. The richest stories set the two against each other, so that chasing the want and meeting the need pull in opposite directions until the climax forces a choice.",
      },
      {
        type: "example",
        title: "Woody wants his spot back",
        source: "Toy Story (1995), dir. John Lasseter",
        body: "Woody wants to stay Andy's favourite toy, and when shiny new Buzz Lightyear arrives, he wants Buzz gone. What he needs is to let go of being number one and learn to share Andy's love. His scheming against Buzz is exactly what gets them both lost. Only when he starts fighting *for* Buzz instead of against him do the two of them make it back to Andy, just as the family moves house.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Give the want a clock",
        body: "Deadlines turn a want into pressure: a wedding on Saturday, a visa that expires on Friday, a tide that turns at dawn. A ticking clock doesn't only add urgency. It forces the character to make choices faster than they're comfortable with, and that's when their true nature shows.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write your protagonist's **want** as something we could photograph. Then write their **need** as something they would deny if you said it to their face.",
        placeholder: "Want: … / Need: …",
      },
    ],
    keyTakeaways: [
      "A specific, active, urgent want is the engine of a story.",
      "The want raises a yes-or-no dramatic question, and the climax is where it gets answered.",
      "You can change the question partway through, as *Rocky* does, but only deliberately and on screen.",
      "The want is what the character chases; the need is what they must learn. Great stories set the two against each other.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which want will drive a story best?",
        options: [
          "Leo wants to feel more fulfilled at work.",
          "Leo wants his estranged brother to be the best man at his wedding on Saturday.",
          "Leo wants the world to be a kinder place.",
          "Leo wants to understand himself better.",
        ],
        answerIndex: 1,
        explanation:
          "Only the brother-and-wedding want is specific (you could film the moment it happens), active (Leo has to go and get his brother) and urgent (Saturday). The others are real human longings, but they're too abstract to generate scenes. Leave them underneath as the *need*.",
      },
      {
        id: "q2",
        prompt: "In *Rocky*, why does losing the fight still feel like a victory?",
        options: [
          "Because the judges' decision is later revealed to be rigged.",
          "Because the audience never really cared about the fight.",
          "Because Apollo Creed retires, so Rocky wins by default.",
          "Because the film shifted the dramatic question to “can he go the distance?”, and the answer is yes.",
        ],
        answerIndex: 3,
        explanation:
          "The night before the fight, Rocky tells Adrian he only wants to go the distance. That scene resets the question the audience is tracking. When he's still standing at the final bell, the story's real question has been answered, so the lost decision barely matters.",
      },
      {
        id: "q3",
        prompt: "What's the difference between a character's want and their need?",
        options: [
          "The want is what they consciously pursue; the need is what they actually require, often without realising it.",
          "The want is a minor subplot; the need is the main plot.",
          "They're the same thing described from different points of view.",
          "The need only matters in comedies.",
        ],
        answerIndex: 0,
        explanation:
          "The want drives the plot; the need drives the character's change. Woody *wants* to stay top toy and *needs* to learn to share Andy's love. The tension between the two is what makes his climax an emotional turning point as well as an action scene.",
      },
      {
        id: "q4",
        prompt:
          "Your screenplay opens by asking “Will Mara win custody of her daughter?” but ends with Mara forgiving her own mother. The custody hearing is never resolved. How is the audience likely to react?",
        options: [
          "With delight, because the twist is unexpected.",
          "With satisfaction, because forgiveness matters more than custody.",
          "With frustration, because the question the story promised to answer was abandoned.",
          "They won't react at all, because audiences don't track dramatic questions.",
        ],
        answerIndex: 2,
        explanation:
          "Audiences hold on to the question the opening raises. You can swap it for a deeper one, as *Rocky* does, but you have to make the switch on screen so the audience starts tracking the new question. Otherwise the ending feels like it belongs to a different film.",
      },
    ],
    exercise: {
      prompt:
        "Write a logline for a story you want to tell. Make the protagonist's want specific enough to photograph and give it a deadline. Run it through the Logline Doctor, then defend it in the Logline Gauntlet.",
      tips: [
        "Swap abstract verbs (find, learn, discover) for concrete ones (win, steal, deliver, escape).",
        "Add a clock: a date, an event or a countdown.",
        "Hint at the need underneath. What will chasing this goal force them to confront?",
      ],
      practiceScenarioId: "logline-gauntlet",
      labTool: "logline",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Conflict and stakes
  // -------------------------------------------------------------------------
  {
    id: "conflict-and-stakes",
    trackId: "foundations",
    title: "Conflict & Stakes",
    summary:
      "Why obstacles are the story, how to make stakes personal rather than abstract, and how to escalate pressure so each problem is worse than the last.",
    minutes: 7,
    level: "intermediate",
    skills: ["conflict", "character"],
    blocks: [
      { type: "heading", text: "Conflict is the gap" },
      {
        type: "text",
        body: "Conflict doesn't mean shouting or explosions. It's the gap between what a character wants and what the world gives them. Every time they reach for their goal and something pushes back, we learn who they are, because **character is revealed by the choices people make under pressure**, not the ones they make when things are easy.",
      },
      {
        type: "text",
        body: "Opposition comes in three layers, and the strongest stories use more than one at once:",
      },
      {
        type: "list",
        items: [
          "**Inner**: a fear, a flaw, a belief or a competing desire inside the character.",
          "**Personal**: a rival, a lover, a parent or a friend who wants something different.",
          "**Wider world**: institutions, nature, society, or time itself.",
        ],
      },
      { type: "heading", text: "Stakes answer “so what?”" },
      {
        type: "text",
        body: "Stakes are what the character loses if they fail. New writers often reach for the biggest stakes available (the world will end, the city will fall) and then find the audience strangely unmoved. Abstract catastrophe is hard to feel. A specific person losing a specific thing they love is not.",
      },
      {
        type: "compare",
        weakLabel: "Abstract stakes",
        weak: "If Dana can't stop the hack, the global banking system will collapse.",
        strongLabel: "Personal stakes",
        strong:
          "If Dana can't stop the hack, the bank forecloses on her mother's house, the one with her late brother's height marks still pencilled on the kitchen doorframe.",
        note: "The second version is smaller in scale and hits much harder. Big stakes work best when they're anchored to something personal.",
      },
      {
        type: "example",
        title: "The shark keeps getting closer to home",
        source: "Jaws (1975), dir. Steven Spielberg",
        body: "Police chief Martin Brody is new to Amity Island and afraid of the water. The mayor refuses to close the beaches because the summer tourist trade depends on them. Watch how the film tightens the screws. First a stranger dies at night. Then a boy is killed in broad daylight on a crowded beach. Then, on the Fourth of July, the shark swims into the estuary where Brody's own son is out on the water.\n\nFinally the story strands Brody on a small boat far out at sea with a shark hunter and an oceanographer. The man who fears the water has to face the thing living in it. Each attack moves the threat closer to Brody personally, so the stakes keep rising even though the monster never changes.",
      },
      { type: "heading", text: "Escalate, don't repeat" },
      {
        type: "text",
        body: "Stakes should climb. If the second obstacle is the same size as the first, the story plateaus. A useful habit: after every setback, ask what the character now stands to lose that they didn't before. Pressure can rise by getting **bigger**, getting **closer to home**, or getting **more costly** to overcome.",
      },
      {
        type: "quote",
        text: "Coincidences to get characters into trouble are great; coincidences to get them out of it are cheating.",
        attribution: "Emma Coats, former Pixar story artist, from her list of story basics",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Make the choice cost something",
        body: "The best obstacles don't just block the character. They force a dilemma between two things the character values. Keep the job or make the recital? Tell the truth or protect a friend? When every option costs something, the audience leans in to see what they'll sacrifice.",
      },
      {
        type: "exercise-inline",
        prompt:
          "List three things your protagonist stands to lose: something material, a relationship, and their sense of who they are. Which one is most personal? Make that one the headline.",
        placeholder: "Material: … / Relationship: … / Identity: …",
      },
    ],
    keyTakeaways: [
      "Conflict is the gap between what a character wants and what the world gives them.",
      "Personal, specific stakes move audiences more than abstract catastrophe.",
      "Escalate pressure by making each obstacle bigger, closer to home, or more costly.",
      "Coincidence can get characters into trouble, but never out of it.",
      "The strongest obstacles force a choice between two things the character values.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which stakes are most likely to make an audience care?",
        options: [
          "A retired jockey will lose the horse he raised from a foal if he can't pay the stable fees by Sunday.",
          "An asteroid will destroy an unnamed city.",
          "A multinational company will miss its quarterly target.",
          "Civilisation as we know it will end.",
        ],
        answerIndex: 0,
        explanation:
          "The jockey's stakes are specific (this horse), personal (he raised it) and on a clock (Sunday). The bigger options are abstract: no one we know loses anything we can picture, so there's nothing for our empathy to hold on to.",
      },
      {
        id: "q2",
        prompt: "How does *Jaws* keep the stakes rising even though the shark itself never changes?",
        options: [
          "It introduces a second, bigger shark in the final act.",
          "It moves each attack closer to Brody personally, until he has to face the water himself.",
          "It reveals that the mayor has been secretly protecting the shark.",
          "It simply increases the number of victims in every scene.",
        ],
        answerIndex: 1,
        explanation:
          "The escalation is about proximity. It goes from a stranger, to a child on a crowded beach, to Brody's own son, to Brody himself out at sea. The threat stays the same size, but its cost to the protagonist keeps growing.",
      },
      {
        id: "q3",
        prompt:
          "Your hero escapes a locked cellar because a stranger happens to wander past with exactly the key she needs. What's the problem?",
        options: [
          "Strangers should never appear in the third act.",
          "Keys are a cliché.",
          "The scene is too short.",
          "Coincidence got her out of trouble, which deflates the tension and robs her of a choice.",
        ],
        answerIndex: 3,
        explanation:
          "Luck that rescues a character tells the audience that effort and choice don't matter. Coincidence can start a story, but escapes have to be earned through the character's own action, ingenuity or sacrifice.",
      },
      {
        id: "q4",
        prompt: "Which obstacle creates the strongest dramatic pressure?",
        options: [
          "A locked door between her and the courthouse.",
          "A rainstorm that delays her trip.",
          "A choice between testifying against her brother and letting an innocent man go to prison.",
          "A long walk to the courthouse.",
        ],
        answerIndex: 2,
        explanation:
          "The other obstacles are external inconveniences. The testimony forces a dilemma between two things she values, family loyalty and justice, so whatever she chooses will cost her, and her choice reveals who she is.",
      },
    ],
    exercise: {
      prompt:
        "Take a story you're developing (a film, a talk, the origin of a company or project) and write one paragraph where the stakes are personal: a named person losing a specific thing. Then test it under pressure in the Founder Story drill, where a sceptical investor keeps asking “so what?”",
      tips: [
        "Anchor any big-picture stakes to one person we can picture.",
        "Show escalation: what got worse after the first failure?",
        "Say what it cost *you*, not just what it cost the market.",
      ],
      practiceScenarioId: "founder-story",
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 4. The hook
  // -------------------------------------------------------------------------
  {
    id: "the-hook",
    trackId: "foundations",
    title: "The Hook: Openings That Raise Questions",
    summary:
      "How great openings plant a question the audience needs answered, whether through mystery, in medias res or the promise of the premise, and how to hook a room with your first sentence.",
    minutes: 7,
    level: "intermediate",
    skills: ["hook", "pacing"],
    blocks: [
      { type: "heading", text: "A hook is a question, not a noise" },
      {
        type: "text",
        body: "Explosions and screams aren't hooks. A hook is **an unanswered question the audience wants answered** badly enough to keep watching. The question can be loud (*who killed her?*) or barely a whisper (*why is he setting the table for two?*), but it has to be there, and it has to arrive early.",
      },
      {
        type: "list",
        items: [
          "**Mystery**: something has happened and we don't know why. *What happened here?*",
          "**Suspense**: we see a danger the character doesn't. *Will they notice in time?*",
          "**Incongruity**: two things that don't belong together. *How can that be?*",
          "**In medias res**: we drop into the middle of the action. *How did we get here?*",
          "**A character in trouble**: someone we care about has a problem. *How will they get out of it?*",
        ],
      },
      {
        type: "quote",
        text: "It was a bright cold day in April, and the clocks were striking thirteen.",
        attribution: "George Orwell, the opening line of *Nineteen Eighty-Four* (1949)",
      },
      {
        type: "text",
        body: "Look how little Orwell needs. Nearly the whole sentence is ordinary, and then the last word is wrong. Clocks don't strike thirteen, so what kind of world is this? That's incongruity: a familiar picture with one detail knocked out of true.",
      },
      { type: "heading", text: "Start in the middle of things" },
      {
        type: "text",
        body: "The Roman poet Horace praised Homer for rushing his audience *in medias res*, into the middle of things, instead of starting at the very beginning. The *Odyssey* doesn't open with the fall of Troy. It opens nearly ten years later, with Odysseus stranded on Calypso's island and his son facing a houseful of suitors back home. The Cyclops, Circe and the Sirens come later, told in flashback by Odysseus himself.",
      },
      {
        type: "example",
        title: "An opening that makes a promise",
        source: "Raiders of the Lost Ark (1981), dir. Steven Spielberg",
        body: "We meet Indiana Jones mid-expedition in a South American jungle, already deep inside a booby-trapped temple. Within minutes we learn he's brilliant, brave, a little reckless and not above a gamble: he swaps the golden idol for a bag of sand and very nearly gets away with it. Then the temple collapses, a giant boulder chases him out, and his rival Belloq takes the idol anyway.\n\nThe idol has nothing to do with the Ark. The sequence's job is to make a promise: *this is the kind of ride you're on.* It even plants Indy's fear of snakes, which the film pays off later in a tomb crawling with them.",
      },
      {
        type: "compare",
        weakLabel: "Flat opening",
        weak: "INT. APARTMENT – MORNING. Sarah, 30s, wakes up, stretches and makes coffee. She looks out of the window. It's a beautiful day.",
        strongLabel: "Hooked opening",
        strong:
          "INT. APARTMENT – MORNING. Sarah makes coffee and sets out two mugs. She stops. Looks at the second mug for a long moment, then puts it back in the cupboard.",
        note: "Nothing louder happens in the second version, but now we're asking a question: who used to drink from that mug?",
      },
      { type: "heading", text: "The promise of the premise" },
      {
        type: "text",
        body: "Screenwriter Blake Snyder called it *the promise of the premise*: the scenes an audience bought a ticket to see. Your opening signs a contract about genre, tone and the kind of questions this story will ask. Open a romantic comedy with ten minutes of grim police procedural and the audience won't know which contract they've signed.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Hooking a room, not just a screen",
        body: "The same rules apply when you tell a story out loud or open a pitch. Skip the preamble (*so, um, this is a story about…*) and start with the moment: a place, a time, a problem. *At 3am on my wedding night, I was standing in a hospital car park in my dress.* You can fill in the context once they're leaning in.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write three different first lines for a story you're working on: one built on **mystery**, one that drops us **in medias res**, and one built on **incongruity**. Which one makes you most want to read the second line?",
        placeholder: "1. Mystery: …\n2. In medias res: …\n3. Incongruity: …",
      },
    ],
    keyTakeaways: [
      "A hook is an unanswered question the audience needs answered. It can be loud or quiet, but it must come early.",
      "Mystery, suspense, incongruity, in medias res and a character in trouble are all reliable ways to raise that question.",
      "Your opening makes a promise about genre and tone, and the rest of the story has to keep it.",
      "When you're telling a story aloud, skip the preamble and start with the moment.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What makes “the clocks were striking thirteen” such an effective opening?",
        options: [
          "It gives a precise time, and precise times are always interesting.",
          "An ordinary scene is knocked out of true by one wrong detail, which raises a question about the world.",
          "It introduces the protagonist by name.",
          "It opens on a burst of action.",
        ],
        answerIndex: 1,
        explanation:
          "The line is built on incongruity. A bright, cold April day is perfectly normal, and clocks striking thirteen is not. That single wrong note makes us ask what kind of world this is, and we keep reading to find out.",
      },
      {
        id: "q2",
        prompt:
          "*Raiders of the Lost Ark* opens with a temple sequence that has nothing to do with the Ark. Why does it work?",
        options: [
          "It establishes the hero's character and makes a clear promise about the kind of adventure to come.",
          "Audiences need ten minutes to settle before the real story begins.",
          "It explains the history of the Ark.",
          "It introduces the romantic subplot.",
        ],
        answerIndex: 0,
        explanation:
          "The prologue is a mini-movie that shows us who Indy is (resourceful, daring, fallible) and exactly what kind of ride this film will be. It even plants a fear that pays off later. An opening doesn't have to start the main plot, but it does have to make a promise the film keeps.",
      },
      {
        id: "q3",
        prompt: "Which opening line for a spoken story makes the best use of in medias res?",
        options: [
          "I've always been interested in how families handle grief.",
          "Let me give you a bit of background on my grandmother first.",
          "This is a story about my grandmother, who was a remarkable woman.",
          "The hearse had already pulled away when I realised we'd buried Grandma with my car keys.",
        ],
        answerIndex: 3,
        explanation:
          "The last line drops us into the middle of a situation that's already in motion and raises immediate questions: how did the keys get there, and what now? The other lines are preamble. They delay the story instead of starting it.",
      },
      {
        id: "q4",
        prompt:
          "You're writing a quiet family drama, and your draft opens with a car chase to grab attention. What's the risk?",
        options: [
          "There's no risk, because louder openings always work better.",
          "Car chases are too expensive to shoot.",
          "The opening promises a different genre, so the audience settles in for the wrong story and feels misled.",
          "The audience will learn the dramatic question too early.",
        ],
        answerIndex: 2,
        explanation:
          "An opening is a contract. A car chase promises an action film, and when the quiet drama arrives, the audience feels the bait-and-switch. Hook them with a question that fits the story you're actually telling.",
      },
    ],
    exercise: {
      prompt:
        "Draft the opening sentence of a pitch for a story or project, one that raises a question in the listener's mind. Sharpen the premise in the Logline Doctor, then practise delivering it against the clock in the Elevator Pitch drill.",
      tips: [
        "Start with a moment (a place, a time, a problem), not with background.",
        "Test your first line: does it make the listener ask a question?",
        "Match the hook's tone to the story's genre so your opening makes the right promise.",
      ],
      practiceScenarioId: "elevator-pitch",
      labTool: "logline",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Show, don't tell
  // -------------------------------------------------------------------------
  {
    id: "show-dont-tell",
    trackId: "foundations",
    title: "Show, Don't Tell: The Power of Specificity",
    summary:
      "Trade verdicts for evidence. How behaviour, objects and precise details let an audience feel what you never say, and when telling is actually the right call.",
    minutes: 8,
    level: "advanced",
    skills: ["visual", "character"],
    blocks: [
      { type: "heading", text: "Evidence, not verdicts" },
      {
        type: "text",
        body: "*She was nervous.* That sentence hands the audience a verdict. *She straightened the forks for the third time before the doorbell rang* hands them evidence and lets them reach the verdict themselves. That small act of inference is where engagement lives. When an audience works something out, they feel it instead of merely being told it.",
      },
      {
        type: "compare",
        weakLabel: "Telling",
        weak: "Marcus was a lonely man who had never got over his wife's death.",
        strongLabel: "Showing",
        strong:
          "Every Sunday Marcus buys two tickets for the matinee. He takes the aisle seat and lays his coat across the one beside him, so that no one sits there.",
        note: "The first tells us what to feel. The second lets us discover it, and the discovery is what hurts.",
      },
      {
        type: "example",
        title: "A whole marriage, almost without words",
        source: "Up (2009), dir. Pete Docter",
        body: "Early in *Up*, a montage traces Carl and Ellie's life together: their wedding, fixing up their house, lying in the grass picking out shapes in the clouds. There's almost no dialogue, just Michael Giacchino's score. They save for a trip to Paradise Falls in a jar, and we watch that jar get broken open again and again for life's emergencies.\n\nOne scene in a doctor's office tells us they will never have children, without a word of explanation. By the time Carl finally buys the tickets and Ellie falls ill, we've been shown an entire marriage, and felt its loss, through images alone.",
      },
      { type: "heading", text: "Specificity is credibility" },
      {
        type: "text",
        body: "Generic details slide off the mind. Specific ones stick, because they sound like things that really happened. *A dog* is furniture; *a three-legged greyhound named Pastor* is a character with a history. The best details do double duty: they paint the picture *and* imply something about the person in it, such as their class, their era or their wounds.",
      },
      { type: "heading", text: "Five ways to show" },
      {
        type: "list",
        items: [
          "**Behaviour under pressure**: what someone does when it costs them tells us more than any description.",
          "**Objects with history**: a cracked phone screen, a wedding ring worn on a chain, a trophy used as a doorstop.",
          "**Choices**: two options, one decision. The choice *is* the characterisation.",
          "**Contradiction**: the gap between what someone says and what they do.",
          "**Environment**: a room, a car or a desk is a portrait of its owner.",
        ],
      },
      {
        type: "callout",
        tone: "insight",
        title: "The iceberg",
        body: "In *Death in the Afternoon*, Ernest Hemingway compared good prose to an iceberg, which moves with dignity because only an eighth of it shows above the water. His point was that if a writer truly knows what they're leaving out, they can omit it and the reader will still feel it. Showing works the same way: the emotion lives under the surface of the action.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "The glint on broken glass",
        body: "A popular line attributed to Chekhov, *don't tell me the moon is shining; show me the glint of light on broken glass*, isn't something he actually wrote. It paraphrases an 1886 letter to his brother Alexander, suggesting that a moonlit night could be conveyed by a shard of broken bottle glittering on a mill dam. The advice holds up: one sharp, concrete detail beats a paragraph of adjectives.",
      },
      { type: "heading", text: "When telling is the right call" },
      {
        type: "text",
        body: "Showing everything is exhausting. If a character drives across town, you don't need every traffic light; *she drove to the hospital* is fine. Tell to compress what's unimportant and show to expand the moments that matter. A handy rule: **summarise the journey, dramatise the turning points.**",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Don't show it and then tell it",
        body: "A common habit in drafts is to write a perfect visual moment, like a clenched jaw or a slammed door, and then add a line that explains it: *I'm so angry right now.* Trust the image. If you've shown it, cut the explanation.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Rewrite this told sentence as a shown moment in three sentences or fewer, without using the words *ambitious* or *trust*: “Priya was ambitious and didn't trust anyone.”",
        placeholder: "Priya…",
      },
    ],
    keyTakeaways: [
      "Telling hands the audience a verdict; showing hands them evidence and lets them feel the conclusion for themselves.",
      "Specific details are more believable and more revealing than generic ones, so make them do double duty.",
      "Behaviour, objects, choices, contradictions and environments all reveal character without explaining it.",
      "Tell to compress the unimportant and show to dramatise what matters, and never show something only to explain it afterwards.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which line *shows* that a character is grieving?",
        options: [
          "Tom felt a deep, crushing sadness.",
          "Tom was grieving, and it was hard on everyone.",
          "Everyone could tell Tom was very sad.",
          "Tom still hasn't changed the voicemail greeting on his late wife's phone. Some nights he calls it twice.",
        ],
        answerIndex: 3,
        explanation:
          "The first three options name the emotion. The last one gives us a specific, private behaviour and trusts us to understand why he does it. Working it out ourselves is what makes it land.",
      },
      {
        id: "q2",
        prompt: "What does the doctor's office scene in *Up* demonstrate?",
        options: [
          "A key emotional fact can land harder through image and performance than through explanation.",
          "Animation can't handle scenes that rely on dialogue.",
          "Montages should always be set to music.",
          "Exposition should be delivered by authority figures.",
        ],
        answerIndex: 0,
        explanation:
          "The film never states that Carl and Ellie can't have children. It shows us their faces and lets us understand. Because the audience fills in the meaning, the loss feels personal, which is exactly what explanation tends to flatten.",
      },
      {
        id: "q3",
        prompt:
          "Your character drives from her office to her mother's house, where they have the confrontation the whole story has been building to. How should you handle it?",
        options: [
          "Show every moment of the drive to build realism.",
          "Summarise the confrontation so the drive has more room.",
          "Tell the drive in a line and dramatise the confrontation moment by moment.",
          "Cut the confrontation and let the audience imagine it.",
        ],
        answerIndex: 2,
        explanation:
          "Summarise the journey, dramatise the turning points. The drive is connective tissue and a sentence will do. The confrontation is the payoff the audience has been waiting for, so give it full scene treatment.",
      },
      {
        id: "q4",
        prompt: "Which detail does the most work?",
        options: [
          "She lived in a nice apartment.",
          "Her bookshelves were empty except for a framed rejection letter from a drama school.",
          "Her apartment had a lot of furniture.",
          "Her apartment was modern and clean.",
        ],
        answerIndex: 1,
        explanation:
          "The framed rejection letter paints a picture and implies a history (a dream, a failure) and a psychology (she keeps it on display). The other details are generic and could belong to anyone.",
      },
      {
        id: "q5",
        prompt:
          "After an argument, a father silently mends his daughter's broken bike. Then he says, “I just want you to know I love you.” What's the best note?",
        options: [
          "Cut the line. The action already says it, and explaining it weakens it.",
          "Add more lines so the feeling is crystal clear.",
          "Move the line to the start so the audience knows what the scene means.",
          "Keep it, because audiences miss visual cues.",
        ],
        answerIndex: 0,
        explanation:
          "Mending the bike *is* the declaration of love, and it's more moving because he can't say it. Adding the line explains what we've already felt. That's showing and then telling, and it drains the moment.",
      },
    ],
    exercise: {
      prompt:
        "Write a short scene (150–250 words) where a character feels a strong emotion, such as grief, envy, shame or joy, that is never named by them or by the narration. Then paste it into the Shot Planner to see how the camera could carry the feeling.",
      tips: [
        "Choose one telling object and let it do the heavy lifting.",
        "Give the character something physical to do while the feeling leaks out.",
        "Read it back and cut any line that explains what the action already shows.",
      ],
      practiceScenarioId: "subtext-sparring",
      labTool: "shots",
    },
  },
];
