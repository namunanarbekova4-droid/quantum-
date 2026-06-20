"use client";
import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { NumberCircle } from "../NumberCircle";
import { LightCard } from "../LightCard";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

export function SolutionSlide({ title, bullets, body }: { title: string; bullets?: string[]; body?: string }) {
  const items = (bullets ?? (body ? [body] : [])).slice(0, 3);
  return (
    <SlideCanvas orbs={generateAuroraOrbs("solution")}>
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ width: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: 28, fontWeight: 900, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</div>
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
          <TitleLayer text={title} outlineSize="44px" solidSize="50px" solidStyle={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.4)" }} />
        </div>
      </div>
    </SlideCanvas>
  );
}
