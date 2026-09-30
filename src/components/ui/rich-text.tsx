import { Fragment, type ReactNode } from "react";

/**
 * Renders the tiny inline markup used in lesson content: **bold**,
 * *italic* and `code`. Everything else is plain text (no HTML injection).
 * Blank lines split paragraphs when `paragraphs` is set.
 */
export function RichText({ text, paragraphs = false, className }: { text: string; paragraphs?: boolean; className?: string }) {
  if (!paragraphs) return <span className={className}>{renderInline(text)}</span>;
  return (
    <>
      {text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className={className}>
            {renderInline(p)}
          </p>
        ))}
    </>
  );
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`)/g;

export function renderInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-sea-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-sea-800 px-1.5 py-0.5 font-mono text-[0.9em] text-bronze-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
