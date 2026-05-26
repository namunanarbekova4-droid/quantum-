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
    const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none";
    const variants = {
      gold: "bg-gold text-[#080808] border border-gold hover:bg-gold-light hover:border-gold-light hover:shadow-gold active:bg-gold-dark",
      outline: "bg-transparent text-gold border border-gold hover:bg-gold/8 hover:shadow-gold",
      ghost: "bg-transparent text-text-secondary border border-transparent hover:text-white hover:bg-[#1a1a1a]",
      danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
    };
    const sizes = {
      sm: "h-8 px-3 text-sm rounded",
      md: "h-10 px-5 text-sm rounded",
      lg: "h-12 px-7 text-base rounded-lg",
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
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);
Button.displayName = "Button";
export { Button };
