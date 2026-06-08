import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuantumLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  showTagline?: boolean;
}

export function OrbitalIcon({ svgSize, strokeWidth = 0.8, opacity = 0.4, particleScale = 1 }: {
  svgSize: number;
  strokeWidth?: number;
  opacity?: number;
  particleScale?: number;
}) {
  const id = `cg-${svgSize}`;
  return (
    <svg
      width={svgSize}
      height={svgSize}
      viewBox="0 0 120 120"
      className="logo-glow overflow-visible flex-shrink-0"
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#A07830" />
        </radialGradient>
        <radialGradient id={`${id}-particle`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#C9A84C" />
        </radialGradient>
      </defs>

      {/* Three orbital ellipses */}
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth={strokeWidth} opacity={opacity} />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth={strokeWidth} opacity={opacity} transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth={strokeWidth} opacity={opacity} transform="rotate(120 60 60)" />

      {/* Orbit 1 particle */}
      <g className="logo-orbit-1" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r={4.5 * particleScale} fill={`url(#${id}-particle)`} />
      </g>

      {/* Orbit 2 particle */}
      <g className="logo-orbit-2" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r={3.5 * particleScale} fill={`url(#${id}-particle)`} transform="rotate(60 60 60)" />
      </g>

      {/* Orbit 3 particle */}
      <g className="logo-orbit-3" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r={3 * particleScale} fill={`url(#${id}-particle)`} transform="rotate(120 60 60)" />
      </g>

      {/* Nucleus */}
      <circle cx="60" cy="60" r="9" fill={`url(#${id}-core)`} />
      <circle cx="60" cy="60" r="5" fill="#F5E09A" opacity="0.9" />
      <circle cx="60" cy="60" r="13" fill="none" stroke="#C9A84C" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function QuantumLogo({ size = "md", href = "/", className, showTagline }: QuantumLogoProps) {
  const configs = {
    sm: {
      svgSize: 28,
      strokeWidth: 1.5,
      opacity: 0.6,
      particleScale: 1.3,
      nameClass: "text-[15px] tracking-[5px]",
      gap: "gap-2.5",
      showTag: false,
    },
    md: {
      svgSize: 44,
      strokeWidth: 1,
      opacity: 0.5,
      particleScale: 1.1,
      nameClass: "text-[22px] tracking-[8px]",
      gap: "gap-4",
      showTag: false,
    },
    lg: {
      svgSize: 64,
      strokeWidth: 0.8,
      opacity: 0.4,
      particleScale: 1,
      nameClass: "text-[30px] tracking-[10px]",
      gap: "gap-5",
      showTag: true,
    },
  };

  const c = configs[size];
  const displayTagline = showTagline ?? c.showTag;

  const logo = (
    <div className={cn("flex items-center", c.gap, className)}>
      <OrbitalIcon
        svgSize={c.svgSize}
        strokeWidth={c.strokeWidth}
        opacity={c.opacity}
        particleScale={c.particleScale}
      />

      {/* Divider */}
      <div
        className="flex-shrink-0"
        style={{
          width: "1px",
          height: size === "lg" ? "52px" : size === "md" ? "36px" : "24px",
          background: "linear-gradient(to bottom, transparent, #C9A84C, transparent)",
        }}
      />

      <div className="flex flex-col gap-0.5">
        <span
          className={cn("font-josefin font-extralight uppercase text-white leading-none", c.nameClass)}
        >
          Quantum
        </span>
        {displayTagline && (
          <span className="font-cormorant font-light text-[11px] tracking-[3px] uppercase text-gold">
            For founders before the world believes
          </span>
        )}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{logo}</Link>;
  return logo;
}
