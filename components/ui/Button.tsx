"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", size = "md", loading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold rounded-lg btn-press " +
      "focus-ring select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";

    const variants = {
      gold: [
        "bg-[#C9A84C] text-[#06040F] border border-[#C9A84C]",
        "hover:bg-[#D4B85C] hover:border-[#D4B85C] hover:shadow-[0_0_20px_rgba(201,168,76,0.35)]",
        "active:bg-[#B8932E]",
      ].join(" "),
      outline: [
        "bg-transparent text-[#C9A84C] border border-[#C9A84C]/40",
        "hover:bg-[#C9A84C]/8 hover:border-[#C9A84C]/70 hover:shadow-[0_0_16px_rgba(201,168,76,0.2)]",
      ].join(" "),
      ghost: [
        "bg-transparent text-[#8B7CF8] border border-transparent",
        "hover:text-white hover:bg-[#1A1040] hover:border-[#1A1040]",
      ].join(" "),
      danger: [
        "bg-red-500/10 text-red-400 border border-red-500/30",
        "hover:bg-red-500/20 hover:border-red-500/50",
      ].join(" "),
    };

    const sizes = {
      sm: "h-8 px-3.5 text-xs gap-1.5",
      md: "h-10 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
export { Button };
