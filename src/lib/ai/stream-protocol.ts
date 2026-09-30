/**
 * Wire format for streamed persona replies (/api/coach/chat).
 *
 * The body is the persona's in-character text. If the server must say
 * something out of character — a mid-stream error or a refusal — it appends
 * NOTICE_MARKER followed by the notice text and ends the stream. Clients
 * show the part before the marker as dialogue and the part after it as a
 * coach notice (never saved as the persona's words).
 */
export const NOTICE_MARKER = "\u001e"; // ASCII record separator: never part of normal prose

export interface SplitReply {
  /** In-character text (may be partial if a notice follows). */
  reply: string;
  /** Out-of-character notice, or null when the reply completed normally. */
  notice: string | null;
}

export function splitNotice(text: string): SplitReply {
  const index = text.indexOf(NOTICE_MARKER);
  if (index === -1) return { reply: text, notice: null };
  return {
    reply: text.slice(0, index).trimEnd(),
    notice: text.slice(index + NOTICE_MARKER.length).trim() || null,
  };
}
