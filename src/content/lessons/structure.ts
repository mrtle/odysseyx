import type { Lesson } from "@/lib/types";

/**
 * Track 2 — Structure & Plot: charting the voyage.
 * Three acts, the Hero's Journey (via the Odyssey), Save the Cat, short-form
 * maps, and structures beyond conflict and chronology.
 */
export const structureLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. Three-act structure
  // -------------------------------------------------------------------------
  {
    id: "three-act-structure",
    trackId: "structure",
    title: "Three Acts and the Turning Points That Hinge Them",
    summary:
      "Beginning, middle and end, and the irreversible turning points that push a story from one act into the next.",
    minutes: 8,
    level: "beginner",
    skills: ["structure", "pacing"],
    blocks: [
      { type: "heading", text: "Beginning, middle, end, and the hinges between" },
      {
        type: "text",
        body: "More than two thousand years ago, Aristotle observed in the *Poetics* that a complete story has a beginning, a middle and an end. It sounds obvious until you try to build one. In 1979 the screenwriting teacher Syd Field gave the idea its modern shape for film (setup, confrontation, resolution) and argued that what separates the acts isn't page count but **turning points**.",
      },
      {
        type: "text",
        body: "A turning point is an event that spins the story in a new direction and can't be undone. It changes what the protagonist wants or how they have to pursue it. If you could delete a so-called turning point and the next scene would still make sense, it isn't one.",
      },
      {
        type: "beats",
        title: "The Wizard of Oz in three acts",
        frameworkId: "three-act",
        beats: [
          {
            name: "Setup",
            description: "Kansas, in sepia. Dorothy feels unheard on the farm and dreams of a place somewhere over the rainbow.",
          },
          {
            name: "Inciting Incident",
            description:
              "Miss Gulch arrives with an order to take Toto away. Toto escapes, Dorothy runs away from home to protect him, and a twister is coming.",
          },
          {
            name: "Plot Point One",
            description:
              "The twister carries her house to Oz and the film bursts into Technicolor. With the Wicked Witch of the West now her enemy, Dorothy commits to a goal: reach the Wizard, who can send her home.",
          },
          {
            name: "Rising Action",
            description:
              "The yellow brick road. She gathers the Scarecrow, the Tin Man and the Cowardly Lion while the Witch throws obstacles in their path.",
          },
          {
            name: "Midpoint",
            description:
              "They reach the Wizard at last, and he refuses to help until they bring him the Witch's broomstick. The goal flips from *reach the Wizard* to *defeat the Witch*.",
          },
          {
            name: "Crisis / Plot Point Two",
            description:
              "Dorothy is captured and locked in the Witch's castle while an hourglass runs down her time. It's her darkest moment.",
          },
          {
            name: "Climax",
            description:
              "Her friends break into the castle to rescue her. When the Witch sets the Scarecrow alight, Dorothy throws water to save him, and the Witch melts.",
          },
          {
            name: "Resolution",
            description:
              "The Wizard is exposed as an ordinary man, Glinda reveals the ruby slippers could always take her home, and Dorothy wakes in sepia Kansas surrounded by the people who love her.",
          },
        ],
      },
      {
        type: "example",
        title: "Luke's point of no return",
        source: "Star Wars (1977), dir. George Lucas",
        body: "When Obi-Wan Kenobi asks Luke Skywalker to come with him to Alderaan, Luke says no. He's needed on his uncle's farm. Then he races home to find the farm burned and his aunt and uncle killed by Imperial stormtroopers. He goes back to Obi-Wan and says he wants to come after all.\n\nThat's a textbook Plot Point One: an irreversible event plus a *choice*. The farm-boy life is gone for good, and Luke steps into the conflict of Act Two of his own accord. The choice matters as much as the event, because a hero who is simply dragged into Act Two is much harder to root for.",
      },
      {
        type: "compare",
        weakLabel: "Soft act break",
        weak: "End of Act One: Maya starts her new job as a junior reporter at the city paper.",
        strongLabel: "Real turning point",
        strong:
          "End of Act One: against her editor's orders, Maya publishes the story naming the mayor in the bribery scandal. There's no taking it back.",
        note: "A new job is a change of scenery. A published story is a point of no return: it creates enemies, a new goal and a price.",
      },
      { type: "heading", text: "The middle is where stories drown" },
      {
        type: "text",
        body: "Act Two is usually about half the running time, and it's where most drafts sink, with the protagonist drifting from obstacle to obstacle and no sense of direction. The fix is a strong **midpoint**: a reversal or revelation around halfway through that raises the stakes and changes the approach. In *The Wizard of Oz*, reaching the Wizard should be the end of the road. Instead it becomes the start of a far more dangerous mission.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Proportions, not laws",
        body: "As a rough guide, Act One takes about a quarter of the story, Act Two about half and Act Three the final quarter. In a 100-minute film, expect the first act break somewhere around the 25-minute mark. Treat these numbers as smoke alarms: if your inciting incident arrives halfway through, your audience has probably been waiting too long.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Every scale has three acts",
        body: "Three-act shape isn't only for features. A good scene has a setup, a turn and an outcome, and so do a joke, a wedding toast, a 30-second ad and a pitch. Once you can feel the hinges, you'll find them everywhere.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Name the three hinges of your story in one sentence each: the **inciting incident**, the **point of no return** that ends Act One, and the **lowest point** that ends Act Two.",
        placeholder: "Inciting incident: …\nPoint of no return: …\nLowest point: …",
      },
    ],
    keyTakeaways: [
      "Acts are defined by turning points, not by page counts.",
      "A true turning point is irreversible and changes what the protagonist wants or how they must pursue it.",
      "The best Plot Point One combines an event with the protagonist's choice to engage.",
      "A strong midpoint stops the long second act from sagging.",
      "Three-act shape works at every scale, from a feature film to a single scene to a toast.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What makes an event a genuine turning point?",
        options: [
          "It happens exactly 25% of the way through.",
          "It's the most visually spectacular moment in the act.",
          "It's irreversible and changes what the protagonist wants or how they must pursue it.",
          "It introduces a new character.",
        ],
        answerIndex: 2,
        explanation:
          "Turning points are defined by what they *do*, not where they fall or how big they look. If the story could carry on unchanged without the event, it isn't a turning point. A real one closes a door behind the protagonist and points them somewhere new.",
      },
      {
        id: "q2",
        prompt:
          "In *Star Wars*, why is Luke's decision after finding the farm destroyed as important as the destruction itself?",
        options: [
          "It shows Luke choosing to enter the conflict, which makes him an active protagonist we can root for.",
          "It proves that Obi-Wan had been lying to him.",
          "It sets up a romance with Leia.",
          "It isn't important; the event does all the work.",
        ],
        answerIndex: 0,
        explanation:
          "The destruction removes Luke's reason to stay, but his decision to go is what makes him a protagonist rather than a passenger. Strong act breaks pair an external event with the character's own commitment.",
      },
      {
        id: "q3",
        prompt:
          "Your Act Two feels saggy: the hero just faces one obstacle after another. What's the most targeted fix?",
        options: [
          "Add more obstacles.",
          "Cut Act Two down to a few minutes.",
          "Add a long flashback.",
          "Add a midpoint reversal that raises the stakes and changes how the hero pursues the goal.",
        ],
        answerIndex: 3,
        explanation:
          "A saggy middle usually means Act Two has no shape. A midpoint splits it into two movements with different energies, often turning a reactive hero into a proactive one, and it gives the audience a fresh reason to lean in.",
      },
      {
        id: "q4",
        prompt: "Which is the strongest Plot Point One for a heist story?",
        options: [
          "The crew meets for drinks to discuss the idea.",
          "The crew steals the vault's blueprints and is caught on camera, so now they must pull the job before the police connect the dots.",
          "The safecracker agrees to think about it.",
          "The leader buys new equipment.",
        ],
        answerIndex: 1,
        explanation:
          "Stealing the blueprints on camera can't be undone. It commits the crew, adds a clock and raises the stakes in one move. The other options are preparations or maybes, and the story could still turn back after any of them.",
      },
    ],
    exercise: {
      prompt:
        "Outline a story you're working on, or a film you love, in three acts, naming each turning point. Map it in the Story Lab with the Three-Act framework, then try breaking an episode under pressure in the Writers' Room drill.",
      tips: [
        "For each act break, ask: what can't be undone after this?",
        "Make Plot Point One a choice, not just something that happens to the hero.",
        "Look for a midpoint that changes the goal or the approach, not just the location.",
      ],
      practiceScenarioId: "writers-room-break",
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 2. The Hero's Journey, via the Odyssey
  // -------------------------------------------------------------------------
  {
    id: "heros-journey",
    trackId: "structure",
    title: "The Hero's Journey: Sailing with Odysseus",
    summary:
      "Joseph Campbell's monomyth and Christopher Vogler's twelve stages, mapped onto the voyage that gave OdysseusX its name, and how to use the pattern without becoming a slave to it.",
    minutes: 9,
    level: "beginner",
    skills: ["structure", "character"],
    blocks: [
      { type: "heading", text: "One story, a thousand faces" },
      {
        type: "text",
        body: "In *The Hero with a Thousand Faces* (1949), the mythologist Joseph Campbell argued that myths from all over the world share a common pattern, which he called the **monomyth**. A hero leaves the everyday world, faces trials in a realm of wonder, wins a decisive victory and returns with the power to help others. George Lucas has credited Campbell's book as an influence on *Star Wars*.",
      },
      {
        type: "text",
        body: "Decades later, Christopher Vogler, then working in Hollywood story development, distilled Campbell into a short practical guide for writers, later expanded into the book *The Writer's Journey*. His twelve stages are the version most screenwriters use today, and there's no better way to learn them than the long voyage home of Odysseus.",
      },
      {
        type: "beats",
        title: "The Odyssey as a Hero's Journey",
        frameworkId: "heros-journey",
        beats: [
          {
            name: "Ordinary World",
            description:
              "Ithaca. Odysseus is king, husband to Penelope and father to the infant Telemachus. It's the home he'll spend twenty years trying to get back to.",
          },
          {
            name: "Call to Adventure",
            description:
              "The Trojan War calls him away. Ten years later, when Troy finally falls, the call that drives the *Odyssey* sounds: get home.",
          },
          {
            name: "Refusal of the Call",
            description:
              "In a legend told after Homer, Odysseus pretends to be mad to dodge the war until his bluff is exposed. Heroes rarely leave home willingly.",
          },
          {
            name: "Meeting the Mentor",
            description:
              "The goddess Athena guides him and his son, sometimes disguised as Odysseus's old friend Mentor, whose name gave English the word *mentor*.",
          },
          {
            name: "Crossing the Threshold",
            description:
              "Rounding Cape Malea, a storm drives his fleet off every known chart and into a world of lotus-eaters, giants and witches. There's no sailing back the way he came.",
          },
          {
            name: "Tests, Allies, Enemies",
            description:
              "The Cyclops Polyphemus. A bag of winds his crew rips open within sight of home. Cannibal giants. The enchantress Circe, who turns his men into pigs before becoming an ally.",
          },
          {
            name: "Approach to the Inmost Cave",
            description:
              "To learn the way home, he must journey to the land of the dead and consult the ghost of the prophet Tiresias. It's about as literal an inmost cave as storytelling offers.",
          },
          {
            name: "The Ordeal",
            description:
              "Past the Sirens and between Scylla and Charybdis, his starving crew slaughter the sacred cattle of the Sun on the island of Thrinacia. Zeus destroys the ship. Every companion dies; only Odysseus survives.",
          },
          {
            name: "Reward",
            description:
              "After seven years with the nymph Calypso, who offers him immortality and is refused, he reaches the Phaeacians, tells them his story and is carried home laden with gifts.",
          },
          {
            name: "The Road Back",
            description:
              "Ithaca is overrun by suitors who are devouring his estate, pressing Penelope to remarry and plotting to kill Telemachus. Athena disguises Odysseus as a ragged old beggar so he can move unseen through his own house.",
          },
          {
            name: "Resurrection",
            description:
              "Penelope sets a challenge: whoever can string Odysseus's great bow and shoot an arrow through twelve axe heads may marry her. None of the suitors can even string it. The beggar can, and the king rises from the rags.",
          },
          {
            name: "Return with the Elixir",
            description:
              "Penelope tests him one last time with the secret of their bed, built around the trunk of a living olive tree. Only her husband could know it can't be moved. The voyage ends where it began, with a marriage restored.",
          },
        ],
      },
      {
        type: "example",
        title: "The man who shouted his name",
        source: "The Odyssey, attributed to Homer (c. 8th century BCE)",
        body: "Trapped in the Cyclops's cave, Odysseus tells Polyphemus that his name is *Nobody*. After he blinds the giant, Polyphemus bellows that Nobody is hurting him, so the other Cyclopes see no reason to help. It's a perfect escape. Then, sailing away, Odysseus can't resist shouting his real name across the water. Polyphemus prays to his father, Poseidon, and the sea god makes the voyage home a torment.\n\nMuch later, Odysseus walks into his own hall disguised as a nameless beggar and endures the suitors' insults, even a footstool hurled at him, without revealing himself. That's the inner journey hidden inside the outer one: a man who needed the whole world to know his name becomes a man who can wait.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Homer didn't tell it in this order",
        body: "The Hero's Journey describes the order of *events*, not the order of the *telling*. The *Odyssey* opens near the end, with Odysseus stranded on Calypso's island, and most of the voyage above (the Cyclops, Circe, the underworld) is told in flashback by Odysseus himself at the Phaeacian court. You can map your story onto the journey and still tell it however you like.",
      },
      {
        type: "compare",
        weakLabel: "Mentor as info-dump",
        weak: "A wise old wizard appears, explains the prophecy, the villain's weakness and exactly what the hero must do, then comes along to the final battle.",
        strongLabel: "Mentor as catalyst",
        strong:
          "The mentor gives her one gift and one warning, then is gone before the hardest test, so she has to become her own guide.",
        note: "Mentors often exit before the climax for exactly this reason. Obi-Wan Kenobi dies well before Luke's final attack on the Death Star.",
      },
      { type: "heading", text: "A map, not a formula" },
      {
        type: "text",
        body: "Campbell was describing patterns he found in myth, not writing a recipe. When writers force every stage into place (a mentor because there must be a mentor, a refusal because the chart says so), the result feels generic. Use the journey as a diagnostic instead. If your second act feels thin, ask whether your hero has truly left their ordinary world. If your ending feels hollow, ask what elixir they bring home.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "The elixir can be anything",
        body: "The elixir isn't always treasure. It can be knowledge, a healed relationship or a new way of seeing. In a tragedy, it can be the terrible lesson the hero learned too late. What matters is that the return shows us what the journey was for.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Describe your story's **ordinary world** and its **special world**. What does your hero have to leave behind to cross the threshold, and what do they bring back?",
        placeholder: "Ordinary world: …\nSpecial world: …\nLeft behind: …\nBrought back: …",
      },
    ],
    keyTakeaways: [
      "The Hero's Journey follows a hero who leaves the ordinary world, is tested and transformed, and returns with something of value.",
      "Campbell found the pattern in myth; Vogler's twelve stages adapted it for screenwriters.",
      "The *Odyssey* pairs an outer voyage with an inner one: a proud man learns to hide his name and wait.",
      "The pattern describes the order of events, not the order of telling, and it's a map, not a formula.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "Why is the moment Odysseus shouts his name at the Cyclops so important to the *Odyssey*'s structure?",
        options: [
          "It's his only mistake in the entire poem.",
          "It brings down Poseidon's wrath and reveals the pride he must overcome on his way home.",
          "It introduces the mentor figure.",
          "It's the story's resolution.",
        ],
        answerIndex: 1,
        explanation:
          "The boast connects the outer and inner journeys. It creates the external obstacle (Poseidon's anger dogs the voyage) and exposes the internal flaw (his hunger for recognition). His arc completes when he re-enters his home as a nameless beggar and holds his tongue.",
      },
      {
        id: "q2",
        prompt:
          "Your fantasy script includes a refusal, a mentor and all twelve stages, yet readers call it generic. What's the likely cause?",
        options: [
          "It needs a thirteenth stage.",
          "The mentor should appear earlier.",
          "The stages are being filled in because the chart demands them, rather than growing out of this particular hero's desire and flaw.",
          "Hero's Journey stories only work in mythology.",
        ],
        answerIndex: 2,
        explanation:
          "The journey is a description of a deep pattern, not a checklist. When each stage exists to tick a box, the story loses the specificity that makes it feel alive. Build from your hero's want, need and flaw, then use the stages to diagnose what's missing.",
      },
      {
        id: "q3",
        prompt:
          "Homer tells much of Odysseus's voyage in flashback. What does that teach us about the Hero's Journey?",
        options: [
          "The journey describes the chronological shape of events; you're free to reveal them in a different order.",
          "Homer didn't understand the structure.",
          "Flashbacks break the Hero's Journey.",
          "The Resurrection must always come first.",
        ],
        answerIndex: 0,
        explanation:
          "The story (what happens, in causal order) and the plot (the order in which you reveal it) are separate choices. The *Odyssey* starts in medias res and circles back, yet the underlying journey is intact.",
      },
      {
        id: "q4",
        prompt:
          "A burnt-out surgeon spends a year volunteering at a remote clinic. Which is the strongest Return with the Elixir?",
        options: [
          "She comes home and resumes her old life unchanged.",
          "She comes home with a suitcase full of souvenirs.",
          "She never comes home; the story ends midway through her year away.",
          "She returns to her hospital and changes how her team treats patients, bringing back what the clinic taught her.",
        ],
        answerIndex: 3,
        explanation:
          "The elixir is whatever the hero brings back that transforms the ordinary world. Here it's a new way of practising medicine. Returning unchanged, or never returning, leaves the journey without a point.",
      },
    ],
    exercise: {
      prompt:
        "Map a story you're working on (a film, a novel or a true story from your own life) onto the twelve stages of the Hero's Journey in the Story Lab. Note which stages are missing, and decide whether each gap is a problem or a choice.",
      tips: [
        "Start with the Ordeal: what's the moment your hero faces their greatest fear?",
        "Define the elixir. What does the hero bring home that they didn't have before?",
        "Look for an inner journey inside the outer one, the way Odysseus's pride is tamed on the voyage home.",
      ],
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Save the Cat
  // -------------------------------------------------------------------------
  {
    id: "save-the-cat-beats",
    trackId: "structure",
    title: "Save the Cat: Fifteen Beats for Momentum",
    summary:
      "Blake Snyder's beat sheet, why commercial films feel so propulsive, and how to use page targets to find where your story stalls.",
    minutes: 8,
    level: "intermediate",
    skills: ["structure", "pacing"],
    blocks: [
      { type: "heading", text: "Why “save the cat”?" },
      {
        type: "text",
        body: "Screenwriter Blake Snyder named his 2005 book after a simple idea: early on, give the audience a moment where the hero does something that makes us like them, such as saving a cat. It's a reminder that structure isn't only about events. It's also about managing how the audience feels about the hero from the very first minutes.",
      },
      {
        type: "text",
        body: "The book's lasting contribution is the **Blake Snyder Beat Sheet**: fifteen beats with approximate page targets for a 110-page screenplay. It breaks the long second act into smaller, purposeful movements, which is exactly why it's so useful for fixing pace.",
      },
      {
        type: "beats",
        title: "The fifteen beats (on a 110-page script)",
        frameworkId: "save-the-cat",
        beats: [
          { name: "Opening Image (p. 1)", description: "A snapshot of the hero and their world *before*: the problem in a single image." },
          { name: "Theme Stated (p. 5)", description: "Someone, often in passing, hints at the lesson the hero will have to learn." },
          { name: "Set-Up (pp. 1–10)", description: "The hero's world, the people in it, and everything that needs fixing." },
          { name: "Catalyst (p. 12)", description: "The life-changing event: the telegram, the diagnosis, the knock at the door." },
          { name: "Debate (pp. 12–25)", description: "Should I go? The hero hesitates, weighs the cost and resists." },
          { name: "Break into Two (p. 25)", description: "The hero *chooses* to act and steps into an upside-down world." },
          { name: "B Story (p. 30)", description: "A new relationship, whether a love interest, mentor or rival, that carries the theme." },
          { name: "Fun and Games (pp. 30–55)", description: "The promise of the premise: the set pieces that would go in the trailer." },
          { name: "Midpoint (p. 55)", description: "A false victory or a false defeat. The stakes rise and the clock starts ticking." },
          { name: "Bad Guys Close In (pp. 55–75)", description: "External enemies regroup while doubt and division spread through the hero's side." },
          { name: "All Is Lost (p. 75)", description: "The mirror of the midpoint. Snyder called for a *whiff of death* here: something, or someone, dies." },
          { name: "Dark Night of the Soul (pp. 75–85)", description: "The hero hits bottom and, in the dark, finally grasps the lesson." },
          { name: "Break into Three (p. 85)", description: "A new idea, born of the A and B stories together, points the way." },
          { name: "Finale (pp. 85–110)", description: "The hero applies the lesson and confronts the problem, transformed." },
          { name: "Final Image (p. 110)", description: "The mirror of the opening image, proving that change has happened." },
        ],
      },
      {
        type: "example",
        title: "A weatherman stuck in the Fun and Games",
        source: "Groundhog Day (1993), dir. Harold Ramis",
        body: "The catalyst is unforgettable. Phil Connors, a cynical TV weatherman sent to cover the Groundhog Day festivities in Punxsutawney, wakes up to the same song on the same clock radio on the same day. The Fun and Games deliver exactly what the premise promises: Phil exploiting the loop to gorge himself, rob an armoured van and try to seduce his producer, Rita.\n\nLater, the film delivers a true whiff of death. Phil tries, day after day, to save an old homeless man and cannot. It's a turning point in his arc from control to compassion, and the final image pays it off: Phil wakes, at last, to a new morning, and he's a changed man.",
      },
      {
        type: "compare",
        weakLabel: "B Story as filler",
        weak: "Maya's best friend Jen turns up whenever Maya needs someone to explain the plot to.",
        strongLabel: "B Story as theme",
        strong:
          "Jen is the one person Maya's usual weapons, charm and control, don't work on. Learning why is the lesson that saves Maya in Act Three.",
        note: "In Snyder's model the theme lives in the B Story. The hero learns the lesson there, then uses it to win the A Story.",
      },
      { type: "heading", text: "Page targets as a smoke alarm" },
      {
        type: "text",
        body: "You don't have to hit page 12 exactly. But if your catalyst arrives on page 30, readers have spent more than a quarter of the script waiting for the story to start. If nothing shifts around page 55, the middle will feel flat. Map your draft against the targets and look for the gaps. They almost always line up with the notes you've been getting.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "The formula trap",
        body: "Because the beat sheet became so popular in Hollywood, critics often blame it for studio films that feel interchangeable. The beats describe what audiences tend to feel; they don't generate originality. Hit them with surprising, specific content, or break them on purpose when your story needs it.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Write the first and last images as a pair",
        body: "If you can describe your hero's change as a before-and-after photograph, you understand your story. If the two images could be swapped without anyone noticing, the change hasn't happened yet.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Describe your story's **Opening Image** and **Final Image** in one sentence each. What does the difference between them say about your hero's change?",
        placeholder: "Opening Image: …\nFinal Image: …",
      },
    ],
    keyTakeaways: [
      "Blake Snyder's beat sheet breaks a story into fifteen beats, with page targets that keep momentum high.",
      "Fun and Games delivers the promise of the premise, and the Midpoint and All Is Lost mirror each other.",
      "The B Story carries the theme, and its lesson is what wins the A Story.",
      "Use page targets as a smoke alarm for pacing, not as a formula to fill in.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What is the Fun and Games section for?",
        options: [
          "Delivering the promise of the premise: the set pieces the audience came to see.",
          "Comic relief that has nothing to do with the plot.",
          "Introducing the villain's backstory.",
          "Resolving the B Story.",
        ],
        answerIndex: 0,
        explanation:
          "Fun and Games is where the premise pays out. In *Groundhog Day*, that means Phil gleefully exploiting the time loop. If your poster or logline promises something, this is where the audience expects to get it.",
      },
      {
        id: "q2",
        prompt: "In your 110-page thriller, the life-changing event happens on page 34. What does the beat sheet suggest?",
        options: [
          "Nothing, because page targets are irrelevant.",
          "Move the midpoint earlier to compensate.",
          "Add a second catalyst later on.",
          "The catalyst is arriving late, so tighten the setup and let the story start closer to page 12.",
        ],
        answerIndex: 3,
        explanation:
          "Page targets are a diagnostic. A catalyst on page 34 means nearly a third of the script passes before the story truly begins. Usually the fix is to compress the setup, not to add more material.",
      },
      {
        id: "q3",
        prompt: "What makes a B Story more than just a subplot?",
        options: [
          "It must be a romance.",
          "It carries the theme, the lesson the hero needs in order to win the main plot.",
          "It only happens in Act Three.",
          "It always features the villain.",
        ],
        answerIndex: 1,
        explanation:
          "Snyder's B Story is thematic. It's the relationship where the hero confronts what they need to learn. At the Break into Three, the lesson from the B Story becomes the key that solves the A Story.",
      },
      {
        id: "q4",
        prompt: "Why does the old man's death in *Groundhog Day* matter to Phil's arc?",
        options: [
          "It's the moment he discovers the time loop.",
          "It proves the loop can be broken by force.",
          "It confronts him with something he can't control, pushing him from control toward compassion.",
          "It resolves his romance with Rita.",
        ],
        answerIndex: 2,
        explanation:
          "Phil has learned to master the day, but he can't master death. That failure humbles him and redirects his energy from controlling the town to caring for it. It works as a whiff of death that changes the hero from the inside.",
      },
    ],
    exercise: {
      prompt:
        "Map your story against the fifteen beats in the Story Lab. Then pitch it in the Studio Pitch drill to a sceptical development executive who thinks in exactly these terms.",
      tips: [
        "Nail the Catalyst and Break into Two first, because they make or break your first act.",
        "Make sure your Midpoint and All Is Lost are genuine opposites.",
        "Pitch the Fun and Games: it's what helps an executive picture the trailer.",
      ],
      practiceScenarioId: "studio-pitch",
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 4. Story Circle and Story Spine
  // -------------------------------------------------------------------------
  {
    id: "story-circle-and-spine",
    trackId: "structure",
    title: "Short-Form Maps: The Story Circle & Story Spine",
    summary:
      "Two compact structures for episodes, short films, talks and pitches: Dan Harmon's eight-step circle and Kenn Adams's Story Spine.",
    minutes: 7,
    level: "intermediate",
    skills: ["structure", "delivery"],
    blocks: [
      { type: "heading", text: "When twelve stages is too many" },
      {
        type: "text",
        body: "A five-minute short or a two-minute pitch can't carry a twelve-stage voyage. Two tools compress the same deep shape into something you can hold in your head, or sketch on a napkin before you walk into the room.",
      },
      { type: "heading", text: "The Story Circle" },
      {
        type: "text",
        body: "Dan Harmon, creator of *Community* and co-creator of *Rick and Morty*, developed his Story Circle as a stripped-down version of Campbell's monomyth. Draw a circle and divide it into eight steps. The top half is the character's familiar world; the bottom half is the unfamiliar one they have to descend into and come back from.",
      },
      {
        type: "beats",
        title: "The Story Circle, in a short film about a night nurse",
        frameworkId: "story-circle",
        beats: [
          {
            name: "You",
            description:
              "A character in a zone of comfort. Ana, a veteran night nurse, runs her ward like clockwork and keeps every patient at arm's length.",
          },
          {
            name: "Need",
            description: "But they want something. Ana wants to finish tonight's shift spotless: tomorrow is her interview for a desk job upstairs.",
          },
          {
            name: "Go",
            description: "They enter an unfamiliar situation. A frightened boy is admitted alone, his family can't be reached, and he won't let anyone else near him.",
          },
          {
            name: "Search",
            description: "They adapt to it. Ana abandons her routine for games, stories and a contraband pudding cup to get him through the night.",
          },
          {
            name: "Find",
            description: "They get what they wanted. The boy's fever breaks, the ward is calm, and the shift ends without a single mistake.",
          },
          {
            name: "Take",
            description: "They pay a heavy price. She stayed with him hours past the end of her shift and missed the interview.",
          },
          {
            name: "Return",
            description: "They return to their familiar situation. The next night Ana walks back onto the same ward, under the same clock.",
          },
          {
            name: "Change",
            description: "Having changed. Now she knows every patient's name, and she has stopped applying for jobs that would take her off the floor.",
          },
        ],
      },
      {
        type: "callout",
        tone: "insight",
        title: "Opposite points rhyme",
        body: "Steps facing each other across the circle echo one another. *You* (1) faces *Find* (5): the comfortable self versus the self who gets what they wanted. *Need* (2) faces *Take* (6): the desire versus its cost. *Go* (3) faces *Return* (7), and *Search* (4) faces *Change* (8). If one step feels weak, strengthen its partner across the circle.",
      },
      { type: "heading", text: "The Story Spine" },
      {
        type: "text",
        body: "Improv teacher Kenn Adams created the Story Spine to help improvisers build a complete story on the spot. Pixar story artist Emma Coats included a version of it in her widely shared list of story basics, and it has since become a favourite of pitch coaches and speakers. Its genius is the phrase **because of that**, which forces every event to be caused by the one before it.",
      },
      {
        type: "example",
        title: "Finding Nemo on the Story Spine",
        source: "Finding Nemo (2003), dir. Andrew Stanton",
        body: "**Once upon a time** there was a clownfish who lost his wife and almost all their eggs to a barracuda. **Every day**, he kept his one surviving son, Nemo, anxiously close. **Until one day**, Nemo swam out to touch a boat to prove he wasn't a baby, and a diver scooped him up.\n\n**Because of that**, Marlin, who was terrified of the open sea, had to cross it, with a forgetful blue tang named Dory as his only ally. **Because of that**, he had to lean on unlikely helpers: sharks trying to swear off eating fish, surfing sea turtles, and Dory's hunch that they should let go inside a whale.\n\n**Until finally**, when Dory was trapped in a fishing net, Marlin let Nemo swim into danger to save her. **And ever since then**, Marlin has let his son live his own life.",
      },
      {
        type: "compare",
        weakLabel: "Event list",
        weak: "I started a bakery. Then I got a food truck. Then we opened a second shop. Then we won an award.",
        strongLabel: "Story Spine",
        strong:
          "Every day I baked bread for a café that paid me late. Until one day, they didn't pay at all. Because of that, I sold loaves out of my car to cover the rent. Because of that, the queue by my car made the local paper, and a landlord called me about an empty shop.",
        note: "Same facts, different glue. *Because of that* turns a CV into a story.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Spine first, polish later",
        body: "Before any pitch, talk or short script, say your story out loud as a Story Spine in under a minute. If you can't get to *until finally* without hesitating, you don't know your climax yet, and no amount of polish will hide it.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Tell a story you know well (a family legend, a favourite film, how you met your best friend) as a seven-line Story Spine.",
        placeholder:
          "Once upon a time…\nEvery day…\nUntil one day…\nBecause of that…\nBecause of that…\nUntil finally…\nAnd ever since then…",
      },
    ],
    keyTakeaways: [
      "The Story Circle compresses the Hero's Journey into eight steps: comfort, desire, the unfamiliar, adapting, getting it, paying for it, returning and changing.",
      "Opposite steps on the circle mirror each other, so you can fix a weak step by strengthening its partner.",
      "The Story Spine's *because of that* forces causality and turns a list of events into a plot.",
      "Short-form maps suit episodes, short films, talks and pitches, and they quickly show whether you know your climax.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "In the Story Circle, what does step 6, *Take*, ask of your character?",
        options: [
          "To pay a heavy price for getting what they wanted.",
          "To steal something from the antagonist.",
          "To return to their familiar world.",
          "To meet their mentor.",
        ],
        answerIndex: 0,
        explanation:
          "*Take* is the cost of *Find*. Getting what you wanted should hurt somehow, because that cost is what forces the change the circle ends on. In the night-nurse example, a spotless shift costs Ana the interview and shows her what she really values.",
      },
      {
        id: "q2",
        prompt: "Why is “because of that” the engine of the Story Spine?",
        options: [
          "It makes the story longer.",
          "It lets the storyteller skip the climax.",
          "It's a rule of improv etiquette.",
          "It forces each event to be caused by the one before, which turns a list into a plot.",
        ],
        answerIndex: 3,
        explanation:
          "A list of events (*and then… and then…*) has no momentum. By requiring every step to be a consequence of the previous one, the Spine builds the chain of cause and effect that audiences experience as story.",
      },
      {
        id: "q3",
        prompt: "You have 90 seconds to tell your company's origin story at a pitch event. Which approach fits best?",
        options: [
          "The twelve-stage Hero's Journey, covering every stage.",
          "A Story Spine: routine, disruption, consequences, climax and what has changed since.",
          "A chronological list of milestones and metrics.",
          "Kishōtenketsu, saving the twist for the Q&A.",
        ],
        answerIndex: 1,
        explanation:
          "The Spine is built for short, spoken stories. It sets up a status quo, breaks it and follows the consequences to a clear ending in a few sentences. Twelve stages won't fit in 90 seconds, and a list of milestones has no story at all.",
      },
      {
        id: "q4",
        prompt:
          "In your circle, the *Take* step feels weightless: your character gets what she wanted at no real cost. Using the mirror principle, which step should you also strengthen?",
        options: [
          "Go, by sending her further from home.",
          "Return, by making the homecoming longer.",
          "Need, by making the desire more urgent, so that its cost hurts more.",
          "Change, by adding a closing speech about what she learned.",
        ],
        answerIndex: 2,
        explanation:
          "*Need* (2) and *Take* (6) face each other. A price only hurts when the want behind it is urgent. Sharpen what she wants so badly, and the cost of getting it will start to carry weight.",
      },
    ],
    exercise: {
      prompt:
        "Tell a true story from your life as a seven-line Story Spine, out loud, in under two minutes. Then take it to the Campfire Story drill, where a storytelling-night host will tell you where it sagged.",
      tips: [
        "Spend a line on *every day*, because the routine is what makes the disruption matter.",
        "Each *because of that* should raise the stakes, not just add information.",
        "*And ever since then* is your ending: say what changed, then stop.",
      ],
      practiceScenarioId: "campfire-story",
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Kishōtenketsu, nonlinear time, setup and payoff
  // -------------------------------------------------------------------------
  {
    id: "kishotenketsu-and-payoffs",
    trackId: "structure",
    title: "Beyond Conflict: Kishōtenketsu, Nonlinear Time & Payoffs",
    summary:
      "Structures that don't run on conflict or chronology, plus the setup-and-payoff craft that makes any structure feel inevitable.",
    minutes: 9,
    level: "advanced",
    skills: ["structure", "pacing"],
    blocks: [
      { type: "heading", text: "Drama without a fight" },
      {
        type: "text",
        body: "Western screenwriting tends to assume that story means conflict. But a four-part structure from classical Chinese poetry, later embraced in Japan as **kishōtenketsu**, builds meaning from contrast instead. It's the backbone of many four-panel *yonkoma* comic strips, and it shows up in films that feel gentle yet somehow complete.",
      },
      {
        type: "beats",
        title: "The four movements",
        frameworkId: "kishotenketsu",
        beats: [
          {
            name: "Ki — Introduction",
            description: "Introduce the characters and their world. *An old man feeds the pigeons from the same bench every morning.*",
          },
          {
            name: "Shō — Development",
            description:
              "Deepen what we know without breaking anything. *We see the ritual up close: the same paper bag, the same bird that lands on his shoe.*",
          },
          {
            name: "Ten — Twist",
            description:
              "Something unexpected, often seemingly unrelated, enters. *Across town, a girl at a hospital window draws the pigeons that pass by.*",
          },
          {
            name: "Ketsu — Reconciliation",
            description: "The pieces come together into a new whole. *Tied to the leg of the bird on his shoe is a crayon-coloured ribbon.*",
          },
        ],
      },
      {
        type: "example",
        title: "A story with no villain",
        source: "My Neighbor Totoro (1988), dir. Hayao Miyazaki",
        body: "Two sisters, Satsuki and Mei, move with their father to an old house in the countryside to be nearer their mother, who is recovering in hospital. For much of the film very little *goes wrong*. The girls explore, discover the forest spirit Totoro, and wait beside him at a rainy bus stop, where Satsuki lends him an umbrella.\n\nThere's no antagonist. When tension finally arrives, with worrying news from the hospital and little Mei going missing, it lands with enormous force precisely because the film spent so long simply letting us know these people. The film is often held up as an example of storytelling driven by atmosphere and contrast rather than by a fight.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Contrast is a kind of tension",
        body: "Kishōtenketsu isn't tension-free. The *ten* delivers a jolt of *how do these connect?*, which is a question, just like a hook. The pleasure of the ending is the click of understanding rather than the relief of victory.",
      },
      { type: "heading", text: "Bending time" },
      {
        type: "text",
        body: "Story is the order in which events *happen*; plot is the order in which you *reveal* them. Pulling the two apart opens up nonlinear storytelling. *Citizen Kane* (1941) begins with its hero's death and his last word, *Rosebud*, then reconstructs his life through the memories of the people a reporter interviews. *Pulp Fiction* (1994) shuffles its chapters out of chronological order. *Memento* (2000) runs its colour scenes backwards, so the audience shares its amnesiac hero's disorientation. Nonlinear time earns its complexity when it does at least one of three jobs:",
      },
      {
        type: "list",
        items: [
          "**It raises a question.** Showing the ending first makes the audience ask *how did it come to this?*",
          "**It mirrors a mind.** Memory, grief and obsession rarely run in order.",
          "**It recontextualises.** A scene we've already watched means something new once we learn what came before it.",
        ],
      },
      { type: "heading", text: "Setup and payoff" },
      {
        type: "text",
        body: "Whatever the structure, endings feel inevitable when they've been **set up**. Chekhov's famous principle, that a gun hanging on the wall in the first act should go off by the last, cuts both ways: don't plant what you won't use, and don't use what you haven't planted. A good payoff is surprising in the moment and obvious in hindsight.",
      },
      {
        type: "example",
        title: "The flyer and the clock tower",
        source: "Back to the Future (1985), dir. Robert Zemeckis",
        body: "Early in the film, a woman collecting money to save the town's clock tower presses a flyer into Marty McFly's hand. It explains that lightning struck the tower one night in 1955 and stopped the clock at 10:04. The moment plays as a throwaway gag about small-town nostalgia.\n\nStranded in 1955 with no way to power the time machine, Marty and Doc realise the flyer tells them exactly where and when a bolt of lightning will strike. The whole climax hangs on it, and because it was planted so casually, the payoff feels both astonishing and inevitable.",
      },
      {
        type: "compare",
        weakLabel: "Unplanted payoff",
        weak: "In the final scene, the hero suddenly reveals she's a trained marksman and ends the standoff with a single shot.",
        strongLabel: "Planted payoff",
        strong:
          "In Act One she refuses to go hunting with her father, snapping that she “doesn't do that any more”. In Act Three, with no other way out, she picks up the rifle, and we finally understand what she's been running from.",
        note: "The skill was planted as a wound, so the payoff lands as both a surprise and a revelation.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Plant in plain sight",
        body: "Disguise your setups as something else: a joke, a character moment, a piece of set dressing. *Citizen Kane* shows us a boy's sled early in Kane's story and saves its meaning for the final shot. The more naturally a setup sits in its scene, the harder the payoff hits.",
      },
      {
        type: "exercise-inline",
        prompt:
          "List three things you plant in your story's first act: an object, a line and a skill. Beside each, write where it pays off. For anything without a payoff, either cut it or use it.",
        placeholder: "Object: … → pays off when…\nLine: … → pays off when…\nSkill: … → pays off when…",
      },
    ],
    keyTakeaways: [
      "Kishōtenketsu builds meaning from contrast: introduction, development, twist and reconciliation.",
      "Plot is the order in which you reveal events. Nonlinear telling should raise a question, mirror a mind or recontextualise.",
      "Don't plant what you won't use, and don't pay off what you haven't planted.",
      "The best payoffs are surprising in the moment and inevitable in hindsight.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What drives a kishōtenketsu story in place of conflict?",
        options: [
          "A villain revealed in the final act.",
          "Contrast and juxtaposition: a twist that reframes everything we've seen.",
          "Constant escalation of danger.",
          "A ticking clock.",
        ],
        answerIndex: 1,
        explanation:
          "The *ten* introduces something unexpected, often apparently unrelated, and the *ketsu* reveals how it connects. The satisfaction comes from the new understanding, not from a victory over an opponent.",
      },
      {
        id: "q2",
        prompt: "Why does *Memento* run its colour scenes in reverse order?",
        options: [
          "Because nonlinear films win more festival prizes.",
          "Because surprising the audience is the only goal of nonlinear structure.",
          "To put the audience inside the hero's condition: like him, we never know what led to the moment we're in.",
          "Because it removes the need for setups and payoffs.",
        ],
        answerIndex: 2,
        explanation:
          "The reverse structure mirrors the hero's inability to form new memories. We arrive in each scene as disoriented as he is. That's nonlinear time doing its most powerful job, which is making form express character.",
      },
      {
        id: "q3",
        prompt:
          "In your mystery's climax, the detective solves the case with a clue the audience never saw. What's wrong?",
        options: [
          "Nothing. Detectives are allowed secret knowledge.",
          "Clues should always be revealed in dialogue.",
          "The climax comes too early.",
          "The payoff was never set up, so it feels like cheating rather than inevitable.",
        ],
        answerIndex: 3,
        explanation:
          "A satisfying solution is one the audience *could* have reached. Plant the clue in plain sight, ideally disguised as something else, so the reveal is surprising in the moment and obvious in hindsight.",
      },
      {
        id: "q4",
        prompt: "What makes the clock-tower flyer in *Back to the Future* such an effective setup?",
        options: [
          "It's disguised as a throwaway gag, so the payoff feels both surprising and inevitable.",
          "It's flagged as important so the audience is sure to remember it.",
          "Doc explains its significance in a long speech early on.",
          "It only appears in the final act.",
        ],
        answerIndex: 0,
        explanation:
          "The flyer arrives as comic texture, so we file it away without suspicion. When it turns out to be the key to getting home, we feel both the jolt of surprise and the rightness of something we saw earlier.",
      },
      {
        id: "q5",
        prompt:
          "You want to open your film with the protagonist's funeral, then tell her life in flashback. What must that choice do to earn its place?",
        options: [
          "Nothing. Nonlinear openings are always stronger.",
          "Raise a question the audience needs answered, such as how she died or who she really was.",
          "Replace the need for a climax.",
          "Reveal every twist in the first scene.",
        ],
        answerIndex: 1,
        explanation:
          "Opening on the ending trades the question *what will happen?* for *how did it come to this?*, as *Citizen Kane* does with its opening death and the mystery of *Rosebud*. If the funeral doesn't raise a question worth answering, the nonlinear structure is just decoration.",
      },
    ],
    exercise: {
      prompt:
        "Write a short story or scene outline in four movements (ki, shō, ten, ketsu) with no villain and no fight. Plant at least one detail in the first movement that pays off in the last, then map it in the Story Lab with the Kishōtenketsu framework.",
      tips: [
        "Make the *ten* feel unrelated at first, because the pleasure is in the connection.",
        "Let the *shō* deepen the situation rather than complicate it.",
        "Disguise your setup as texture: a habit, an object, a throwaway line.",
      ],
      labTool: "story",
    },
  },
];
