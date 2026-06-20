"use client";
import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

export function MarketSlide({ title, body, keystat }: { title: string; body?: string; keystat?: string }) {
  return (
    <SlideCanvas orbs={generateAuroraOrbs("market")}>
      <div style={{ display: "flex", height: "100%", alignItems: "center", padding: "8%" }}>
        <div style={{ flex: 1, paddingRight: "8%" }}>
          {body && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 20, lineHeight: 1.7 }}>{body}</p>}
          {keystat && <div style={{ marginTop: 32, fontSize: 52, fontWeight: 900, color: "#fff" }}>{keystat}</div>}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <TitleLayer text={title} outlineSize="56px" solidSize="64px" outlineStyle={{ textAlign: "right" }} solidStyle={{ textAlign: "right" }} />
        </div>
      </div>
    </SlideCanvas>
  );
}
