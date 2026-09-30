"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sailboat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { SkillChip } from "@/components/ui/skill-chip";
import { writeProfileCookie } from "@/components/home/profile-cookie";
import type { ExperienceLevel, GoalId } from "@/lib/constants";
import { EXPERIENCES, EXPERIENCE_LIST, GOALS, GOAL_LIST, isExperienceLevel, isGoalId } from "@/lib/goals";
import { useAppStore, useHasHydrated } from "@/lib/store";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GoalIcon } from "./goal-icon";

export const ONBOARDING_STEPS = [
  { id: "name", label: "Name", short: "Name" },
  { id: "goal", label: "Goal", short: "Goal" },
  // "Experience" doesn't fit a quarter of a phone-width card, so phones show the short label.
  { id: "experience", label: "Experience", short: "Level" },
  { id: "project", label: "Project", short: "Project" },
] as const;

const NAME_MAX = 60;
const PROJECT_MAX = 200;

const PROJECT_EXAMPLES: Record<GoalId, string[]> = {
  filmmaker: ["A short film about my grandmother's last summer", "A no-budget music video", "My first feature as director"],
  screenwriter: ["A pilot set in a family-run funeral home", "A horror spec script", "Rewriting act two of my feature"],
  creator: [
    "A channel about night-shift workers",
    "A 60-second series on forgotten inventions",
    "My travel vlog's first episode",
  ],
  founder: ["Our seed-round pitch", "The origin story for our About page", "A demo-day talk"],
  speaker: ["A keynote on why teams stop telling the truth", "A best-man speech", "A TEDx audition"],
  writer: ["A personal essay about leaving home", "A short story collection", "The opening chapter of my novel"],
};

const DEFAULT_EXAMPLES = ["A short film", "A pitch deck story", "A personal essay"];

/** Where to go after saving: only known in-app destinations are allowed. */
const RETURN_TO: Record<string, string> = { progress: "/progress", home: "/" };

export function returnToFor(from: string | null | undefined): string {
  return (from && Object.hasOwn(RETURN_TO, from) && RETURN_TO[from]) || "/";
}

/**
 * Reads `?from=` on the client, so the page itself can be prerendered.
 * Render inside <Suspense> (useSearchParams suspends during prerendering).
 */
export function OnboardingFlowFromUrl() {
  const from = useSearchParams().get("from");
  return <OnboardingFlow returnTo={returnToFor(from)} />;
}

/** Waits for the store so an existing profile can pre-fill the form. */
export function OnboardingFlow({ returnTo = "/" }: { returnTo?: string }) {
  const hydrated = useHasHydrated();
  const profile = useAppStore((s) => s.profile);
  if (!hydrated) {
    return (
      <div aria-busy="true" aria-label="Loading">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-32 rounded-md" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Skeleton className="h-[26rem] w-full rounded-2xl" />
          <Skeleton className="hidden h-72 w-full rounded-2xl lg:block" />
        </div>
      </div>
    );
  }
  return <OnboardingForm initial={profile} returnTo={returnTo} />;
}

