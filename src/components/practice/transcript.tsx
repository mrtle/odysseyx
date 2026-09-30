import type { ChatMessage, Persona, ScenarioCategory } from "@/lib/types";
import { ChatBubble } from "./chat-bubble";

/** A finished conversation, read-only. */
export function Transcript({
  messages,
  persona,
  category,
}: {
  messages: ChatMessage[];
  persona: Pick<Persona, "name" | "avatar">;
  category: ScenarioCategory;
}) {
  return (
    <ol className="space-y-5" aria-label="Transcript">
      {messages.map((m) => (
        <ChatBubble key={m.id} role={m.role} content={m.content} persona={persona} category={category} />
      ))}
    </ol>
  );
}
