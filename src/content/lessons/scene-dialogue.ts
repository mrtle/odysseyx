import type { Lesson } from "@/lib/types";

/**
 * Track 4 — Scenes & Dialogue: where story actually happens.
 * Scene anatomy (goal, conflict, turn); entering late and leaving early;
 * subtext; voice and exposition in dialogue; tension and suspense.
 */
export const sceneDialogueLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. Scene anatomy
  // -------------------------------------------------------------------------
  {
    id: "scene-anatomy",
    trackId: "scene-dialogue",
    title: "Scene Anatomy: Goal, Conflict, Turn",
    summary:
      "A scene isn't a location or a conversation. It's a unit of change. Learn the three parts every working scene needs, and the test that tells you when to cut one.",
    minutes: 7,
    level: "beginner",
    skills: ["conflict", "structure"],
    blocks: [
      { type: "heading", text: "A scene is a unit of change" },
      {
        type: "text",
        body: "Films, plays and novels are built from scenes, but a scene isn't defined by a location or a page count. It's a stretch of story, usually in one place and continuous time, in which **something changes**. A character walks in wanting something, runs into resistance and walks out in a different situation from the one they entered. If they leave exactly as they arrived, the audience has watched a pause, not a scene.",
      },
      {
        type: "text",
        body: "The screenwriting teacher Robert McKee describes every true scene as turning a **value**: some quality of a character's life that can swing between positive and negative, such as hope and despair, trust and suspicion, or safety and danger. A scene in which no value turns is, in his term, a *non-event*. Look underneath almost any scene you love and you'll find three working parts.",
      },
      {
        type: "list",
        items: [
          "**Goal**: what the point-of-view character wants *in this scene*. Not their life's ambition, but something they can get or fail to get before the scene ends: a yes, a confession, the car keys, five more minutes.",
          "**Conflict**: what stands in the way. Usually it's another person who wants something different, but it can be a locked door, a clock or the character's own fear.",
          "**Turn**: the moment the situation flips. A value shifts from one charge to another (hope to despair, ignorance to knowledge, together to alone), and the character leaves in a new position.",
        ],
      },
      {
        type: "beats",
        title: "One small scene, four moving parts",
        beats: [
          {
            name: "Goal",
            description: "Rosa, a line cook, needs Saturday night off to see her daughter's first school play.",
          },
          {
            name: "Conflict",
            description:
              "Her manager is two cooks short and has already turned everyone else down. She pleads, then bargains, then threatens to quit.",
          },
          {
            name: "Turn",
            description:
              "He gives her Saturday, on one condition: she works a double on her daughter's birthday. Hope curdles into a hollow victory.",
          },
          {
            name: "New question",
            description: "She says yes. The scene ends on Rosa staring at the rota, and on the question it leaves behind: how will she tell her daughter?",
          },
        ],
      },
      {
        type: "text",
        body: "The novelist and teacher Dwight V. Swain taught fiction writers that a scene runs from goal to conflict to *disaster*, a setback that leaves the character worse off, and plenty of great scenes do end that way. But a turn can also run from bad to good, or end in an ironic mix like Rosa's, where she gets what she wanted and loses something else. What matters is that the value at the end is **different** from the value at the start, that the change is caused by what happens in the scene, and, ideally, that it hands the next scene its problem.",
      },
      {
        type: "example",
        title: "A breakup that launches a company",
        source: "The Social Network (2010), dir. David Fincher, written by Aaron Sorkin",
        body: "The film opens mid-conversation in a crowded bar near campus. Mark Zuckerberg is talking at speed to his girlfriend, Erica, mostly about how to get into one of Harvard's exclusive final clubs. Underneath the chatter, Mark wants to be seen as someone who matters, and he wants Erica to be impressed. Erica wants a boyfriend who actually listens to her. Every time he talks down to her, including a dig at the university she goes to, the conflict tightens.\n\nThe turn is simple and brutal: Erica breaks up with him and walks out. Mark arrived confident of his own brilliance and is left rejected and humiliated. Better still, the turn creates the next scene. He goes back to his dorm, blogs cruelly about her and, that same night, builds a website inviting students to vote on which of two female classmates is more attractive. It's the stunt that sets the rest of the story in motion.",
      },
      {
        type: "compare",
        weakLabel: "Nothing turns",
        weak: "**NINA:** Mum moves into Hollybank on Friday.\n\n**OWEN:** I know. The manager rang me.\n\n**NINA:** It seems like a nice place.\n\n**OWEN:** It does. She'll be comfortable there.\n\n**NINA:** Good. I'll drive her over, then.",
        strongLabel: "Goal, conflict, turn",
        strong:
          "**NINA:** Mum moves into Hollybank on Friday. I just need your signature.\n\n**OWEN:** Sure. Where? … Hang on. Why is the house on here?\n\n**NINA:** Because it pays for her room.\n\n**OWEN:** You're selling the house. Without asking me.\n\n**NINA:** You'd have had to visit to be asked.",
        note: "Same situation, same news. In the first version two people agree and nobody wants anything, so the scene ends exactly where it began. In the second, Nina has a goal (the signature), Owen becomes the obstacle, and a discovery turns the value from cooperation to open conflict, with a new question hanging: will he sign?",
      },
      { type: "heading", text: "The cut test" },
      {
        type: "text",
        body: "Here's a quick diagnostic for every scene in a draft. Write down the value at the start and the value at the end. If they're the same, the scene is a candidate for the cutting-room floor, however good its lines are. Either find the turn it's missing, fold its useful information into a scene that does turn, or cut it.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Information is not a turn",
        body: "The most common non-event is a scene that exists only to deliver facts: characters meet to discuss what we already know, or to tell us something we'll need later. Information turns a scene only when it changes someone's situation. A diagnosis that lands on a patient is a turn. The same diagnosis calmly agreed on by two doctors in a corridor usually isn't.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Vary the direction",
        body: "If three scenes in a row all turn from good to bad, the audience starts to feel the pattern and stops feeling the story. Alternate the charges: let a small win set up a bigger loss, or a defeat open an unexpected door. The rhythm between scenes matters as much as the turn inside each one.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Pick a scene from your draft, or from a film you know well. Name the point-of-view character's goal, the obstacle, and the value at the start and end, written as *value → value*. If the two values are the same, what one change would make the scene turn?",
        placeholder: "Goal: …\nObstacle: …\nValue: trust → suspicion",
      },
    ],
    keyTakeaways: [
      "A scene is a unit of change: a character pursues a goal, meets resistance and leaves in a different situation.",
      "Every working scene has three parts: a goal, a conflict that blocks it, and a turn that shifts a value, such as hope to despair.",
      "The best turns are caused by what happens in the scene, and they hand the next scene its problem.",
      "If the value at the end of a scene matches the value at the start, rewrite it, fold it into another scene or cut it.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which of these is a *scene goal* rather than a long-term goal?",
        options: [
          "To become the youngest head of surgery in the hospital's hundred-year history",
          "To win back the respect of her father, a surgeon who has barely spoken to her in years",
          "To get the night-shift supervisor to let her scrub in on tonight's transplant",
          "To rebuild her confidence in the year after her divorce",
        ],
        answerIndex: 2,
        explanation:
          "A scene goal is something the character can win or lose before the scene ends. Scrubbing in tonight will get a yes or a no by the end of the conversation. The others are ambitions or needs that play out across a whole story, and they're often what a scene goal is secretly in service of.",
      },
      {
        id: "q2",
        prompt:
          "Two detectives review a case file and agree on everything the audience saw in the previous scene. What's the core problem?",
        options: [
          "Nothing turns: no one wants anything, nothing blocks them and no value shifts.",
          "It lacks technical detail; more forensic jargon would make the scene feel authentic.",
          "It's too static: the detectives should walk and talk through the station to add energy.",
          "It should be shot as a single long take, so the audience feels the weight of the case.",
        ],
        answerIndex: 0,
        explanation:
          "A recap scene is a classic non-event: no goal, no resistance, no change. Jargon, movement or a showy camera can decorate it, but they can't make it turn. Give one detective something to hide, or let the file reveal something that turns their confidence into doubt, and the same information starts to move the story.",
      },
      {
        id: "q3",
        prompt: "In the opening scene of *The Social Network*, what makes the breakup such an effective turn?",
        options: [
          "It reveals Erica's secret backstory, which explains everything she does later in the film.",
          "It's a comic beat that releases the tension built up by the fast, overlapping dialogue.",
          "It comes out of nowhere, and a turn with no warning is always the most powerful kind.",
          "It flips Mark from confident to humiliated, and his response to it drives the next scene.",
        ],
        answerIndex: 3,
        explanation:
          "The turn grows out of the conflict (he keeps condescending to her, and she's had enough), and it changes his situation completely. Just as important, it has consequences: what he does that night sets the plot in motion. A good turn ends one scene and starts the next.",
      },
      {
        id: "q4",
        prompt:
          "Your scene ends with the heroine getting the loan she asked for, but only by putting up her grandmother's house as collateral. What kind of turn is this?",
        options: [
          "No turn at all, because she got exactly what she came in asking for.",
          "A mixed or ironic turn: she wins her goal, at a cost that raises the stakes.",
          "A purely negative turn, because putting up the house is a disaster for the family.",
          "A purely positive turn, because the scene ends with her goal achieved.",
        ],
        answerIndex: 1,
        explanation:
          "She leaves in a different position from the one she entered, which is what makes it a turn, and it's neither purely good nor purely bad. Winning the goal at a price is one of the most useful turns there is: it answers the scene's question while opening a bigger one. *What happens if she can't pay?*",
      },
    ],
    exercise: {
      prompt:
        "Pick three scenes from your draft. For each, write the point-of-view character's goal, the obstacle and the value shift (for example, *trust → suspicion*). Rewrite or cut any scene that doesn't turn, then paste the strongest one into the Story Doctor for notes.",
      tips: [
        "Make each goal something the character can win or lose before the scene ends.",
        "If you can't name the obstacle, the scene probably has no conflict yet.",
        "Check that the turn is caused by something that happens in the scene, not by coincidence.",
        "Look at the order of your turns: three losses in a row may need a win between them.",
      ],
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 2. Enter late, leave early
  // -------------------------------------------------------------------------
  {
    id: "enter-late-leave-early",
    trackId: "scene-dialogue",
    title: "Enter Late, Leave Early",
    summary:
      "First drafts tend to start scenes at the doorbell and end them at the goodbye. Cut to the conflict, get out on the turn, and let the audience fill the gaps.",
    minutes: 6,
    level: "beginner",
    skills: ["pacing", "structure"],
    blocks: [
      { type: "heading", text: "Skip the doorbell" },
      {
        type: "text",
        body: "Real conversations have warm-ups and wind-downs: hellos, tea, small talk, the slow circling before anyone gets to the point, then the goodbyes. First drafts tend to copy all of it. But the audience didn't come for the warm-up. They came for the moment two wants collide, and every line before that moment is time they spend waiting.",
      },
      {
        type: "text",
        body: "Screenwriters have a mantra for this: **enter late, leave early**. Start the scene as close to its conflict as you can while the audience can still follow what's happening, and end it as soon as the turn has landed. Whatever you cut, the audience fills in for themselves, and they're remarkably good at it.",
      },
      {
        type: "quote",
        text: "Start as close to the end as possible.",
        attribution: "Kurt Vonnegut, rule five of his eight rules for writing short stories",
      },
      {
        type: "compare",
        weakLabel: "Enters early, leaves late",
        weak: "*The doorbell rings.*\n\n**JO:** Oh, hi! Come in, come in. Tea?\n\n**MARCUS:** Go on, then. Traffic was a nightmare.\n\n**JO:** Always is on a Friday. So, what did you want to talk about?\n\n**MARCUS:** I'm leaving the band. I got the session job in Berlin.\n\n**JO:** Oh. Wow. Well, I'm sad, but I understand.\n\n**MARCUS:** Thanks, Jo. I'd better go. Thanks for the tea.",
        strongLabel: "Enters late, leaves early",
        strong:
          "**JO:** Two weeks before the tour. You're joking.\n\n**MARCUS:** It's Berlin, Jo. It's a real job.\n\n**JO:** This is a real job.\n\n**MARCUS:** It's a van.\n\n*Jo takes the tour poster off the wall and holds it out to him. He doesn't take it.*",
        note: "The strong version opens after the news has already been broken, right inside the argument, and trusts the audience to work out what happened. It ends on an image instead of a goodbye, leaving a question hanging: is he really going?",
      },
      { type: "heading", text: "Finding the way in, and the way out" },
      {
        type: "list",
        ordered: true,
        items: [
          "**Find the first spark.** Mark the line where the conflict actually begins. Could the scene start there, or one beat before?",
          "**Cut the arrivals.** Doors, greetings, sitting down and ordering drinks can almost always go. If the arrival matters, start with the character already mid-action.",
          "**Cut the recap.** If the audience saw it happen, the characters don't need to tell each other about it.",
          "**Find the turn.** Anything after it that only confirms, explains or says goodbye is a candidate for the cut.",
          "**End on something that pulls.** A decision, a revelation, an image or an unanswered question that leads into the next scene.",
        ],
      },
      {
        type: "example",
        title: "A marriage told in breakfasts",
        source: "Citizen Kane (1941), dir. Orson Welles",
        body: "Welles tells the collapse of Charles Foster Kane's first marriage in a string of short breakfast scenes, linked by whip pans, each set later in the marriage than the last. The newlyweds begin close together at a small table, flirting. In each scene that follows, the exchanges get shorter and sharper, drifting toward arguments about his newspaper, and the two of them sit further apart.\n\nIn the final vignette they sit at opposite ends of a long table, reading in silence, and she's reading a rival paper. Every vignette enters on a single charged exchange and leaves the moment it has turned, and together they cover years of a marriage in a few minutes of screen time. Nobody ever announces that the love has gone. The cuts do it.",
      },
      { type: "heading", text: "Leave on the turn, or on a question" },
      {
        type: "text",
        body: "Endings matter as much as entrances. Once a scene has turned, every extra line leaks tension: the reaction to the reaction, a character explaining what just happened, the walk to the door. Cut on the turn itself, or on the first sign of what it will cost, and the audience carries the question across the cut into the next scene. Television writers do this at every act break, but it works just as well at the end of an ordinary scene.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Sometimes the best scene is the one you skip",
        body: "Enter late and leave early applies to whole sequences too. *Reservoir Dogs* (1992) is a heist film that never shows the heist. It jumps from the robbers' breakfast to the bloody aftermath of a job gone wrong, and lets the survivors' arguments about what went wrong fill in the gap. Ask of every big set piece in your outline: is the event itself the story, or is the story what it does to people?",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Late isn't the same as rushed",
        body: "Compression is for the parts of a scene that don't matter. The moments that do, such as a decision, a confession or the silence after bad news, deserve room. Cut the hellos so that you can afford to linger on the look that changes everything.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Take a scene from your draft. Mark the first moment of real conflict and the turn. Rewrite the scene so it starts no more than two lines before the first mark and ends within two lines of the second. What did you cut that you actually miss?",
        placeholder: "First spark: …\nTurn: …\nWhat I cut: …",
      },
    ],
    keyTakeaways: [
      "Start each scene as close to its conflict as the audience can follow, and end it as soon as the turn has landed.",
      "Arrivals, greetings, recaps and goodbyes can almost always be cut. The audience fills the gaps.",
      "End on the turn, a decision or an unanswered question, so the audience carries the tension into the next scene.",
      "Compress what doesn't matter so the crucial moments have room to breathe.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A scene opens with a character parking, walking into a café, ordering and chatting about the weather before her ex arrives and the argument begins. What's the most effective edit?",
        options: [
          "Keep it all: the parking and ordering ground the scene in reality before the conflict.",
          "Start with the ex already at the table, mid-argument or one beat before it.",
          "Add more small talk, so the audience wonders when the ex will arrive.",
          "Move the weather chat to the end, so the scene closes on a quiet, awkward note.",
        ],
        answerIndex: 1,
        explanation:
          "Everything before the ex arrives is warm-up: the audience learns nothing the argument won't show them. Entering at, or just before, the first spark gets straight to the collision of wants. If the café itself matters, a single establishing image can do that work.",
      },
      {
        id: "q2",
        prompt:
          "Your scene turns when a son admits he crashed his father's car. Afterwards, the two of them talk through how they feel and agree to discuss it tomorrow. What should you consider?",
        options: [
          "Adding a flashback to the crash, so the audience sees exactly what happened.",
          "Extending the discussion, so the audience understands exactly how each of them feels.",
          "Moving the admission to the very start, so the scene has more time to explore it.",
          "Cutting soon after the admission, perhaps on the father's silent reaction.",
        ],
        answerIndex: 3,
        explanation:
          "Once the confession lands, the scene has turned. Talking through the feelings drains the tension and tells the audience what they've already felt. Cutting on the reaction keeps the question alive (*what will the father do?*) and pulls the audience forward.",
      },
      {
        id: "q3",
        prompt: "What does the breakfast montage in *Citizen Kane* demonstrate?",
        options: [
          "Short scenes that enter on a charged exchange and leave once it turns can compress years into minutes.",
          "A marriage is best shown in long, unbroken takes that let the actors' performances breathe.",
          "Characters should say outright how their feelings have changed, so the audience can follow the time jumps.",
          "Montages only work with voiceover narration to explain what the audience is seeing.",
        ],
        answerIndex: 0,
        explanation:
          "Each breakfast vignette is a tiny scene with its own turn, and the cuts do the rest. Nobody announces that the marriage is over. The audience measures the growing distance between the two of them and draws the conclusion themselves.",
      },
      {
        id: "q4",
        prompt: "*Reservoir Dogs* never shows its central robbery. Why can skipping an expected scene strengthen a story?",
        options: [
          "Because audiences have seen so many robberies that showing another one would bore them.",
          "Because it saves money, and budget is the only real reason a film would skip its biggest scene.",
          "Because the story may lie in the aftermath, and the missing scene becomes a question we want answered.",
          "Because every film should skip its most important event, to keep the audience guessing.",
        ],
        answerIndex: 2,
        explanation:
          "The heist matters for what it does to the men afterwards: suspicion, blame, loyalty. Leaving it out turns *what happened in there?* into a question that drives the film. Skipping is a choice to make on purpose, not a rule. Some stories need the big scene on screen.",
      },
    ],
    exercise: {
      prompt:
        "Choose the longest scene in your draft and cut it by a third without losing its turn: start later, get out earlier and remove any line that recaps what the audience already knows. Then paste the before and after versions into the Story Doctor and compare the notes.",
      tips: [
        "Circle the first line of real conflict and try starting there.",
        "Circle the turn and try ending there, or one image after it.",
        "If a detail from the cut opening matters, slip it into the conflict itself.",
        "Read both versions aloud. The tighter one should feel faster, not thinner.",
      ],
      labTool: "story",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Subtext
  // -------------------------------------------------------------------------
  {
    id: "subtext",
    trackId: "scene-dialogue",
    title: "Subtext: What Characters Don't Say",
    summary:
      "People rarely say what they mean, least of all when it matters. Learn to write the iceberg: dialogue that's about one thing on the surface and something else underneath.",
    minutes: 8,
    level: "intermediate",
    skills: ["dialogue", "character"],
    blocks: [
      { type: "heading", text: "The words and the meaning" },
      {
        type: "text",
        body: "In life, people rarely announce their feelings. A husband doesn't say *I'm afraid you're falling out of love with me*; he asks, a little too casually, who kept texting her at dinner. **Subtext** is the meaning under the words: what a character actually feels, wants or fears, which the lines point toward without stating. When characters say exactly what they mean, writers call it **on-the-nose** dialogue, and it tends to lie flat on the page.",
      },
      {
        type: "text",
        body: "If you've taken the Story Foundations track, you've met Hemingway's iceberg. In his Paris memoir, *A Moveable Feast*, he described the theory behind it: you could leave out anything, as long as you knew what you were leaving out, and the omitted part would strengthen the story and make readers feel more than they understood. In dialogue, the part below the water is whatever the characters can't bring themselves to say.",
      },
      {
        type: "example",
        title: "An operation nobody names",
        source: "“Hills Like White Elephants” (1927), short story by Ernest Hemingway",
        body: "An American man and a young woman he calls Jig wait for the train to Madrid at a small station in Spain's Ebro valley. They order drinks. She remarks that the hills across the valley look like white elephants. On the surface, that's almost all that happens: drinks, the heat, the bead curtain across the bar door, the train on its way.\n\nUnderneath, they're deciding the future of a pregnancy. He keeps assuring her that the operation is simple, and that he doesn't want her to do anything she doesn't want to do, while making it plain which choice he's hoping for. She keeps circling back to the hills, and at one point begs him to stop talking. The word *abortion* never appears, and neither of them ever names what they feel. Readers still come away knowing exactly what's at stake, because Hemingway leaves the most important thing out.",
      },
      { type: "heading", text: "Dialogue is action" },
      {
        type: "text",
        body: "Why don't characters just say what they mean? Because in drama, talking is doing. Every line is an attempt to get something from the other person: to win them over, to wound them, to buy time, to hide. Characters use words as **tactics**, and the want underneath shapes a line far more than its literal meaning. That's why *Nice of you to call* can be gratitude, an accusation or a door slammed shut, depending on what the speaker is trying to do. Every line has three layers:",
      },
      {
        type: "list",
        items: [
          "**What they say**: *I'm fine. Go, have fun.*",
          "**What they mean**: *It hurts that you're choosing them over me.*",
          "**What they're doing**: making you feel guilty enough to stay, without ever having to ask.",
        ],
      },
      {
        type: "compare",
        weakLabel: "On the nose",
        weak: "**DAD:** I'm going to miss you so much. I'm scared you won't need me any more.\n\n**ELLIE:** I'll miss you too, Dad, but I need you to let me grow up.\n\n**DAD:** You're right. I'm so proud of you.",
        strongLabel: "Subtext",
        strong:
          "**DAD:** I put a spare lightbulb in your drawer. And the number for a locksmith.\n\n**ELLIE:** Dad, there's a porter. It's literally his job.\n\n**DAD:** Porters go home at night.\n\n**ELLIE:** *(hugging him, quickly)* Your parking runs out at four.\n\n**DAD:** Right. Four.",
        note: "The first version states every feeling, so there's nothing left to discover. In the second, the lightbulb and the locksmith are his fear of letting go, and the parking meter is her love and her impatience at once. We feel everything he can't say, and the quick hug does more than any declaration.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Actors play actions, not lines",
        body: "The idea of subtext is closely associated with Konstantin Stanislavski, co-founder of the Moscow Art Theatre, where he and his colleagues staged Chekhov's major plays. His approach taught actors to ask what their character wants in each moment and to play that intention rather than the literal words. Directors still work this way: instead of *say it sadder*, they give an actor a verb to play on their scene partner, such as *to reassure*, *to punish* or *to stall*. Write with the same question in mind and your subtext will be playable.",
      },
      {
        type: "example",
        title: "A scene with no words at all",
        source: "Before Sunrise (1995), dir. Richard Linklater",
        body: "Jesse and Céline have just met on a train and, on impulse, got off together in Vienna to spend a single night walking the city. In a record shop, they squeeze into a tiny listening booth to hear Kath Bloom's song *Come Here*. Neither says a word. Each steals glances at the other, then looks away the instant the other might notice, so their eyes never quite meet.\n\nThe whole scene is subtext: two strangers realising they're falling for each other, and both too shy to show it. A single line about their feelings would break the spell. The silence, and the careful not-looking, say it all.",
      },
      { type: "heading", text: "Ways to keep it under the surface" },
      {
        type: "list",
        items: [
          "**Answer a different question.** *Did you call the doctor?* / *The car's making that noise again.*",
          "**Talk about an object.** A ring, a dish, a boat, a lightbulb: anything a feeling can hide inside.",
          "**Deflect with a joke.** Humour is one of the most common ways real people dodge a painful truth.",
          "**Say the opposite.** *Take all the time you need* can mean *hurry up*, and the audience knows it.",
          "**Use silence.** A pause or an unanswered question can be the loudest line in the scene.",
          "**Let actions contradict words.** *I'm not upset*, said while scrubbing a pan that's already clean.",
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Subtext isn't vagueness",
        body: "The audience has to be able to read what's underneath, so set up the situation clearly enough that they know what's really at stake. Hemingway gives the reader just enough (the operation, the man's insistence, the woman's unhappiness) to decode the rest. And subtext is what makes the rare on-the-nose moment powerful: when a character who has dodged the truth all story finally says it plainly, the dam breaking *is* the turn.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write a four-line exchange in which one character asks another for forgiveness without ever saying *sorry*, *forgive* or *mistake*.",
        placeholder: "A: …\nB: …\nA: …\nB: …",
      },
    ],
    keyTakeaways: [
      "Subtext is the real meaning under the words: what characters feel and want but don't say.",
      "On-the-nose dialogue states feelings outright and leaves the audience nothing to discover.",
      "Dialogue is action: every line is a tactic for getting something from the other person.",
      "Hide feelings in objects, jokes, silences and answers to different questions, but give the audience enough context to read what's underneath.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "After their mother's funeral, a woman's brother, who never visited during the last year of their mother's illness, offers to help sort the house. Which reply carries the most subtext?",
        options: [
          "“I'm angry that you weren't here when Mum was dying, and I don't know how to forgive it.”",
          "“I don't need your help. You abandoned us, and now you want to play the good son.”",
          "“I feel like you only care now that it's too late, and that's hard for me to accept.”",
          "“The spare room's still made up for you. She kept it that way all year.”",
        ],
        answerIndex: 3,
        explanation:
          "The first three name the feeling or the accusation directly. The last one never mentions anger or absence, yet the made-up bed tells him, and us, how long their mother waited and how badly he let her down. The audience feels the accusation because they decode it themselves.",
      },
      {
        id: "q2",
        prompt: "What's the central idea behind treating *dialogue as action*?",
        options: [
          "Every line of dialogue should be paired with a physical action, so scenes never sit still.",
          "Every line is a tactic to get something from the other person, so the want shapes what's said.",
          "Characters should state their goals out loud, so the audience always knows what they want.",
          "Action films need less dialogue, because audiences come for the set pieces, not the talk.",
        ],
        answerIndex: 1,
        explanation:
          "Talking is a way of doing. Characters flatter, threaten, deflect and bargain with words, and the want under a line determines how it's said. That's also why actors look for a playable verb, such as *to reassure* or *to punish*, rather than a mood.",
      },
      {
        id: "q3",
        prompt: "In “Hills Like White Elephants”, why does it matter that the word *abortion* never appears?",
        options: [
          "It keeps the story deliberately ambiguous, so readers can't tell what the couple is discussing.",
          "It shows the couple don't yet know each other well enough to talk about anything serious.",
          "Leaving it out makes readers feel the pressure under the small talk more than naming it would.",
          "Hemingway wanted the story to be about travel in Spain, and the pregnancy is only a side detail.",
        ],
        answerIndex: 2,
        explanation:
          "The omission isn't there to hide anything: Hemingway gives readers enough clues to understand what's being decided, then leaves the word out. Because we have to work it out ourselves, the tension between the man's persuasion and the woman's reluctance lands harder. That's the iceberg: the omitted part is felt, not lost.",
      },
      {
        id: "q4",
        prompt:
          "A character who has deflected with jokes for the entire film finally says, simply, *I'm scared.* Why can this on-the-nose line work?",
        options: [
          "Because it breaks a pattern the audience has learned, so the directness itself becomes the turn.",
          "Because on-the-nose dialogue is always stronger in the final act, once the stakes are highest.",
          "Because audiences need the main character's feelings spelled out before the ending.",
          "It can't: on-the-nose lines always weaken a scene, so the writer should cut it.",
        ],
        answerIndex: 0,
        explanation:
          "Subtext isn't a ban on directness. When a character has hidden a feeling all story long, the moment they finally name it is a dramatic event in itself: the defences drop. The line lands because of all the scenes in which they couldn't say it.",
      },
    ],
    exercise: {
      prompt:
        "Improvise a tense scene in the Subtext Sparring drill. You and your sister are clearing out your late father's garage, and you're keeping a secret from her. The only rule: you can't say it outright. Before you start, write down in one line what your character wants from her in this scene.",
      tips: [
        "Want something in every line, even if it's only to change the subject.",
        "Answer a different question from the one she asked.",
        "Use the objects in the garage as shields and signals.",
        "Notice the moments the scene goes flat. They're usually the moments you explained yourself.",
      ],
      practiceScenarioId: "subtext-sparring",
    },
  },

  // -------------------------------------------------------------------------
  // 4. Dialogue that sounds real
  // -------------------------------------------------------------------------
  {
    id: "dialogue-that-sounds-real",
    trackId: "scene-dialogue",
    title: "Dialogue That Sounds Real (Without Being Real)",
    summary:
      "Transcribed speech makes terrible dialogue. Keep the rhythm of real talk, cut the dead weight, give every character a voice of their own and turn exposition into ammunition.",
    minutes: 8,
    level: "intermediate",
    skills: ["dialogue", "character"],
    blocks: [
      { type: "heading", text: "Real talk is terrible dialogue" },
      {
        type: "text",
        body: "Record a real conversation and transcribe it, and you'll find it's mostly padding: greetings, filler words, repeated points, half-finished tangents, people agreeing with each other. It feels natural in life and deadly on the page. Good dialogue is an illusion of real speech. It keeps the *texture* of how people talk and throws away most of what they actually say.",
      },
      {
        type: "list",
        items: [
          "**Keep** fragments, interruptions, people talking past each other, questions answered with questions, and the specific words this particular person would use.",
          "**Cut** hellos and goodbyes, pleasantries, names used in every line, tidy grammatical sentences nobody really speaks in, and exchanges where everyone agrees.",
          "**Replace** lines that only move people in and out of rooms. A look, a gesture or a cut can usually do that job.",
        ],
      },
      { type: "heading", text: "Every character needs their own voice" },
      {
        type: "text",
        body: "Here's a test: cover the character names on a page of your script and read it. Can you tell who's speaking? If everyone sounds like the same witty, articulate person (who usually sounds a lot like the writer), the dialogue is doing only half its job. A distinct voice tells us who someone is before they've done anything.",
      },
      {
        type: "list",
        items: [
          "**Vocabulary**: jargon from their job, words from their region or generation, how educated or careful they sound, whether they swear.",
          "**Rhythm**: clipped bursts or long, winding sentences. Do they interrupt, wait their turn or trail off?",
          "**What they avoid**: the topic they steer away from, the word they never use, the feeling they won't name. Avoidance is where voice meets subtext.",
          "**How they deflect**: with jokes, with questions, with facts, with silence.",
          "**What they call people**: *sir*, *mate*, *sweetheart*, a surname, a nickname. A form of address reveals status and relationship in a single word.",
        ],
      },
      {
        type: "quote",
        text: "Brevity is the soul of wit.",
        attribution: "Polonius, in William Shakespeare's *Hamlet* (c. 1600)",
      },
      {
        type: "text",
        body: "The joke is who says it. Polonius is the most long-winded character in the play, and he offers this line partway through a rambling speech, until the Queen tells him, in effect, to get to the point. Shakespeare turns a piece of advice into characterisation: Polonius's voice *is* his vanity. How a character says everything matters more than what they claim about themselves.",
      },
      {
        type: "example",
        title: "Talk that sounds like filler, and isn't",
        source: "Pulp Fiction (1994), dir. Quentin Tarantino",
        body: "Two hitmen, Jules and Vincent, head to a job making what sounds like idle chatter. Vincent, just back from a long stay in Europe, describes the little differences he noticed there, such as what the French call a Quarter Pounder with Cheese. Then, walking into the apartment building, they debate whether a foot massage means anything, prompted by a rumour that their boss had a man thrown off a balcony for giving his wife one.\n\nIt looks like exactly the kind of talk a first draft should cut, but every beat is working. Their voices are distinct: Vincent easygoing and curious, Jules forceful and opinionated. The foot-massage debate matters because Vincent has been asked to take the boss's wife out while the boss is away, which sets up one of the film's most tense sequences. And the chatter plays against what we sense is coming: they're on their way to recover the boss's briefcase from the young men who crossed him, and the visit will end in bloodshed. Banter earns its place when it characterises, plants something or builds tension, ideally all three.",
      },
      { type: "heading", text: "As you know, Bob" },
      {
        type: "text",
        body: "Few things sound falser than characters telling each other what they both already know, purely so the audience can overhear it. Writers call this **as you know, Bob** dialogue, after the giveaway phrase that so often introduces it. The fix isn't to cut the exposition, because the audience often needs the information. It's to give a character a reason to say it *now*, to *this* person, to get something they want.",
      },
      {
        type: "compare",
        weakLabel: "As you know, Bob",
        weak: "**KAREN:** As you know, Tom, we've been married for twelve years, and ever since you lost your job at the plant in March, money has been tight.\n\n**TOM:** Yes, Karen. That's why I've been driving for the delivery app at night.",
        strongLabel: "Exposition as ammunition",
        strong:
          "**KAREN:** Twelve years, and I find out from the bank.\n\n**TOM:** I was going to tell you.\n\n**KAREN:** When? You leave at nine to drive other people's takeaways around, and you're asleep when I get up.\n\n**TOM:** Since the plant, it's the only thing that pays.\n\n**KAREN:** The plant closed in March, Tom. It's October.",
        note: "The same facts arrive: a long marriage, a lost job, night work, money trouble. In the strong version, Karen uses them as weapons and Tom uses them as a shield, so the audience absorbs the backstory without noticing they're being told anything.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Turn exposition into ammunition",
        body: "Information slips in unnoticed when characters use it against each other in a fight, as leverage in a negotiation, or in a confession that costs them something. Another option is a character who genuinely doesn't know, such as a new recruit or an outsider, so the explanation has a real listener. Just give that character reasons of their own to ask, or they'll become a walking question mark.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Write the same piece of information (*the rent is three months late*) as a single line spoken by three different characters: a teenager, a retired army officer and a landlord who's secretly fond of the tenant.",
        placeholder: "Teenager: …\nOfficer: …\nLandlord: …",
      },
    ],
    keyTakeaways: [
      "Good dialogue keeps the rhythm and texture of real speech and cuts the padding: greetings, filler, recaps and agreement.",
      "Give each character a distinct voice through vocabulary, rhythm, what they avoid and how they deflect. Test it by covering the names.",
      "Banter earns its place when it characterises, plants something or builds tension.",
      "Avoid *as you know, Bob* exposition. Give characters a reason to use information against each other, and it becomes ammunition.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "You cover the character names on a page of your script and can't tell who's speaking. What's the most useful fix?",
        options: [
          "Differentiate their voices: vocabulary, rhythm, what each one avoids and how each one deflects.",
          "Work the characters' names into more of each other's lines, so readers always know who's talking.",
          "Give every character more jokes, so each one has a funny line on every page.",
          "Make every line longer and more articulate, so the dialogue sounds more polished.",
        ],
        answerIndex: 0,
        explanation:
          "Interchangeable dialogue means the voices haven't been built yet. Working on vocabulary, rhythm, avoidance and deflection makes each character audibly themselves. Sprinkling in names is a common crutch, and it makes dialogue sound less real, not more.",
      },
      {
        id: "q2",
        prompt: "Which line is the clearest example of *as you know, Bob* dialogue?",
        options: [
          "“You said you'd be here at six. It's nearly nine, and the food's been cold for hours.”",
          "“Don't look at me like that. You'd have done exactly the same thing in my position.”",
          "“As your older brother, who's run Dad's shop since he died, I know what's best.”",
          "“Is that my jacket? The one I lent you in March and you swore you'd lost?”",
        ],
        answerIndex: 2,
        explanation:
          "The third line exists to brief the audience: the listener already knows who his brother is, what he does and that their father has died. Real people don't narrate shared history to each other. The other lines carry information too, but it emerges from a live conflict.",
      },
      {
        id: "q3",
        prompt: "Why doesn't the hitmen's banter on the way to the job in *Pulp Fiction* count as filler, even though it seems to be about nothing?",
        options: [
          "Because Tarantino's dialogue is so entertaining in itself that it doesn't need to do any other job.",
          "Because it builds two distinct voices, plants a worry that pays off later and plays against what's coming.",
          "Because it's packed with plot exposition about the briefcase and the young men who have it.",
          "Because long, rambling scenes are the best way to make characters feel like real people.",
        ],
        answerIndex: 1,
        explanation:
          "Filler is talk that does no work, however entertaining it is. This banter does several jobs at once: it defines two very different voices, sets up the stakes of Vincent's evening with the boss's wife and generates tension from the gap between casual chat and a deadly errand.",
      },
      {
        id: "q4",
        prompt:
          "The audience needs to learn that the heroine was once a champion swimmer who quit after an accident. Which approach turns exposition into ammunition?",
        options: [
          "The heroine tells her best friend the story of her career, though the friend was there for it.",
          "A narrator describes her swimming career and the accident over a montage of old race footage.",
          "A newspaper clipping about the accident fills the screen for ten seconds in the opening scene.",
          "During an argument, her rival mocks her for being too scared to get back in the pool since the accident.",
        ],
        answerIndex: 3,
        explanation:
          "In the argument, the information arrives as a weapon: the rival uses it to hurt her, which reveals backstory, relationship and stakes at once. The first option is classic *as you know, Bob*. Narration and clippings can be fine, but they deliver facts without conflict.",
      },
    ],
    exercise: {
      prompt:
        "Write the scene behind the What's My Motivation drill. Walter, sixty-four, has driven three hours to help his daughter June pack up her apartment. Mid-packing, she tells him she's taken a job in Lisbon and won't be home for the holidays, the first Christmas since her mother died. Get that backstory across without either of them telling the other what they both already know, and give father and daughter clearly different voices. Then direct the scene in the drill.",
      tips: [
        "Let the mother's absence surface through an object, such as a box of her dishes, rather than a speech.",
        "Walter is a recently retired bus mechanic: let his trade colour his vocabulary. Give June the rhythm of someone who has rehearsed bad news.",
        "Cut every line in which one of them tells the other something they both know.",
        "In the drill, direct the actor with what Walter wants from June, not with how he should feel.",
      ],
      practiceScenarioId: "actor-motivation",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Tension and suspense
  // -------------------------------------------------------------------------
  {
    id: "tension-and-suspense",
    trackId: "scene-dialogue",
    title: "Tension & Suspense: The Bomb Under the Table",
    summary:
      "Surprise lasts seconds; suspense lasts as long as you can hold it. Learn Hitchcock's bomb, dramatic irony, ticking clocks and the art of choosing what to withhold.",
    minutes: 9,
    level: "advanced",
    skills: ["conflict", "pacing"],
    blocks: [
      { type: "heading", text: "Surprise versus suspense" },
      {
        type: "text",
        body: "In his book-length interviews with François Truffaut, Alfred Hitchcock explained the difference with a bomb. Picture two people chatting at a table. Suddenly a bomb goes off beneath it. The audience gets a jolt of surprise that lasts a few seconds. Now replay the scene, but first show the audience the bomb under the table, set for one o'clock, and a clock on the wall reading a quarter to. The same dull conversation becomes almost unbearable. The audience longs to shout a warning, and the scene holds them for minutes instead of seconds.",
      },
      {
        type: "text",
        body: "Hitchcock's conclusion was that, wherever possible, the audience should be **informed**, unless the surprise is itself the point, as with a twist ending. Suspense doesn't come from what the audience doesn't know. It comes from what they *do* know, and dread, while they wait to see how it will play out. Three ingredients make it work: the audience knows about a danger, they care about the people in its path, and they don't know how or when it will resolve.",
      },
      {
        type: "compare",
        weakLabel: "Surprise",
        weak: "A nurse finishes her night shift, chats with a colleague in the car park and gets into her car. A man rises from the back seat. Cut to black.",
        strongLabel: "Suspense",
        strong:
          "We watch a man slip into the back seat of a nurse's car and crouch out of sight. Then we cut inside the hospital, where she's stuck at the end of her night shift: a patient who won't settle, a colleague who wants to chat, keys she can't find. Every delay is agony, because we know who is waiting in the car.",
        note: "The first version buys one gasp. The second turns every ordinary delay into tension, because the audience knows what she doesn't. The events are the same. The difference is when you show the danger.",
      },
      {
        type: "example",
        title: "Dinner served from the chest",
        source: "Rope (1948), dir. Alfred Hitchcock",
        body: "In the opening minutes of *Rope*, two young men strangle a former classmate in their Manhattan apartment and hide his body in a large wooden chest. Then they host a dinner party, with the victim's father and fiancée among the guests, and serve the buffet from the top of the chest. There's no mystery about what happened, because we watched it. Everything that follows is the bomb under the table.\n\nHitchcock staged the film in long takes designed to look almost continuous, trapping us in the room, in something close to real time, with the secret. Late in the evening, the housekeeper starts clearing the chest so she can put some books back inside it, and the camera simply holds on her unhurried trips back and forth while, offscreen, the guests wonder aloud where the victim can be. She has already begun to raise the lid when one of the killers stops her and tells her it can wait until tomorrow. Nothing happens in the shot except a woman tidying up, and it's one of the tensest moments in the film.",
      },
      { type: "heading", text: "The suspense toolkit" },
      {
        type: "list",
        items: [
          "**Dramatic irony**: the audience knows something a character doesn't. Every audience of *Romeo and Juliet* knows that Juliet has only taken a potion that makes her appear dead when Romeo finds her in the tomb.",
          "**The ticking clock**: a deadline that shrinks the time to act. *High Noon* (1952) plays out in roughly real time as a town marshal waits for the noon train bringing back an outlaw he once sent to prison, with clocks appearing again and again.",
          "**Delay**: once the danger is established, every obstacle that slows the resolution stretches the tension. A locked door or a fumbled key buys you more.",
          "**Withholding**: keeping information *from* the audience. This creates curiosity rather than suspense, the pull of *what's going on?* instead of *what's going to happen?*",
        ],
      },
      {
        type: "example",
        title: "A glass of milk and a hidden family",
        source: "Inglourious Basterds (2009), dir. Quentin Tarantino",
        body: "The film opens at a remote dairy farm in Nazi-occupied France. SS Colonel Hans Landa arrives to question the farmer, Perrier LaPadite, about a Jewish family, the Dreyfuses, who are unaccounted for. Landa is polite, even charming. He asks for a glass of milk, compliments it and takes his time.\n\nTarantino lets the camera sink beneath the floorboards to show us what LaPadite knows: the family is hiding directly under the men's feet. Landa's courteous switch from French to English, we come to realise, keeps the people below from understanding what's being said. Once we've seen the danger, every pleasant line is a threat, and the question shifts from *will he find them?* to *does he already know?* The patient small talk isn't padding. Every delay tightens the screw.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "Suspense is a promise",
        body: "In *Sabotage* (1936), Hitchcock had a young boy unknowingly carry a time bomb across London, delayed again and again as the minutes ran down, and then let it explode on a bus, killing him. He later told Truffaut he considered it a serious mistake: the audience had been made to care so much about the boy that killing him after all that suspense left them resentful rather than thrilled. Build suspense and you owe the audience a payoff that honours it, even if it isn't the one they hoped for.",
      },
      {
        type: "beats",
        title: "Building a suspense sequence",
        beats: [
          {
            name: "Show the bomb",
            description: "Let the audience see the danger: the intruder, the forged signature, the family under the floor.",
          },
          {
            name: "Make us care",
            description: "Put someone we care about in its path, and keep them unaware, distracted or trapped.",
          },
          {
            name: "Set the clock",
            description: "Give the danger a deadline or a trigger, so we know exactly what will set it off.",
          },
          {
            name: "Stretch",
            description:
              "Delay with ordinary obstacles: small talk, a stuck zip, a stranger asking for directions. Cut back to the danger often.",
          },
          {
            name: "Release",
            description:
              "Pay it off with an escape, a discovery, an explosion or a twist. Hold too long without release and tension turns into fatigue.",
          },
        ],
      },
      {
        type: "callout",
        tone: "tip",
        title: "Choose mystery or suspense, scene by scene",
        body: "Withholding and revealing are both tools, and the craft is choosing which one a scene needs. Keep a secret from the audience and they lean in to solve it. Share it with them while keeping it from the characters, and they lean in to watch. Many great sequences switch halfway: a mystery (*who is in the house?*) becomes suspense the moment the audience sees the intruder and the heroine doesn't.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Take an ordinary scene (two people choosing a restaurant, a job interview, a child's bedtime) and put a bomb under the table: one thing the audience knows that at least one character doesn't. What do we see first, what's the clock, and how will you stretch the scene before the payoff?",
        placeholder: "The audience sees…\nThe character doesn't know…\nThe clock is…",
      },
    ],
    keyTakeaways: [
      "Surprise gives the audience a few seconds of shock; showing them the bomb first gives them minutes of suspense.",
      "Suspense needs three things: the audience knows about a danger, cares about who's in its path and doesn't know how it will resolve.",
      "Dramatic irony, ticking clocks and delay are the core tools. Withholding creates curiosity rather than suspense.",
      "Suspense is a promise. Stretch it as far as it will hold, then pay it off.",
    ],
    quiz: [
      {
        id: "q1",
        prompt: "In Hitchcock's bomb example, what turns a surprise into suspense?",
        options: [
          "Making the explosion bigger and louder, so the shock lasts long after the blast.",
          "Hiding the bomb until the very last second, so the explosion is completely unexpected.",
          "Showing the audience the bomb, and when it will go off, while the characters remain unaware.",
          "Having the characters chat nervously about bombs, so the audience senses danger is coming.",
        ],
        answerIndex: 2,
        explanation:
          "The bomb is the same in both versions. What changes is the audience's knowledge. Once they know what the characters don't, every trivial line of conversation becomes charged, and the tension lasts as long as the scene does instead of the instant of the blast.",
      },
      {
        id: "q2",
        prompt: "Which scenario uses dramatic irony?",
        options: [
          "A detective finds a hidden clue at the very moment the audience does, and gasps right along with them.",
          "An old woman narrates events from her childhood, long after they happened.",
          "The killer's identity is kept secret from the audience until the last scene of the film.",
          "The audience knows the groom has been cheating; the bride, toasting him at the wedding, doesn't.",
        ],
        answerIndex: 3,
        explanation:
          "Dramatic irony means the audience knows something a character doesn't, so every word of the bride's toast carries a second meaning. In the first option the audience learns the clue when the detective does, and in the third the audience is the one kept in the dark, which creates mystery, not irony. Narration on its own, as in the second, isn't irony either.",
      },
      {
        id: "q3",
        prompt:
          "In the opening of *Inglourious Basterds*, why does the scene grow more tense even though Landa stays calm and polite?",
        options: [
          "We've been shown the family hidden under the floor, so every pleasant exchange becomes a threat.",
          "The dialogue is full of veiled threats, which we'd notice even without seeing what's under the floor.",
          "Landa openly threatens to have LaPadite shot from the moment he walks through the door.",
          "The scene is cut with rapid, jarring edits that keep the audience constantly off balance.",
        ],
        answerIndex: 0,
        explanation:
          "The threat isn't in the words, which stay courteous; it's in what we know. Once the camera reveals the family below, the audience holds the secret alongside the farmer. Landa's courtesy becomes frightening precisely because we can't tell what he knows. It's the bomb under the table, with a glass of milk on top.",
      },
      {
        id: "q4",
        prompt:
          "A thriller has a bomb, a countdown and a hero racing to defuse it, but test audiences find the sequence flat. What's the most likely missing ingredient?",
        options: [
          "A bigger bomb, with a blast radius that could level a city block.",
          "An audience that actually cares about the people in danger.",
          "A longer countdown, so the tension has more time to build.",
          "More technical detail about the wiring and how the bomb is defused.",
        ],
        answerIndex: 1,
        explanation:
          "Danger and a clock aren't enough on their own. Suspense is fear on someone's behalf, so if the audience doesn't care about the people at risk, the countdown is just numbers. Invest in the characters before the fuse is lit.",
      },
      {
        id: "q5",
        prompt: "What lesson did Hitchcock draw from the bus bomb in *Sabotage*?",
        options: [
          "That audiences prefer a sudden surprise to a long stretch of suspense.",
          "That the audience should never have been shown the bomb, so the blast could come as a total shock.",
          "That the sequence failed because it never showed a clock counting down.",
          "That killing the boy after making the audience care so much left them resentful, not thrilled.",
        ],
        answerIndex: 3,
        explanation:
          "Hitchcock told Truffaut he regretted it. Suspense builds a bond between the audience and the character at risk, and the payoff has to honour that bond. Danger doesn't always have to be averted, but the end of a suspense sequence needs to be designed as carefully as the build-up.",
      },
    ],
    exercise: {
      prompt:
        "Rewrite a scene from your project, or write a new one, around a bomb under the table: show the audience a danger early, keep at least one character unaware of it, and stretch the scene with ordinary business before paying it off. Then run it through the Story Doctor to see where the tension peaks and where it sags.",
      tips: [
        "Reveal the danger to the audience before the small talk begins.",
        "Give the danger a clock or a trigger the audience understands.",
        "Cut back to the danger at intervals to remind us it's still there.",
        "Decide on the payoff before you write the build-up.",
      ],
      labTool: "story",
    },
  },
];
