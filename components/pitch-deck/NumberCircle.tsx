"use client";
import React from "react";

export function NumberCircle({ n, size = 72 }: { n: number; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,0.7), rgba(45,212,191,0.5))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.4, fontWeight: 900, color: "#fff" }}>{n}</span>
    </div>
  );
}
