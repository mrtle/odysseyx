import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-b from-bronze-400 to-bronze-600 text-sea-950 shadow-lg shadow-bronze-900/30 hover:from-bronze-300 hover:to-bronze-500",
  secondary: "border border-sea-600 bg-sea-800/70 text-sea-100 hover:border-sea-500 hover:bg-sea-700/70",
  ghost: "text-sea-200 hover:bg-sea-800/70 hover:text-sea-100",
  danger: "border border-wine-500/60 bg-wine-600/20 text-wine-400 hover:bg-wine-600/35",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant, size, loading, icon, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant, size, icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
