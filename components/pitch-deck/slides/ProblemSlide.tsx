import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { NumberCircle } from "../NumberCircle";
import { LightCard } from "../LightCard";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface ProblemSlideProps {
  title: string;
  bullets?: string[];
  body?: string;
  keystat?: string;
}

export function ProblemSlide({ title, bullets, body }: ProblemSlideProps) {
  const orbs = generateAuroraOrbs("problem");
  const items = (bullets && bullets.length > 0 ? bullets : body ? [body] : []).slice(0, 3);
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ padding: "6% 8%", height: "100%", display: "flex", flexDirection: "column" }}>
        <TitleLayer text={title} outlineSize="52px" solidSize="60px" />
        <div style={{ display: "flex", gap: 20, marginTop: "auto", paddingTop: 32 }}>
          {items.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
              <NumberCircle n={i + 1} />
              <LightCard body={b} style={{ width: "100%" }} />
            </div>
          ))}
        </div>
      </div>
    </SlideCanvas>
  );
}
