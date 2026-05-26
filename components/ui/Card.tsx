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
        "bg-[#111111] border border-[#1a1a1a] rounded-lg transition-all duration-200",
        hover && "hover:border-gold/20 hover:shadow-gold cursor-pointer",
        gold && "border-gold/40 shadow-gold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
