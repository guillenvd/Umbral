import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:opacity-90",
  secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
