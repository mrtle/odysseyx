import type { Lesson } from "@/lib/types";

/**
 * Track 5 — Visual Storytelling: the camera as narrator.
 * Shot sizes, camera angles and power, composition, camera movement and
 * lenses, and light and colour as emotion.
 */
export const visualLessons: Lesson[] = [
  // -------------------------------------------------------------------------
  // 1. Shot sizes
  // -------------------------------------------------------------------------
  {
    id: "shot-sizes",
    trackId: "visual",
    title: "Shot Sizes: The Distance of Feeling",
    summary:
      "Every shot size, from extreme wide to extreme close-up, decides how near the audience stands to a character, and so how much they feel. Learn the scale and when to move along it.",
    minutes: 7,
    level: "beginner",
    skills: ["visual"],
    blocks: [
      { type: "heading", text: "Every shot is a decision about distance" },
      {
        type: "text",
        body: "Before a single line is spoken, the camera has already answered a question for the audience: *how close should I be to this person right now?* Stand far away and we observe. Move in and we start to feel what they feel. Shot size is the first dial a director reaches for, and the one audiences notice least, which is exactly why it works.",
      },
      {
        type: "text",
        body: "Think of the camera as a guest at a party. It can hover by the door taking in the whole room, stand at conversational distance, or lean in close enough to see a pupil widen. Each position creates a different relationship with the people on screen, so each one should be chosen for what the moment needs, not out of habit.",
      },
      { type: "heading", text: "The scale, from far to near" },
      {
        type: "list",
        items: [
          "**Extreme wide (EWS):** scale and isolation. The world dwarfs the character. Good for openings, journeys and loneliness.",
          "**Wide (WS):** geography and context. Where are we, who is here, and how far apart are they?",
          "**Full (FS):** head to toe. Physical action and body language: a dance, a fight, a slump of the shoulders.",
          "**Medium wide (MWS):** roughly knees up. The character within their environment. Framed at mid-thigh in westerns to include the holstered gun, it's also called the *cowboy shot*.",
          "**Medium (MS):** waist up. The workhorse of conversation and behaviour.",
          "**Medium close-up (MCU):** chest up. Intimacy, while keeping some gesture.",
          "**Close-up (CU):** the face. Emotion, thought, the moment of decision.",
          "**Extreme close-up (ECU):** a detail. Eyes, hands, an object charged with meaning.",
        ],
      },
      {
        type: "quote",
        text: "Life is a tragedy when seen in close-up, but a comedy in long-shot.",
        attribution: "Widely attributed to Charlie Chaplin",
      },
      {
        type: "text",
        body: "The line captures the principle perfectly. A man slipping on a banana peel in a wide shot is slapstick. The same fall in close-up, his face crumpling with pain and embarrassment, is a small tragedy. **Distance controls empathy.** The further away we are, the more we judge; the closer we are, the more we share.",
      },
      {
        type: "example",
        title: "Trapped with a face",
        source: "The Passion of Joan of Arc (1928), dir. Carl Theodor Dreyer",
        body: "Dreyer tells the story of Joan's trial almost entirely in close-ups. Renée Falconetti's face fills the frame, shot without make-up, while her judges crowd in with close-ups of their own. We're rarely allowed to step back and take in the courtroom, so we can't escape into the architecture.\n\nThat is the whole point. The film is about a young woman surrounded by accusers, and the framing makes the audience feel surrounded too.",
      },
      {
        type: "example",
        title: "Wide for geometry, close for eternity",
        source: "The Good, the Bad and the Ugly (1966), dir. Sergio Leone",
        body: "In the final three-way standoff, Leone alternates wide shots of the three gunmen spaced around a circular plaza in a cemetery with ever-tighter close-ups: faces, then eyes, then hands hovering over holsters. The wide shots keep the geometry clear (who can shoot whom), while the extreme close-ups stretch a few seconds of twitching into an eternity. For minutes almost nothing happens, and the tension is unbearable.",
      },
      { type: "heading", text: "A close-up means most after a wider shot" },
      {
        type: "text",
        body: "A close-up means little on its own. It gets its force from what came before. If a scene plays in comfortable mediums and then cuts to a close-up at the exact moment a character realises she's been betrayed, the audience feels the jolt of that realisation. Use your tightest shots like punctuation: save them for the moments that matter and they land. Use them everywhere and they become white noise.",
      },
      {
        type: "compare",
        weakLabel: "Coverage on autopilot",
        weak: "A daughter tells her father she's leaving home. Every line, from “Can we talk?” to the final slammed door, is covered in matching close-ups.",
        strongLabel: "Shot size that tracks the feeling",
        strong:
          "The scene opens wide, with the length of the kitchen table between them. As the argument sharpens, we move to mediums, then singles. The first close-up comes only when the father, finally silent, realises she means it, and we hold on him as she goes.",
        note: "In the second version the audience's distance shrinks as the stakes rise, so the close-up arrives as a revelation rather than a default.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Framing matters as much as size",
        body: "Size is how close; framing is who shares the frame. A **two-shot** makes the relationship the subject. An **over-the-shoulder** places us inside the conversation. A **POV** shows exactly what a character sees, and an **insert** isolates a crucial object. A medium two-shot and a medium single tell very different stories about the same line.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Pick a scene you know well, or one you're writing, and find its single most important moment. Which shot size would you save for that moment, and what size would you play the rest of the scene in so the change is felt?",
        placeholder: "The turn is when… so I'd stay in mediums until…",
      },
    ],
    keyTakeaways: [
      "Shot size sets the audience's emotional distance: far away we observe, up close we feel.",
      "Each size has a job, from the extreme wide's scale and isolation to the extreme close-up's charged detail.",
      "Close-ups get their power from contrast, so save your tightest shot for the moment that turns the scene.",
      "Framing (single, two-shot, over-the-shoulder, POV, insert) decides who shares the frame, and that changes the story as much as size does.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A lone hiker realises she's hopelessly lost in a vast mountain range. Which shot best conveys her isolation?",
        options: [
          "An extreme close-up of her compass",
          "An extreme wide shot, with her tiny against the peaks",
          "A medium shot of her checking the map",
          "An over-the-shoulder shot of her phone screen",
        ],
        answerIndex: 1,
        explanation:
          "An extreme wide shot lets the landscape dwarf her; the size relationship between character and world *is* the feeling of isolation. The compass insert or the map medium might come later in the sequence, but they show her problem, not how small and alone she is.",
      },
      {
        id: "q2",
        prompt:
          "A director covers every line of a tense dinner scene in tight close-ups. What is the most likely problem?",
        options: [
          "Close-ups should only be used in action scenes",
          "The audience won't be able to tell who is speaking",
          "With nowhere closer to go, the scene's key moment has no visual emphasis",
          "Close-ups always need a longer shooting schedule",
        ],
        answerIndex: 2,
        explanation:
          "Close-ups draw their power from contrast. If everything is a close-up, the moment a character realises something has nothing to escalate to. Varying the size lets you save the tightest framing for the turn.",
      },
      {
        id: "q3",
        prompt: "Why might the same pratfall play as comedy in a wide shot but as pain in a close-up?",
        options: [
          "Distance lets us watch from outside, while closeness makes us share what the character feels",
          "Wide shots are always lit more brightly than close-ups",
          "Close-ups are normally shot in slow motion",
          "Audiences can't read body language in a wide shot",
        ],
        answerIndex: 0,
        explanation:
          "Distance controls empathy. From far away we judge the fall as an event; up close we see the embarrassment and hurt on the face and feel it with them. That's the idea behind the line attributed to Chaplin about tragedy in close-up and comedy in long shot.",
      },
      {
        id: "q4",
        prompt:
          "You want the audience to notice a woman slipping her wedding ring off under the table, unseen by her husband. Which shot does that job most directly?",
        options: [
          "A wide shot of the whole restaurant",
          "A two-shot of the couple at eye level",
          "A crane shot rising above the table",
          "An insert of her hands beneath the tablecloth",
        ],
        answerIndex: 3,
        explanation:
          "An insert isolates a crucial object or action and tells the audience *this matters*, while the husband stays oblivious. That gap between what we know and what he knows creates suspense. The wider options would bury the detail.",
      },
    ],
    exercise: {
      prompt:
        "Take a short scene (yours, or two strangers forced to share an umbrella at a bus stop) and write a shot list of 6 to 8 shots. Label each with a size and one sentence on what it makes the audience feel. Then run the scene through the Shot Planner and compare its choices with yours.",
      tips: [
        "Start wide enough to orient us, unless disorientation is the point.",
        "Mark the scene's turn first, then decide which shot you're saving for it.",
        "Justify each size with a feeling, not a rule: “close-up, because this is when he decides.”",
        "Try a version where you never go tighter than a medium. What gets lost?",
      ],
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 2. Camera angles and power
  // -------------------------------------------------------------------------
  {
    id: "camera-angles",
    trackId: "visual",
    title: "Camera Angles & Power",
    summary:
      "Where the lens sits relative to a character's eyes decides who holds power in the frame. Learn eye-level, high, low, bird's-eye and Dutch angles, and when to break the obvious reading.",
    minutes: 6,
    level: "beginner",
    skills: ["visual", "character"],
    blocks: [
      { type: "heading", text: "Height is an opinion" },
      {
        type: "text",
        body: "Camera height is one of the quietest ways a film tells us how to feel about someone. Put the lens at a character's eye level and we meet them as equals. Drop it below and they tower over us; raise it above and they shrink. We rarely notice the angle consciously, but we absorb its judgement every time.",
      },
      {
        type: "list",
        items: [
          "**Eye level:** neutral and honest. The default for most drama, because it lets the performance do the work.",
          "**High angle:** looking down. Vulnerability, smallness, being judged or trapped.",
          "**Low angle:** looking up. Power, menace, heroism, or self-importance.",
          "**Bird's-eye and overhead:** from far above or straight down. Godlike detachment, patterns, fate, or clinical observation.",
          "**Worm's-eye:** from the ground, looking up. Awe or overwhelming threat.",
          "**Dutch tilt:** the horizon canted off level. Unease, madness, a world off its axis.",
        ],
      },
      {
        type: "example",
        title: "The ceiling over Kane",
        source: "Citizen Kane (1941), dir. Orson Welles",
        body: "Welles and cinematographer Gregg Toland shoot Charles Foster Kane from low angles again and again, and the sets were built with ceilings (unusual for Hollywood at the time) so the camera could look up at him without revealing the studio above. Kane looms as publisher, candidate and titan.\n\nBut as his life empties out, the film increasingly shows him small inside the cavernous rooms of Xanadu, his vast Florida estate. Angle and scale track his arc from power to isolation without a word of dialogue.",
      },
      {
        type: "text",
        body: "Angle also creates point of view. When a child looks up at a parent, a low-angle shot from the child's height shows us the parent as the child sees them. Out of context, that shot would just say *powerful*. In context, it says *powerful to her*. Always ask whose eyes the camera is borrowing, and whose judgement it expresses.",
      },
      {
        type: "compare",
        weakLabel: "Angle as decoration",
        weak: "A new hire meets her intimidating boss. Both are shot at eye level in matching mediums, and there's a random Dutch tilt when the boss laughs because it “looks cool”.",
        strongLabel: "Angle as point of view",
        strong:
          "The boss stands by the window, framed slightly from below. The new hire sits in a low chair, seen slightly from above over the boss's shoulder. When she finally stands to disagree, the camera meets her at eye level for the first time.",
        note: "Subtle shifts of a few inches are often more powerful than extreme angles. The change in angle marks the change in power.",
      },
      { type: "heading", text: "When to break the obvious reading" },
      {
        type: "text",
        body: "Low-equals-powerful is a starting point, not a law. A villain shot at plain eye level can be more frightening than one shot from below, because he feels like someone who could be sitting across the table from us. A high angle can stand in for a watcher's gaze, turning the character below into prey. And sometimes an angle's real job is to hide something.",
      },
      {
        type: "example",
        title: "Looking down to keep a secret",
        source: "Psycho (1960), dir. Alfred Hitchcock",
        body: "When the private investigator Arbogast climbs the stairs of the Bates house, Hitchcock cuts to a shot from high above the landing as a figure rushes out and attacks him. The height feels like fate closing in, but it also does a practical storytelling job: from up there, we can't see the attacker's face. The angle keeps the film's secret while seeming merely dramatic.",
      },
      {
        type: "callout",
        tone: "warning",
        title: "The Dutch tilt wears out fast",
        body: "A canted frame is a strong spice. Used for a specific reason, as in the postwar Vienna of *The Third Man* (1949), where tilted angles make a morally broken city feel physically off-balance, it's unforgettable. Sprinkled on for energy, it just looks as if the camera fell over.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Think of a conversation where power shifts: a job interview that turns, a parent and a teenager, a negotiation. Describe where the camera sits at the start, and where it has moved to by the end.",
        placeholder: "At first the camera looks up at… by the end…",
      },
    ],
    keyTakeaways: [
      "Camera height is a judgement: eye level meets characters as equals, low angles lend power, and high angles diminish.",
      "Angles borrow a point of view, so ask whose eyes the camera is using and whose feelings it expresses.",
      "A change of angle across a scene can chart a shift in power more clearly than any dialogue.",
      "Extreme angles and Dutch tilts are spices. Use them for a specific reason or they turn into noise.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A bullied teenager finally confronts his tormentor. You want the audience to feel the moment he stops being afraid. Which camera plan supports that best?",
        options: [
          "Start with the camera slightly high on the teen, then bring it down to his eye level, or just below, as he stands his ground",
          "Use a Dutch tilt throughout to show the tension",
          "Shoot the whole scene from a bird's-eye view",
          "Shoot both boys at eye level in identical framing for the whole scene",
        ],
        answerIndex: 0,
        explanation:
          "The change in angle charts the change in power. Starting high makes him small and vulnerable; lowering the camera as he stands up lets the audience feel the shift. A constant angle, whatever it is, can't express a change.",
      },
      {
        id: "q2",
        prompt:
          "A director films a character alone in a huge, empty car park from directly overhead. What is this most likely to convey?",
        options: [
          "That the character is powerful and in control",
          "Nothing in particular; overhead shots are neutral",
          "That the scene is a flashback",
          "Detachment and insignificance, as if the character is being observed by fate",
        ],
        answerIndex: 3,
        explanation:
          "A bird's-eye or overhead view lifts us out of the character's experience and turns them into a small shape in a pattern. It reads as detachment, fate or clinical observation, not as neutral coverage.",
      },
      {
        id: "q3",
        prompt:
          "In *Psycho*, the attack on Arbogast is shown from high above the staircase. Beyond drama, what storytelling job does that angle do?",
        options: [
          "It shows the layout of the whole house",
          "It keeps the attacker's face out of view, protecting the film's secret",
          "It makes Arbogast look powerful",
          "It lets the audience see through the attacker's eyes",
        ],
        answerIndex: 1,
        explanation:
          "The high angle feels like fate, but it also conceals: from above, the attacker's face stays hidden. Good angles often do two jobs at once, one emotional and one practical.",
      },
      {
        id: "q4",
        prompt:
          "A child is being scolded by her father. The camera sits at the child's height, looking up at him. What is the shot mainly communicating?",
        options: [
          "That the father is objectively heroic",
          "That the scene is a dream sequence",
          "How powerful the father seems to her, from her point of view",
          "That the father is about to fall over",
        ],
        answerIndex: 2,
        explanation:
          "Angle borrows a point of view. From the child's height, the low angle expresses her experience: the father looms. Out of context the same shot might just say *powerful*; here it says *powerful to her*.",
      },
    ],
    exercise: {
      prompt:
        "Write a six-shot list for a scene where power changes hands: an interview, an interrogation, a break-up, a first day at work. Give every shot an angle and a reason, and make sure the angle at the end differs from the angle at the start. Then run the scene through the Shot Planner.",
      tips: [
        "Decide who holds power at the start and who holds it at the end.",
        "Small height changes of a few inches are often more convincing than extreme ones.",
        "Give any Dutch tilt a specific reason tied to a character's state of mind.",
        "Try one reversal: give the ‘weak’ character the low angle at the key moment.",
      ],
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 3. Composition
  // -------------------------------------------------------------------------
  {
    id: "composition",
    trackId: "visual",
    title: "Composition: Arranging the Frame",
    summary:
      "Rule of thirds, leading lines, headroom and lead room, negative space, frames within frames and depth: how the arrangement of a single image tells the audience where to look and what to feel.",
    minutes: 8,
    level: "intermediate",
    skills: ["visual"],
    blocks: [
      { type: "heading", text: "The frame is a stage with four walls" },
      {
        type: "text",
        body: "Every image is a small rectangle of decisions. What sits in the centre, what hugs the edge, what's sharp and what's lost in shadow all tell the audience where to look and how to feel before anything moves. Composition is how a director *writes* inside a single frame.",
      },
      { type: "heading", text: "The core tools" },
      {
        type: "list",
        items: [
          "**Rule of thirds:** divide the frame into a 3×3 grid and place eyes, horizons and key objects on the lines or where they cross. Off-centre subjects feel natural and alive; a dead-centre subject feels formal, confrontational or eerily controlled.",
          "**Leading lines:** roads, corridors, railings and shadows pull the eye along them. Point them at what matters.",
          "**Headroom and lead room:** leave a little space above the head, and more space in the direction a character looks or moves (also called *looking room* or *nose room*). It gives their gaze somewhere to go.",
          "**Negative space:** empty areas of the frame. A small figure in a big empty frame reads as lonely, lost or free.",
          "**Frames within frames:** doorways, windows and mirrors box characters in, isolate them, or show them as trapped or watched.",
          "**Depth:** foreground, midground and background layers let one image hold several stories at once.",
        ],
      },
      {
        type: "example",
        title: "Corridors that pull you in",
        source: "The Shining (1980), dir. Stanley Kubrick",
        body: "Kubrick repeatedly places the camera dead centre in the Overlook Hotel's corridors, so the walls, carpet and ceiling all converge on a single vanishing point. These leading lines drag the eye down the hallway toward whatever might be waiting at the end. The symmetry feels controlled, almost too perfect, and that unnatural orderliness is part of what makes the hotel feel as if it's watching.",
      },
      {
        type: "example",
        title: "The door that frames a man",
        source: "The Searchers (1956), dir. John Ford",
        body: "The film ends looking out from the dark interior of a homestead through its doorway. The rescued girl is carried inside and the others follow, but Ethan Edwards (John Wayne) stays on the threshold, framed against the bright desert. Then he turns and walks away, and the door closes on him.\n\nThe doorway says he can bring the family back together but can never belong inside it. The film opens with a mirror of this shot, a door swinging open onto the same landscape, so the whole story is bracketed by a frame within a frame.",
      },
      {
        type: "text",
        body: "Notice how often composition does the work that clumsy dialogue tries to do. Nobody in that final shot says *I will always be an outsider*. The architecture says it for him.",
      },
      {
        type: "example",
        title: "Two stories in one frame",
        source: "Citizen Kane (1941), dir. Orson Welles",
        body: "In one famous shot, Kane's mother signs her son over to the banker who will become his guardian, while through the window behind them young Charles plays happily in the snow, his shouts drifting in. Gregg Toland's deep focus keeps every plane sharp, so the audience holds the adult transaction and the child's innocence in a single glance. The boy's childhood is being signed away in the foreground while he plays in the background.",
      },
      {
        type: "compare",
        weakLabel: "Everything in the middle",
        weak: "A widow sits alone at a dinner table set for two. She's framed dead centre in a tight medium shot, and the empty chair is out of frame.",
        strongLabel: "Composition that tells the story",
        strong:
          "She sits small on the left third of a wide frame. The rest of the frame belongs to the empty chair across from her and the untouched place setting, sharp in the foreground.",
        note: "The second frame makes absence the subject. Negative space, depth and focus tell us what she's thinking about, without a cutaway or a word.",
      },
      {
        type: "callout",
        tone: "insight",
        title: "Breaking the rules on purpose",
        body: "The series *Mr. Robot* (2015–2019) became known for pushing its lonely, paranoid hacker into the bottom corner of the frame, with a wall of empty space above or behind him, often facing the near edge rather than into open space. It breaks the conventions of headroom and lead room deliberately, and the result feels like alienation. You earn the right to break a rule by knowing exactly which feeling the break creates.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "The squint test",
        body: "Squint at a frame until the detail blurs. The shapes that remain (the brightest area, the biggest mass, the strongest line) are where the audience's eye will go first. If that isn't your subject, recompose.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Describe a single frame that shows a character is trapped, without any bars, locks or chains. Name the composition tools you'd use: frame within a frame, negative space, leading lines, depth.",
        placeholder: "She's framed through the gap in…",
      },
    ],
    keyTakeaways: [
      "Composition tells the audience where to look and how to feel before anything moves or anyone speaks.",
      "Place subjects on the thirds for a natural feel; centre them for formality, confrontation or eerie control.",
      "Lead room gives a gaze somewhere to go, while negative space, frames within frames and depth let the architecture carry emotion.",
      "Break a convention only when you know exactly what feeling the break creates.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "A character is framed at the far right edge of the screen, looking right, with almost no space in front of her face and a large empty area behind her. What is this most likely to make the audience feel?",
        options: [
          "That she's confident and in control",
          "Cramped and uneasy, as if she's blocked or something is behind her",
          "Nothing in particular; this is standard framing",
          "Joyful and free",
        ],
        answerIndex: 1,
        explanation:
          "She has no lead room: her gaze runs straight into the edge of the frame, and the empty space sits behind her, where she can't see. Audiences read this as confinement or unease, even threat. Standard framing would give her space to look into.",
      },
      {
        id: "q2",
        prompt:
          "In the final shot of *The Searchers*, Ethan is framed through the homestead doorway before he walks away. What does this frame within a frame express?",
        options: [
          "That the house is about to be attacked",
          "That Ethan is about to move in with the family",
          "That the landscape is dangerous",
          "That he stands apart from the family he has brought back together, divided from them by the threshold",
        ],
        answerIndex: 3,
        explanation:
          "The doorway separates the family's interior from the wilderness where Ethan belongs. Framing him through it, then closing the door, turns architecture into meaning: he can restore the family, but he can't join it.",
      },
      {
        id: "q3",
        prompt:
          "You want one shot to show that a teenager is secretly listening while her parents argue about divorce. Which composition does this best?",
        options: [
          "Deep staging: the teenager half-hidden on the stairs in the foreground, the parents arguing in the background",
          "A close-up of the teenager's face, with the parents off screen and silent",
          "A bird's-eye view of the whole house",
          "A centred two-shot of the parents only",
        ],
        answerIndex: 0,
        explanation:
          "Depth lets one frame hold two stories: the argument and the child absorbing it. The audience sees cause and effect at the same time, which neither a close-up of her alone nor a shot of the parents alone can give.",
      },
      {
        id: "q4",
        prompt: "When is it most justified to put your subject dead centre in the frame?",
        options: [
          "Always, because audiences look at the centre first",
          "Never, because the rule of thirds forbids it",
          "When you want formality, confrontation, symmetry or an eerie sense of control",
          "Only in documentaries",
        ],
        answerIndex: 2,
        explanation:
          "Centring isn't wrong; it's a different feeling. Symmetry reads as formal, deliberate or unnatural, like Kubrick's corridors, and a character staring straight down the lens feels confrontational. The rule of thirds is a default, not a law.",
      },
    ],
    exercise: {
      prompt:
        "Take the key moment of a scene you're working on (or this one: a man waits alone on a train platform for someone who isn't coming). Plan three compositions for that moment, each built on a different tool (negative space, a frame within a frame, deep staging), and write one line on how each changes the feeling. Then build the full scene in the Shot Planner.",
      tips: [
        "Decide what the audience should feel first, then choose the tool.",
        "Use foreground objects to add depth and suggest a point of view.",
        "Give a moving or looking character lead room, unless you want them to feel blocked.",
        "Check each frame with the squint test: where does the eye land first?",
      ],
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 4. Camera movement and lenses
  // -------------------------------------------------------------------------
  {
    id: "movement-and-lenses",
    trackId: "visual",
    title: "Camera Movement & Lenses",
    summary:
      "Push-ins, tracking shots, handheld and locked-off frames, wide lenses versus telephoto compression, and the dolly zoom: how a moving camera and a chosen lens change what a moment feels like.",
    minutes: 9,
    level: "intermediate",
    skills: ["visual", "pacing"],
    blocks: [
      { type: "heading", text: "Every move needs a motive" },
      {
        type: "text",
        body: "A still camera observes. A moving camera *participates*. When the frame moves, the audience feels themselves move, so every movement should answer two questions: why are we going there, and why now? A move without a motive is decoration. A move with a motive is storytelling.",
      },
      {
        type: "list",
        items: [
          "**Push-in:** the camera creeps toward a character. Growing intensity, a realisation, the world narrowing to one thought.",
          "**Pull-out:** the camera withdraws. Isolation, a reveal of context, or an ending that leaves someone behind.",
          "**Tracking:** the camera travels with a character. Momentum, a journey, being swept along.",
          "**Handheld:** the camera breathes and jolts with its operator. Immediacy, chaos, documentary intimacy.",
          "**Static (locked off):** the camera doesn't move at all. Composure and observation, a stage on which performance carries everything.",
          "**Steadicam:** a stabilised camera glides through space. Floating, dreamlike continuity, like a ghost following the characters.",
        ],
      },
      {
        type: "example",
        title: "The Copacabana shot",
        source: "Goodfellas (1990), dir. Martin Scorsese",
        body: "Henry Hill takes Karen on a date to the Copacabana nightclub. Instead of queuing at the front, he leads her in through a side entrance, along back corridors and through the bustling kitchen, handing out tips as he goes, until a table is set down for them right in front of the stage. Scorsese shoots it as one unbroken Steadicam take.\n\nThe moving camera doesn't just show the route. It makes us feel the seduction Karen feels: doors opening, no waiting, the whole world rearranging itself for this man.",
      },
      {
        type: "compare",
        weakLabel: "Movement for energy",
        weak: "The camera circles two friends at a café for the whole conversation, because the director wanted the scene to feel “dynamic”.",
        strongLabel: "Movement with a motive",
        strong:
          "The camera is locked off for the small talk. When one friend admits she's seriously ill, the camera begins a slow push-in on the other friend's face as she takes it in, and doesn't stop until the scene ends.",
        note: "A move means most against stillness. Holding back until the emotional turn makes the push-in feel like the listener's world narrowing.",
      },
      { type: "heading", text: "Handheld or sticks?" },
      {
        type: "text",
        body: "Handheld camerawork tells the audience *this is happening now, and nobody planned it*. The Omaha Beach landing that opens *Saving Private Ryan* (1998) is shot largely handheld, the camera jostled, splashed and ducking like another soldier, so the chaos becomes ours.\n\nAt the opposite pole is Yasujirō Ozu, whose films, such as *Tokyo Story* (1953), are built from low, still, carefully composed frames. His stillness invites us to watch patiently as a family quietly drifts apart. Neither approach is better. They offer the audience different contracts.",
      },
      { type: "heading", text: "Lenses change space itself" },
      {
        type: "text",
        body: "Focal length does more than zoom. A **wide-angle lens** (short focal length) exaggerates depth: distances stretch, backgrounds fall away, and a face close to the lens can bulge and distort, which suits comedy, paranoia or claustrophobic intimacy. A **telephoto lens** (long focal length) compresses depth: foreground and background seem stacked together, crowds press in, and the world flattens around the character.",
      },
      {
        type: "example",
        title: "Running and getting nowhere",
        source: "The Graduate (1967), dir. Mike Nichols",
        body: "Near the end, Benjamin races on foot to the church where Elaine is getting married. He's filmed on a very long lens as he runs straight toward the camera, and the compression means that for several seconds he barely seems to get any closer. The lens turns his sprint into the feeling of a nightmare: running as hard as you can and still being too late.",
      },
      {
        type: "example",
        title: "The dolly zoom",
        source: "Vertigo (1958), dir. Alfred Hitchcock; Jaws (1975), dir. Steven Spielberg",
        body: "Move the camera toward a subject while zooming out, or away while zooming in, at just the right rate, and the subject stays the same size while the background swells or shrinks behind them. In *Vertigo*, Hitchcock uses it for Scottie's view down the bell-tower stairwell, so the drop seems to stretch away beneath him: fear of heights made visible.\n\nIn *Jaws*, Spielberg uses it on Chief Brody's face on the beach at the moment he sees the shark attack, and the world seems to lurch around him. It is the visual equivalent of your stomach dropping, which is why it should be saved for exactly that.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Tie the move to a beat",
        body: "A camera move feels natural when something in the scene motivates it: a character stands, walks, looks or realises. Link your move to an action or an emotional beat and the audience won't feel the camera; they'll feel the moment.",
      },
      {
        type: "exercise-inline",
        prompt:
          "Choose the most important moment in a scene you know. Would you play it static, handheld or with a slow push-in? On a wide lens close to the actor, or a long lens from across the room? Write one sentence defending each choice.",
        placeholder: "Static, because… on a long lens, because…",
      },
    ],
    keyTakeaways: [
      "A moving camera makes the audience participate, so every move needs a motive: why go there, and why now?",
      "Movement means most against stillness, so save the push-in for the turn.",
      "Handheld says *immediate and unplanned*; a locked-off frame says *watch closely*. Choose the contract that fits the scene.",
      "Wide lenses stretch space and distort faces up close; long lenses compress space and press the world in.",
      "The dolly zoom warps the background around a steady subject. Save it for the moment a character's world lurches.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "Two lovers stand on opposite sides of a crowded street, and you want the crowd to feel as if it's pressing in and keeping them apart. Which lens choice helps most?",
        options: [
          "An extreme wide-angle lens right next to one of them",
          "A fisheye lens from high above",
          "A telephoto lens from a distance, compressing the crowd between them",
          "Whichever lens is on the camera, since lenses don't affect space",
        ],
        answerIndex: 2,
        explanation:
          "Long lenses compress depth, stacking foreground and background together. The crowd looks denser and the lovers seem caught in it. A wide lens would do the opposite, stretching the space and emptying it out.",
      },
      {
        id: "q2",
        prompt: "A director wants one slow push-in during a conversation. Where does it most likely belong?",
        options: [
          "On the listener's face at the moment the scene turns, after the camera has been still",
          "Continuously, from the first line to the last",
          "On the establishing shot of the building",
          "On whoever is speaking, every time they speak",
        ],
        answerIndex: 0,
        explanation:
          "Movement reads loudest against stillness. Holding the camera back and then pushing in at the emotional turn tells the audience *this is the moment*, and it often lands hardest on the person absorbing the news rather than the one delivering it.",
      },
      {
        id: "q3",
        prompt: "Why does the handheld Omaha Beach sequence in *Saving Private Ryan* feel so overwhelming?",
        options: [
          "Handheld cameras record at a higher resolution",
          "It is shot entirely from a bird's-eye view",
          "The camera glides perfectly smoothly, in contrast with the violence",
          "The jostling, unplanned-feeling camera puts the audience inside the chaos like another soldier",
        ],
        answerIndex: 3,
        explanation:
          "Handheld camerawork breaks the sense of a composed, safe viewpoint. The camera flinches, gets splashed and loses track of people, so we experience the landing rather than simply observing it.",
      },
      {
        id: "q4",
        prompt: "What does a dolly zoom do, and when is it best used?",
        options: [
          "It circles the subject to show every angle, for grand reveals",
          "It keeps the subject the same size while the background stretches or shrinks, for a moment of shock or dizzying realisation",
          "It speeds up the footage, for comic chases",
          "It switches between colour and black and white, for flashbacks",
        ],
        answerIndex: 1,
        explanation:
          "By tracking and zooming in opposite directions, the dolly zoom holds the subject steady while the space around them warps. It's the visual version of a lurching stomach, which is why Hitchcock used it for vertigo and Spielberg for Brody's moment of horror. Overuse drains its power.",
      },
    ],
    exercise: {
      prompt:
        "Plan the camera for the turn of a key scene: decide whether you're handheld or on sticks, which lens you're on, and exactly where (and why) the camera moves. Defend those choices to a demanding cinematographer in the DP drill, then refine the full shot list in the Shot Planner.",
      tips: [
        "Name the scene's turn before you choose any movement.",
        "Give every move a motive: an action, a look or a realisation.",
        "Pick a lens for how space should feel: stretched and exposed, or compressed and crowding.",
        "Know which move you'd cut if time ran short, and which one you'd protect.",
      ],
      practiceScenarioId: "dp-shot-planning",
      labTool: "shots",
    },
  },

  // -------------------------------------------------------------------------
  // 5. Light and colour
  // -------------------------------------------------------------------------
  {
    id: "light-and-colour",
    trackId: "visual",
    title: "Light & Colour as Emotion",
    summary:
      "Key, fill and back light, high-key and low-key looks, motivated light, and colour palettes that change as characters do. How cinematographers paint mood and make colour carry a story.",
    minutes: 9,
    level: "advanced",
    skills: ["visual", "character"],
    blocks: [
      { type: "heading", text: "Writing with light" },
      {
        type: "text",
        body: "The word *photography* comes from Greek roots meaning, roughly, *drawing with light*. Cinematographers take that literally: light decides what we see, what we can't see, and how we feel about both. The same face can read as innocent or sinister depending on nothing more than where the light comes from and how much shadow it leaves.\n\nStorytellers have always known this. Homer greets new days of Odysseus's voyage with the same painted light:",
      },
      {
        type: "quote",
        text: "When the child of morning, rosy-fingered Dawn, appeared…",
        attribution: "Homer, *The Odyssey*, trans. Samuel Butler (1900)",
      },
      { type: "heading", text: "Key, fill, back, and the ratio between them" },
      {
        type: "list",
        items: [
          "**Key light:** the main source, which shapes the face and sets the mood.",
          "**Fill light:** a softer light from the other side that lifts the shadows the key creates. Less fill means deeper shadow and more drama.",
          "**Back light:** a light from behind that rims the head and shoulders and separates the subject from the background.",
        ],
      },
      {
        type: "text",
        body: "The balance between key and fill, the *contrast ratio*, is your emotional dial. **High-key lighting** uses plenty of fill for low contrast: bright, even, few shadows, the look of sitcoms, musicals and optimism. **Low-key lighting** uses little fill for high contrast: deep shadows and pools of darkness, the look of film noir, horror and moral danger.",
      },
      {
        type: "example",
        title: "The Prince of Darkness",
        source: "The Godfather (1972), dir. Francis Ford Coppola",
        body: "Cinematographer Gordon Willis lit Don Corleone's office largely from above, so Marlon Brando's eyes often sit in shadow and we can never quite read what he's thinking. Outside, his daughter's wedding blazes in sunshine. The film cuts between the two, and the lighting tells the story before the plot does: the family's warm public face, and the dark room where the real business is done.\n\nWillis's willingness to let faces fall into darkness earned him the nickname *the Prince of Darkness*.",
      },
      {
        type: "text",
        body: "Light feels truthful when it seems to come from somewhere: a window, a lamp, a fire, a television. That's **motivated lighting**. Even when a scene is lit with film lamps, the cinematographer usually builds the look around a source the audience can believe in, so the mood feels like a property of the world rather than a trick of the crew.",
      },
      {
        type: "example",
        title: "Shooting by candlelight",
        source: "Barry Lyndon (1975), dir. Stanley Kubrick",
        body: "To film interiors lit by real candles, as eighteenth-century rooms would have been, Kubrick and cinematographer John Alcott used extraordinarily fast lenses originally made by Zeiss for NASA. The result is soft, flickering, golden light, with faces glowing out of the darkness like figures in paintings of the period. The motivation isn't just believable; it becomes the whole aesthetic of the film.",
      },
      { type: "heading", text: "Colour as a storyline" },
      {
        type: "text",
        body: "Colour works on us before we name it. Warm palettes (amber, gold, red) tend to read as comfort, passion or danger; cool palettes (blue, teal, grey) as calm, distance or loneliness. But the real power is in **change**: when a film's palette shifts with its protagonist, colour becomes an arc of its own. Pixar plans this across a whole film in a *colour script*, a sequence of small paintings that maps the emotional temperature of every part of the story.",
      },
      {
        type: "example",
        title: "Colour that means something",
        source: "The Wizard of Oz (1939); Schindler's List (1993); Traffic (2000)",
        body: "In *The Wizard of Oz*, Dorothy's Kansas is sepia-toned. When she opens the farmhouse door onto Oz, the film bursts into Technicolor, and the change of palette *is* the change of worlds. In *Schindler's List*, shot in black and white, Steven Spielberg picks out a little girl in a red coat walking through the liquidation of the Kraków ghetto. When that red appears again later, we know exactly what it means.\n\nIn *Traffic*, Steven Soderbergh gives each storyline its own look: the Mexico scenes a hot, washed-out yellow, the story of the American judge leading the drug war a cold blue. The audience always knows where it is, and feels the difference between the worlds.",
      },
      {
        type: "compare",
        weakLabel: "Colour as wallpaper",
        weak: "A film about a woman leaving a controlling marriage is graded in the same warm, glossy look from first frame to last, because that look is popular.",
        strongLabel: "Colour as an arc",
        strong:
          "Her married life plays in muted greys and beiges in a spotless house, and she always wears pale neutrals. As she starts to break away, one colour enters her world: a green scarf, a green door, the garden she begins to tend. By the final scene the frame is full of it.",
        note: "A palette that changes with the character gives the audience a second, silent storyline, and a way to feel the change before anyone names it.",
      },
      {
        type: "callout",
        tone: "tip",
        title: "Light the turn",
        body: "Plan your lighting around the scene's emotional movement, not just its location. A lamp switched off halfway through a break-up, curtains opened on the morning after a death, a neon sign flickering as a lie unravels: when the light changes on the turn, the audience feels the turn.",
      },
    ],
    keyTakeaways: [
      "Light decides what the audience sees and how they feel about it, and the balance of key and fill is your emotional dial.",
      "High-key lighting reads as open and optimistic; low-key lighting as secretive, dangerous or dramatic.",
      "Motivated light, built around a believable source, makes mood feel like part of the world rather than a trick.",
      "Colour works hardest when it changes: plan a palette that tracks your character's arc.",
    ],
    quiz: [
      {
        id: "q1",
        prompt:
          "You're lighting a scene in which a trusted family doctor is secretly lying to a patient. Which approach best hints at the lie without giving it away?",
        options: [
          "Flat, bright, high-key light on everyone, exactly like the rest of the film",
          "Coloured party lights flashing across his face",
          "Near-total darkness, so we can barely see him",
          "Gradually reducing the fill on his side, so shadow creeps across his face as the lie deepens",
        ],
        answerIndex: 3,
        explanation:
          "Less fill means deeper shadow. Letting shadow grow across his face over the scene makes the audience uneasy before they know why. It's a subtle, motivated change rather than a sign reading *villain*.",
      },
      {
        id: "q2",
        prompt: "What makes lighting *motivated*?",
        options: [
          "It is brighter than every other light on set",
          "It appears to come from a believable source in the story's world, such as a window, lamp or fire",
          "It is added digitally in post-production",
          "It follows the actor wherever they move",
        ],
        answerIndex: 1,
        explanation:
          "Motivated light seems to come from something in the scene. Even when film lamps do the real work, building the look around a believable source keeps the mood feeling truthful, and *Barry Lyndon*'s candlelit rooms take that to the extreme.",
      },
      {
        id: "q3",
        prompt: "Why is the red coat in *Schindler's List* so powerful?",
        options: [
          "In a black-and-white film, the single colour singles out one child and gives an individual face to mass atrocity",
          "Red always signals happiness to audiences",
          "It tells the audience that the girl is secretly the villain",
          "It shows that the scene is a flashback",
        ],
        answerIndex: 0,
        explanation:
          "Against a black-and-white world, one splash of colour is impossible to ignore. It turns an anonymous crowd into one child we follow, so when the red appears again later, its meaning is devastating.",
      },
      {
        id: "q4",
        prompt:
          "Your protagonist starts the film numb and isolated and ends it reconnected with her family. Which colour plan tells that story best?",
        options: [
          "The same saturated palette throughout, for consistency",
          "Random colours in every scene, to keep things visually interesting",
          "Cool, desaturated tones early, with warmer colours gradually entering her world as she reconnects",
          "Black and white for the entire film",
        ],
        answerIndex: 2,
        explanation:
          "A colour arc gives the audience a silent second storyline. Moving from cool and desaturated toward warmth lets them feel her reconnection happening, even before the plot confirms it.",
      },
    ],
    exercise: {
      prompt:
        "Write a lighting and colour plan for the key scene of your project, or for the late-night diner scene in the DP drill: where the light comes from, whether the look is high-key or low-key, and how the light or palette changes at the scene's turn. Then pitch it to the cinematographer, who will want to know what the light is doing and where it's coming from.",
      tips: [
        "Name a motivating source for every light: window, lamp, neon, screen, fire.",
        "Decide how much shadow the scene deserves, and why.",
        "Tie any change in light or colour to the emotional turn.",
        "Think across the whole film: where does this scene sit on your colour arc?",
      ],
      practiceScenarioId: "dp-shot-planning",
    },
  },
];
