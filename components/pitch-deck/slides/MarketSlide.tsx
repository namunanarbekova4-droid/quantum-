import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface MarketSlideProps { title: string; body?: string; keystat?: string; bullets?: string[]; }

export function MarketSlide({ title, body, keystat, bullets }: MarketSlideProps) {
  const orbs = generateAuroraOrbs("market");
  const desc = body ?? (bullets ? bullets.join(" ") : "");
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ display: "flex", height: "100%", alignItems: "center", padding: "8%" }}>
        <div style={{ flex: 1, paddingRight: "8%" }}>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 20, lineHeight: 1.7 }}>{desc}</p>
          {keystat && <div style={{ marginTop: 32, fontSize: 52, fontWeight: 900, color: "#fff" }}>{keystat}</div>}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <TitleLayer text={title} outlineSize="60px" solidSize="68px" outlineStyle={{ textAlign: "right" }} solidStyle={{ textAlign: "right" }} />
        </div>
      </div>
    </SlideCanvas>
  );
}
