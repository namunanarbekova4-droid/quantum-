import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuantumLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export function QuantumLogo({ size = "md", href = "/", className }: QuantumLogoProps) {
  const sizes = {
    sm: { q: "text-lg", text: "text-sm", wrapper: "gap-1.5" },
    md: { q: "text-2xl", text: "text-base", wrapper: "gap-2" },
    lg: { q: "text-4xl", text: "text-xl", wrapper: "gap-3" },
  };
  const s = sizes[size];

  const logo = (
    <div className={cn("flex items-center", s.wrapper, className)}>
      <div className={cn("font-bold text-[#080808] bg-gold w-8 h-8 flex items-center justify-center rounded font-mono", size === "lg" && "w-12 h-12 rounded-lg", size === "sm" && "w-6 h-6 text-sm")}>
        Q
      </div>
      <span className={cn("font-bold tracking-tight text-white", s.text)}>Quantum</span>
    </div>
  );

  if (href) return <Link href={href}>{logo}</Link>;
  return logo;
}
