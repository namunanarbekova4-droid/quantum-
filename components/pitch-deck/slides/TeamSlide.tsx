import React from "react";
import { SlideCanvas } from "../SlideCanvas";
import { TitleLayer } from "../TitleLayer";
import { generateAuroraOrbs } from "@/lib/pitch-deck/design-system";

interface TeamMember { name: string; role: string; bio?: string; }
interface TeamSlideProps { title: string; team?: TeamMember[]; body?: string; bullets?: string[]; keystat?: string; }

export function TeamSlide({ title, team, body, bullets }: TeamSlideProps) {
  const orbs = generateAuroraOrbs("team");
  const members: TeamMember[] = team && team.length > 0
    ? team
    : bullets && bullets.length > 0
      ? bullets.map(b => ({ name: b, role: "" }))
      : [{ name: body ?? "", role: "" }];
  return (
    <SlideCanvas orbs={orbs}>
      <div style={{ padding: "6% 8%", height: "100%", display: "flex", flexDirection: "column" }}>
        <TitleLayer text={title} outlineSize="52px" solidSize="60px" />
        <div style={{ display: "flex", gap: 24, marginTop: "auto", flexWrap: "wrap" }}>
          {members.slice(0, 4).map((m, i) => (
            <div key={i} style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,146,60,0.7), rgba(168,85,247,0.5))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff" }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>{m.name}</div>
                {m.role && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>{m.role}</div>}
                {m.bio && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>{m.bio}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideCanvas>
  );
}
