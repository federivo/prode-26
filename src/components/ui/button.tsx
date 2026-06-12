import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Pan de oro con brillo que barre al pasar el mouse.
  primary:
    "bg-gilded sheen text-primary-fg shadow-[var(--shadow-gold)] " +
    "shadow-[inset_0_1px_0_oklch(1_0_0/0.45)] hover:brightness-[1.06] active:brightness-95",
  secondary:
    "bg-surface text-fg border border-border hover:border-primary/50 hover:bg-primary-soft/40",
  ghost: "text-muted hover:text-fg hover:bg-primary-soft/50",
  danger:
    "bg-danger text-white hover:brightness-105 active:brightness-95 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center rounded-full font-semibold tracking-tight",
        "transition duration-200 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:translate-y-px",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
