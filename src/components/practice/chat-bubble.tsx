import { Volume2 } from "lucide-react";
import { ThinkingDots } from "@/components/ui/loading";
import type { ChatMessage, Persona, ScenarioCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PersonaAvatar } from "./persona-avatar";

export interface ChatBubbleProps {
  role: ChatMessage["role"];
  content: string;
  persona: Pick<Persona, "name" | "avatar">;
  category: ScenarioCategory;
  /** The persona is still typing this message. */
  streaming?: boolean;
  /** Offer a "read aloud" control on persona lines. */
  onSpeak?: () => void;
}

export function ChatBubble({ role, content, persona, category, streaming = false, onSpeak }: ChatBubbleProps) {
  const isPersona = role === "persona";
  return (
    <li className={cn("flex gap-2.5 sm:gap-3", isPersona ? "justify-start" : "justify-end")}>
      {isPersona ? <PersonaAvatar persona={persona} category={category} size="sm" className="mt-6" /> : null}
      <div className={cn("flex max-w-[85%] min-w-0 flex-col sm:max-w-[75%]", isPersona ? "items-start" : "items-end")}>
        <p className="mb-1 px-1 text-xs font-medium text-sea-400">{isPersona ? persona.name : "You"}</p>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap",
            isPersona
              ? "rounded-tl-md border border-sea-700 bg-sea-800/80 text-sea-100"
              : "rounded-tr-md border border-bronze-500/30 bg-bronze-500/15 text-sea-100",
          )}
        >
          {content ? (
            <>
              {content}
              {streaming ? (
                <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-bronze-300" aria-hidden />
              ) : null}
            </>
          ) : streaming ? (
            <ThinkingDots label={`${persona.name} is thinking`} className="py-1" />
          ) : null}
        </div>
        {onSpeak && isPersona && !streaming && content ? (
          <button
            type="button"
            onClick={onSpeak}
            className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-sea-400 transition-colors hover:bg-sea-800 hover:text-sea-100"
          >
            <Volume2 className="size-3.5" aria-hidden />
            Read aloud
          </button>
        ) : null}
      </div>
    </li>
  );
}
