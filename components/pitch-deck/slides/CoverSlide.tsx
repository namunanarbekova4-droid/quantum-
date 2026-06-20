"use client";
import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

export function CoverSlide({ title, subtitle, keystat }: { title: string; subtitle?: string; keystat?: string }) {
  return (
    <SlideCanvas orbs={generateAuroraOrbs("cover")}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "8% 10%", textAlign: "center" }}>
        <TitleLayer text={title} outlineSize="56px" solidSize="64px" outlineStyle={{ textAlign: "center" }} solidStyle={{ textAlign: "center" }} />
        {subtitle && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, marginTop: 24, maxWidth: 600 }}>{subtitle}</p>}
        {keystat && <div style={{ marginTop: 40, padding: "12px 32px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 18 }}>{keystat}</div>}
      </div>
    </SlideCanvas>
  );
}
