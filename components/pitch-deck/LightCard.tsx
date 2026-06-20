import React from "react";

interface LightCardProps {
  heading?: string;
  body: string;
  style?: React.CSSProperties;
}

export function LightCard({ heading, body, style }: LightCardProps) {
  return (
    <div style={{
      background: "#C9C9CC",
      borderRadius: 10,
      padding: "16px 20px",
      ...style,
    }}>
      {heading && <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 6 }}>{heading}</div>}
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
