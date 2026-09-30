"use client";

import { useId, useState, type ReactNode, type Ref } from "react";
import { BookOpen, Camera, ClipboardList, Download, MessageSquareQuote, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoNotice } from "@/components/ui/demo-notice";
import type { Shot, ShotPlan } from "@/lib/ai/schemas";
import { CAMERA_ANGLE_INFO, CAMERA_MOVEMENT_INFO, SHOT_FRAMING_INFO, SHOT_SIZE_INFO, type FilmTerm } from "@/lib/film";
import type { CoachMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { SectionHeading } from "./lab-ui";
import { fileSlug, shotPlanToCsv, shotPlanToText } from "./shot-export";

/**
 * A camera term that explains itself on demand: a button that toggles the
 * term's meaning inline (tap, click or Enter/Space), so the explanation
 * works on touch screens and for keyboard and screen-reader users — not
 * just as a hover tooltip. The `title` stays as a mouse-hover shortcut.
 */
function TermToggle({ term, children, className }: { term: FilmTerm; children?: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        title={term.effect}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        className={cn("cursor-help rounded text-left", className ?? TERM_TEXT)}
      >
        {children ?? term.label}
      </button>
      <span id={id} hidden={!open} className="mt-1 block max-w-[14rem] text-xs leading-snug font-normal text-sea-300">
        {term.effect}
      </span>
    </>
  );
}

const TERM_TEXT = "underline decoration-sea-500 decoration-dotted underline-offset-4 hover:decoration-bronze-300";

function SizeLabel({ shot }: { shot: Shot }) {
  const info = SHOT_SIZE_INFO[shot.size];
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className="font-display text-base font-bold text-bronze-300">{info.abbr ?? info.label}</span>
      <span className="text-[11px] text-sea-300">{info.label}</span>
    </span>
  );
}

