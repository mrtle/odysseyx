import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * OdysseusX wordmark: a bronze sail over a wine-dark sea. Decorative — the
 * enclosing link or heading supplies the accessible name.
 */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  // Unique per instance: the shell renders two logos, and a gradient referenced
  // by id from a display:none subtree (the hidden sidebar) doesn't paint.
  const gradientId = `ox-sail-${useId()}`;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0cf8e" />
            <stop offset="1" stopColor="#b27b24" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="#0d1628" />
        <path d="M16 5 L16 21 L7 21 Z" fill={`url(#${gradientId})`} />
        <path d="M17.5 8 L24.5 21 L17.5 21 Z" fill="#e6b560" opacity="0.55" />
        <path d="M5 24 Q10.5 21 16 24 T27 24" stroke="#4fbccd" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
      {compact ? null : (
        <span className="font-display text-xl font-semibold tracking-tight text-sea-100">
          Odysseus<span className="text-bronze-400">X</span>
        </span>
      )}
    </span>
  );
}
