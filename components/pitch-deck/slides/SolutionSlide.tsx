import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { NumberCircle } from "../NumberCircle";
import { LightCard } from "../LightCard";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface SolutionSlideProps { title: string; bullets?: string[]; body?: string; keystat?: string; }

export function SolutionSlide({ title, bullets, body }: SolutionSlideProps) {
  const orbs = generateAuroraOrbs("solution");
  const items = (bullets && bullets.length > 0 ? bullets : body ? [body] : []).slice(0, 3);
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ width: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "8% 0" }}>
          <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: 32, fontWeight: 900, color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {title}
          </div>
        </div>
        <div style={{ flex: 1, padding: "6% 8% 6% 2%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
          {items.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <NumberCircle n={i + 1} size={56} />
              <LightCard body={b} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", bottom: "5%", right: "5%", textAlign: "right" }}>
          <TitleLayer text={title} outlineSize="48px" solidSize="56px" solidStyle={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.5)" }} />
        </div>
      </div>
    </SlideCanvas>
  );
}
