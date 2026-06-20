export type SlideType =
  | "cover" | "problem" | "personal_story" | "solution"
  | "market" | "product" | "traction" | "business_model"
  | "competition" | "team" | "financials" | "ask";

export const AURORA_PALETTES: Record<SlideType, [string, string]> = {
  cover:          ["rgba(168,85,247,0.45)", "rgba(59,130,246,0.35)"],
  problem:        ["rgba(251,146,60,0.4)",  "rgba(239,68,68,0.3)"],
  personal_story: ["rgba(251,146,60,0.35)", "rgba(236,72,153,0.25)"],
  solution:       ["rgba(45,212,191,0.4)",  "rgba(59,130,246,0.35)"],
  market:         ["rgba(59,130,246,0.4)",  "rgba(236,72,153,0.3)"],
  product:        ["rgba(45,212,191,0.35)", "rgba(168,85,247,0.3)"],
  traction:       ["rgba(45,212,191,0.4)",  "rgba(59,130,246,0.3)"],
  business_model: ["rgba(59,130,246,0.4)",  "rgba(168,85,247,0.3)"],
  competition:    ["rgba(168,85,247,0.4)",  "rgba(236,72,153,0.3)"],
  team:           ["rgba(251,146,60,0.35)", "rgba(168,85,247,0.3)"],
  financials:     ["rgba(234,179,8,0.35)",  "rgba(251,146,60,0.3)"],
  ask:            ["rgba(45,212,191,0.45)", "rgba(59,130,246,0.35)"],
};

export type OrbConfig = { x: string; y: string; size: string; color: string };

export function generateAuroraOrbs(slideType: SlideType): OrbConfig[] {
  const [c1, c2] = AURORA_PALETTES[slideType];
  const configs: Record<SlideType, OrbConfig[]> = {
    cover:          [{ x: "10%",  y: "15%",  size: "600px", color: c1 }, { x: "65%", y: "55%",  size: "500px", color: c2 }],
    problem:        [{ x: "75%",  y: "5%",   size: "550px", color: c1 }, { x: "0%",  y: "60%",  size: "480px", color: c2 }],
    personal_story: [{ x: "5%",   y: "10%",  size: "520px", color: c1 }, { x: "70%", y: "65%",  size: "460px", color: c2 }],
    solution:       [{ x: "60%",  y: "0%",   size: "580px", color: c1 }, { x: "5%",  y: "55%",  size: "500px", color: c2 }],
    market:         [{ x: "0%",   y: "0%",   size: "560px", color: c1 }, { x: "70%", y: "50%",  size: "520px", color: c2 }],
    product:        [{ x: "55%",  y: "5%",   size: "540px", color: c1 }, { x: "0%",  y: "60%",  size: "480px", color: c2 }],
    traction:       [{ x: "70%",  y: "0%",   size: "580px", color: c1 }, { x: "5%",  y: "55%",  size: "500px", color: c2 }],
    business_model: [{ x: "0%",   y: "5%",   size: "550px", color: c1 }, { x: "65%", y: "60%",  size: "480px", color: c2 }],
    competition:    [{ x: "65%",  y: "5%",   size: "560px", color: c1 }, { x: "0%",  y: "55%",  size: "520px", color: c2 }],
    team:           [{ x: "5%",   y: "5%",   size: "520px", color: c1 }, { x: "60%", y: "60%",  size: "480px", color: c2 }],
    financials:     [{ x: "70%",  y: "5%",   size: "580px", color: c1 }, { x: "0%",  y: "60%",  size: "500px", color: c2 }],
    ask:            [{ x: "10%",  y: "10%",  size: "600px", color: c1 }, { x: "60%", y: "50%",  size: "540px", color: c2 }],
  };
  return configs[slideType];
}
