import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface AskSlideProps { title: string; keystat?: string; body?: string; bullets?: string[]; }

export function AskSlide({ title, keystat, body, bullets }: AskSlideProps) {
  const orbs = generateAuroraOrbs("ask");
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "8% 12%", textAlign: "center" }}>
        <TitleLayer text={title} outlineSize="52px" solidSize="60px" outlineStyle={{ textAlign: "center" }} solidStyle={{ textAlign: "center" }} />
        {keystat && <div style={{ fontSize: 88, fontWeight: 900, color: "#4ade80", marginTop: 8, letterSpacing: "-0.04em" }}>{keystat}</div>}
        {body && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 20, marginTop: 24, maxWidth: 600 }}>{body}</p>}
        {bullets && (
          <div style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap", justifyContent: "center" }}>
            {bullets.slice(0, 3).map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 24px", color: "rgba(255,255,255,0.8)", fontSize: 15 }}>{b}</div>
            ))}
          </div>
        )}
      </div>
    </SlideCanvas>
  );
}