/** A shot as a card (narrow screens): the camera terms share one explanation line below them. */
function ShotCard({ shot }: { shot: Shot }) {
  const id = useId();
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const size = SHOT_SIZE_INFO[shot.size];
  const terms: { key: string; term: FilmTerm }[] = [
    { key: "framing", term: SHOT_FRAMING_INFO[shot.framing] },
    { key: "angle", term: CAMERA_ANGLE_INFO[shot.angle] },
    { key: "movement", term: CAMERA_MOVEMENT_INFO[shot.movement] },
  ];
  const active = openTerm === "size" ? size : terms.find((t) => t.key === openTerm)?.term ?? null;
  const explanationId = `${id}-term`;
  const toggle = (key: string) => setOpenTerm((current) => (current === key ? null : key));
  const toggleProps = (key: string, term: FilmTerm) => ({
    type: "button" as const,
    title: term.effect,
    "aria-expanded": openTerm === key,
    "aria-controls": explanationId,
    onClick: () => toggle(key),
  });

  return (
    <li
      className="rounded-xl border border-sea-700/80 bg-sea-900/60 p-4"
      onKeyDown={(e) => {
        if (e.key === "Escape" && openTerm) setOpenTerm(null);
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sea-800 font-display text-lg font-bold text-sea-200">
          <span className="sr-only">Shot </span>
          {shot.number}
        </span>
        <div className="min-w-0 flex-1">
          <button {...toggleProps("size", size)} className="cursor-help rounded text-left">
            <SizeLabel shot={shot} />
          </button>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {terms.map(({ key, term }) => (
              <button
                key={key}
                {...toggleProps(key, term)}
                className={cn(
                  "cursor-help rounded-md border px-2 py-0.5 transition-colors",
                  openTerm === key ? "border-bronze-400/60 bg-bronze-500/15 text-bronze-200" : "border-sea-600/80 bg-sea-800/60 text-sea-200 hover:border-sea-500",
                )}
              >
                {term.label}
              </button>
            ))}
            <span className="rounded-md border border-sea-700 px-2 py-0.5 text-sea-300">{shot.lens}</span>
          </div>
          <p id={explanationId} hidden={!active} className="mt-2 text-xs leading-relaxed text-sea-300">
            {active ? (
              <>
                <span className="font-semibold text-sea-100">{active.label}: </span>
                {active.effect}
              </>
            ) : null}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-sea-100">{shot.subject}</p>
      <p className="mt-0.5 text-sm text-sea-300">{shot.action}</p>
      <p className="mt-3 text-sm leading-relaxed text-sea-200">
        <span className="font-semibold text-bronze-200">Why: </span>
        {shot.purpose}
      </p>
      {shot.sound ? (
        <p className="mt-2 flex gap-2 text-sm text-sea-300">
          <Volume2 className="mt-0.5 size-4 shrink-0 text-aegean-300" aria-hidden />
          <span>
            <span className="sr-only">Sound: </span>
            {shot.sound}
          </span>
        </p>
      ) : null}
    </li>
  );
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Split "Palette: … Lighting: … Camera: …" into labelled parts when the concept follows that shape. */
function conceptParts(concept: string): { label: string; text: string }[] | null {
  const matches = [...concept.matchAll(/(Palette|Lighting|Camera(?: language)?)\s*:\s*/gi)];
  if (matches.length < 2) return null;
  return matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : concept.length;
    return { label: m[1].replace(/ language/i, ""), text: concept.slice(start, end).trim() };
  });
}

function Glossary({ shots }: { shots: Shot[] }) {
  const groups: { title: string; terms: FilmTerm[] }[] = [
    { title: "Shot sizes", terms: [...new Set(shots.map((s) => s.size))].map((k) => SHOT_SIZE_INFO[k]) },
    { title: "Framings", terms: [...new Set(shots.map((s) => s.framing))].map((k) => SHOT_FRAMING_INFO[k]) },
    { title: "Angles", terms: [...new Set(shots.map((s) => s.angle))].map((k) => CAMERA_ANGLE_INFO[k]) },
    { title: "Movement", terms: [...new Set(shots.map((s) => s.movement))].map((k) => CAMERA_MOVEMENT_INFO[k]) },
  ];
  return (
    <details className="group rounded-xl border border-sea-700/80 bg-sea-950/40">
      <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-sea-200 hover:text-sea-100">
        <BookOpen className="size-4 text-bronze-300" aria-hidden />
        Film grammar in this plan — what each choice communicates
      </summary>
      <div className="grid gap-5 border-t border-sea-700/70 p-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 text-xs font-semibold tracking-[0.16em] text-sea-400 uppercase">{g.title}</h3>
            <dl className="space-y-2 text-sm">
              {g.terms.map((t) => (
                <div key={t.label}>
                  <dt className="font-medium text-sea-100">
                    {t.label}
                    {t.abbr ? <span className="ml-1 text-bronze-300">({t.abbr})</span> : null}
                  </dt>
                  <dd className="text-sea-300">{t.effect}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </details>
  );
}

/** The Shot Planner's plan: concept, the shot list (table on wide screens, cards on narrow), coverage and export. */
export function ShotPlanResult({
  plan,
  mode,
  title,
  headingRef,
}: {
  plan: ShotPlan;
  mode: CoachMode;
  /** Used for export headings and file names. */
  title?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const concept = conceptParts(plan.visualConcept);
  const exportTitle = title?.trim() || "Shot plan";

  return (
    <div className="animate-rise space-y-8">
      <Card className="relative overflow-clip">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-64 rounded-full bg-gradient-to-br from-wine-500/20 to-transparent blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-wine-400 uppercase">Shot plan</p>
            <Badge tone="neutral">
              {plan.shots.length} {plan.shots.length === 1 ? "shot" : "shots"}
            </Badge>
          </div>
          <h2 ref={headingRef} tabIndex={-1} className="mt-2 scroll-mt-12 font-display text-xl leading-snug font-semibold text-sea-100 focus:outline-none sm:text-2xl">
            {plan.sceneSummary}
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-sea-400 uppercase">Emotional intent</h3>
              <p className="mt-1.5 leading-relaxed text-sea-200">{plan.emotionalIntent}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.16em] text-sea-400 uppercase">Visual concept</h3>
              {concept ? (
                <dl className="mt-1.5 space-y-1.5 text-sm leading-relaxed">
                  {concept.map((c) => (
                    <div key={c.label}>
                      <dt className="inline font-semibold text-bronze-200">{c.label}: </dt>
                      <dd className="inline text-sea-200">{c.text}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1.5 leading-relaxed text-sea-200">{plan.visualConcept}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <DemoNotice mode={mode} />

      <section aria-labelledby="shot-list">
        <SectionHeading
          id="shot-list"
          icon={<Camera className="size-4" />}
          title="Shot list"
          description="Tap or click a camera term to see what it communicates."
          actions={
            <>
              <CopyButton text={shotPlanToText(plan, exportTitle)} label="Copy as text" variant="secondary" />
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="size-4" aria-hidden />}
                onClick={() => downloadText(`${fileSlug(exportTitle)}.csv`, `﻿${shotPlanToCsv(plan)}`, "text/csv;charset=utf-8")}
              >
                Download CSV
              </Button>
            </>
          }
        />

        {/* Wide screens: a table */}
        {/* Sized to fit the xl content width (974px at a 1280px window); it only scrolls on unusually narrow xl layouts, and the scroller is focusable so it can be scrolled from the keyboard. */}
        <div
          role="region"
          aria-label="Shot list table (scrollable)"
          tabIndex={0}
          className="hidden overflow-x-auto rounded-2xl border border-sea-700/80 bg-sea-900/60 focus-visible:border-bronze-400/60 xl:block"
        >
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <caption className="sr-only">Shot list with {plan.shots.length} shots</caption>
            <thead>
              <tr className="border-b border-sea-700 text-[11px] tracking-[0.14em] text-sea-400 uppercase">
                <th scope="col" className="px-3 py-3 font-semibold">#</th>
                <th scope="col" className="px-3 py-3 font-semibold">Size</th>
                <th scope="col" className="px-3 py-3 font-semibold">Framing</th>
                <th scope="col" className="px-3 py-3 font-semibold">Angle</th>
                <th scope="col" className="px-3 py-3 font-semibold">Move</th>
                <th scope="col" className="px-3 py-3 font-semibold">Lens</th>
                <th scope="col" className="w-[22%] px-3 py-3 font-semibold">Subject &amp; action</th>
                <th scope="col" className="w-[24%] px-3 py-3 font-semibold">Purpose</th>
                <th scope="col" className="w-[16%] px-3 py-3 font-semibold">Sound</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sea-800">
              {plan.shots.map((s) => (
                <tr key={s.number} className="align-top transition-colors hover:bg-sea-800/40">
                  <th scope="row" className="px-3 py-3 font-display text-lg font-bold text-sea-300">
                    {s.number}
                  </th>
                  <td className="px-3 py-3">
                    <TermToggle term={SHOT_SIZE_INFO[s.size]} className="">
                      <SizeLabel shot={s} />
                    </TermToggle>
                  </td>
                  <td className="px-3 py-3 text-sea-200">
                    <TermToggle term={SHOT_FRAMING_INFO[s.framing]} />
                  </td>
                  <td className="px-3 py-3 text-sea-200">
                    <TermToggle term={CAMERA_ANGLE_INFO[s.angle]} />
                  </td>
                  <td className="px-3 py-3 text-sea-200">
                    <TermToggle term={CAMERA_MOVEMENT_INFO[s.movement]} />
                  </td>
                  <td className="px-3 py-3 text-sea-300">{s.lens}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-sea-100">{s.subject}</p>
                    <p className="mt-0.5 text-sea-300">{s.action}</p>
                  </td>
                  <td className="px-3 py-3 leading-relaxed text-sea-200">{s.purpose}</td>
                  <td className="px-3 py-3 text-sea-300">{s.sound || <span className="text-sea-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Narrow screens: cards */}
        <ol className="grid gap-3 md:grid-cols-2 xl:hidden" aria-label="Shots">
          {plan.shots.map((s) => (
            <ShotCard key={s.number} shot={s} />
          ))}
        </ol>

        <div className="mt-4">
          <Glossary shots={plan.shots} />
        </div>
      </section>

      {plan.coverageNotes.length > 0 ? (
        <section aria-labelledby="shot-coverage">
          <SectionHeading id="shot-coverage" icon={<ClipboardList className="size-4" />} title="Coverage notes" description="For the day itself — and the edit after." />
          <Card>
            <ul className="space-y-3">
              {plan.coverageNotes.map((n, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-sea-200">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-bronze-400" aria-hidden />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {plan.feedbackOnUserShots.length > 0 ? (
        <section aria-labelledby="shot-feedback">
          <SectionHeading id="shot-feedback" icon={<MessageSquareQuote className="size-4" />} title="Notes on your shot ideas" />
          <Card className="p-0">
            <ul className="divide-y divide-sea-700/70">
              {plan.feedbackOnUserShots.map((f, i) => (
                <li key={i} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6 sm:p-5">
                  <p className="screenplay text-sm text-sea-100">“{f.shot}”</p>
                  <p className="text-sm leading-relaxed text-sea-300">{f.note}</p>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
