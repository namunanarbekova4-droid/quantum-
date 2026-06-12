"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  headline: string;
  description: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: "default" | "gold";
}

export function EmptyState({ icon: Icon, headline, description, cta, className, variant = "default" }: EmptyStateProps) {
  const isGold = variant === "gold";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-8 py-14",
        "bg-[#0F0A1F] border border-[#1A1040] rounded-2xl",
        isGold && "border-[#C9A84C]/20 shadow-[0_0_40px_rgba(201,168,76,0.05)]",
        className
      )}
    >
      {/* Icon with ambient glow */}
      <div className="relative mb-5">
        <div className={cn(
          "absolute inset-0 rounded-2xl blur-xl opacity-30",
          isGold ? "bg-[#C9A84C]/30" : "bg-[#7C3AED]/30"
        )} />
        <div className={cn(
          "relative w-14 h-14 rounded-2xl flex items-center justify-center",
          isGold
            ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20"
            : "bg-[#7C3AED]/10 border border-[#7C3AED]/20"
        )}>
          <Icon className={cn("w-6 h-6", isGold ? "text-[#C9A84C]" : "text-[#7C3AED]")} />
        </div>
      </div>

      <h3 className="text-base font-semibold text-white mb-2 text-balance">{headline}</h3>
      <p className="text-sm text-[#8B7CF8]/60 leading-relaxed max-w-xs text-balance">{description}</p>

      {cta && (
        <div className="mt-6">
          {cta.href ? (
            <Link
              href={cta.href}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg",
                "transition-all duration-200 btn-press",
                isGold
                  ? "bg-[#C9A84C] text-[#06040F] hover:bg-[#D4B85C] hover:shadow-[0_0_20px_rgba(201,168,76,0.35)]"
                  : "bg-[#7C3AED] text-white hover:bg-[#8B4CF8] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              )}
            >
              {cta.label}
            </Link>
          ) : (
            <button
              onClick={cta.onClick}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg",
                "transition-all duration-200 btn-press",
                isGold
                  ? "bg-[#C9A84C] text-[#06040F] hover:bg-[#D4B85C] hover:shadow-[0_0_20px_rgba(201,168,76,0.35)]"
                  : "bg-[#7C3AED] text-white hover:bg-[#8B4CF8] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              )}
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
