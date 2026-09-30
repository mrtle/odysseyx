"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

/** Copy text to the clipboard, falling back to a hidden textarea where the async API is unavailable. */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to the legacy path (e.g. insecure context or denied permission)
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Copy failed");
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  srLabel,
  variant = "ghost",
  size = "sm",
  className,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  /** Accessible name when the visible label is ambiguous, e.g. "Copy rewrite 2". */
  srLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const id = window.setTimeout(() => setState("idle"), 2200);
    return () => window.clearTimeout(id);
  }, [state]);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label={srLabel}
        onClick={() => {
          copyText(text).then(
            () => setState("copied"),
            () => setState("failed"),
          );
        }}
        icon={state === "copied" ? <Check className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      >
        {state === "copied" ? copiedLabel : state === "failed" ? "Copy failed" : label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Couldn't copy — select the text and copy it manually" : ""}
      </span>
    </>
  );
}
