import React from "react";

interface TitleLayerProps {
  text: string;
  outlineSize?: string;
  solidSize?: string;
  outlineStyle?: React.CSSProperties;
  solidStyle?: React.CSSProperties;
}

export function TitleLayer({ text, outlineSize = "72px", solidSize = "80px", outlineStyle, solidStyle }: TitleLayerProps) {
  return (
    <div style={{ position: "relative", lineHeight: 1.05 }}>
      <div style={{
        fontSize: outlineSize,
        fontWeight: 900,
        color: "transparent",
        WebkitTextStroke: "1.5px rgba(255,255,255,0.25)",
        letterSpacing: "-0.02em",
        userSelect: "none",
        ...outlineStyle,
      }}>
        {text}
      </div>
      <div style={{
        fontSize: solidSize,
        fontWeight: 900,
        color: "#FFFFFF",
        letterSpacing: "-0.02em",
        marginTop: "-0.4em",
        ...solidStyle,
      }}>
        {text}
      </div>
    </div>
  );
}
