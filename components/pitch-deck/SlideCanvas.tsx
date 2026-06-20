import React from "react";
import { OrbConfig } from "@/lib/pitch-deck/design-system";

interface SlideCanvasProps {
  orbs: OrbConfig[];
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SlideCanvas({ orbs, children, className = "", style }: SlideCanvasProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#18181A",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        ...style,
      }}
    >
      {orbs.map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            borderRadius: "50%",
            filter: "blur(100px)",
            transform: "translate(-25%, -25%)",
            pointerEvents: "none",
          }}
        />
      ))}
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
