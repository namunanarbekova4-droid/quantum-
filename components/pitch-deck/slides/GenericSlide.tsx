import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { LightCard } from "../LightCard";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";
import type { SlideType } from "@/lib/pitch-deck/design-system";

interface GenericSlideProps { slideType: SlideType; title: string; body?: string; bullets?: string[]; keystat?: string; }

export function GenericSlide({ slideType, title, body, bullets, keystat }: GenericSlideProps) {
  const orbs = generateAuroraOrbs(slideType);
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ padding: "6% 8%", height: "100%", display: "flex", flexDirection: "column" }}>
        <TitleLayer text={title} outlineSize="52px" solidSize="60px" />
        {keystat && <div style={{ fontSize: 60, fontWeight: 900, color: "#60d8ff", marginTop: 12 }}>{keystat}</div>}
        {body && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 18, lineHeight: 1.7, marginTop: 20, maxWidth: 700 }}>{body}</p>}
        {bullets && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {bullets.slice(0, 4).map((b, i) => (
              <LightCard key={i} body={b} />
            ))}
          </div>
        )}
      </div>
    </SlideCanvas>
  );
}
