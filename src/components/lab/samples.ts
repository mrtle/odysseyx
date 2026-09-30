/**
 * Sample material for the Story Lab's "Try an example" buttons, and the
 * craft tips shown while an analysis runs. All samples are original.
 */
import type { StoryFormat } from "@/lib/ai/schemas";
import type { FrameworkId } from "@/lib/frameworks";

export interface SampleLogline {
  quality: "weak" | "promising" | "strong";
  note: string;
  logline: string;
  genre: string;
}

export const SAMPLE_LOGLINES: SampleLogline[] = [
  {
    quality: "weak",
    note: "A vague premise — watch what the doctor flags.",
    logline: "A man goes on a journey to find himself and learns what really matters in life.",
    genre: "Drama",
  },
  {
    quality: "strong",
    note: "Specific, ironic and on a clock.",
    logline:
      "When her estranged father is framed for a cartel murder, a disgraced deep-sea diver must recover the evidence from a sunken ferry before a hurricane buries it — and him — forever.",
    genre: "Thriller",
  },
  {
    quality: "promising",
    note: "A great irony, but what stands in her way?",
    logline: "A shy librarian who hates crowds must win a televised trivia tournament to save her small-town library from demolition.",
    genre: "Comedy",
  },
  {
    quality: "promising",
    note: "A juicy setup with no stakes yet.",
    logline: "After a botched heist, a getaway driver with a stutter wants to collect his cut, but the crew is convinced he's the one who talked.",
    genre: "Crime comedy",
  },
  {
    quality: "strong",
    note: "A flawed hero and a deadline.",
    logline:
      "An agoraphobic crossword setter must decode the clues a killer is hiding in her own newspaper grid before he strikes again on Sunday — without leaving her apartment.",
    genre: "Thriller",
  },
];

export interface SampleStory {
  id: string;
  label: string;
  title: string;
  format: StoryFormat;
  framework: FrameworkId;
  text: string;
}

export const SAMPLE_STORIES: SampleStory[] = [
  {
    id: "lake",
    label: "Personal story",
    title: "The Lake",
    format: "personal-story",
    framework: "story-circle",
    text: `This is a story about the summer I learned to swim. I was eleven and I was really scared of the water, basically terrified of it.

Every morning my grandmother walked me to the lake at the edge of our town. The water was cold and green and smelled like pine needles and diesel from the boats. She would sit on the dock with her thermos and watch me not go in.

Then one day she didn't come. My mother said she was in the hospital and that she might not come home. I felt so sad that I couldn't eat.

I decided I would swim across the lake before she came back, so she could see it from her window. I tried every day. I swallowed water, I panicked, I went under and came up coughing while the older kids laughed at me from the dock.

On the last day of August I finally did it. My arms burned and the far shore wouldn't get closer, but I kept going until my feet touched the mud.

She came home in September. I never told her I did it for her. I learned that courage is just fear that keeps going.`,
  },
  {
    id: "night-ferry",
    label: "Short film treatment",
    title: "Night Ferry",
    format: "short-film",
    framework: "three-act",
    text: `Every night for eleven years, DELIA (58) has piloted the last ferry across the strait. She knows every regular by their coat. She speaks to none of them.

Tonight a boy of about nine boards alone, soaked, clutching a plastic bag. No ticket. No adult. Delia should radio the harbour police. Instead she lets him sit in the wheelhouse and gives him her coffee.

Halfway across, the boy tells her he is going to find his father, who works the night shift at the cannery on the far shore. Delia knows the cannery closed in the spring. She says nothing.

The fog comes in thick. The radio crackles: the harbour police are searching for a missing child. Delia looks at the boy asleep on her coat. She turns the radio down.

When the ferry docks, a police car is waiting, blue lights washing the pier. The boy wakes and sees it. He looks at Delia like she has betrayed him. She could hand him over. Instead she kneels and tells him the truth about the cannery — and about the son she stopped speaking to eleven years ago.

The boy takes her hand and walks with her to the police car.

The next night, Delia pilots the last ferry across the strait. A regular in a grey coat boards. For the first time, she says good evening.`,
  },
  {
    id: "inventory",
    label: "A single scene",
    title: "Inventory",
    format: "scene",
    framework: "kishotenketsu",
    text: `The hardware store closes at six. At ten past, SAM (70s) is still counting screws into paper bags, twenty to a bag, the way he has for forty years.

His daughter NINA (40s) stands at the counter with a folder from the bank. "The buyer wants the keys by Friday," she says.

Sam keeps counting. "Hinges are low. I'll need to order hinges."

"Dad. There's no order. There's no Friday after Friday."

He sets down a bag, opens it, and pours the screws back into the bin. They rattle like rain on a tin roof. He starts counting again from one.

Nina watches. Then she walks around the counter, takes a paper bag, and counts with him. Neither of them says anything for a long time.

"Nineteen," Sam says. "Twenty." He folds the top of the bag twice, the way he taught her when she was six, and hands it to her.

She folds hers the same way.`,
  },
];

