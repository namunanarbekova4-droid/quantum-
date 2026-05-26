"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, suffix, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-text-secondary">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              "w-full h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded transition-all duration-200",
              "focus:outline-none focus:border-gold focus:shadow-[0_0_0_2px_rgba(201,168,76,0.1)]",
              "placeholder:text-[#444444]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-danger focus:border-danger focus:shadow-[0_0_0_2px_rgba(239,68,68,0.1)]",
              suffix && "pr-10",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
