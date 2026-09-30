import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-sea-700/80 bg-sea-900/60 p-5 shadow-xl shadow-black/20 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("font-display text-lg font-semibold text-sea-100", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm leading-relaxed text-sea-300", className)} {...props} />;
}