export interface SampleScene {
  id: string;
  label: string;
  scene: string;
  intent: string;
  userShots: string;
}

export const SAMPLE_SCENES: SampleScene[] = [
  {
    id: "envelope",
    label: "The Envelope",
    intent: "Quiet and tense — a family secret surfacing without anyone saying it.",
    userShots: `Drone shot of the lighthouse in the storm
Close-up on the envelope as Tom slides it across
Handheld on Mara as she leaves`,
    scene: `INT. LIGHTHOUSE KITCHEN - NIGHT

Rain hammers the windows. MARA (40s), soaked, stands at the stove. TOM (60s), her father, sits at the table with an unopened envelope.

TOM
You came back.

MARA
You wrote.

Tom slides the envelope across the table. Mara picks up the envelope and turns it over. She doesn't open it.

MARA (CONT'D)
Is it true? What they're saying about the boat?

Tom looks at the window. A long silence.

TOM
Your mother never knew.

Mara realizes what he means. She sets the envelope down, slowly.

MARA
Then neither will I.

She walks out into the rain. The door slams. Tom sits alone.`,
  },
  {
    id: "diner",
    label: "3 A.M. Diner",
    intent: "Tender and unhurried — kindness between strangers.",
    userShots: "",
    scene: `INT. ALL-NIGHT DINER - 3 A.M.

Fluorescent lights hum. JUNE (20s), still in hospital scrubs, sits alone in a booth with a cold coffee. Her phone lies face down on the table.

It buzzes. She stares at it. Doesn't move.

RAY (60s), the night cook, comes out with a coffee pot.

RAY
You've been nursing that one since midnight.

JUNE
Waiting to hear if I can go home.

Ray pours anyway. June turns the phone over and reads the message. She laughs. Then she cries.

RAY
Good news or bad?

JUNE
Both.

Ray slides into the booth across from her. He doesn't say anything. Neither does she.`,
  },
];

export const DIRECTING_INTENT_IDEAS = [
  "Claustrophobic and paranoid",
  "Tender and unhurried",
  "Deadpan comedy",
  "Dreamlike, slightly unreal",
  "Raw, documentary immediacy",
] as const;

export const CRAFT_TIPS: Record<"logline" | "story" | "shots", string[]> = {
  logline: [
    "The best loglines contain an irony: the one person least equipped for the job is the one who has to do it.",
    "Stakes should be personal. \"The world ends\" is abstract; \"she loses custody of her son\" is a story.",
    "If you can't write the logline, the story may not have a spine yet — that's useful to know early.",
    "A logline sells the movie, not the plot. Leave out subplots, backstory and the ending.",
    "Name the flaw. A \"retired\" detective is a job; a \"disgraced\" detective is a story.",
    "Read it aloud. If you run out of breath, it's two loglines.",
  ],
  story: [
    "Enter late, leave early: start every scene as close to its turn as you can.",
    "A protagonist is defined by the choices they make under pressure, not the adjectives we give them.",
    "The midpoint is where the story changes its mind — a revelation that makes the old plan impossible.",
    "Endings land when they answer the question the beginning asked.",
    "Specific details make stories universal. \"A red 1994 Corolla with one grey door\" beats \"an old car\".",
    "If a scene can be cut without the story collapsing, it probably should be.",
  ],
  shots: [
    "Every shot should answer the question \"why here, why this close, why now?\"",
    "Save your tightest close-up for the moment the scene turns — if everything is close, nothing is.",
    "Keep the camera on one side of the 180° line so eyelines match and geography stays clear.",
    "A camera move should mean something: we push in when a character realises, pull out when they're left alone.",
    "Inserts are cheap and powerful — the object a character can't stop touching tells us what they won't say.",
    "Plan your last frame first. It's the image the audience carries into the next scene.",
  ],
};
