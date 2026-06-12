"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, suffix, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#8B7CF8] uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full h-11 px-4 bg-[#06040F] border border-[#1A1040] text-white text-sm rounded-lg",
              "transition-all duration-200",
              "focus:outline-none focus:border-[#C9A84C] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.1),inset_0_1px_2px_rgba(0,0,0,0.2)]",
              "placeholder:text-[#8B7CF8]/25",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              error && "border-red-500/60 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
              suffix && "pr-10",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7CF8]">
              {suffix}
            </div>
          )}
        </div>
        {hint && !error && (
          <p className="text-xs text-[#8B7CF8]/50">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
export { Input };
