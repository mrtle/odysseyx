import type { Lesson } from "@/lib/types";

/**
 * Track 3 — Character: want, need, wound, change.
 * Want vs. need; the wound and the lie; active protagonists; antagonists and
 * mirror characters; and the three shapes of character arc.
 */
export const characterLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. Want vs. need
  // -------------------------------------------------------------------------
  {
    id: "want-vs-need",
    trackId: "character",
    title: "Want vs. Need: The Engine and the Heart",
    summary:
      "Your protagonist chases what they want. The story gives them what they need. Learn to build both, and to set them on a collision course.",
    minutes: 7,
    level: "beginner",
    skills: ["character", "conflict"],
    blocks: [
      { type: "heading", text: "Two desires, one character" },
      {
        type: "text",
        body: "Every memorable protagonist is driven by two desires at once. The **want** is the conscious, external goal: win the case, find the missing son, save the farm, float the house to South America. It's concrete enough that the audience can track it scene by scene and tell whether the character is getting closer or falling further behind. The want is the engine of the plot.",
      },
      {
        type: "text",
        body: "The **need** is quieter. It's the inner change the character must make to be whole: to forgive, to trust, to stop hiding, to grow up. Characters are usually blind to it, at least at first. The need is the heart of the story, the reason the plot *means* something rather than just happening.",
      },
      {
        type: "list",
        items: [
          "**Want**: external, conscious, specific. A camera could see it. It answers *what are they chasing?*",
          "**Need**: internal, often unconscious, universal. It can only be revealed. It answers *what must they learn or become?*",
          "**The gap between them** is where the drama lives. The harder the want pulls against the need, the harder the character's choices become.",
        ],
      },
      {
        type: "compare",
        weakLabel: "Vague",
        weak: "Maya wants to be happy. She needs to find herself.",
        strongLabel: "Specific",
        strong:
          "Maya wants to win the county baking contest her late mother won three years running. What she needs is to stop living as her mother's understudy and bake something that is hers.",
        note: "“Happy” can't be photographed, and it gives Maya nothing to do tomorrow morning. A trophy with a date attached can, and now the need has something concrete to push against.",
      },
      { type: "heading", text: "Set them on a collision course" },
      {
        type: "text",
        body: "The strongest stories make want and need pull in opposite directions. Chasing the want lets the character stay comfortable inside their old self, so at the decisive moment they must choose: grab the thing they've been chasing, or let it go and become who they need to be. That choice is where an audience leans forward.",
      },
      {
        type: "example",
        title: "Carl lets go of the house",
        source: "Up (2009), dir. Pete Docter",
        body: "Carl Fredricksen's want is literal and enormous: float his house to Paradise Falls, the place he and his late wife Ellie always meant to go. When the house comes down short of the falls, he tows it across the landscape by a garden hose. Russell, the young Wilderness Explorer who stowed away on the porch, starts out as just another obstacle to that want.\n\nCarl's need is to stop living in the past and let someone new into his life. The collision comes after he finally gets the house to the falls. Leafing through Ellie's adventure book, he finds she filled it with photographs of their life together, and left a note thanking him for the adventure and urging him to go and have a new one. When Russell flies off alone to rescue Kevin the bird, Carl heaves his furniture out of the house so it can fly again. The want and the need can't both survive, and he chooses the need.",
      },
      {
        type: "text",
        body: "The collision doesn't always mean losing the want. Sometimes the character gets it, transformed. Shrek sets out to reclaim his swamp so he can be left alone, and by the end he has it back, filled with friends and shared with Fiona. The want is achieved, but the need has rewritten what it means.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Someone usually says the need out loud",
        body: "In many films, another character names the protagonist's need early on, and the protagonist brushes it off. Blake Snyder called this beat *Theme Stated*. The audience files it away. The protagonist has to live their way into it, which takes the rest of the movie.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "When the want and the need point the same way",
        body: "If chasing the want automatically delivers the need, there's no inner conflict, and your climax becomes a to-do list. Ask: *what does pursuing this goal let my character avoid?* The answer is usually the need, and it's usually where the story is hiding.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write your protagonist's want in a sentence a camera could film. Then write their need in a sentence it couldn't. Finally: how does chasing the first let them avoid the second?",
        placeholder: "She wants to… but what she needs is…",
      },
    ],
    keyTakeaways: [
      "The want is the external goal that drives the plot; the need is the inner change that gives the plot meaning.",
      "Make the want specific enough to photograph. A vague want like happiness gives a character nothing to do.",
      "The best stories set want and need on a collision course, so the climax forces a choice between them.",
      "Characters are usually blind to their need. Let them live their way into it rather than announce it.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which of these is a *want* rather than a *need*?",
        options: [
          "To learn to trust other people",
          "To stop the bank from auctioning the family restaurant on Friday",
          "To forgive her father",
          "To accept that she can't control everything",
        ],
        answerIndex: 1,
        explanation:
          "Saving the restaurant from Friday's auction is external, specific and visible: a camera could show whether she succeeds. The other three are inner changes. They're needs, the kind of thing a story reveals through the pursuit of a want like this one.",
      },
      {
        id: "q2",
        prompt:
          "A writer's protagonist wants to become head chef, and what she needs is also to become head chef. What's the main problem?",
        options: [
          "The want is too specific to be interesting.",
          "Nothing. When want and need align, the story is clearer.",
          "There's no inner tension: chasing the want never forces a painful choice.",
          "The need should be stated in the first scene instead.",
        ],
        answerIndex: 2,
        explanation:
          "A specific want is a strength, not a flaw. The trouble is that pursuing it costs her nothing inside. A need that pulls against the want (say, she needs to stop sacrificing everyone around her for her career) turns the climb into a series of real choices.",
      },
      {
        id: "q3",
        prompt: "In *Up*, why does the moment Carl throws his furniture out of the house land so hard?",
        options: [
          "It's the moment he chooses his need, a living connection with Russell, over the want he's clung to all film.",
          "It's a twist the audience couldn't possibly have seen coming.",
          "It reveals that Carl was never really attached to the house.",
          "It works as comic relief after the emotional adventure-book scene.",
        ],
        answerIndex: 0,
        explanation:
          "The house has been the physical embodiment of Carl's want, and of his grip on the past, for the entire film. Throwing out its contents is the want and need colliding in a single image: he can't save Russell and keep the shrine. He was deeply attached, which is exactly why the sacrifice means something.",
      },
      {
        id: "q4",
        prompt: "Your protagonist's need is to stop hiding from people. What's the most effective way to handle it?",
        options: [
          "Have her explain it to a friend in the first act so the audience understands.",
          "Leave it out entirely, because audiences only follow the want.",
          "Reveal it in voiceover over the final scene.",
          "Let another character name it early while she brushes it off, then force choices that make hiding increasingly costly.",
        ],
        answerIndex: 3,
        explanation:
          "A need works best when the audience senses it before the character does. Planting it through someone else (the *Theme Stated* beat) and then making the old behaviour more and more expensive lets her discover the truth through action, which the audience experiences as change rather than as a lecture.",
      },
    ],
    exercise: {
      prompt:
        "Write a logline for your project that puts your protagonist's want on the surface. Underneath it, add one sentence naming their need and where the two collide. Then run the logline through the Logline Lab.",
      tips: [
        "The logline carries the want and the obstacle; the need usually lives underneath it.",
        "Test the want: could a camera tell whether they've achieved it?",
        "Ask what pursuing the want lets your character avoid. That's usually the need.",
        "If want and need point the same way, raise the cost of one of them.",
      ],
      labTool: "logline",
    },
  },

  // -------------------------------------------------------------------------
  // 2. The wound and the lie
  // -------------------------------------------------------------------------
  {
    id: "the-wound-and-the-lie",
    trackId: "character",
    title: "The Wound and the Lie",
    summary:
      "Why do characters want the wrong things? Because something hurt them, and they drew the wrong conclusion. Trace the chain from wound to lie to need.",
    minutes: 7,
    level: "beginner",
    skills: ["character"],
    blocks: [
      { type: "heading", text: "The past that won't stay past" },
      {
        type: "text",
        body: "Why does your character want the wrong thing, or chase the right thing in the wrong way? Usually because something hurt them. Writers call it the **wound**, the backstory or, in screenwriting teacher John Truby's term, the **ghost**: an event from the past that still haunts the present. A parent who left. A public humiliation. A betrayal. The wound itself is backstory. What matters for your story is what the character concluded from it.",
      },
      {
        type: "text",
        body: "That conclusion is **the lie the character believes**, a phrase novelist and teacher K.M. Weiland builds her whole approach to character arcs around. The lie is a false belief about themselves or the world that once protected them: *if I never rely on anyone, no one can abandon me.* It shapes what they want, how they behave and what they can't see. The truth that would free them is their need.",
      },
      {
        type: "beats",
        title: "From wound to need, in *Finding Nemo* (2003)",
        beats: [
          {
            name: "Wound",
            description: "A barracuda attack takes Marlin's wife and all but one of their eggs.",
          },
          {
            name: "Lie",
            description: "*The ocean is too dangerous. If I control everything, I can keep him safe.*",
          },
          {
            name: "Want",
            description: "Keep Nemo close; then, once he's taken, get him back at any cost.",
          },
          {
            name: "Behaviour",
            description: "Anxious rules, panic, refusing to trust Nemo, refusing to trust Dory.",
          },
          {
            name: "Need",
            description: "You can't protect someone by never letting anything happen to them.",
          },
        ],
      },
      {
        type: "text",
        body: "Notice how the lie makes Marlin's behaviour *logical*. He isn't irrational; given what happened to him, overprotection makes perfect sense. That's what gives a lie its power on screen. The audience understands exactly why the character clings to it, even while they can see what it's costing. When Marlin finally trusts Dory and lets go inside the whale, then trusts Nemo to swim into a fishing net to save her, the truth has replaced the lie through action.",
      },
      {
        type: "example",
        title: "“It's not your fault”",
        source: "Good Will Hunting (1997), dir. Gus Van Sant",
        body: "Will Hunting mops floors at MIT and solves maths problems that stump its best students. His file records years of abuse in foster homes, and the lie he took from it is simple: *anyone who gets close will hurt me, so push them away first.* He picks fights, runs rings around every therapist he's sent to, and when Skylar asks him to come with her to California, he tells her he doesn't love her.\n\nThe film's climax isn't a chase or a fight. It's his therapist, Sean, telling him it's not his fault, again and again, until Will stops deflecting and breaks down. The wound is finally named, and the lie loses its grip. In the final scene Will drives west after Skylar, choosing the very risk he spent the whole film avoiding.",
      },
      {
        type: "compare",
        weakLabel: "Wound as speech",
        weak: "“Ever since my brother drowned when we were kids, I've been terrified of losing the people I love. That's why I push everyone away.”",
        strongLabel: "Wound as behaviour",
        strong:
          "She checks her son's life jacket three times before he steps onto the dock. When he begs to join the swim team, she says yes, then quietly misses every sign-up deadline.",
        note: "The first version explains the character to the audience. The second lets us watch the lie in action, and makes us curious about the wound behind it.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "The wound is not the story",
        body: "Writers often overexpose the wound: long flashbacks, tearful monologues, trauma standing in for personality. The wound matters only because of the lie it created, and the lie matters only because it drives choices in the present. Reveal the wound late, partially or through behaviour, and let the audience assemble it themselves.",
      },
      { type: "heading", text: "Finding your character's lie" },
      {
        type: "list",
        ordered: true,
        items: [
          "What hurt them before the story began? Be specific: an event, not a mood.",
          "What did they decide was true about themselves or the world because of it?",
          "How has that belief served them? A lie that never worked would have been abandoned long ago.",
          "What does it cost them now, in the story's present?",
          "What truth would free them, and what event could force them to face it?",
        ],
      },
      {
        type: "exercise-inline",
        prompt:
          "Complete the chain for your protagonist: *Because [wound], they believe [lie]. So they want [want]. What they actually need to learn is [truth].*",
        placeholder: "Because her father missed every recital, she believes…",
      },
    ],
    keyTakeaways: [
      "The wound is a painful event from the past; the lie is the false belief the character built to protect themselves from it.",
      "The lie shapes the character's want and behaviour, and the truth that overturns it is their need.",
      "A good lie makes behaviour logical: it once protected the character, which is exactly why they cling to it.",
      "Show the lie through present-tense choices and reveal the wound sparingly. The audience should feel it before they're told it.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What's the relationship between a character's wound and their lie?",
        options: [
          "They're two names for the same backstory event.",
          "The wound is the painful event; the lie is the false belief the character concluded from it.",
          "The lie is what other characters wrongly believe about the protagonist.",
          "The wound is internal; the lie is the external obstacle in the plot.",
        ],
        answerIndex: 1,
        explanation:
          "The wound is what happened; the lie is what the character decided it meant. Two people can suffer the same wound and draw different lies from it, which is why the lie, not the wound, is what drives behaviour in your story's present.",
      },
      {
        id: "q2",
        prompt: "Why does Marlin's overprotectiveness in *Finding Nemo* feel sympathetic rather than simply irritating?",
        options: [
          "He's funny, so the audience forgives him.",
          "Other characters explain his behaviour on his behalf.",
          "We witness the wound in the opening scene, so his lie feels completely logical even as we see its cost.",
          "He's right: the ocean really is too dangerous for Nemo.",
        ],
        answerIndex: 2,
        explanation:
          "The opening barracuda attack lets the audience experience the wound alongside Marlin. From then on, his smothering rules read as love shaped by grief. We understand the lie, which is what lets us root for him to outgrow it.",
      },
      {
        id: "q3",
        prompt:
          "A draft opens with a four-minute flashback of the hero's childhood trauma, followed by the hero explaining to a friend how it shaped her. What's the best note?",
        options: [
          "Show the lie in her present-day choices, and let the wound surface later, partially.",
          "Make the flashback longer so it lands harder.",
          "Cut the wound entirely, because backstory never matters.",
          "Move the explanation into voiceover.",
        ],
        answerIndex: 0,
        explanation:
          "The wound matters, but front-loading it and then explaining it leaves the audience nothing to discover. Let them watch the lie steer her choices first; when the wound finally surfaces, it answers a question they've been asking instead of one they never had.",
      },
      {
        id: "q4",
        prompt: "Which of these is the strongest *lie* for a character to believe?",
        options: [
          "She's sad because her mother left.",
          "She's always hated Mondays.",
          "She's afraid of spiders.",
          "*If I'm the best at everything, no one will ever leave me again.*",
        ],
        answerIndex: 3,
        explanation:
          "A lie is a belief that dictates behaviour. The first option names a wound and a feeling, but no conclusion; the others are traits. *If I'm the best, no one will leave* tells you what she'll chase, how she'll treat people and what truth could set her free.",
      },
    ],
    exercise: {
      prompt:
        "Tell a true two-minute story about a time you believed something about yourself or the world that turned out to be false: what you believed, why it made sense, what cracked it and what you believe now. Then tell it to a live listener in the Campfire Story drill.",
      tips: [
        "Open inside the lie, back when it was still working for you.",
        "Mark the moment it cracked with a concrete detail: a place, an object, something someone said.",
        "Don't over-explain the wound. One precise image beats a paragraph of backstory.",
        "End with how you behave differently now, not just how you feel.",
      ],
      practiceScenarioId: "campfire-story",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Active protagonists
  // -------------------------------------------------------------------------
  {
    id: "active-protagonists",
    trackId: "character",
    title: "Active Protagonists: Choices Under Pressure",
    summary:
      "Audiences can sympathise with a passive hero, but they can't follow one. Build protagonists whose choices drive the plot, and dilemmas that reveal who they are.",
    minutes: 8,
    level: "intermediate",
    skills: ["character", "conflict"],
    blocks: [
      { type: "heading", text: "Things shouldn't just happen to your hero" },
      {
        type: "text",
        body: "One of the most common notes on early drafts is some version of *your protagonist is passive*. Things happen to them. Other characters make the decisions. They're swept from scene to scene by events. An audience can sympathise with a passive character, but it can't follow one, because nothing the character does determines what happens next.",
      },
      {
        type: "text",
        body: "An **active protagonist** pursues a goal and makes choices that cause the plot. Active doesn't mean loud, violent or constantly on the move. It means the story's major turns are driven by the character's own decisions, and that those decisions cost them something.",
      },
      {
        type: "quote",
        text: "True character is revealed in the choices a human being makes under pressure — the greater the pressure, the greater the revelation.",
        attribution: "Robert McKee, *Story*",
      },
      {
        type: "text",
        body: "McKee separates **characterisation**, the observable surface of age, job, clothes and wit, from **true character**, which only choice can reveal. A character who says they're brave tells us nothing. A character who stays when running would be easier tells us everything. And the harder the choice, the more it reveals.",
      },
      {
        type: "example",
        title: "A hero who can't leave his chair",
        source: "Rear Window (1954), dir. Alfred Hitchcock",
        body: "L.B. Jefferies spends almost the entire film in a wheelchair with a broken leg, confined to his apartment. On paper he's the most passive protagonist imaginable. Yet he drives every turn of the plot. He decides that a neighbour, Lars Thorwald, has murdered his wife. He recruits his girlfriend Lisa and his nurse Stella, sends Thorwald an anonymous note, and phones him to lure him out of his apartment so it can be searched.\n\nEach choice raises the risk, until Thorwald works out who has been watching and comes for him. Even then, trapped in the dark, Jeff fights back with the only weapon he has: the flashbulbs of his camera. Hitchcock proves that being active is about choices, not movement.",
      },
      {
        type: "compare",
        weakLabel: "Passive",
        weak: "Detective Ruiz gets a call about a body. At the scene, her partner notices a matchbook from a nightclub. Her captain orders her to check it out. At the club, a waitress confesses everything.",
        strongLabel: "Active",
        strong:
          "Detective Ruiz spots a matchbook the crime-scene team missed and pockets it instead of logging it, because the club belongs to her brother. She goes alone, off the books, and lies to her captain about where she's been.",
        note: "Same clue. In the first version other people make every decision. In the second, each choice is Ruiz's own, each one costs her something, and each creates a fresh problem.",
      },
      { type: "heading", text: "Dilemmas, not easy choices" },
      {
        type: "text",
        body: "A choice between good and evil isn't much of a choice: any decent character picks good, and the audience learns nothing. The revealing choices are **dilemmas**: two things the character values that they can't both keep, or two bad options where they must pick the lesser evil. Loyalty or honesty. Career or family. Saving one person or saving many. Whatever they choose, they lose something, and what they're willing to lose is who they are.",
      },
      { type: "heading", text: "The passivity checklist" },
      {
        type: "list",
        items: [
          "Other characters make the key decisions, or tell the hero what to do next.",
          "The hero is rescued, or the problem solves itself through luck.",
          "The hero wants something but never takes a risk to get it.",
          "The climax is decided by someone else's action.",
          "You could delete the protagonist and most of the plot would still happen.",
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Reactive first, proactive by the end of act one",
        body: "It's normal for a protagonist to begin by reacting: the inciting incident usually happens *to* them. But by the end of the first act they need to seize the initiative, and from then on the story should run on their choices. Former Pixar story artist Emma Coats made the point bluntly in her list of story basics: give your characters opinions, because a passive, malleable character may seem likable to you as you write, but it's poison to the audience.",
      },
      {
        type: "exercise-inline",
        prompt:
          "List the five biggest turning points in your story. Next to each, write whose choice caused it. How many belong to your protagonist?",
        placeholder: "1. The pitch meeting collapses. Caused by…",
      },
    ],
    keyTakeaways: [
      "An active protagonist pursues a goal and makes choices that drive the plot's major turns.",
      "Active means choosing, not moving: a character stuck in a chair can still drive every scene.",
      "True character is revealed by choices under pressure, and the harder the choice, the more it reveals.",
      "Give characters dilemmas rather than easy good-versus-evil choices.",
      "Let the climax turn on the protagonist's decision, never on luck or a rescue.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which protagonist is the most *active*?",
        options: [
          "A soldier who survives a battle because an airstrike arrives just in time.",
          "A bedridden grandmother who secretly coaches her grandson through a chess tournament by phone, against her doctor's orders.",
          "A teenager whose parents decide to move the family to Tokyo.",
          "A detective whose partner solves the case while she's in hospital.",
        ],
        answerIndex: 1,
        explanation:
          "The grandmother can barely move, yet she's the only one making a risky choice in pursuit of a goal, and paying for it. The soldier is rescued, the teenager is moved and the detective is sidelined. Like Jeff in *Rear Window*, activity is about decisions, not mobility.",
      },
      {
        id: "q2",
        prompt: "Using McKee's distinction, which moment reveals *true character* rather than characterisation?",
        options: [
          "We learn the heroine is a surgeon with a sharp sense of humour.",
          "A friend's wedding toast describes the hero as the bravest man he knows.",
          "A nurse reports the doctor she loves, knowing it will end both his career and their relationship.",
          "The villain wears a black coat and speaks softly.",
        ],
        answerIndex: 2,
        explanation:
          "Job, humour, reputation and wardrobe are characterisation: surface information. The nurse's choice is made under pressure and costs her something she values, so it shows us what she values more. That's true character.",
      },
      {
        id: "q3",
        prompt:
          "At the climax, your hero must choose between saving the city and taking the villain's bribe. What's the best note?",
        options: [
          "Turn it into a dilemma: make both options things she genuinely values, so either choice costs her.",
          "Add more explosions to raise the stakes.",
          "Let her mentor make the decision for her.",
          "Keep it as it is; the clearer the moral choice, the better.",
        ],
        answerIndex: 0,
        explanation:
          "Good versus money is no contest for a hero, so the choice reveals nothing. If the bribe were, say, the only way to pay for her daughter's treatment, the audience would genuinely not know what she'll do, and whatever she chooses would define her.",
      },
      {
        id: "q4",
        prompt:
          "In your draft's climax, the hero is cornered by the villain until the police burst in unexpectedly. What's the core problem?",
        options: [
          "The scene runs too long.",
          "The police should arrive earlier.",
          "The villain isn't threatening enough.",
          "The resolution comes from outside the protagonist, so her choices don't answer the story's central question.",
        ],
        answerIndex: 3,
        explanation:
          "A rescue at the climax takes the story's decisive action away from the hero. However well it's staged, the audience feels cheated, because the whole film promised that *her* choices would determine the outcome.",
      },
    ],
    exercise: {
      prompt:
        "Break your story into its major turns. Rebuild any turn caused by luck or by another character so that it's caused by your protagonist's choice under pressure. Then test it in the Writers' Room, where a showrunner will push on every act break.",
      tips: [
        "For each act break, ask: what does my protagonist decide here, and what does it cost?",
        "Replace at least one rescue with a choice.",
        "Look for dilemmas: two things your character values that they can't both keep.",
        "Reacting to the inciting incident is fine. By the end of act one, your protagonist should be driving.",
      ],
      practiceScenarioId: "writers-room-break",
    },
  },

  // -------------------------------------------------------------------------
  // 4. Antagonists and mirror characters
  // -------------------------------------------------------------------------
  {
    id: "antagonists-and-mirrors",
    trackId: "character",
    title: "Antagonists, Opposing Forces & Mirror Characters",
    summary:
      "A hero is measured by what they're up against. Build antagonists who believe they're right, and mirror characters who show the hero the road not taken.",
    minutes: 8,
    level: "intermediate",
    skills: ["conflict", "character"],
    blocks: [
      { type: "heading", text: "Your story is only as strong as its opposition" },
      {
        type: "text",
        body: "If the opposition is weak, the hero never has to stretch, and the audience never doubts the outcome. Robert McKee calls this the *principle of antagonism*: a protagonist, and the story around them, can only be as compelling as the forces working against them. Build the opposition first, and your hero grows stronger out of necessity.",
      },
      {
        type: "text",
        body: "Those forces come in layers. There's the **antagonist**, a character whose goals collide with the hero's. There are **wider forces**: nature, society, institutions, time running out. And there's the **inner opposition**, the hero's own lie and fear. The richest stories press on all three at once, so that the outer fight keeps forcing the inner one.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Nobody thinks they're the villain",
        body: "The antagonist is the hero of their own story. They have a want, a wound and a worldview, and from inside that worldview their actions make sense. The best antagonists have a point: they say something about the world that the hero, and the audience, can't easily dismiss.",
      },
      {
        type: "compare",
        weakLabel: "Evil for its own sake",
        weak: "The developer wants to bulldoze the community garden because he's greedy and cruel, and he smirks when the gardeners cry.",
        strongLabel: "Believes they're right",
        strong:
          "The developer grew up in this town and watched the factory close. He wants to replace the garden with a clinic and forty affordable flats, and he has a waiting list of families to prove the town needs them.",
        note: "Now the gardeners' fight has a cost. To win, the hero has to answer a real argument, and the audience feels torn, which is exactly where you want them.",
      },
      {
        type: "example",
        title: "A villain with a case",
        source: "Black Panther (2018), dir. Ryan Coogler",
        body: "Erik Killmonger is T'Challa's cousin: the son of a Wakandan prince killed by T'Challa's father, left behind as a boy in Oakland. He grew up knowing that Wakanda, rich and hidden, did nothing while people of African descent around the world suffered. His plan is to seize the throne and send Wakanda's weapons to the oppressed everywhere.\n\nHis methods are brutal, but his accusation lands: Wakanda's isolation *has* had a cost. That's what makes him so unsettling. T'Challa defeats him, but can't dismiss him, and the film ends with the new king opening an outreach centre in Oakland and choosing to share Wakanda with the world. The antagonist loses the fight but wins part of the argument, and the hero grows because of it.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Make them want the same thing",
        body: "The most reliable way to guarantee collision is to have hero and antagonist compete for the same goal: the same job, the same person, the same town, the same throne. When only one of them can win, every scene between them has stakes built in.",
      },
      { type: "heading", text: "Mirror characters: the road not taken" },
      {
        type: "text",
        body: "A **mirror character**, sometimes called a foil, reflects the protagonist: a similar situation, a similar wound, similar skills, but different choices. Mirrors let the audience glimpse the hero's possible futures. An antagonist can be a mirror, and some of the most haunting ones are, because they show what the hero might become if they chose differently.",
      },
      {
        type: "example",
        title: "The cop and the thief over coffee",
        source: "Heat (1995), dir. Michael Mann",
        body: "Detective Vincent Hanna and career thief Neil McCauley are on opposite sides of the law and almost the same man: disciplined, obsessive professionals who have sacrificed everything else to the work. Hanna's marriage is falling apart. McCauley lives by a rule never to get attached to anything he couldn't walk away from in seconds.\n\nMidway through the film, Hanna pulls McCauley over on the freeway and invites him for coffee. They talk honestly, almost warmly, and agree that if it comes to it, neither will hesitate to kill the other. The scene works because each man is looking at his reflection, and their final confrontation plays as a duel between two versions of the same life.",
      },
      {
        type: "list",
        items: [
          "**The fallen mirror**: someone who faced the hero's dilemma and chose badly, showing the cost of the lie. In *The Dark Knight*, Harvey Dent is Gotham's crusading hero until grief turns him into Two-Face.",
          "**The redeemed mirror**: someone who has already made the hero's journey, living proof that the truth is survivable.",
          "**The rival mirror**: an antagonist who wants what the hero wants, for different reasons, so only one can have it.",
          "**The shadow**: an antagonist who embodies the hero's hidden flaw, pushed to its extreme.",
        ],
      },
      {
        type: "exercise-inline",
        prompt:
          "Write your antagonist's logline as if they were the hero of the film. What do they want, why do they believe they're right, and what does your protagonist look like from their side?",
        placeholder: "When a reckless outsider threatens everything she's built…",
      },
    ],
    keyTakeaways: [
      "A protagonist, and a story, can only be as strong as the forces of opposition.",
      "Great antagonists believe they're right, and often have a point the hero must answer.",
      "Opposition works in layers: the antagonist, wider forces such as nature or society, and the hero's own inner lie.",
      "Mirror characters show the hero's possible futures, the road not taken, and make the theme visible.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which antagonist setup is strongest?",
        options: [
          "A warlord who destroys villages because he enjoys it.",
          "A rival chef who wants the same Michelin star as the hero, and genuinely believes the hero's cooking is a gimmick that cheapens the craft.",
          "A storm that appears without warning in the final act.",
          "A shadowy figure whose motives are never revealed or felt.",
        ],
        answerIndex: 1,
        explanation:
          "The rival competes for the same goal, so collision is guaranteed, and has a sincere worldview that challenges the hero. The warlord's cruelty is a trait rather than a motive, the storm arrives too late to shape the story, and the shadowy figure gives the hero nothing to push against.",
      },
      {
        id: "q2",
        prompt: "What makes Killmonger in *Black Panther* more than a standard villain?",
        options: [
          "His fighting skills exceed T'Challa's.",
          "He's given a tragic death scene.",
          "His critique of Wakanda's isolation is partly right, so the hero has to grow in response to it.",
          "He's related to the hero.",
        ],
        answerIndex: 2,
        explanation:
          "Plenty of villains are skilled, related to the hero or die tragically. Killmonger stands out because his argument lands. T'Challa can defeat him in combat but must still answer him, and the film's ending shows the hero changed by the antagonist's point of view.",
      },
      {
        id: "q3",
        prompt: "In *Heat*, what does the coffee-shop scene between Hanna and McCauley achieve?",
        options: [
          "It reveals the two men as mirrors, so their final confrontation feels like a duel with a reflection.",
          "It gives the audience a break from the action with some comic relief.",
          "It resolves their conflict so the finale can focus on the heist.",
          "It reveals that Hanna secretly sympathises with crime.",
        ],
        answerIndex: 0,
        explanation:
          "The scene resolves nothing; if anything, it sharpens the conflict by making both men say out loud that they'd kill each other. What it adds is recognition: two obsessives seeing themselves across the table. That turns the ending from cop-catches-robber into something closer to tragedy.",
      },
      {
        id: "q4",
        prompt:
          "Your protagonist is a whistleblower deciding whether to go public. Which *mirror* character would sharpen the theme the most?",
        options: [
          "A comic-relief colleague at the same company.",
          "A journalist who wants the scoop.",
          "A love interest from outside the company.",
          "A former colleague who stayed silent years ago and has since built a comfortable, hollow life on that silence.",
        ],
        answerIndex: 3,
        explanation:
          "The former colleague faced the same dilemma and chose the other way. Every scene with him shows the hero one possible future, which dramatises the theme far more vividly than any conversation about it could. The others have roles to play, but they don't reflect her choice back at her.",
      },
    ],
    exercise: {
      prompt:
        "Write a paragraph from your antagonist's point of view, as if they were pitching their own film. Then pitch your story to a skeptical development exec in the Studio Pitch drill, and be ready for the question every exec asks: who, or what, stands in the way?",
      tips: [
        "Give your antagonist a want, a wound and a worldview, not just a plan.",
        "Find the one thing your antagonist says that your hero can't easily answer.",
        "In the pitch, describe the antagonist in one sentence that makes them sound both dangerous and reasonable.",
        "If your opposition is a force, like nature or a system, give it a human face somewhere in the story.",
      ],
      practiceScenarioId: "studio-pitch",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Character arcs
  // -------------------------------------------------------------------------
  {
    id: "character-arcs",
    trackId: "character",
    title: "Character Arcs: Positive, Negative & Flat",
    summary:
      "Redemption, tragedy or the steadfast hero who changes the world. Learn the three shapes of character change and how to make an arc feel earned.",
    minutes: 9,
    level: "advanced",
    skills: ["character", "structure"],
    blocks: [
      { type: "heading", text: "An arc is a change in belief" },
      {
        type: "text",
        body: "A **character arc** is how a character changes across a story, and it's best understood as a change in what they believe. The lie from earlier lessons is the arc's starting point; what the character believes at the end is its destination. The plot's job is to apply pressure until that belief has to move, or break.",
      },
      {
        type: "text",
        body: "There are three broad shapes, and each makes a different promise to the audience.",
      },
      {
        type: "list",
        items: [
          "**Positive arc**: the character overcomes the lie, embraces the truth and is better for it. The shape of redemption and growth.",
          "**Negative arc**: the character fails to overcome the lie, or trades it for a worse one, and ends diminished or destroyed. The shape of tragedy.",
          "**Flat arc**: the character already holds the truth, and changes the world around them instead. The shape of the steadfast hero.",
        ],
      },
      {
        type: "example",
        title: "The positive arc in its purest form",
        source: "A Christmas Carol (1843), Charles Dickens",
        body: "Ebenezer Scrooge believes money is the only thing in the world worth trusting. The Ghost of Christmas Past shows where that lie took root: a lonely boy left at school over the holidays, and the young woman, Belle, who released him from their engagement because money had come to matter more to him than she did.\n\nEach spirit applies more pressure, until the Ghost of Christmas Yet to Come shows him his own neglected grave. Scrooge wakes on Christmas morning changed, and proves it through action: he sends the prize turkey from the poulterer's window to the Cratchits, raises Bob's salary and becomes a second father to Tiny Tim. The truth isn't announced. It's enacted.",
      },
      {
        type: "example",
        title: "The negative arc: Michael Corleone",
        source: "The Godfather (1972), dir. Francis Ford Coppola",
        body: "At his sister's wedding, Michael arrives in his Marine uniform and tells his girlfriend Kay that his family's business is his family, not him. He's the outsider, the war hero, the son with a clean future. After the attempt on his father's life, he coolly volunteers to kill the men responsible himself, and every choice after that pulls him deeper.\n\nBy the end he's head of the family, orchestrating the murders of his rivals while he stands as godfather at his nephew's baptism, then looking Kay in the eye and lying about it. In the final shot, a door closes on her as his captains pay their respects. Michael wins everything the plot offers and loses the self we met in the first scene. That's the tragic arc: winning the want, losing the soul.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "The many shapes of tragedy",
        body: "Negative arcs come in several varieties. In a **fall**, the character clings to the lie until it destroys them or the people around them. In a **corruption** arc, a decent person trades their truth for a seductive lie; Vince Gilligan has described *Breaking Bad* as the story of turning Mr. Chips into Scarface. In a **disillusionment** arc, the character does learn the truth, but it's devastating: Jake Gittes in *Chinatown* uncovers the conspiracy only to find he's powerless to stop it.",
      },
      {
        type: "text",
        body: "In a **flat arc**, the protagonist doesn't need to change, because they already know the truth. The arc belongs to the people around them. Mary Poppins doesn't learn a thing; Mr. Banks, the rigid banker who runs his household like a ledger, ends the film flying a kite with his children in the park. Flat-arc heroes are tested rather than transformed: the world pressures them to abandon their truth, and the drama is whether they'll hold.",
      },
      {
        type: "beats",
        title: "A positive arc across three acts",
        frameworkId: "three-act",
        beats: [
          {
            name: "Setup: the lie at work",
            description: "Show the lie serving the character, and hint at what it's costing them.",
          },
          {
            name: "Plot point one: committed, still wrong",
            description: "They pursue the want using the lie's logic, and it half works.",
          },
          {
            name: "Midpoint: a glimpse of truth",
            description: "They experience the truth briefly, or see its value, but don't yet embrace it.",
          },
          {
            name: "Crisis: the lie's full cost",
            description: "Holding onto the lie now threatens everything they care about. They must choose.",
          },
          {
            name: "Climax: acting on the truth",
            description: "They make a choice only the changed person could make.",
          },
          {
            name: "Resolution: the new self",
            description: "Show the change in behaviour, ideally echoing an image or choice from the opening.",
          },
        ],
      },
      {
        type: "compare",
        weakLabel: "Change announced",
        weak: "In the last scene, the workaholic father tells his daughter, “I've learned that family matters more than work.”",
        strongLabel: "Change enacted",
        strong:
          "In the first scene, he takes a work call during her recital. In the last, his phone buzzes in the front row with the call he's waited all film for, and he turns it face down without looking.",
        note: "Build the arc's bookends as a pair: the same kind of choice, early and late, with a different answer. The audience measures the distance for themselves.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Earn it in increments",
        body: "Arcs fail when the change happens all at once in the final act. Move the character in steps: a crack in the lie, a backslide, a costly partial choice, a relapse under pressure, then the decisive act. Every step should be caused by the plot, not by the page count.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write the first and last significant choices your protagonist makes, ideally in the same or a similar situation. What's different? Which arc does that make: positive, negative or flat?",
        placeholder: "First choice: … Last choice: …",
      },
    ],
    keyTakeaways: [
      "A character arc is a change in belief, from the lie at the start to what the character believes at the end.",
      "Positive arcs overcome the lie; negative arcs cling to it or trade it for something worse; flat arcs hold the truth and change the world instead.",
      "Show change through choices, ideally bookended: the same kind of choice early and late, with a different answer.",
      "Build arcs in increments, with cracks, backslides and costly partial choices before the decisive act.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A heroine who is already kind and principled refuses to compromise, and by the end the cynical town around her has changed. Which arc is this?",
        options: ["Positive arc", "Negative arc", "Flat arc", "No arc, because nothing changed"],
        answerIndex: 2,
        explanation:
          "She starts with the truth and holds it under pressure, while the world around her transforms. That's a flat arc, like Mary Poppins and the Banks family. Something very much changed; it just wasn't the protagonist.",
      },
      {
        id: "q2",
        prompt: "Why is Michael Corleone's story a *negative* arc even though he ends up on top?",
        options: [
          "He gains everything he pursues but loses the self and the relationships he started with.",
          "The film ends on a sad note.",
          "He's the antagonist of the film.",
          "He never makes an active choice.",
        ],
        answerIndex: 0,
        explanation:
          "Arcs are measured by who the character becomes, not by whether they win. Michael makes a string of active, costly choices that give him power and strip away his conscience, his marriage and the man we met at the wedding.",
      },
      {
        id: "q3",
        prompt: "What's the strongest way to show that a workaholic has changed?",
        options: [
          "A monologue in which he explains what he's learned.",
          "A voiceover over the final scene.",
          "Other characters remarking on how different he seems.",
          "A late choice that mirrors an early one, with the opposite answer and a real cost.",
        ],
        answerIndex: 3,
        explanation:
          "Telling the audience about the change, whether through monologue, voiceover or other characters, asks them to take it on trust. A mirrored choice lets them see the distance travelled, and the cost proves the change is real.",
      },
      {
        id: "q4",
        prompt: "In a positive arc, what typically happens around the midpoint?",
        options: [
          "The character fully overcomes the lie.",
          "The character glimpses the truth or its value, but hasn't yet embraced it.",
          "The antagonist is finally defeated.",
          "The wound is revealed for the first time.",
        ],
        answerIndex: 1,
        explanation:
          "If the lie were fully overcome at the midpoint, the second half would have nowhere to go. A glimpse of the truth raises the stakes: now the character knows what's possible, which makes the crisis, when the lie's full cost arrives, all the more painful.",
      },
      {
        id: "q5",
        prompt: "In a corruption arc like Walter White's in *Breaking Bad*, what's the essential movement?",
        options: [
          "A bad person gradually becomes good.",
          "A character learns the truth but is powerless to act on it.",
          "A person who starts out decent trades that decency, choice by choice, for a seductive lie.",
          "A character stays the same while the world around him changes.",
        ],
        answerIndex: 2,
        explanation:
          "The corruption arc runs a positive arc in reverse: each choice moves the character further from the truth. The first option describes a positive arc, the second a disillusionment arc and the fourth a flat arc.",
      },
    ],
    exercise: {
      prompt:
        "Map your protagonist's arc onto your story's structure: the lie at the start, the midpoint glimpse, the crisis where the lie's full cost arrives and the choice at the climax. Then paste a synopsis into Story Lab and check whether the character beats land where the structural beats do.",
      tips: [
        "Decide first which arc you're writing: positive, negative or flat. Each shapes the ending differently.",
        "Write the first and last choices as a matched pair.",
        "Put at least one backslide in the second half. Arcs that only ever move forward feel unearned.",
        "In a flat arc, track the change in the supporting characters instead.",
      ],
      labTool: "story",
    },
  },
];
