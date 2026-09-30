# OdysseusX

**An AI storytelling coach for storytellers and filmmakers.**

Letter AI coaches salespeople with lessons, roleplays and scored feedback. OdysseusX does the same for
people who tell stories: screenwriters, directors, video creators, founders who pitch, and speakers.
You learn the craft, practise it out loud with AI personas, get your own work critiqued, and watch
your skills improve over time.

> *"Tell me, O Muse, of that ingenious hero…"* — every story is an odyssey.

## What's inside

| Pillar | What it does |
| --- | --- |
| **Learn** (`/learn`) | Seven tracks of short, interactive lessons: Story Foundations, Structure & Plot, Character, Scenes & Dialogue, Visual Storytelling, Editing & Sound, and Pitch & Delivery. Each lesson has worked film examples, weak-vs-strong comparisons, a quiz with explanations, and an exercise that links to a drill or Story Lab tool. |
| **Practice** (`/practice`) | AI roleplay drills, the core of the product. Pitch a studio exec, survive a writers' room, direct an actor who asks "what's my motivation?", plan coverage with a demanding DP, or tell a true story at a campfire. Personas stay in character and push back, replies stream live, and you can use voice (dictation plus spoken replies). At the end you get a scorecard with per-skill scores, strengths, concrete rewrites and a next step. |
| **Story Lab** (`/lab`) | Feedback on your own work. The **Logline Doctor** scores six components and suggests rewrites. The **Story Doctor** maps a story, treatment or scene onto a structure framework (Three-Act, Hero's Journey, Save the Cat, Story Circle, Kishōtenketsu, Story Spine) and gives line notes and a revision plan. The **Shot Planner** turns a scene into a shot list with sizes, angles, movement, lenses and sound. |
| **Progress** (`/progress`) | A skill radar across eight storytelling skills (Hook, Structure, Character, Stakes, Dialogue, Visual, Pacing, Delivery), XP ranks from *Deckhand* to *Odysseus*, streaks, an activity heatmap, and full history. |
| **Daily challenge** (home) | A new micro-story prompt every day with quick AI feedback, for building a habit. |

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

### Live AI coach vs demo mode

- **Live mode.** With `ANTHROPIC_API_KEY` set, coaching runs on Claude (`claude-opus-5-5` by default)
  through the official Anthropic TypeScript SDK. Roleplay replies stream at low effort to keep latency
  down. Scorecards and Story Lab analyses use structured outputs validated against zod schemas at high
  effort. Refusals retry server-side on a fallback model (`fallbacks: "default"`).
- **Demo mode.** With no key set, the app still works end to end. An offline heuristic coach in
  `src/lib/demo/` produces deterministic feedback in the same shape, and a "Demo coach" badge shows
  in the UI. The offline coach reads English only: text that is clearly in another language gets a
  `422` with `code: "unsupported_language"` and a note explaining why, instead of a score.

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables the live Claude coach. |
| `ODYSSEUSX_MODEL` | Override the model (default `claude-opus-5-5`). |
| `ODYSSEUSX_MODE` | Force `live` or `demo`. Use `live` when credentials come from an `ant auth login` profile rather than an env var. |
| `ODYSSEUSX_DISABLE_FALLBACKS` | Set to `1` when routing through a gateway or cloud platform that doesn't accept the `fallbacks` parameter. |
| `ODYSSEUSX_RATE_LIMIT_PER_MINUTE` | Live-mode AI calls per minute per client (default `20`, bursts allowed up to the same number). `0` turns it off. |
| `ODYSSEUSX_DEMO_RATE_LIMIT_PER_MINUTE` | Demo-mode AI calls per minute per client (default `60`). The offline coach costs server CPU, so it's limited too, just more loosely. `0` turns it off. |
| `ODYSSEUSX_GLOBAL_RATE_LIMIT_PER_MINUTE` | AI calls per minute for all clients together, per mode (default 10 × the per-client limit: `200` live, `600` demo). A backstop against clients rotating addresses. `0` turns it off. |
| `ODYSSEUSX_TRUSTED_PROXY_HOPS` | How many proxies in front of the app append to `X-Forwarded-For` (default `1`). See [Deploying publicly](#deploying-publicly). |

### Deploying publicly

Every AI route (`/api/coach/*`, `/api/lab/*`, `/api/daily`) accepts only same-origin requests, caps
bodies at 1 MB, and rate-limits each client with an in-memory token bucket (per server instance), plus
a global bucket per mode. Rate-limited calls get `429` with a `Retry-After` header. Every error body
has the shape `{ "error": "…", "code": "…" }`.

Route handlers can't see the socket address, so the client is identified from headers, and the left end
of `X-Forwarded-For` is whatever the client sent. Tell the app how many proxies to trust:

- **Behind one reverse proxy or load balancer** that appends to `X-Forwarded-For` (nginx with
  `$proxy_add_x_forwarded_for`, AWS ALB, Fly, Render…): the default `ODYSSEUSX_TRUSTED_PROXY_HOPS=1`
  uses the rightmost entry, the address that proxy saw.
- **Behind a CDN and a proxy**: set it to the number of hops, e.g. `2`.
- **On Vercel**: nothing to set; the platform's `x-vercel-forwarded-for` header is used.
- **Exposed directly with `npm start`**: set `ODYSSEUSX_TRUSTED_PROXY_HOPS=0`. Forwarded headers are
  then ignored and all clients share one bucket, so raise the per-client limits accordingly (or, better,
  put a proxy in front).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Vitest unit tests: progress logic, demo coach, prompts, content integrity |
| `npm run build:demo` | Build the click-through demo as one self-contained HTML file (see below) |

### Static click-through demo

`npm run build:demo` bundles the whole app into a single HTML file in `.demo-dist/` that runs with no
server at all:

- `odysseusx-standalone.html` opens directly in a browser.
- `odysseusx.html` is the same page without the document wrapper, for hosts that add their own, such
  as claude.ai Artifacts.

The demo build (`demo/`) renders the real pages with a small hash router, swaps in browser stand-ins
for `next/link`, `next/navigation` and `next/headers`, and answers `fetch("/api/...")` in the page by
calling the real route handlers. Because it never has credentials, every AI feature runs on the
offline demo coach. It's for trying and sharing the product; the Next.js app is what you deploy.

## Architecture

- **Next.js 16 App Router**, React 19, TypeScript (strict), Tailwind CSS v4.
- **Content is code.** Lessons (`src/content/lessons/*.ts`), practice scenarios (`src/content/scenarios.ts`)
  and daily prompts are typed data. `src/content/content.test.ts` checks them for broken links, invalid
  quiz answers and duplicate ids.
- **AI layer.** `src/lib/ai/client.ts` is server-only. `generateStructured()` streams a structured-output
  request and returns the parsed object; `streamText()` streams roleplay replies; SDK errors map to
  friendly `CoachError`s. Prompts live in `src/lib/ai/prompts/`. User material is wrapped in tagged
  blocks so the model treats it as material to evaluate, not as instructions.
- **API routes** (`src/app/api/**`) validate every request body with zod: `coach/chat` (streaming
  roleplay), `coach/evaluate` (scorecard), `lab/logline`, `lab/story`, `lab/shots`, `daily`, `status`.
- **Progress** is stored in the browser (a zustand store persisted to `localStorage`). There are no
  accounts yet, and you can export or reset your data from `/progress`. The pure logic (XP, ranks,
  streaks, the recency-weighted skill profile, recommendations) lives in `src/lib/progress.ts`.

```
src/
  app/            routes: /, /onboarding, /learn, /practice, /lab, /progress, /api/*
  components/     ui kit, layout shell, and feature components
  content/        tracks & lessons, scenarios, daily prompts
  lib/
    ai/           Claude client, schemas, prompts
    demo/         offline heuristic coach
    store.ts      persisted progress store
    progress.ts   XP, ranks, streaks, skill profile, recommendations
```

## Roadmap ideas

- Accounts and cloud sync, plus team/classroom dashboards for film schools and writers' rooms
  (the equivalent of Letter AI's manager view)
- Upload a short film or storyboard frames for visual feedback (Claude vision)
- Custom scenarios authored by coaches, and certification paths
- Shared rate limiting across server instances (e.g. Redis) and per-user usage metering once there are accounts
