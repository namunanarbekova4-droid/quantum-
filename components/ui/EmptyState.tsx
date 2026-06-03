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
}

export function EmptyState({ icon: Icon, headline, description, cta, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12 bg-[#111111] border border-[#1a1a1a] rounded-lg",
        className
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#444]" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5">{headline}</h3>
      <p className="text-xs text-[#666] leading-relaxed max-w-xs">{description}</p>
      {cta && (
        <div className="mt-5">
          {cta.href ? (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#080808] bg-[#C9A84C] hover:bg-[#d4b660] rounded transition-colors"
            >
              {cta.label}
            </Link>
          ) : (
            <button
              onClick={cta.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#080808] bg-[#C9A84C] hover:bg-[#d4b660] rounded transition-colors"
            >
              {cta.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
