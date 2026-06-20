import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface TractionSlideProps { title: string; keystat?: string; bullets?: string[]; body?: string; }

export function TractionSlide({ title, keystat, bullets, body }: TractionSlideProps) {
  const orbs = generateAuroraOrbs("traction");
  const stats = bullets && bullets.length > 0 ? bullets : (body ? [body] : []);
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ padding: "6% 8%", height: "100%", display: "flex", flexDirection: "column" }}>
        <TitleLayer text={title} outlineSize="52px" solidSize="60px" />
        {keystat && <div style={{ fontSize: 72, fontWeight: 900, color: "#4ade80", marginTop: 16, letterSpacing: "-0.03em" }}>{keystat}</div>}
        <div style={{ display: "flex", gap: 20, marginTop: "auto" }}>
          {stats.slice(0, 4).map((s, i) => (
            <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </SlideCanvas>
  );
}
