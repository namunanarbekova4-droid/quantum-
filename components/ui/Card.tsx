import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gold?: boolean;
}

export function Card({ className, hover = false, gold = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#0F0A1F] border border-[#1A1040] rounded-lg transition-all duration-200",
        hover && "hover:border-[#7C3AED]/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] cursor-pointer",
        gold && "border-gold/40 shadow-gold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
