import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface ProductSlideProps { title: string; body?: string; bullets?: string[]; keystat?: string; }

export function ProductSlide({ title, body, bullets }: ProductSlideProps) {
  const orbs = generateAuroraOrbs("product");
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ display: "flex", height: "100%", padding: "6% 8%", gap: 40, alignItems: "center" }}>
        <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", maxWidth: "46%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
            <div style={{ flex: 1, height: 20, background: "#f3f4f6", borderRadius: 4, marginLeft: 8 }} />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", background: i === 1 ? "#f0f9ff" : "#f9fafb", borderRadius: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 1 ? "#3b82f6" : "#e5e7eb" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 8, background: "#d1d5db", borderRadius: 4, marginBottom: 4, width: "70%" }} />
                <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4, width: "50%" }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "10px 16px", background: "#3b82f6", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            Get Started →
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <TitleLayer text={title} outlineSize="48px" solidSize="56px" />
          {body && <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 17, lineHeight: 1.7, marginTop: 20 }}>{body}</p>}
          {bullets && bullets.slice(0, 3).map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#60d8ff", marginTop: 7, flexShrink: 0 }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideCanvas>
  );
}
