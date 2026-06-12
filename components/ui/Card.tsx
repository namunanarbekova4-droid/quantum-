import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gold?: boolean;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ className, hover = false, gold = false, glass = false, padding = "none", children, ...props }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        "bg-[#0F0A1F] border border-[#1A1040] rounded-xl",
        "transition-all duration-250",
        hover && [
          "cursor-pointer",
          "hover:border-[#7C3AED]/40",
          "hover:shadow-[0_0_0_1px_rgba(124,58,237,0.3),0_8px_40px_rgba(124,58,237,0.15)]",
          "hover:-translate-y-0.5",
        ],
        gold && [
          "border-[#C9A84C]/30",
          "shadow-[0_0_0_1px_rgba(201,168,76,0.15),0_4px_24px_rgba(201,168,76,0.08)]",
          hover && "hover:border-[#C9A84C]/60 hover:shadow-[0_0_0_1px_rgba(201,168,76,0.4),0_8px_40px_rgba(201,168,76,0.15)]",
        ],
        glass && "glass",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
