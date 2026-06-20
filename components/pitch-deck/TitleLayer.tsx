"use client";
import React from "react";

interface TitleLayerProps {
  text: string;
  outlineSize?: string;
  solidSize?: string;
  outlineStyle?: React.CSSProperties;
  solidStyle?: React.CSSProperties;
}

/**
 * Double-title system:
 * - Outline text: absolutely positioned background accent (top-right zone),
 *   semi-transparent, never overlaps the in-flow solid headline.
 * - Solid text: in-flow main headline, full opacity, clearly readable.
 *
 * This prevents the illegible overlap that occurred when both layers
 * sat on the same coordinates with negative margin.
 */
export function TitleLayer({
  text,
  outlineSize = "clamp(36px, 5vw, 60px)",
  solidSize = "clamp(32px, 4.5vw, 56px)",
  outlineStyle,
  solidStyle,
}: TitleLayerProps) {
  return (
    <div style={{ position: "relative" }}>
      {/* Outline accent — absolute, top-right, background zone */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%",
          right: 0,
          fontSize: outlineSize,
          fontWeight: 900,
          color: "transparent",
          WebkitTextStroke: "1.5px rgba(255,255,255,0.18)",
          letterSpacing: "-0.02em",
          lineHeight: 1.05,
          pointerEvents: "none",
          userSelect: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          maxWidth: "80%",
          textAlign: "right",
          ...outlineStyle,
        }}
      >
        {text}
      </div>

      {/* Solid headline — in-flow, main readable text */}
      <div
        style={{
          position: "relative",
          fontSize: solidSize,
          fontWeight: 900,
          color: "#FFFFFF",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          paddingTop: "0.2em",
          ...solidStyle,
        }}
      >
        {text}
      </div>
    </div>
  );
}