export function OnboardingForm({ initial, returnTo }: { initial: Profile | null; returnTo: string }) {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const id = useId();
  const editing = initial !== null;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [goal, setGoal] = useState<GoalId | null>(initial && isGoalId(initial.goal) ? initial.goal : null);
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    initial && isExperienceLevel(initial.experience) ? initial.experience : null,
  );
  const [project, setProject] = useState(initial?.project ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Move focus to the step's primary control whenever the step changes.
  useEffect(() => {
    bodyRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [step]);

  const last = step === ONBOARDING_STEPS.length - 1;
  const errorId = `${id}-error`;

  function validate(current: number): string | null {
    if (current === 0 && !name.trim()) return "Tell us what to call you — a first name is plenty.";
    if (current === 1 && !goal) return "Choose the one that fits best. You can change it any time.";
    if (current === 2 && !experience) return "Pick the closest match. It sets how deep the coaching goes.";
    return null;
  }

  function save(projectValue: string) {
    if (!goal || !experience || !name.trim()) return;
    setSaving(true);
    const trimmedProject = projectValue.trim().slice(0, PROJECT_MAX);
    setProfile({
      name: name.trim().slice(0, NAME_MAX),
      goal,
      experience,
      ...(trimmedProject ? { project: trimmedProject } : {}),
    });
    // Lets the server render the dashboard shell (not the landing page) on the next visit to Home.
    writeProfileCookie(true);
    router.push(returnTo);
  }

  function next(event?: Pick<FormEvent, "preventDefault">) {
    event?.preventDefault();
    const problem = validate(step);
    if (problem) {
      setError(problem);
      bodyRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      return;
    }
    setError(null);
    if (last) save(project);
    else setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    if (step === 0) router.push(returnTo);
    else setStep((s) => s - 1);
  }

  function jumpTo(target: number) {
    if (target >= step) return;
    setError(null);
    setStep(target);
  }

  function handleProjectKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) next(event);
  }

  const examples = goal ? PROJECT_EXAMPLES[goal] : DEFAULT_EXAMPLES;

  return (
    <>
      <PageHeader
        eyebrow={editing ? "Edit your profile" : "Before we set sail"}
        title={editing ? "Adjust your heading" : "Set your course"}
        description={
          editing
            ? "Change your name, goal, level or project. Your progress and history stay exactly where they are."
            : "Four quick questions, and your coach will chart lessons, drills and daily challenges around the stories you want to tell."
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <Card className="p-0">
          <form onSubmit={next} noValidate className="flex min-h-[26rem] flex-col">
            <div className="border-b border-sea-800 px-5 pt-5 pb-4 sm:px-7">
              <StepIndicator step={step} onJump={jumpTo} />
              <p className="sr-only" aria-live="polite">
                Step {step + 1} of {ONBOARDING_STEPS.length}: {ONBOARDING_STEPS[step].label}
              </p>
            </div>

            <div ref={bodyRef} key={step} className="flex-1 animate-rise px-5 py-6 sm:px-7">
              {step === 0 ? (
                <div>
                  <StepTitle>What should the crew call you?</StepTitle>
                  <StepHint>Your coach uses it when it talks to you. A first name is plenty.</StepHint>
                  <label htmlFor={`${id}-name`} className="label mt-6">
                    Your name
                  </label>
                  <input
                    id={`${id}-name`}
                    data-autofocus
                    className="field text-lg"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={NAME_MAX}
                    autoComplete="given-name"
                    placeholder="Penelope"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                  />
                  <p className="mt-6 text-sm text-sea-400">
                    Coming from another browser?{" "}
                    <Link href="/progress" className="font-medium text-bronze-300 underline-offset-4 hover:underline">
                      Restore your progress from a backup
                    </Link>
                  </p>
                </div>
              ) : null}

              {step === 1 ? (
                <fieldset className="min-w-0" aria-describedby={cn(`${id}-goal-hint`, error && errorId)}>
                  <legend>
                    <StepTitle>What stories do you want to tell?</StepTitle>
                  </legend>
                  <StepHint id={`${id}-goal-hint`}>
                    We&apos;ll tune your course around it. Pick the closest — you can change it any time.
                  </StepHint>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {GOAL_LIST.map((g, i) => {
                      const checked = goal === g.id;
                      return (
                        <label
                          key={g.id}
                          className={cn(
                            "relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze-400/70",
                            checked
                              ? "border-bronze-400/70 bg-bronze-500/10"
                              : "border-sea-700 bg-sea-900/50 hover:border-sea-500",
                          )}
                        >
                          <input
                            type="radio"
                            name={`${id}-goal`}
                            value={g.id}
                            checked={checked}
                            onChange={() => {
                              setGoal(g.id);
                              setError(null);
                            }}
                            className="sr-only"
                            data-autofocus={checked || (!goal && i === 0) ? true : undefined}
                            aria-describedby={`${id}-goal-${g.id}`}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl",
                              checked ? "bg-bronze-400 text-sea-950" : "bg-sea-800 text-bronze-300",
                            )}
                          >
                            <GoalIcon icon={g.icon} className="size-5" />
                          </span>
                          <span className="min-w-0 pr-5">
                            <span className="block font-semibold text-sea-100">{g.label}</span>
                            <span id={`${id}-goal-${g.id}`} className="mt-0.5 block text-sm leading-relaxed text-sea-300">
                              {g.description}
                            </span>
                            <span className="mt-2 flex flex-wrap gap-1" aria-hidden>
                              {g.preferredSkills.map((skill) => (
                                <SkillChip key={skill} skill={skill} />
                              ))}
                            </span>
                          </span>
                          <RadioMark checked={checked} />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {step === 2 ? (
                <fieldset className="min-w-0" aria-describedby={cn(`${id}-exp-hint`, error && errorId)}>
                  <legend>
                    <StepTitle>How far into the voyage are you?</StepTitle>
                  </legend>
                  <StepHint id={`${id}-exp-hint`}>This sets how deep the coaching goes and how hard the personas push.</StepHint>
                  <div className="mt-6 grid gap-3">
                    {EXPERIENCE_LIST.map((level, i) => {
                      const checked = experience === level.id;
                      return (
                        <label
                          key={level.id}
                          className={cn(
                            "relative flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze-400/70",
                            checked
                              ? "border-bronze-400/70 bg-bronze-500/10"
                              : "border-sea-700 bg-sea-900/50 hover:border-sea-500",
                          )}
                        >
                          <input
                            type="radio"
                            name={`${id}-experience`}
                            value={level.id}
                            checked={checked}
                            onChange={() => {
                              setExperience(level.id);
                              setError(null);
                            }}
                            className="sr-only"
                            data-autofocus={checked || (!experience && i === 0) ? true : undefined}
                            aria-describedby={`${id}-exp-${level.id}`}
                          />
                          <span aria-hidden className="flex shrink-0 gap-1 pt-1.5">
                            {[0, 1, 2].map((dot) => (
                              <span
                                key={dot}
                                className={cn(
                                  "h-2 w-4 rounded-full",
                                  dot <= i ? (checked ? "bg-bronze-400" : "bg-bronze-600/70") : "bg-sea-700",
                                )}
                              />
                            ))}
                          </span>
                          <span className="min-w-0 pr-5">
                            <span className="block font-semibold text-sea-100">
                              {level.label} <span className="font-normal text-sea-400 capitalize">· {level.id}</span>
                            </span>
                            <span id={`${id}-exp-${level.id}`} className="mt-0.5 block text-sm leading-relaxed text-sea-300">
                              {level.description}
                            </span>
                          </span>
                          <RadioMark checked={checked} />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {step === 3 ? (
                <div>
                  <StepTitle>What are you working on?</StepTitle>
                  <StepHint>
                    A film, a pitch, a talk, a chapter — naming it helps the coach make every exercise about your story.
                  </StepHint>
                  <label htmlFor={`${id}-project`} className="label mt-6">
                    Current project <span className="font-normal text-sea-400">(optional)</span>
                  </label>
                  <textarea
                    id={`${id}-project`}
                    data-autofocus
                    className="field min-h-24 resize-y"
                    rows={3}
                    value={project}
                    maxLength={PROJECT_MAX}
                    onChange={(e) => setProject(e.target.value)}
                    onKeyDown={handleProjectKeyDown}
                    placeholder={examples[0]}
                    aria-describedby={`${id}-project-count`}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Examples">
                      {examples.map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setProject(example)}
                          className="rounded-full border border-sea-600 bg-sea-800/60 px-2.5 py-1 text-xs text-sea-200 transition-colors hover:border-bronze-500/50 hover:text-bronze-200"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                    <span id={`${id}-project-count`} className="text-xs text-sea-400 tabular-nums">
                      {project.length}/{PROJECT_MAX}
                    </span>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p id={errorId} role="alert" className="mt-4 text-sm font-medium text-wine-400">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sea-800 px-5 py-4 sm:px-7">
              {step > 0 || editing ? (
                <Button variant="ghost" onClick={back} icon={step > 0 ? <ArrowLeft className="size-4" aria-hidden /> : undefined}>
                  {step > 0 ? "Back" : "Cancel"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-2">
                {last && !editing ? (
                  <Button variant="ghost" onClick={() => save("")} disabled={saving}>
                    Skip for now
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  loading={saving}
                  icon={last ? <Sailboat className="size-4" aria-hidden /> : undefined}
                  className="min-w-32"
                >
                  {last ? (editing ? "Save changes" : "Set sail") : "Continue"}
                  {last ? null : <ArrowRight className="size-4" aria-hidden />}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <VoyagePreview name={name} goal={goal} experience={experience} project={project} editing={editing} />
      </div>
    </>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold text-sea-100 sm:text-3xl">{children}</h2>;
}

function StepHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 text-sm leading-relaxed text-sea-300 sm:text-base">
      {children}
    </p>
  );
}

function RadioMark({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-3.5 right-3.5 flex size-5 items-center justify-center rounded-full border transition-colors",
        checked ? "border-bronze-400 bg-bronze-400 text-sea-950" : "border-sea-500",
      )}
    >
      {checked ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}

function StepIndicator({ step, onJump }: { step: number; onJump: (step: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:gap-2" aria-label="Onboarding steps">
      {ONBOARDING_STEPS.map((s, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        const content = (
          <>
            <span
              aria-hidden
              className={cn(
                "block h-1.5 rounded-full transition-colors",
                state === "done" ? "bg-bronze-500" : state === "current" ? "bg-bronze-300" : "bg-sea-700",
              )}
            />
            <span
              className={cn(
                "mt-2 flex items-center gap-1 text-xs font-medium",
                state === "current" ? "text-bronze-200" : state === "done" ? "text-sea-200" : "text-sea-400",
              )}
            >
              {state === "done" ? (
                <Check className="size-3" aria-hidden />
              ) : (
                <span aria-hidden className="tabular-nums">
                  {i + 1}.
                </span>
              )}
              <span className="truncate">
                {s.short !== s.label ? (
                  <span aria-hidden className="sm:hidden">
                    {s.short}
                  </span>
                ) : null}
                <span className={s.short !== s.label ? "max-sm:sr-only" : undefined}>{s.label}</span>
              </span>
              <span className="sr-only">{state === "done" ? " (done)" : state === "todo" ? " (to do)" : ""}</span>
            </span>
          </>
        );
        return (
          <li key={s.id} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
            {state === "done" ? (
              <button type="button" onClick={() => onJump(i)} className="block w-full rounded text-left hover:opacity-90">
                {content}
                <span className="sr-only">, go back to this step</span>
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}

function VoyagePreview({
  name,
  goal,
  experience,
  project,
  editing,
}: {
  name: string;
  goal: GoalId | null;
  experience: ExperienceLevel | null;
  project: string;
  editing: boolean;
}) {
  const g = goal ? GOALS[goal] : null;
  return (
    <aside aria-label="Profile preview" className="hidden lg:block">
      <Card className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-48 rounded-full bg-bronze-500/15 blur-3xl"
        />
        <p className="relative text-xs font-semibold tracking-[0.2em] text-bronze-400 uppercase">Your voyage</p>
        <p className="relative mt-2 truncate font-display text-2xl font-semibold text-sea-100">
          {name.trim() || "A new voyager"}
        </p>
        <dl className="relative mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-sea-400">Telling stories as a</dt>
            <dd className="mt-1 flex items-center gap-2 text-sea-100">
              {g ? (
                <>
                  <GoalIcon icon={g.icon} className="size-4 text-bronze-300" /> {g.label}
                </>
              ) : (
                <span className="text-sea-400">—</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-sea-400">Experience</dt>
            <dd className="mt-1 text-sea-100">
              {experience ? EXPERIENCES[experience].label : <span className="text-sea-400">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-sea-400">Your course leans on</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {g ? (
                g.preferredSkills.map((skill) => <SkillChip key={skill} skill={skill} />)
              ) : (
                <span className="text-sea-400">Pick a goal</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-sea-400">Working on</dt>
            <dd className="mt-1 line-clamp-3 text-sea-100">{project.trim() || <span className="text-sea-400">—</span>}</dd>
          </div>
        </dl>
        {!editing ? (
          <p className="relative mt-6 border-t border-sea-800 pt-4 text-xs leading-relaxed text-sea-400">
            You start as a <span className="font-semibold text-sea-200">Deckhand</span>. Lessons, drills and daily challenges earn
            XP on the way to Odysseus.
          </p>
        ) : null}
      </Card>
    </aside>
  );
}
