import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const variants = {
    gold: "bg-gold/10 text-gold border border-gold/20",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    neutral: "bg-[#1a1a1a] text-text-secondary border border-[#2a2a2a]",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded", variants[variant], className)}>
      {children}
    </span>
  );
}
