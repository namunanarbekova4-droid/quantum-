import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface CoverSlideProps {
  title: string;
  subtitle?: string;
  body?: string;
  keystat?: string;
  notes?: string;
  bullets?: string[];
}

export function CoverSlide({ title, subtitle, body, keystat }: CoverSlideProps) {
  const orbs = generateAuroraOrbs("cover");
  const desc = subtitle ?? body ?? "";
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "8% 10%", textAlign: "center" }}>
        <TitleLayer text={title} outlineSize="56px" solidSize="64px" />
        {desc && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, marginTop: 24, maxWidth: 600 }}>{desc}</p>}
        {keystat && (
          <div style={{ marginTop: 40, padding: "12px 32px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 18 }}>
            {keystat}
          </div>
        )}
      </div>
    </SlideCanvas>
  );
}
