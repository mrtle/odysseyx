import type { Lesson } from "@/lib/types";

/**
 * Track 7 — Pitch & Delivery: telling it out loud.
 * The logline, the elevator pitch and comps, the pitch meeting, oral
 * storytelling craft, and storytelling beyond film (founder stories, brands
 * and talks).
 */
export const pitchDeliveryLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. The logline
  // -------------------------------------------------------------------------
  {
    id: "the-logline",
    trackId: "pitch-delivery",
    title: "The Logline: Your Story in One Sentence",
    summary:
      "Protagonist, goal, obstacle, stakes and the ironic twist that makes a listener lean in: how to build a logline that sells your story, and the mistakes that sink most of them.",
    minutes: 8,
    level: "beginner",
    skills: ["hook", "conflict", "character"],
    blocks: [
      { type: "heading", text: "One sentence that has to do everything" },
      {
        type: "text",
        body: "A logline is your whole story compressed into a single sentence, usually around 25 to 35 words, that makes someone want to read the script, hear the pitch or watch the film. It's the first thing a manager or producer will ask for and a standard field on screenwriting-competition entry forms. Often it's the only thing a busy reader sees before deciding whether to see more.\n\nThat makes it a sales tool, but it's also a diagnostic. If you can't write your logline, the problem is rarely the sentence. It usually means you don't yet know who the story is about, what they want or what stands in their way.",
      },
      {
        type: "beats",
        title: "The anatomy of a logline",
        beats: [
          {
            name: "Protagonist",
            description: "A role plus one telling trait: *a burned-out paramedic*, not a name the listener has never heard.",
          },
          {
            name: "Inciting incident",
            description: "The event that knocks their life off course and sets the story moving.",
          },
          {
            name: "Goal",
            description: "What they must do. Concrete and visible: something you could photograph.",
          },
          {
            name: "Obstacle",
            description: "The antagonist or opposing force, described as specifically as the hero.",
          },
          {
            name: "Stakes",
            description: "What they lose if they fail. Personal cost beats “the world will end”.",
          },
        ],
      },
      {
        type: "compare",
        weakLabel: "Parts missing",
        weak: "A young woman moves to the big city, and her life changes forever when she meets a mysterious stranger.",
        strongLabel: "All five parts",
        strong:
          "A small-town nurse working nights in Manhattan to pay for her father's surgery sees the hospital's star surgeon commit a murder, and must expose him before he destroys her career and her father's last chance.",
        note: "The first version has no goal, no obstacle and no stakes, and *her life changes forever* could describe almost any film ever made. The second gives us all five: a person, the incident that traps her, a goal, an antagonist and stakes we feel instantly, because the man she has to expose holds the job her father's life depends on.",
      },
      { type: "heading", text: "Irony: the twist that makes people lean in" },
      {
        type: "text",
        body: "Put those five parts in a sentence and you have a serviceable logline. What turns a serviceable logline into one people repeat at dinner is **irony**: a built-in contradiction between the hero and the situation. Blake Snyder, author of *Save the Cat!*, argued that a great logline needs irony and a compelling mental picture, so that a whole movie starts playing in the listener's head.",
      },
      {
        type: "example",
        title: "The police chief who's terrified of the water",
        source: "Jaws (1975), dir. Steven Spielberg",
        body: "Try it on *Jaws*: when a great white starts killing swimmers off his island town, a police chief who's terrified of the water must hunt it down, while the mayor insists the beaches stay open. Every part is there. The hero has a telling trait, the goal is concrete, the opposition comes from the sea and from his own town hall, and the stakes are lives on a crowded summer beach.\n\nThe irony does the heavy lifting. Of all the people who could end up at sea chasing a shark, the story picks the man who is afraid of the water. You can sense the climax before you've seen a frame: the hero forced into the one place he least wants to be.",
      },
      {
        type: "list",
        items: [
          "**The worst person for the job.** A police chief who's terrified of the water must go to sea after a shark (*Jaws*).",
          "**A situation that attacks the hero's defining trait.** A lawyer who lies as easily as he breathes is magically unable to lie for a single day, right in the middle of a big case (*Liar Liar*).",
          "**A goal that fights itself.** A teenager stranded thirty years in the past must get his parents to fall in love, which is tricky now that his teenage mother has fallen for him (*Back to the Future*).",
        ],
      },
      { type: "heading", text: "Seven mistakes that sink loglines" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Theme instead of story.** *A film about grief, forgiveness and the courage to love again* tells us what it means, not what happens. Lead with events; the themes will come through them.",
          "**Names instead of roles.** *Jake must stop Marcus before it's too late* means nothing to someone who has never met Jake. *A disgraced bomb-disposal expert* means something straight away.",
          "**A passive protagonist.** *Gets caught up in* and *finds her life turned upside down* describe weather, not a hero. Give them an active verb: find, steal, win, escape, convince.",
          "**Vague stakes.** *Everything changes* and *nothing will ever be the same* are placeholders. Say what, specifically, is lost.",
          "**Plot overload.** Subplots, backstory and three twists in one breath. If it needs a semicolon, it's probably a synopsis.",
          "**Giving away the ending.** A logline poses the question. The script gets to answer it.",
          "**Borrowed clichés.** *In a world where*, *against all odds*, *a journey of self-discovery*: phrases so familiar the ear skips right over them.",
        ],
      },
      {
        type: "compare",
        weakLabel: "Names and themes",
        weak: "When Daniel's past catches up with him, he must confront his demons and learn what it truly means to be a father before it's too late.",
        strongLabel: "Roles and events",
        strong:
          "A getaway driver who quit crime for his daughter's sake is blackmailed into one last job: driving the crew that plans to rob the bank where she works.",
        note: "Every phrase in the first version could belong to a hundred films. The second gives us a role with a history, a trap, and irony that points straight at the climax: the one job that could cost him the person he quit for.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Say it out loud, in one breath",
        body: "A logline is spoken far more often than it's read, so test it with your voice. If you run out of air, it's too long. If you stumble, the syntax is too tangled. If your listener's first response is *wait, who?*, the protagonist needs a sharper descriptor. The best test of all: tell it to a friend, and a day later ask them to tell it back to you.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Write the logline first",
        body: "Many writers only attempt a logline once the script is finished, which is exactly when it's hardest to write. Try it the other way round. A logline drafted before you outline is a cheap way to find out whether the idea has a protagonist, a goal and an engine, and it becomes a compass you can check every draft against.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Draft a logline with the frame *When [inciting incident], a [trait + role] must [goal] before [stakes].* Then name the irony in a few words underneath. If you can't find any, try changing the protagonist rather than the plot.",
        placeholder: "When …, a … must … before …\nThe irony: …",
      },
    ],
    keyTakeaways: [
      "A logline names a specific protagonist, the incident that sets them moving, a concrete goal, the obstacle in their way and what they stand to lose, ideally in 35 words or fewer.",
      "Irony, whether the least suitable hero or a situation that attacks their defining trait, is what makes a logline memorable and repeatable.",
      "Describe characters by role and trait rather than name, and describe events rather than themes.",
      "Vague stakes, passive verbs and borrowed clichés are placeholders: replace each one with something specific.",
      "If you can't write the logline, the story needs work. Use it as a diagnostic, not just a sales tool.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What's missing from this logline? *An ambitious young chef opens a restaurant in her late grandmother's bakery.*",
        options: [
          "A protagonist",
          "A setting",
          "An obstacle and stakes",
          "A descriptive trait for the hero",
        ],
        answerIndex: 2,
        explanation:
          "We have a hero with a trait (*ambitious young chef*), a setting and even a hint of a goal. But nothing stands in her way and nothing is at risk, so there's no story engine yet. Add a force that opposes her (a rival, a debt, a family feud over the building) and a cost of failure, and it starts to become a film.",
      },
      {
        id: "q2",
        prompt: "Which revision adds the most irony to *A doctor must survive a deadly outbreak in a remote village*?",
        options: [
          "A germophobic dermatologist on a wellness retreat becomes a remote village's only doctor when a deadly outbreak hits.",
          "A world-famous doctor with a Nobel Prize must survive a deadly and truly terrifying outbreak in a remote village.",
          "A brilliant but reckless doctor, haunted by the patient she lost, must survive a deadly outbreak in a remote mountain village.",
          "In a world where disease runs rampant, one doctor must survive a deadly outbreak against all odds.",
        ],
        answerIndex: 0,
        explanation:
          "Irony puts the least suitable person in the situation that tests them hardest. A germ-phobic skin specialist on holiday is almost comically wrong for an epidemic, which instantly suggests conflict, comedy or dread. Extra adjectives (*world-famous*, *truly terrifying*) add volume but no contradiction, a haunted past adds depth but not irony, and *in a world where* and *against all odds* are clichés.",
      },
      {
        id: "q3",
        prompt: "Why do loglines usually describe the protagonist by role and trait (*a disgraced bomb-disposal expert*) rather than by name?",
        options: [
          "Character names are saved for the title page and the synopsis, where there's room to introduce them.",
          "Industry style guides treat a named character in a logline as the mark of an amateur.",
          "Names often change in development, so a role keeps the logline accurate through rewrites.",
          "A name tells a stranger nothing; a role and a trait suggest who this person is.",
        ],
        answerIndex: 3,
        explanation:
          "There's no rule or style guide against names, and rewrites aren't the reason: a name is empty to someone who hasn't read the script. *A disgraced bomb-disposal expert* carries a history, a skill set and a wound in four words, and it hints at the conflict to come. That's precious information in a sentence with no room to spare.",
      },
      {
        id: "q4",
        prompt: "A writer's logline reads: *A story about loss, memory and the healing power of music.* What's the most useful note?",
        options: [
          "Add a comp, such as *Whiplash* meets *Manchester by the Sea*, so readers know the genre and tone.",
          "It names themes, not events. Say who wants what, what's in the way and what's at risk.",
          "Turn it into a question the audience will want answered: *Can music heal a broken heart?*",
          "Add the main character's name and age, so readers know whose story it is.",
        ],
        answerIndex: 1,
        explanation:
          "Themes are what a story means; a logline has to say what happens, and the themes will emerge from that. *A grieving concert pianist who hasn't touched a piano since his wife's death must play at her memorial concert, or the music school she founded will close* lets the audience discover loss, memory and music for themselves. Comps, rhetorical questions and names can't fix a logline with no events in it.",
      },
      {
        id: "q5",
        prompt: "Your logline ends *…and in the end, she learns that family was what mattered all along.* Why cut that clause?",
        options: [
          "Loglines should stop at the inciting incident; everything after it belongs in the synopsis.",
          "Emotional arcs belong in the pitch meeting, where there's time to make them land.",
          "It makes the logline too long, since loglines have a strict limit of twenty-five words.",
          "It gives away the ending and swaps a live question for a stated moral.",
        ],
        answerIndex: 3,
        explanation:
          "A logline's job is to plant a dramatic question, not answer it. Announcing the lesson she learns closes the question and replaces story with a moral, the least compelling way to end any sentence. The problem isn't word count or where emotion belongs: stop at the stakes and let the listener ask *so what happens?*",
      },
    ],
    exercise: {
      prompt:
        "Write a logline for a story you want to tell and run it through the Logline Doctor to score its six vital signs. Once it holds up, take it into the Logline Gauntlet and defend it out loud while a literary manager makes you tighten it, round after round.",
      tips: [
        "Start from the frame *When [incident], a [trait + role] must [goal] before [stakes]*, then rewrite until it sounds like speech rather than a form.",
        "Hunt for the irony. If your hero is well suited to the challenge, try the least suitable person instead.",
        "Cut every adjective that doesn't change the picture in the listener's head.",
        "Aim for 35 words or fewer, and make sure you can say it in one breath.",
      ],
      practiceScenarioId: "logline-gauntlet",
      labTool: "logline",
    },
  },

  // -------------------------------------------------------------------------
  // 2. The elevator pitch & comps
  // -------------------------------------------------------------------------
  {
    id: "elevator-pitch-and-comps",
    trackId: "pitch-delivery",
    title: "The Elevator Pitch & the Art of the Comp",
    summary:
      "Sixty seconds, one listener, one goal: earning the next conversation. Lead with the hook, frame it with comparisons that actually help, and close with an ask that's easy to say yes to.",
    minutes: 7,
    level: "beginner",
    skills: ["hook", "delivery"],
    blocks: [
      { type: "heading", text: "You're not selling the film. You're selling the next meeting." },
      {
        type: "text",
        body: "The elevator pitch takes its name from a familiar fantasy: you step into a lift and there's the producer you've always wanted to work with, and you have until their floor. In real life the same sixty seconds happen at festival parties, in coffee queues, after panels and at the end of meetings, whenever someone says *so, what are you working on?*\n\nThe classic mistake is trying to tell the whole story. You can't, and you shouldn't. An elevator pitch has exactly one job: to make the listener want more. Success looks like a follow-up question, a business card or the words *send it to me*.",
      },
      {
        type: "beats",
        title: "Sixty seconds: 45 to pitch, 15 for their reply",
        beats: [
          {
            name: "Connect (5 sec)",
            description: "A brief, genuine hello. If you admire their work, name one specific thing, then move on.",
          },
          {
            name: "Frame (5 sec)",
            description: "Title, format and genre, so they know which shelf to put it on: *a murder mystery called Polar Night*.",
          },
          {
            name: "Hook (15 sec)",
            description: "Your logline: protagonist, goal, obstacle and stakes, said like you mean it.",
          },
          {
            name: "Spark (15 sec)",
            description: "One thing that makes it yours: a comp, a striking image, or why you're the person to make it.",
          },
          {
            name: "Ask (5 sec)",
            description: "One small, specific next step they can agree to on the spot. Then stop and let them respond.",
          },
        ],
      },
      {
        type: "compare",
        weakLabel: "Starts with backstory",
        weak: "Hi! So, I went to film school in Leeds, and I've been developing this project for about five years now. It's quite hard to explain, it's sort of a few genres at once, but at its heart it's really about isolation, and trust, and there's a mystery element too, but it's very grounded…",
        strongLabel: "Starts with the hook",
        strong:
          "Hi, I'm Dana, I'm a writer-director. I've got a murder mystery called *Polar Night*. When the doctor at an Antarctic research station is found dead in the depths of winter, the base's most disliked scientist has to find the killer among the eleven people she's snowed in with, before they decide it was her. It's *Knives Out* at the South Pole. The script's finished. Could I send it to your office?",
        note: "Forty seconds in, the first pitch still hasn't said what the film is. In about the same time, the second delivers a title, a genre, a logline with built-in irony (the prime suspect has to play detective), a comp and a clear ask.",
      },
      { type: "heading", text: "Comps: “It's X meets Y”" },
      {
        type: "text",
        body: "Sooner or later someone will ask *what's it like?* Your answer is your **comps**, short for comparable titles: one or two existing films or shows that tell the listener genre, tone, audience and rough budget in a heartbeat. *Speed* has long been summed up as “*Die Hard* on a bus”. Five words, and you can already see the poster.",
      },
      {
        type: "example",
        title: "“Jaws in space”",
        source: "Alien (1979), dir. Ridley Scott",
        body: "The story goes that *Alien* was sold with three words: “*Jaws* in space”. True or embellished, it shows exactly what a comp can do. *Jaws* had been a phenomenon only a few years earlier, so the phrase told a studio the genre (a creature thriller), the engine (a monster picking off people who can't escape) and the audience (the crowds who had queued round the block for a shark). *In space* supplied the twist that made it new.\n\nNotice what the phrase doesn't do: it doesn't tell you the story. The finished film became far more than its comp, with a working-class crew, a company that treats them as expendable and a hero the audience didn't see coming. The comp opened the door. The story is what walked through it.",
      },
      {
        type: "list",
        items: [
          "**Successful.** Comp a hit, not a flop. You're borrowing its track record as evidence that an audience exists for your film.",
          "**Recent.** Titles from roughly the last decade show you know today's market. A classic can set the tone, but pair it with something newer.",
          "**Realistic.** “It's the next *Godfather*” says more about your ego than your film. Compare yourself to peers, not monuments.",
          "**Doing a job.** In “X meets Y”, each half should contribute something specific: one lends the premise or world, the other the tone or engine.",
          "**Compatible.** Two comps that imply wildly different audiences or budgets cancel each other out.",
        ],
      },
      {
        type: "compare",
        weakLabel: "Comps that confuse",
        weak: "It's sort of *The Revenant* meets *Mamma Mia!* meets *The Godfather*. Honestly, it's got something for everyone.",
        strongLabel: "A comp that orients",
        strong:
          "It's *Knives Out* at the South Pole: an ensemble whodunit with a wicked sense of humour, in a place nobody can leave.",
        note: "Three giant hits from three unrelated genres tell a producer only that you haven't decided what your film is. One well-chosen comp plus one twist delivers genre, tone, audience and a hook in seven words, and the phrase after the colon says exactly what the comp is doing.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "The comp is the frame, not the picture",
        body: "A comp orients the listener; it never replaces your story. If your whole pitch is “It's *A Quiet Place* meets *Barbie*”, you've described two films that already exist and none of yours. Always follow the comp with the sentence only you can say: who it's about, what they want and what stands in the way.",
      },
      { type: "heading", text: "The ask, and the art of stopping" },
      {
        type: "text",
        body: "End with one clear, small request. *Could I send you the script? Would you be open to a coffee next month? Who at your company should I send it to?* Small asks are easy yeses. *Will you produce my film?* is a question nobody can answer between floors.\n\nThen stop talking. Blaise Pascal once apologised for a long letter by explaining that he hadn't had time to make it shorter, and brevity takes the same work in a pitch. The one that works best is often the shortest, because it leaves a gap the listener wants to fill. If they ask *how does it end?* or *who's attached?*, you've already won: the pitch has become a conversation.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Build a pitch they can repeat",
        body: "The person in the lift is rarely the final decision-maker. If your pitch lands, they'll retell it to a boss, a partner or a financier, probably in one sentence and without you in the room. So design it to survive being repeated: a clear title, one vivid image and a comp they can say without notes. To test it, ask a friend to pitch your project back to you the next day. Whatever they remember is your real pitch.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write your pitch in five lines: **connect**, **frame**, **hook**, **spark**, **ask**. Read it aloud against a timer and aim for about 45 seconds, leaving the rest of the minute for their reply. If it runs long, trim the spark before you touch the hook.",
        placeholder: "Connect: …\nFrame: …\nHook: …\nSpark: …\nAsk: …",
      },
    ],
    keyTakeaways: [
      "An elevator pitch has one job: to earn the next conversation, not to tell the whole story.",
      "Lead with the hook. Title, genre and logline come first; biography and backstory can wait until they ask.",
      "Good comps are successful, fairly recent, realistic and compatible, and each one does a specific job.",
      "A comp frames your story but never replaces it, so always follow it with your logline.",
      "Close with one small, specific ask, then stop talking and let the listener respond.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "You have about a minute with a producer at a festival party. Which opening gives you the best chance?",
        options: [
          "“Hi, I loved your last film. I'm a writer-director, and I've spent six years on a project I think you'd really connect with.”",
          "“I'm not sure how to describe it, but it's very personal to me, and it's the most honest thing I've ever written.”",
          "“Have you got a minute? I'd love to tell you about my journey as a filmmaker and how this project came about.”",
          "“It's a heist comedy called *The Retirement Plan*: five pensioners try to rob the bank that repossessed their care home.”",
        ],
        answerIndex: 3,
        explanation:
          "The last option gives the title, genre and a premise with built-in irony (pensioners as bank robbers) in one breath. The others spend the listener's attention on a vague compliment, feelings or biography before saying what the project is, and in sixty seconds that's attention you can't win back.",
      },
      {
        id: "q2",
        prompt: "You're pitching a low-budget, darkly funny horror film about a cursed family reunion. Which comps help most?",
        options: [
          "*Hereditary* meets *Knives Out*",
          "*Jurassic Park* meets *Avatar*",
          "*The Godfather* meets *Citizen Kane*",
          "*The Shining* meets *Meet the Parents*",
        ],
        answerIndex: 0,
        explanation:
          "*Hereditary* signals family horror on a modest budget; *Knives Out* adds a feuding-family ensemble and a wicked sense of humour. Both were recent hits, and together they triangulate your tone and audience. The blockbusters imply a budget you don't have, the classics sound grandiose, and the last pair gets the tone roughly right but says nothing about today's market.",
      },
      {
        id: "q3",
        prompt: "A producer asks what your film is like, and you say, “Honestly, nothing like it has ever been made.” Why does this usually hurt the pitch?",
        options: [
          "It invites them to pick a comp themselves, and they may well choose a flop.",
          "Producers only greenlight remakes, sequels and adaptations, so originality is a red flag.",
          "It gives them nothing to picture, and suggests you don't know your market.",
          "It marks the film as experimental, and experimental films rarely find distribution.",
        ],
        answerIndex: 2,
        explanation:
          "Originality is welcome (producers buy original stories all the time), but *nothing like it* leaves the listener unable to place your film's genre, tone, audience or budget, or to imagine who will buy a ticket. Comps aren't an admission that your idea is derivative. They're a map that helps someone else see where your film would sit, and they show you've studied the market.",
      },
      {
        id: "q4",
        prompt: "Which closing line is strongest at the end of an elevator pitch?",
        options: [
          "“So… what do you think? Would you want to produce it?”",
          "“Could I send the script to your office this week?”",
          "“Anyway, I'll let you go. Thanks for listening!”",
          "“Could we set up a meeting with your whole team and your financiers?”",
        ],
        answerIndex: 1,
        explanation:
          "A good ask is small, specific and easy to say yes to on the spot. Asking someone to commit to producing, or to convene their whole company, is too big a leap for a sixty-second conversation, and ending with no ask at all wastes the goodwill you've just earned.",
      },
      {
        id: "q5",
        prompt: "A friend pitches: “It's *Barbie* meets *Oppenheimer*.” Then they stop, smiling. What's missing?",
        options: [
          "A third comp, so the listener can triangulate the tone between the other two.",
          "Box-office figures for both films, to prove an audience is out there.",
          "Nothing. A sharp comp says it all, and stopping there shows confidence.",
          "Their own story: who it's about, what they want and what's in the way.",
        ],
        answerIndex: 3,
        explanation:
          "Comps describe films that already exist. The listener still has no idea what happens in this one, and more comps or box-office figures won't tell them. Use the comp to orient, then immediately deliver the logline, the part of the pitch that nobody else could say.",
      },
    ],
    exercise: {
      prompt:
        "Step into the Elevator drill and pitch a project to a producer before the doors open on his floor. Aim to earn a genuine follow-up question, and finish with a specific, easy ask.",
      tips: [
        "Say your title and genre in the first ten seconds.",
        "Choose one comp you can defend: a recent hit with the same audience as your film.",
        "Rehearse aloud with a timer until the pitch fits comfortably in 45 seconds, leaving room for his questions.",
        "Make one small ask, then stop talking.",
      ],
      practiceScenarioId: "elevator-pitch",
      labTool: "logline",
    },
  },

  // -------------------------------------------------------------------------
  // 3. The pitch meeting
  // -------------------------------------------------------------------------
  {
    id: "the-pitch-meeting",
    trackId: "pitch-delivery",
    title: "The Pitch Meeting: Fifteen Minutes to Sell a Movie",
    summary:
      "How a professional pitch is built, from the personal connection that opens it to the ending you must never skip, and how to handle tough questions and studio notes without losing the room or your story.",
    minutes: 9,
    level: "intermediate",
    skills: ["delivery", "structure", "hook"],
    blocks: [
      { type: "heading", text: "A whole movie, told in a room" },
      {
        type: "text",
        body: "In a pitch meeting, a writer or director tells a buyer (a development executive, a producer, a streamer) the story of a film or series that may exist only as an outline. You talk, they listen, and within fifteen minutes or so they're deciding whether to spend their time, their credibility and eventually their money on it.\n\nNobody wants a reading of the screenplay. What they're buying is a clear, emotionally compelling story, plus confidence that you're the person to write it. Structure is what makes that possible: a good pitch has a shape the listener can follow without a map.",
      },
      {
        type: "beats",
        title: "The shape of a 10–15 minute pitch",
        beats: [
          {
            name: "Personal connection (1–2 min)",
            description:
              "Why this story, and why you? One brief, true moment that links you to the material. It earns attention and answers *why you* before anyone asks.",
          },
          {
            name: "Title, logline and comps (30 sec)",
            description: "Say exactly what the film is (genre, tone, the one-sentence story) so they can hang everything that follows on it.",
          },
          {
            name: "The world (1 min)",
            description: "Where and when, plus the rules if the world is heightened. One or two vivid details, not an encyclopedia.",
          },
          {
            name: "The characters (2 min)",
            description:
              "Your protagonist: what they want, what's wrong with them, what they stand to lose. Then the antagonist and one or two key relationships. Save the rest of the cast for the script.",
          },
          {
            name: "The story in broad strokes (5–7 min)",
            description: "Act one in some detail, then the tentpoles: the act breaks, the midpoint, the lowest point and the climax. Emotion over mechanics.",
          },
          {
            name: "The ending and why now (1–2 min)",
            description: "Always tell the ending. Then close on why this story matters today, ideally circling back to your personal connection.",
          },
        ],
      },
      { type: "heading", text: "Pitch the journey, not the plot" },
      {
        type: "text",
        body: "The fastest way to lose a room is the plot dump: *and then she goes to the warehouse, and then she finds the key, and then…* Buyers don't need every scene. They need to feel the story's shape and its emotional turns. Treat acts two and three as a series of **tentpoles**, the few big moments that hold the whole structure up, and let the connective tissue go.\n\nFor each tentpole, say what happens and what it costs the protagonist. *What happens* keeps the listener oriented. *What it costs* keeps them caring.",
      },
      {
        type: "compare",
        weakLabel: "Plot dump",
        weak: "So then she drives to the lab, and she meets the security guard, Tom, who's actually an old friend from university, and he lets her in, and she finds the files, but then the alarm goes off, so she hides in the supply cupboard, and then…",
        strongLabel: "A tentpole",
        strong:
          "At the midpoint she finally gets inside the lab and finds proof the company knew all along. But the sign-off on the cover-up is in her own handwriting. The whistleblower helped bury it, and now the only way to expose them is to go down with them.",
        note: "The first version tells us what happens. The second tells us what it *means* for her, turns the story inside out and raises the stakes for act three, in roughly the same number of words.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Never skip the ending",
        body: "*I'd rather keep the ending a surprise* is one of the most common ways to lose a pitch. A buyer isn't an audience member; they're a prospective partner deciding whether the story works, and they can't judge it without its final act. Endings are where a great many scripts fall apart, so an ending you can tell with conviction is proof you've solved the hardest problem.",
      },
      { type: "heading", text: "Why you, why now" },
      {
        type: "example",
        title: "A bet on the storyteller",
        source: "Star Wars (1977), dir. George Lucas",
        body: "Before *Star Wars* became a phenomenon, it was a hard sell. Universal and United Artists both passed on George Lucas's space fantasy. Alan Ladd Jr., a senior executive at 20th Century Fox, said yes, and the decision is widely described as a bet on Lucas himself, fresh from the success of *American Graffiti*, as much as on a script many people struggled to picture.\n\nBuyers always invest in a person as well as an idea. That's why a strong pitch opens with your connection to the material and closes with why now. Together they answer the question every buyer is silently asking: will this person see it through?",
      },
      {
        type: "compare",
        weakLabel: "A résumé",
        weak: "I've been writing for about ten years. I have an MFA, I've placed in a couple of competitions, and I've always loved thrillers.",
        strongLabel: "A reason",
        strong:
          "When I was twelve, my dad spent a winter on night shifts at a nuclear power station. Every morning he came home and said *nothing happened*, and I spent years wondering what *something* would look like. This film is my answer.",
        note: "Credentials tell a buyer you can write. A personal connection tells them why *you* have to write this one, and hands them a story about the storyteller that they can repeat to their boss.",
      },
      { type: "heading", text: "When the questions start" },
      {
        type: "text",
        body: "When you finish, the real meeting begins. Expect questions (*How does it end? Who's the audience? What's the budget feel? Why is the villain doing this?*) and expect notes, some of them bad. Listen to the whole question, take a breath, and answer the one they asked rather than the one you rehearsed. Short, specific answers signal that you know your story better than anyone.\n\nWhen a buyer gives a note you disagree with, look for **the note behind the note**. *What if she were younger?* might really mean *I'm not sure the audience will root for her yet.* Answer the concern rather than the suggestion, and you can protect your story while proving you're a collaborator.",
      },
      {
        type: "compare",
        weakLabel: "Defensive",
        weak: "Exec: What if we lose the daughter and make it a romance?\n\nWriter: No, the daughter is the whole point. Without her there's no movie.",
        strongLabel: "Curious",
        strong:
          "Exec: What if we lose the daughter and make it a romance?\n\nWriter: Is it that the middle feels light on emotional stakes? The ending hinges on the daughter, so I'd fight to keep her, but I think there's room for a romance alongside her. Can I show you how that might work?",
        note: "The first writer is right about the story and still loses the room. The second protects the same thing by asking what the note is reaching for, and turns a threat into a collaboration.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Rehearse out loud, and never the same way twice",
        body: "Pitch to friends, record yourself and time it. Don't memorise a script: learn the beats and tell it slightly differently each time, so it stays a story rather than a recital. Then write down the ten questions you'd least like to be asked and answer each one aloud in two sentences. The question you've prepared for is never the one that sinks you.",
      },
    ],
    keyTakeaways: [
      "A strong pitch follows a shape the listener can hold: personal connection, logline, world, characters, the story in broad strokes, then the ending and why now.",
      "Pitch the emotional journey through a few tentpole moments, saying what each one costs the protagonist, rather than recounting every scene.",
      "Always tell the ending. It's the proof that you've solved the story.",
      "Buyers invest in people as well as ideas, so open with why you and close with why now.",
      "Answer questions briefly and look for the note behind the note, so you can protect the story while staying collaborative.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Ten minutes into your pitch, you're still in act one and the executive keeps glancing at the clock. What's the most likely problem?",
        options: [
          "You opened with the logline, so there's no mystery left to hold their interest.",
          "Your personal connection was too short to earn their attention for the long haul.",
          "You're recounting scenes instead of hitting the tentpoles.",
          "You haven't brought visuals, and executives expect a lookbook to follow along.",
        ],
        answerIndex: 2,
        explanation:
          "Act one can have some detail, but ten minutes means you're narrating scene by scene. Buyers need the story's shape and emotional turns, not its connective tissue. Jump to the tentpoles (the act breaks, the midpoint, the climax) and say what each one costs the protagonist, and the pitch will feel like it's moving again. Opening with the logline was right, not a spoiler: it gives them something to hang the rest on.",
      },
      {
        id: "q2",
        prompt: "The executive asks, “So how does it end?” Which answer is best?",
        options: [
          "“I'd rather keep it a surprise. I think you'll enjoy the script more if you don't know where it's going.”",
          "“I'm still finding it. I know the ending will come once I'm deep into the writing.”",
          "“I've got a dark version and a hopeful one, and I'd love your take on which is more commercial.”",
          "“She hands over the evidence, knowing it convicts her too. She loses her career but gets her daughter back.”",
        ],
        answerIndex: 3,
        explanation:
          "A buyer needs to know the story works all the way through, and endings are where so many scripts fail. A confident, specific ending, with its emotional cost, proves you've solved the story. Withholding it, not knowing it or outsourcing it all undermine the pitch.",
      },
      {
        id: "q3",
        prompt:
          "An executive suggests, “What if the hero were a man in his twenties instead of a woman in her fifties?” You think the note would gut the story. What's the best response?",
        options: [
          "Agree warmly in the room to keep things positive, then quietly write it your way.",
          "Ask what worry sits behind the note, then address it while explaining what the character's age gives the story.",
          "Explain that the script is already written this way, so the change isn't possible.",
          "Defend your version with passion, since buyers invest in writers who truly believe in their own story.",
        ],
        answerIndex: 1,
        explanation:
          "Notes are often a symptom rather than a prescription. Finding the concern underneath (audience, casting, relatability) lets you solve the real problem while protecting what matters. Caving, even with a plan to ignore the note later, signals you don't believe in the story, and stonewalling, however passionate, signals you'll be hard to work with.",
      },
      {
        id: "q4",
        prompt: "Why open a pitch with a brief personal connection to the material?",
        options: [
          "It answers *why you* and gives the buyer a story about you to pass on.",
          "It warms up the room while the executive settles in.",
          "It proves your credentials early, so they trust what follows.",
          "It means you can skip the logline, since you are the hook.",
        ],
        answerIndex: 0,
        explanation:
          "Buyers are betting on a person as well as an idea. A short, true story about why this material matters to you builds credibility and emotional investment in a way a list of credentials can't, and it gives the executive something memorable to say when they take your project to their boss.",
      },
      {
        id: "q5",
        prompt:
          "You have fifteen minutes. Your draft pitch spends six on the world's history and mythology, two on the characters and four on the story. What should change?",
        options: [
          "Nothing. Rich world-building shows you've done the work and justifies the budget.",
          "Cut the characters to a minute, since the world is what makes the film distinctive.",
          "Cut the world to a minute and give that time to the characters and tentpoles.",
          "Keep the balance, but talk faster so everything fits with time left for questions.",
        ],
        answerIndex: 2,
        explanation:
          "World-building is the most common place pitches bloat. The buyer needs just enough world to picture the film and understand its rules. What sells a movie is a protagonist they care about and a story whose turns they can feel, so that's where the minutes should go.",
      },
    ],
    exercise: {
      prompt:
        "Pitch your feature to a development executive in the Studio Pitch drill. Follow the shape from this lesson, tell the ending, and practise answering her notes with curiosity instead of defensiveness. If your story's middle feels shaky, map it in the Story Doctor first.",
      tips: [
        "Before you start, write your six beats on a card: connection, logline, world, characters, tentpoles, ending and why now.",
        "Get to the logline within your first two answers.",
        "When she gives a note, name the concern you think sits behind it before you respond.",
        "If you don't know an answer, say what you'd explore rather than bluffing.",
      ],
      practiceScenarioId: "studio-pitch",
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 4. Oral storytelling craft
  // -------------------------------------------------------------------------
  {
    id: "oral-storytelling",
    trackId: "pitch-delivery",
    title: "Oral Storytelling: Voice, Pace & the Power of the Pause",
    summary:
      "The oldest storytelling technology is a voice in a room. Start in scene, speak in the present tense, choose details a listener can see, use silence on purpose and end on a callback that makes the whole story click.",
    minutes: 8,
    level: "intermediate",
    skills: ["delivery", "pacing", "visual"],
    blocks: [
      { type: "heading", text: "The ear is not the eye" },
      {
        type: "text",
        body: "A reader can slow down, skim back a paragraph or reread a line they loved. A listener can't. Everything you say arrives once, in order, at the speed you choose, and then it's gone. That's why a story that works beautifully on the page can fall apart when it's read aloud, and why great spoken storytellers sound more like conversation than prose.\n\nSpoken stories need shorter sentences, clearer signposts and a single through-line a listener can hold without effort. In return, they offer tools the page doesn't have: your voice, your timing and, most powerful of all, silence.",
      },
      {
        type: "example",
        title: "The bard's toolkit",
        source: "The Odyssey, attributed to Homer",
        body: "Long before it was written down, the *Odyssey* lived in the voices of bards who performed it for listeners. Even its first line is spoken aloud to someone; in Emily Wilson's translation it begins, *Tell me about a complicated man.* In the 1920s and 30s the scholar Milman Parry, later joined by his student Albert Lord, studied how such poets worked, comparing Homer with epic singers in Yugoslavia who could still perform poems thousands of lines long. They argued that these singers didn't recite a fixed text but composed in performance, building each telling from familiar phrases and story patterns: *rosy-fingered Dawn*, *grey-eyed Athena*, *the wine-dark sea*.\n\nThe poem even stages its own storytelling night. At the Phaeacian court, a blind bard sings of Troy until the stranger in the hall, Odysseus himself, weeps. Then the hero takes over and tells his own adventures, from the Cyclops to the Sirens, to a hall that sits spellbound. The lesson has held for more than two and a half thousand years: know your story's shape, not its script.",
      },
      { type: "heading", text: "Start in scene, and stay there" },
      {
        type: "text",
        body: "The strongest spoken stories open in a specific moment (a time, a place, something already going wrong) rather than with background. Then they stay in scene. You're not summarising what happened; you're taking the audience back into the moment it happened, so they live through it with you.",
      },
      {
        type: "compare",
        weakLabel: "Summary",
        weak: "My grandfather was an incredibly stubborn man. He never, ever admitted when he was wrong, about anything. It drove my grandmother mad.",
        strongLabel: "Scene",
        strong:
          "It's 1994, somewhere outside Swindon. My grandfather has just missed the motorway exit, and rather than turn around, he drives forty minutes in the wrong direction, whistling, while my grandmother knits in the passenger seat without saying a single word.",
        note: "The first version tells us he was stubborn. The second makes us watch him being stubborn and hands us his wife's silent verdict for free. It's also in the present tense, which puts the listener in the back seat of that car.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Learn the beats, not the words",
        body: "Like Homer's bards, the best tellers don't memorise word for word. Know your beats, and know your first and last lines cold. The Moth, the true-storytelling organisation founded in New York in 1997, has its tellers perform without notes and coaches them to start in the action and know what's at stake. A story you know by its shape survives nerves, interruptions and a forgotten sentence. A memorised script collapses at the first slip.",
      },
      { type: "heading", text: "Tense, detail and timing" },
      {
        type: "list",
        items: [
          "**Slip into the present tense.** *So I'm standing at the gate, and the plane is already moving.* Present tense turns a memory into something happening now. Many tellers begin in the past and shift to the present as the stakes rise.",
          "**Choose one or two details a listener can see, hear or smell.** The chipped yellow mug, the smell of diesel, the radio murmuring in the next room. One exact detail beats a paragraph of description.",
          "**Speak in your own voice.** Contractions, short sentences, the words you'd use with a friend. If a sentence has two commas and a *which*, it was written for the eye.",
          "**Vary your pace.** Nerves push everyone faster. Hurry through the connective tissue and slow right down for the moments that matter.",
          "**Use the pause.** A beat of silence *before* a reveal builds suspense; one *after* a big line gives the room time to feel it, or to laugh. It feels endless to you and completely natural to them.",
          "**Repeat on purpose.** A phrase that keeps returning (*and I still hadn't told her*) gives the ear a handrail and tightens the tension each time it comes back.",
        ],
      },
      {
        type: "compare",
        weakLabel: "Rushed",
        weak: "I opened the envelope and it was empty, completely empty, no letter, nothing, so I called her.",
        strongLabel: "Scored for pauses",
        strong: "I open the envelope. *(pause)* It's empty. *(long pause)* No letter. No note. Nothing. *(pause)* So I pick up the phone.",
        note: "Almost the same words. The second version breaks the moment into short sentences, gives each beat its own space and lets the silence do the work. Say both aloud and you'll hear the difference immediately.",
      },
      { type: "heading", text: "End where you began" },
      {
        type: "text",
        body: "A **callback ending** brings back an image, object or line from the opening, changed by everything that has happened since. It gives the audience the satisfying click of a circle closing, and it shows the change without announcing it. *Citizen Kane* (1941) opens with a dying man whispering *Rosebud* and ends by revealing the word painted on a childhood sled, a callback that reframes the entire life we've just watched.\n\nIn a spoken story, the callback replaces the moral. Instead of telling the room what you learned, return to the detail you started with and let them see how different it looks now.",
      },
      {
        type: "compare",
        weakLabel: "A stated moral",
        weak: "And that's when I realised that sometimes you have to let other people take the wheel.",
        strongLabel: "A callback",
        strong:
          "He never did admit he'd missed that exit. But the day I passed my driving test, he climbed into the passenger seat, handed me his battered road atlas and said, *You navigate.*",
        note: "The first ending states a lesson nobody will remember. The second returns to the opening image (the missed exit, the car, the silence) and lets the change in a stubborn old man speak for itself.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write the **first line** and the **last line** of a true story from your life. The first should drop us into a specific moment; the last should call back to something in the first, changed by what happened in between.",
        placeholder: "First line: …\nLast line: …",
      },
    ],
    keyTakeaways: [
      "Listeners can't reread, so spoken stories need short sentences, clear signposts and a single through-line.",
      "Start in a specific scene and stay there, slipping into the present tense as the stakes rise.",
      "One precise sensory detail does more work than a paragraph of description.",
      "Silence is part of the story: pause before a reveal and after a big line.",
      "Learn your beats and your first and last lines rather than a script, and end on a callback instead of a moral.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which opening line is best suited to a story told out loud?",
        options: [
          "“The following events, which I'll try to recount as accurately as I can, took place during what was, in retrospect, a very difficult year.”",
          "“I want to talk to you tonight about resilience, and about the year that taught me what that word really means.”",
          "“The night before my sister's wedding, I'm standing in her kitchen holding the only copy of her vows, and I've just spilled red wine all over them.”",
          "“Let me give you a bit of background on my family first, because none of this makes sense without it.”",
        ],
        answerIndex: 2,
        explanation:
          "The third line drops us into a specific moment, in the present tense, with a problem already in motion, and it raises an instant question: what now? The others are preamble. One is written for the eye with nested clauses, one announces a theme, and one promises background before any story begins.",
      },
      {
        id: "q2",
        prompt: "You're telling a story about a missed flight that changed your life. Where will a pause do the most good?",
        options: [
          "Just before you reveal who was in the seat you were rebooked into, and just after.",
          "Between every sentence, so the audience can picture each moment.",
          "At the very start, holding the silence as long as you can to command the room.",
          "Nowhere. Pauses make you look as if you've forgotten your lines.",
        ],
        answerIndex: 0,
        explanation:
          "Pauses work when they frame the moments that matter. Silence before the reveal lets suspense build; silence after it gives the audience time to feel it. Pausing everywhere flattens the rhythm so that nothing stands out, a long silence before you've said anything just looks like nerves, and avoiding pauses entirely rushes straight past your best moment.",
      },
      {
        id: "q3",
        prompt: "What's the best way to prepare a five-minute true story for a live audience?",
        options: [
          "Write it out in full and memorise it word for word, so nerves can't knock you off course.",
          "Improvise the whole thing on the night, so it sounds fresh and unrehearsed.",
          "Keep a full script on your phone as a safety net, and read from it if you freeze.",
          "Know the beats and your first and last lines cold, then rehearse it aloud.",
        ],
        answerIndex: 3,
        explanation:
          "Knowing the shape rather than the script keeps the story alive and conversational, and it survives nerves: if you lose a sentence, you still know where you're going. Rehearsing aloud, telling it slightly differently each time, keeps it sounding like speech. Word-for-word memorisation collapses at the first slip, reading kills eye contact, and pure improvisation tends to ramble past the ending.",
      },
      {
        id: "q4",
        prompt: "Your story opens with your grandmother teaching you to swim in a freezing lake. Which ending is a callback?",
        options: [
          "“And standing in that freezing water, I learned the lesson I've lived by ever since: never give up.”",
          "“Last summer I took my daughter to the same lake, and heard myself say my grandmother's words.”",
          "“Anyway, that's my story. Thank you all so much for listening tonight.”",
          "“My grandmother passed away a few years ago, and I still think of her every time I swim.”",
        ],
        answerIndex: 1,
        explanation:
          "The second ending returns to the opening image (the lake, the cold, the grandmother's words) transformed: the child is now the teacher. It shows the change instead of stating it. The first ending is a moral, the third simply stops, and the fourth adds new information rather than closing the circle.",
      },
      {
        id: "q5",
        prompt:
          "Which version of this line works best for the ear? *The house, which had been empty since my uncle's death, which had been sudden, smelled of damp.*",
        options: [
          "“Nobody's lived in the house since my uncle died. It smells of damp, and of his pipe tobacco.”",
          "“The house, empty since my uncle's sudden death, smelled of damp.”",
          "“The house had a smell.”",
          "“The house, which had been left empty for a period of time following the sudden and unexpected death of my uncle, smelled of damp.”",
        ],
        answerIndex: 0,
        explanation:
          "The first version uses short, spoken sentences, slips into the present tense and adds one precise sensory detail that carries emotion (his tobacco still lingers). The second is tidier but still built for the page, with a clause tucked inside the sentence. The third throws the detail away, and the fourth makes the listener hold a long clause before reaching the point.",
      },
    ],
    exercise: {
      prompt:
        "Take a true story from your life to the Campfire Story drill and tell it to the host the way you'd tell it to the circle: start in a specific scene, slip into the present tense as the stakes rise, and land on a callback.",
      tips: [
        "Find the moment you changed, then work backwards to the scene where the story should start.",
        "Choose one sensory detail for the opening and bring it back, transformed, at the end.",
        "Mark *(pause)* in your rehearsal notes before the turn and after your last line, then honour it.",
        "Tell it aloud at least three times before you tell it to anyone.",
      ],
      practiceScenarioId: "campfire-story",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Storytelling beyond film
  // -------------------------------------------------------------------------
  {
    id: "founder-and-brand-stories",
    trackId: "pitch-delivery",
    title: "Beyond the Screen: Founder Stories, Brands & Talks",
    summary:
      "The craft that sells a film also raises money, builds brands and holds an auditorium. Tell the story of a struggle rather than a résumé, make the customer the hero, and give every talk one idea worth carrying home.",
    minutes: 9,
    level: "advanced",
    skills: ["character", "conflict", "delivery"],
    blocks: [
      { type: "heading", text: "The story of a struggle, not a résumé" },
      {
        type: "text",
        body: "Founders pitching investors, charities asking for donations, leaders announcing a change, speakers at a conference: all of them are asking an audience to believe in something that doesn't fully exist yet. That's exactly what a filmmaker does in a pitch room, and the same craft works.\n\nThe classic mistake outside film is to present a résumé instead of a story: credentials, features, market size and milestones, all true and all forgettable. Aristotle described three modes of persuasion: *ethos* (the speaker's character), *pathos* (emotion) and *logos* (reason). A résumé offers credentials (a thin kind of ethos) and facts (logos), but almost no pathos. A story carries all three at once.\n\nAudiences don't bond with success; they bond with struggle. The most persuasive founder stories have the bones of a film: a person with a problem they couldn't ignore, a moment of clarity, attempts that failed, an insight others missed and a mission that grew out of it all. The failures aren't a weakness in the story. They're proof you'll keep going when things get hard, which is precisely what an investor is betting on.",
      },
      {
        type: "compare",
        weakLabel: "The résumé",
        weak: "I have fifteen years of experience in healthcare technology, including senior roles at two Fortune 500 companies. Our AI-powered platform is revolutionising elder care in a multi-billion-dollar market.",
        strongLabel: "The struggle",
        strong:
          "Three years ago my mum fell in her kitchen and lay on the floor for nine hours before anyone knew. She owned a panic button. She'd stopped wearing it because it made her feel old. So we set out to build a sensor she'd actually be willing to live with, and we got it wrong twice before we got it right.",
        note: "The first version makes claims. The second shows a problem you can picture, a reason the founder can't let go, and an insight (people won't wear what makes them feel old) that no market-size slide could deliver.",
      },
      {
        type: "beats",
        title: "A founder story on the Story Spine",
        frameworkId: "story-spine",
        beats: [
          { name: "Once upon a time…", description: "Who you were and the world you worked in, in a sentence or two." },
          { name: "Every day…", description: "The problem everyone had learned to live with, shown through one specific person." },
          { name: "Until one day…", description: "The moment you saw it clearly and couldn't unsee it." },
          { name: "Because of that…", description: "Your first attempt, and how it failed." },
          { name: "Because of that…", description: "What the failure taught you: the insight others had missed." },
          { name: "Until finally…", description: "The breakthrough: a customer, a result, a moment of proof." },
          { name: "And ever since then…", description: "The mission, and what you need from this audience to reach the next chapter." },
        ],
      },
      {
        type: "example",
        title: "Air mattresses on the living-room floor",
        source: "Airbnb's founding story, San Francisco (2007–2008)",
        body: "In 2007, Brian Chesky and Joe Gebbia were struggling to pay the rent on their San Francisco flat. With a big design conference in town and hotels booked up, they inflated air mattresses on their floor and offered visitors a bed and breakfast. That improvised experiment became the seed of Airbnb.\n\nThe version founders and journalists still retell isn't about market size. It's about the struggle that followed: investors who passed, and a stretch when the founders kept the company alive by designing and selling novelty cereal boxes themed on the 2008 US presidential election. Notice what the story proves. Anyone hearing it learns what the founders noticed, how resourceful they were and how far they'd go to keep going, none of which a chart could show.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Never fake the struggle",
        body: "Audiences, and investors especially, have finely tuned detectors for an origin story polished into a myth. Don't invent a dramatic moment, inflate a hardship or quietly edit out the co-founder who was there first. Details are exactly what people check, and a story that falls apart costs far more than a plain one ever would. If your real story is quiet, tell it quietly and specifically.",
      },
      { type: "heading", text: "Make the customer the hero" },
      {
        type: "text",
        body: "In a brand story, the temptation is to cast your company as the hero. Resist it. Donald Miller's *Building a StoryBrand* (2017) popularised a useful reframe: the customer is the hero with a problem, and the brand is the guide who helps them win.\n\nHomer got there first. In the *Odyssey*, the goddess Athena takes the form of Mentor, an old friend of Odysseus, to advise his son Telemachus, which is where our word *mentor* comes from. The guide doesn't steal the voyage. The guide helps the hero act.",
      },
      {
        type: "compare",
        weakLabel: "Company as hero",
        weak: "Founded in 2019, we're the industry leader in sustainable running shoes. Our award-winning team has developed a patented recycled foam that outperforms the competition.",
        strongLabel: "Customer as hero",
        strong:
          "You run to clear your head. Then you open the cupboard, see the pile of dead trainers and feel a little sick. Send us your old pair when you're done, and we'll grind it into the foam for your next one.",
        note: "The first version is about the company's achievements. The second is about the runner (their habit, their guilt) and casts the brand as the guide that lets them keep doing what they love without the pile.",
      },
      { type: "heading", text: "Talks: one idea, carried home" },
      {
        type: "text",
        body: "A talk is a story told to many people at once, with the same rules and higher stakes. Chris Anderson, the curator of TED, argues that every great talk has a **throughline**: a single idea the whole talk builds, the way a plot builds towards its climax. Nancy Duarte's book *Resonate* (2010) maps many celebrated speeches as a movement back and forth between *what is* and *what could be*, ending on a vision of the better world the audience can help create.\n\nThat's the pitch-room lesson at scale. Open on a moment, not an agenda. Give the audience one idea, not four. And end on the change you want them to make.",
      },
      {
        type: "compare",
        weakLabel: "An agenda",
        weak: "Hi everyone, thanks so much for having me. Today I'm going to talk about the importance of sleep, and I've divided my talk into three sections.",
        strongLabel: "A moment",
        strong:
          "Last March, I was wheeled into surgery at six in the morning. My surgeon had been awake for twenty-six hours. This talk is about the one treatment nobody prescribed him: sleep.",
        note: "The first opening announces a topic and a table of contents. The second starts inside a moment, makes the stakes physical and states the throughline by its third sentence.",
      },
      {
        type: "example",
        title: "Three products, or one?",
        source: "Steve Jobs introduces the iPhone, Macworld, January 2007",
        body: "Jobs told the audience that Apple was about to introduce three revolutionary products: a widescreen iPod with touch controls, a revolutionary mobile phone and a breakthrough internet communications device. Then he repeated the list, and repeated it again, faster, until the room caught on and began to cheer. They weren't three devices. They were one, and he called it the iPhone.\n\nIt's oral storytelling applied to a product launch: a rule of three, repetition that gives the audience a handrail, and a reveal delivered just after the room has half-guessed it. He let the audience enjoy working it out, and people remember what they work out for themselves.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write the first three sentences of your founder story, brand story or talk. Open on a specific moment of struggle, not a credential, and check that a listener could picture it.",
        placeholder: "Three years ago…",
      },
    ],
    keyTakeaways: [
      "Outside film, the same craft applies: tell the story of a struggle, not a résumé of achievements.",
      "A founder story has the bones of a film: a problem you couldn't ignore, a moment of clarity, failed attempts, an insight and a mission.",
      "In a brand story the customer is the hero and the brand is the guide: be Mentor, not Odysseus.",
      "Give every talk one throughline, open on a moment rather than an agenda, and let the audience enjoy working things out.",
      "Never embellish an origin story. Specific, verifiable truth persuades better than drama.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "An investor says, “Tell me why you started this company.” Which answer is strongest?",
        options: [
          "“I've got an MBA and ten years running logistics at a national grocer, so I know where this industry's waste comes from.”",
          "“We're using AI to match surplus food with local charities in real time, cutting last-mile waste dramatically.”",
          "“Food waste costs billions every year, and nobody has built a fix that small businesses can actually use.”",
          "“Every Friday my family's bakery binned forty loaves while the food bank next door ran out by noon. My first fix died within a week.”",
        ],
        answerIndex: 3,
        explanation:
          "The last answer has a specific place, a problem you can picture, a personal reason to care and a failure to learn from: the bones of a story. The others are a credential, a product pitch and a market claim, each of which an investor has heard hundreds of times and none of which shows who the founder is.",
      },
      {
        id: "q2",
        prompt: "In a brand story built on the customer-as-hero idea, what role should the company play?",
        options: [
          "The hero, fighting the industry's giants on the customer's behalf.",
          "The guide who helps the customer win, like Mentor advising Telemachus.",
          "The narrator who walks the customer through all its awards and milestones.",
          "The prize the customer finally wins at the end of their journey.",
        ],
        answerIndex: 1,
        explanation:
          "Customers are the heroes of their own stories and they're looking for help, not a new protagonist to admire, even one fighting on their behalf. A brand that positions itself as the guide (empathetic, credible, offering a clear plan) invites the customer into the story instead of asking them to watch someone else's.",
      },
      {
        id: "q3",
        prompt: "You have four great ideas and a fifteen-minute speaking slot. What does the throughline principle suggest?",
        options: [
          "Pick the one idea to carry home, and use the others only to serve it.",
          "Cover all four at a brisk pace, so the audience gets as much value as possible.",
          "Save your best idea for last, so the talk builds to a climax.",
          "Give each idea its own short story, so all four have a memorable hook.",
        ],
        answerIndex: 0,
        explanation:
          "A talk, like a story, needs one spine. Four ideas in fifteen minutes means none of them gets built properly, however well each is told or ordered, and the audience leaves remembering nothing. Choosing a single throughline lets you set it up, develop it and land it, the way a plot builds to a climax.",
      },
      {
        id: "q4",
        prompt: "Why do failures belong in a founder's origin story?",
        options: [
          "They make the founder look humble, which investors like whatever actually happened.",
          "They add drama, and a dramatic origin story is more likely to be retold in the press.",
          "They show resilience and learning, and make the story believable.",
          "They lower expectations, so any future success looks bigger by comparison.",
        ],
        answerIndex: 2,
        explanation:
          "A story in which nothing goes wrong isn't credible, and it tells an investor nothing about how you'll handle the hard years ahead. Real failures and what they taught you are evidence of persistence and judgement, which is what an investor is really betting on. Staging failures for drama or to seem humble is its own kind of fakery.",
      },
      {
        id: "q5",
        prompt: "Jobs described three devices before revealing they were one iPhone. Which storytelling principle does that illustrate?",
        options: [
          "List a product's features in order of importance, saving the best for last.",
          "Keep the audience confused for as long as you can, so they stay hooked.",
          "Repetition and a well-timed reveal let the audience half-guess it and enjoy being right.",
          "Surprise works best with no setup, so the reveal should come out of nowhere.",
        ],
        answerIndex: 2,
        explanation:
          "Repeating the trio gave the audience a pattern to hold, and the speed-up invited them to solve it. They were never lost, just one step from the answer, so when the reveal came they felt clever rather than told. It's the same principle as planting and payoff in a screenplay: a surprise lands hardest when it has been set up.",
      },
    ],
    exercise: {
      prompt:
        "Tell your company's origin story to a seed investor in the Founder Story drill. He has read the deck and wants the story behind it: the moment you saw the problem, what went wrong, and why you're the one who'll see it through. To shape it first, map it onto the Story Spine in the Story Doctor.",
      tips: [
        "Open with a specific moment, not your CV: a date, a place, a person with a problem.",
        "Include at least one real failure and what it taught you.",
        "Cut every buzzword. If you wouldn't say it to a friend, don't say it to an investor.",
        "Finish with the mission and what happens next, not a list of features.",
      ],
      practiceScenarioId: "founder-story",
      labTool: "story",
    },
  },
];
