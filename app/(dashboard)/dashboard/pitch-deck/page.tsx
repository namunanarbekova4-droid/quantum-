"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, ChevronRight, ChevronLeft, Copy, Check, RotateCcw, Loader2,
  Download, History, X, FileText, Mic, HelpCircle,
  ChevronDown, ChevronUp, Maximize2, Minimize2, Palette,
  Zap, AlertTriangle, Eye, TrendingUp, Star, Sparkles, Wand2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { ThemeSelector } from "@/features/pitch-deck/components/ThemeSelector";
import { DECK_THEMES } from "@/features/pitch-deck/lib/theme-system";
import type { ThemeId, DeckTheme } from "@/features/pitch-deck/lib/theme-system";
import { generatePPTX } from "@/features/pitch-deck/lib/pptx-generator";
import { SlideRenderer } from "@/components/pitch-deck/SlideRenderer";

// ─── Slide themes ─────────────────────────────────────────────────────────────

const SLIDE_THEMES: Record<string, { bg: string; titleColor: string; accent: string; textColor: string; badge: string }> = {
  cover:          { bg: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", titleColor: "#ffffff", accent: "#f59e0b", textColor: "#e2e8f0", badge: "#f59e0b" },
  problem:        { bg: "linear-gradient(135deg, #1a0000 0%, #4a0a0a 50%, #2d0000 100%)", titleColor: "#ff8a80", accent: "#ff5252", textColor: "#ffcdd2", badge: "#ff5252" },
  personal_story: { bg: "linear-gradient(135deg, #2d1b00 0%, #6b3e00 50%, #3d2000 100%)", titleColor: "#ffd54f", accent: "#ffa000", textColor: "#fff8e1", badge: "#ffa000" },
  solution:       { bg: "linear-gradient(135deg, #001429 0%, #003a6e 50%, #001e3c 100%)", titleColor: "#81d4fa", accent: "#0288d1", textColor: "#e1f5fe", badge: "#0288d1" },
  market:         { bg: "linear-gradient(135deg, #1a0040 0%, #4a1080 50%, #2d0060 100%)", titleColor: "#ce93d8", accent: "#9c27b0", textColor: "#f3e5f5", badge: "#9c27b0" },
  product:        { bg: "linear-gradient(135deg, #001a14 0%, #004d38 50%, #002419 100%)", titleColor: "#80cbc4", accent: "#00897b", textColor: "#e0f2f1", badge: "#00897b" },
  traction:       { bg: "linear-gradient(135deg, #001a00 0%, #1b5e20 50%, #002200 100%)", titleColor: "#a5d6a7", accent: "#43a047", textColor: "#f1f8e9", badge: "#43a047" },
  business_model: { bg: "linear-gradient(135deg, #000d29 0%, #002171 50%, #001540 100%)", titleColor: "#90caf9", accent: "#1565c0", textColor: "#e3f2fd", badge: "#1565c0" },
  competition:    { bg: "linear-gradient(135deg, #1a0030 0%, #4a0070 50%, #240040 100%)", titleColor: "#f48fb1", accent: "#c2185b", textColor: "#fce4ec", badge: "#c2185b" },
  team:           { bg: "linear-gradient(135deg, #1a0e00 0%, #4a2800 50%, #2d1500 100%)", titleColor: "#ffcc80", accent: "#ef6c00", textColor: "#fff3e0", badge: "#ef6c00" },
  financials:     { bg: "linear-gradient(135deg, #0d0d00 0%, #3d3d00 50%, #1a1a00 100%)", titleColor: "#fff176", accent: "#f9a825", textColor: "#fffde7", badge: "#f9a825" },
  ask:            { bg: "linear-gradient(160deg, #003300 0%, #006600 40%, #004d00 100%)", titleColor: "#ffffff", accent: "#69f0ae", textColor: "#e8f5e9", badge: "#69f0ae" },
};
const DEFAULT_THEME = { bg: "linear-gradient(135deg, #0f0c29, #302b63)", titleColor: "#ffffff", accent: "#7C3AED", textColor: "#e2e8f0", badge: "#7C3AED" };

function getTheme(slide_type: string) {
  return SLIDE_THEMES[slide_type] ?? DEFAULT_THEME;
}

// ─── PDF export ───────────────────────────────────────────────────────────────

function renderSlideHtml(slide: PitchSlide, th: typeof DEFAULT_THEME, startupName: string, total: number): string {
  const header = `
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
    <span style="font-size:10px;padding:3px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:2px;font-weight:800;background:${th.accent}22;color:${th.accent};border:1px solid ${th.accent}44;">${slide.slide_type.replace(/_/g, " ")}</span>
    <span style="font-size:11px;color:${th.textColor};opacity:0.5;">${slide.slide_number} / ${total}</span>
  </div>`;
  const notes = slide.speaker_notes ? `
  <div style="margin-top:24px;padding:14px 18px;border-radius:8px;background:${th.accent}12;border:1px solid ${th.accent}30;">
    <span style="font-size:9px;font-weight:800;letter-spacing:2px;color:${th.accent};text-transform:uppercase;display:block;margin-bottom:4px;">Speaker Notes</span>
    <span style="font-size:13px;color:${th.textColor};opacity:0.75;">${slide.speaker_notes}</span>
  </div>` : "";

  switch (slide.slide_type) {
    case "cover": return `
<div class="page" style="background:${th.bg};color:${th.textColor};text-align:center;align-items:center;">
  ${header}
  ${slide.key_stat ? `<div style="display:inline-block;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:800;margin-bottom:24px;background:${th.accent}22;color:${th.accent};border:1px solid ${th.accent}44;">${slide.key_stat}</div>` : ""}
  <h1 style="font-size:72px;font-weight:900;color:${th.titleColor};letter-spacing:-0.03em;line-height:1;margin-bottom:16px;">${startupName}</h1>
  <div style="width:60px;height:3px;background:${th.accent};border-radius:2px;margin:0 auto 20px;"></div>
  <p style="font-size:22px;font-weight:600;color:${th.accent};margin-bottom:10px;">${slide.title}</p>
  ${slide.subtitle ? `<p style="font-size:16px;font-style:italic;color:${th.textColor};opacity:0.7;">${slide.subtitle}</p>` : ""}
  <p style="font-size:14px;color:${th.textColor};opacity:0.6;max-width:480px;margin-top:16px;line-height:1.7;">${slide.main_content}</p>
  ${notes}
</div>`;

    case "problem": return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  ${header}
  <div style="display:flex;gap:40px;align-items:flex-start;flex:1;">
    <div style="flex:1;">
      ${slide.key_stat ? `<div style="font-size:64px;font-weight:900;color:${th.accent};line-height:1;margin-bottom:12px;">${slide.key_stat}</div>` : ""}
      <h1 style="font-size:42px;font-weight:900;color:${th.titleColor};letter-spacing:-0.02em;line-height:1.1;margin-bottom:12px;">${slide.title}</h1>
      ${slide.subtitle ? `<p style="font-size:16px;font-style:italic;color:${th.accent};margin-bottom:12px;">${slide.subtitle}</p>` : ""}
    </div>
    <div style="flex:1;">
      <div style="padding:20px;border-radius:12px;background:${th.accent}14;border:1px solid ${th.accent}30;margin-bottom:16px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:${th.accent};text-transform:uppercase;display:block;margin-bottom:8px;">Pain Point</span>
        <p style="font-size:14px;color:${th.textColor};opacity:0.9;line-height:1.7;">${slide.main_content}</p>
      </div>
      <div style="display:flex;gap:8px;">
        ${["Critical","Widespread","Costly"].map(l=>`<div style="flex:1;text-align:center;padding:8px;border-radius:8px;background:${th.accent}18;border:1px solid ${th.accent}30;font-size:10px;font-weight:800;color:${th.accent};text-transform:uppercase;letter-spacing:1px;">${l}</div>`).join("")}
      </div>
    </div>
  </div>
  ${notes}
</div>`;

    case "personal_story": return `
<div class="page" style="background:${th.bg};color:${th.textColor};position:relative;overflow:hidden;">
  ${header}
  <div style="position:absolute;top:-20px;left:-20px;font-size:240px;font-weight:900;color:${th.accent};opacity:0.1;line-height:1;pointer-events:none;">"</div>
  <div style="position:relative;z-index:1;">
    ${slide.key_stat ? `<span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:800;background:${th.accent}22;color:${th.accent};border:1px solid ${th.accent}44;margin-bottom:20px;">${slide.key_stat}</span>` : ""}
    <h1 style="font-size:40px;font-weight:900;color:${th.titleColor};letter-spacing:-0.02em;line-height:1.15;font-style:italic;margin-bottom:16px;">"${slide.title}"</h1>
    ${slide.subtitle ? `<p style="font-size:16px;color:${th.accent};margin-bottom:14px;">${slide.subtitle}</p>` : ""}
    <p style="font-size:15px;color:${th.textColor};opacity:0.82;line-height:1.8;max-width:600px;">${slide.main_content}</p>
  </div>
  ${notes}
</div>`;

    case "solution": return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  ${header}
  <div style="display:flex;gap:40px;align-items:center;flex:1;">
    <div style="flex:1;">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${th.accent};text-transform:uppercase;margin-bottom:16px;">The Solution</div>
      <h1 style="font-size:40px;font-weight:900;color:${th.titleColor};letter-spacing:-0.02em;line-height:1.1;margin-bottom:12px;">${slide.title}</h1>
      ${slide.subtitle ? `<p style="font-size:16px;font-style:italic;color:${th.accent};margin-bottom:16px;">${slide.subtitle}</p>` : ""}
      ${slide.key_stat ? `<div style="display:inline-flex;align-items:center;padding:8px 20px;border-radius:12px;background:${th.accent}20;border:1px solid ${th.accent}40;color:${th.accent};font-size:24px;font-weight:900;">${slide.key_stat}</div>` : ""}
    </div>
    <div style="flex:1;border-radius:16px;border:2px solid ${th.accent}40;background:${th.accent}08;overflow:hidden;">
      <div style="padding:8px 12px;background:${th.accent}15;border-bottom:1px solid ${th.accent}30;display:flex;gap:6px;">
        <div style="width:10px;height:10px;border-radius:50%;background:#ff5f56;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:#ffbd2e;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:#27c93f;"></div>
      </div>
      <div style="padding:20px;">
        <p style="font-size:13px;color:${th.textColor};opacity:0.88;line-height:1.7;">${slide.main_content}</p>
      </div>
    </div>
  </div>
  ${notes}
</div>`;

    case "market": return `
<div class="page" style="background:${th.bg};color:${th.textColor};text-align:center;align-items:center;">
  ${header}
  ${slide.key_stat ? `<div style="font-size:96px;font-weight:900;color:${th.accent};line-height:1;margin-bottom:12px;">${slide.key_stat}</div>` : ""}
  <h1 style="font-size:38px;font-weight:900;color:${th.titleColor};letter-spacing:-0.02em;margin-bottom:10px;max-width:600px;">${slide.title}</h1>
  ${slide.subtitle ? `<p style="font-size:16px;font-style:italic;color:${th.accent};margin-bottom:14px;">${slide.subtitle}</p>` : ""}
  <p style="font-size:14px;color:${th.textColor};opacity:0.75;max-width:500px;line-height:1.7;">${slide.main_content}</p>
  ${notes}
</div>`;

    case "traction": return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  ${header}
  <div style="display:flex;gap:40px;align-items:center;flex:1;">
    <div style="flex:1;">
      ${slide.key_stat ? `<div style="font-size:88px;font-weight:900;color:${th.accent};line-height:1;margin-bottom:8px;">${slide.key_stat}</div>` : ""}
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="0,16 8,8 14,12 24,2" stroke="${th.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="21,2 24,2 24,5" stroke="${th.accent}" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <span style="font-size:14px;font-weight:700;color:${th.accent};">Growing</span>
      </div>
      <h1 style="font-size:34px;font-weight:900;color:${th.titleColor};margin-bottom:10px;">${slide.title}</h1>
      ${slide.subtitle ? `<p style="font-size:14px;font-style:italic;color:${th.accent};margin-bottom:10px;">${slide.subtitle}</p>` : ""}
      <p style="font-size:13px;color:${th.textColor};opacity:0.82;line-height:1.7;max-width:360px;">${slide.main_content}</p>
    </div>
    <div style="display:flex;align-items:flex-end;gap:8px;height:120px;">
      ${[0.35,0.52,0.44,0.68,0.58,0.75,0.90,1.0].map((h,i)=>`<div style="width:20px;height:${Math.round(h*120)}px;border-radius:4px 4px 0 0;background:${i===7?th.accent:`${th.accent}${Math.round(i*18+30).toString(16).padStart(2,'0')}`};"></div>`).join("")}
    </div>
  </div>
  ${notes}
</div>`;

    case "competition": return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  ${header}
  <div style="display:flex;gap:40px;align-items:center;flex:1;">
    <div style="flex:1;">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${th.accent};text-transform:uppercase;margin-bottom:16px;">Competitive Landscape</div>
      ${slide.key_stat ? `<div style="font-size:56px;font-weight:900;color:${th.accent};line-height:1;margin-bottom:10px;">${slide.key_stat}</div>` : ""}
      <h1 style="font-size:36px;font-weight:900;color:${th.titleColor};margin-bottom:10px;">${slide.title}</h1>
      ${slide.subtitle ? `<p style="font-size:14px;font-style:italic;color:${th.accent};margin-bottom:10px;">${slide.subtitle}</p>` : ""}
      <p style="font-size:13px;color:${th.textColor};opacity:0.82;line-height:1.7;max-width:360px;">${slide.main_content}</p>
    </div>
    <div style="flex-shrink:0;">
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <line x1="100" y1="10" x2="100" y2="190" stroke="${th.accent}" stroke-width="1.5" opacity="0.5"/>
        <line x1="10" y1="100" x2="190" y2="100" stroke="${th.accent}" stroke-width="1.5" opacity="0.5"/>
        <text x="105" y="22" fill="${th.accent}" font-size="9" font-weight="700" opacity="0.8">INNOVATIVE</text>
        <text x="12" y="22" fill="${th.accent}" font-size="8" opacity="0.6">LEGACY</text>
        <text x="8" y="96" fill="${th.accent}" font-size="8" opacity="0.7">NICHE</text>
        <text x="122" y="96" fill="${th.accent}" font-size="8" opacity="0.7">SCALE</text>
        <circle cx="40" cy="75" r="7" fill="${th.textColor}" opacity="0.3"/>
        <circle cx="60" cy="110" r="6" fill="${th.textColor}" opacity="0.3"/>
        <circle cx="70" cy="55" r="5" fill="${th.textColor}" opacity="0.3"/>
        <circle cx="42" cy="135" r="7" fill="${th.textColor}" opacity="0.3"/>
        <circle cx="148" cy="35" r="11" fill="${th.accent}" opacity="0.9"/>
        <text x="138" y="24" fill="${th.accent}" font-size="9" font-weight="900">US</text>
      </svg>
    </div>
  </div>
  ${notes}
</div>`;

    case "ask": return `
<div class="page" style="background:${th.bg};color:${th.textColor};text-align:center;align-items:center;">
  ${header}
  <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:${th.accent};text-transform:uppercase;margin-bottom:16px;">The Ask</div>
  ${slide.key_stat ? `<div style="font-size:96px;font-weight:900;color:${th.titleColor};line-height:1;margin-bottom:12px;">${slide.key_stat}</div>` : ""}
  <h1 style="font-size:38px;font-weight:900;color:${th.accent};letter-spacing:-0.02em;margin-bottom:10px;max-width:600px;">${slide.title}</h1>
  ${slide.subtitle ? `<p style="font-size:16px;font-style:italic;color:${th.textColor};opacity:0.85;margin-bottom:16px;">${slide.subtitle}</p>` : ""}
  <div style="display:flex;width:400px;height:10px;border-radius:6px;overflow:hidden;margin-bottom:12px;">
    <div style="width:40%;background:${th.accent};"></div>
    <div style="width:25%;background:${th.accent};opacity:0.65;"></div>
    <div style="width:20%;background:${th.accent};opacity:0.45;"></div>
    <div style="width:15%;background:${th.accent};opacity:0.25;"></div>
  </div>
  <div style="display:flex;gap:24px;font-size:11px;color:${th.textColor};opacity:0.6;margin-bottom:16px;">
    <span>Product 40%</span><span>Team 25%</span><span>Growth 20%</span><span>Ops 15%</span>
  </div>
  <p style="font-size:14px;color:${th.textColor};opacity:0.8;max-width:500px;line-height:1.7;">${slide.main_content}</p>
  ${notes}
</div>`;

    default: return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  ${header}
  ${slide.key_stat ? `<div style="font-size:72px;font-weight:900;color:${th.accent};line-height:1;margin-bottom:12px;">${slide.key_stat}</div>` : ""}
  <h1 style="font-size:42px;font-weight:900;color:${th.titleColor};letter-spacing:-0.02em;line-height:1.1;margin-bottom:12px;">${slide.title}</h1>
  ${slide.subtitle ? `<p style="font-size:18px;font-style:italic;color:${th.accent};margin-bottom:16px;opacity:0.85;">${slide.subtitle}</p>` : ""}
  <div style="display:flex;align-items:flex-start;gap:14px;max-width:680px;">
    <div style="width:3px;flex-shrink:0;border-radius:2px;height:44px;background:${th.accent};opacity:0.5;margin-top:3px;"></div>
    <p style="font-size:16px;color:${th.textColor};opacity:0.88;line-height:1.8;">${slide.main_content}</p>
  </div>
  ${notes}
</div>`;
  }
}

function downloadPDF(result: PitchDeckResult, startupName: string) {
  const slidesHtml = result.slides.map((slide) => {
    const th = getTheme(slide.slide_type);
    return renderSlideHtml(slide, th, startupName, result.slides.length);
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${startupName} — Pitch Deck</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Helvetica Neue',Arial,sans-serif;}
  .page{width:100%;min-height:100vh;padding:48px 60px;display:flex;flex-direction:column;justify-content:center;page-break-after:always;overflow:hidden;}
  .page:last-of-type{page-break-after:avoid;}
  .extra{padding:48px 64px;border-top:1px solid #333;}
  .extra h2{font-size:20px;font-weight:700;color:#7C3AED;margin-bottom:12px;}
  .extra p{font-size:14px;color:#444;line-height:1.8;white-space:pre-wrap;}
  .qa-item{margin-bottom:16px;padding:14px;border:1px solid #eee;border-radius:8px;}
  .qa-q{font-size:14px;font-weight:700;color:#111;margin-bottom:6px;}
  .qa-a{font-size:13px;color:#555;line-height:1.6;}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
</style>
</head>
<body>
${slidesHtml}
<div class="extra"><h2>3-Minute Script</h2><p>${result.three_minute_script}</p></div>
<div class="extra"><h2>Elevator Pitch (30 sec)</h2><p>${result.elevator_pitch}</p></div>
<div class="extra"><h2>Investor Q&amp;A</h2>${result.investor_questions?.map(qa => `<div class="qa-item"><div class="qa-q">Q: ${qa.question}</div><div class="qa-a">A: ${qa.answer}</div></div>`).join("") ?? ""}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => {
      setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
    };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PitchSlide {
  slide_number: number;
  slide_type: string;
  title: string;
  subtitle: string;
  main_content: string;
  speaker_notes: string;
  key_stat: string | null;
  emotional_purpose?: string;
  visual_hint?: string;
}

interface DeckScore {
  overall: number;
  storytelling: number;
  clarity: number;
  investor_confidence: number;
  market_conviction: number;
  memorability: number;
  verdict: string;
}

interface RedFlag {
  severity: "HIGH" | "MEDIUM" | "LOW";
  issue: string;
  slide: string;
  fix: string;
}

interface WowMoment {
  headline: string;
  subtext: string;
  stat: string;
}

interface InvestorPreviewItem {
  after_slide: number;
  thought: string;
}

interface DeckIntelligence {
  deck_score: DeckScore;
  red_flags: RedFlag[];
  wow_moment: WowMoment;
  investor_preview: InvestorPreviewItem[];
}

interface PitchDeckResult {
  slides: PitchSlide[];
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
  intelligence?: DeckIntelligence;
}

interface SavedDeck {
  id: string;
  startupName: string;
  createdAt: string;
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  { q: "What is your startup called and what does it do in one sentence?", type: "text" as const },
  { q: "What problem does it solve? Describe it like telling a friend.", type: "textarea" as const },
  { q: "How did you personally discover this problem?", type: "textarea" as const },
  { q: "What is your solution and how does it actually work?", type: "textarea" as const },
  { q: "Who is your exact target customer? Be very specific.", type: "textarea" as const },
  { q: "What is your business model? How do you make money?", type: "textarea" as const },
  { q: "Who are your competitors and why are you better?", type: "textarea" as const },
  { q: "What traction do you have so far? Any users or revenue?", type: "textarea" as const },
  { q: "Tell me about your team and why you are the right people.", type: "textarea" as const },
  { q: "How much are you raising and what will you use it for?", type: "textarea" as const },
];

// ─── Aurora background ────────────────────────────────────────────────────────

function Aurora() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <style>{`@keyframes af{0%{transform:translate(0,0)}25%{transform:translate(30px,-30px)}50%{transform:translate(-20px,20px)}100%{transform:translate(0,0)}}`}</style>
      <div style={{ position: "absolute", top: -100, right: -100, width: 600, height: 600, background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)", borderRadius: "50%", animation: "af 16s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, background: "radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%)", borderRadius: "50%", animation: "af 22s ease-in-out infinite reverse" }} />
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all" style={{ background: copied ? "rgba(201,168,76,0.2)" : "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Locked in." : label}
    </button>
  );
}

// ─── Deck Score Panel ─────────────────────────────────────────────────────────

function DeckScorePanel({ score }: { score: DeckScore }) {
  const { t: tl } = useLanguage();
  const fts = tl.features.pitchDeck as Record<string, string>;
  const [open, setOpen] = useState(false);
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score.overall / 100) * circ;
  const categories = [
    { label: "Storytelling", value: score.storytelling },
    { label: "Clarity", value: score.clarity },
    { label: "Investor Confidence", value: score.investor_confidence },
    { label: "Market Conviction", value: score.market_conviction },
    { label: "Memorability", value: score.memorability },
  ];
  const color = score.overall >= 80 ? "#22c55e" : score.overall >= 60 ? "#C9A84C" : "#ef4444";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0F0A1F", border: "1px solid #1A1040" }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <Star className="w-4 h-4" style={{ color: "#C9A84C" }} />
          <span className="font-bold text-white text-sm">{fts.deckScore || "Deck Score"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: color + "22", color, border: `1px solid ${color}44` }}>{score.overall}/100</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-5">
              {/* Circular gauge */}
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <svg width={100} height={100} className="-rotate-90">
                    <circle cx={50} cy={50} r={r} fill="none" stroke="#1A1040" strokeWidth={8} />
                    <motion.circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
                      strokeLinecap="round" strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }}
                      transition={{ duration: 1.2, ease: "easeOut" }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{score.overall}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#555] mb-1">{fts.brutallHonest || "Brutally Honest Verdict"}</p>
                  <p className="text-sm italic leading-relaxed" style={{ color: "#C9A84C" }}>&ldquo;{score.verdict}&rdquo;</p>
                </div>
              </div>
              {/* Category bars */}
              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const c = cat.value >= 80 ? "#22c55e" : cat.value >= 60 ? "#C9A84C" : "#ef4444";
                  return (
                    <div key={cat.label} className="flex items-center gap-3">
                      <span className="text-xs text-[#8B7CF8] w-36 flex-shrink-0">{cat.label}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1A1040" }}>
                        <motion.div className="h-full rounded-full" style={{ background: c }}
                          initial={{ width: 0 }} animate={{ width: `${cat.value}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: c }}>{cat.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Red Flags Panel ──────────────────────────────────────────────────────────

function RedFlagsPanel({ flags }: { flags: RedFlag[] }) {
  const { t: tl } = useLanguage();
  const fts = tl.features.pitchDeck as Record<string, string>;
  const [open, setOpen] = useState(false);
  const highCount = flags.filter(f => f.severity === "HIGH").length;

  const severityStyle = {
    HIGH: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
    MEDIUM: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    LOW: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0F0A1F", border: "1px solid #1A1040" }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white text-sm">{fts.investorRedFlags || "Investor Red Flags"}</span>
          {highCount > 0
            ? <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">{highCount} {fts.highSeverity || "HIGH"}</span>
            : <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-500/20 text-green-400 border border-green-500/30">{fts.clean || "Clean"}</span>
          }
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#555]" /> : <ChevronDown className="w-4 h-4 text-[#555]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-3">
              {flags.length === 0 ? (
                <p className="text-sm text-green-400 flex items-center gap-2"><Check className="w-4 h-4" /> {fts.noIssues || "No critical issues detected"}</p>
              ) : flags.map((flag, i) => {
                const s = severityStyle[flag.severity];
                return (
                  <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black px-2 py-0.5 rounded" style={{ background: s.border, color: s.color }}>{flag.severity}</span>
                      <span className="text-xs text-[#8B7CF8]">→ {flag.slide.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{flag.issue}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#8B7CF8" }}>Fix: {flag.fix}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── WOW Moment card ─────────────────────────────────────────────────────────

function WowMomentCard({ wow }: { wow: WowMoment }) {
  const { t: tl } = useLanguage();
  const fts = tl.features.pitchDeck as Record<string, string>;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 sm:p-8 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0A0A1A 0%, #13132A 50%, #0A0A1A 100%)", border: "1px solid rgba(201,168,76,0.3)" }}>
      {/* Glow orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)" }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">{fts.wowMoment || "Your Most Memorable Moment"}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">{wow.headline}</h3>
        <p className="text-base text-[#8B7CF8] mb-4 italic">{wow.subtext}</p>
        {wow.stat && (
          <div className="inline-block px-4 py-2 rounded-lg font-black text-xl" style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}>
            {wow.stat}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Per-slide-type unique layouts ───────────────────────────────────────────

interface SlideTheme { bg: string; titleColor: string; accent: string; textColor: string; badge: string }

function renderSlideContent(slide: PitchSlide, theme: SlideTheme, deckName: string, fullscreen: boolean) {
  const T = theme;
  const fs = fullscreen;

  switch (slide.slide_type) {

    case "cover": return (
      <div className="flex-1 flex flex-col items-center justify-center relative py-4 z-10 text-center">
        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="rounded-full absolute" style={{ width: "70%", height: "70%", border: `1px solid ${T.accent}18` }} />
          <div className="rounded-full absolute" style={{ width: "50%", height: "50%", border: `1px solid ${T.accent}14` }} />
        </div>
        {slide.key_stat && (
          <div className="inline-block px-4 py-1 rounded-full text-xs font-bold mb-4 tracking-widest" style={{ background: T.accent + "22", color: T.accent, border: `1px solid ${T.accent}44` }}>
            {slide.key_stat}
          </div>
        )}
        <h1 className={`font-black leading-none mb-3 ${fs ? "text-6xl md:text-9xl" : "text-5xl md:text-7xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.03em" }}>
          {deckName}
        </h1>
        <div className="w-16 h-0.5 rounded-full mx-auto mb-4" style={{ background: T.accent }} />
        <p className={`font-semibold max-w-lg ${fs ? "text-xl" : "text-base"}`} style={{ color: T.accent }}>{slide.title}</p>
        {slide.subtitle && <p className={`mt-2 max-w-md ${fs ? "text-base" : "text-sm"} italic`} style={{ color: T.textColor, opacity: 0.7 }}>{slide.subtitle}</p>}
        <p className={`mt-4 max-w-sm ${fs ? "text-sm" : "text-xs"} leading-relaxed`} style={{ color: T.textColor, opacity: 0.6 }}>{slide.main_content}</p>
      </div>
    );

    case "problem": return (
      <div className="flex-1 flex gap-6 items-center py-4 z-10 relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>The Problem</div>
          {slide.key_stat && (
            <div className={`font-black leading-none mb-2 ${fs ? "text-7xl" : "text-5xl"}`} style={{ color: T.accent }}>{slide.key_stat}</div>
          )}
          <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em" }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className={`italic mb-3 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
        </div>
        <div className="flex-shrink-0 w-2/5 flex flex-col gap-3">
          {/* Pain point card */}
          <div className="rounded-xl p-4" style={{ background: T.accent + "12", border: `1px solid ${T.accent}30`, backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: T.accent + "30", color: T.accent }}>!</div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: T.accent }}>Pain Point</span>
            </div>
            <p className={`leading-relaxed ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.9 }}>{slide.main_content}</p>
          </div>
          {/* Severity indicator */}
          <div className="flex items-center gap-3">
            {["Critical", "Widespread", "Costly"].map((l) => (
              <div key={l} className="flex-1 text-center py-1.5 rounded-lg" style={{ background: T.accent + "18", border: `1px solid ${T.accent}30` }}>
                <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: T.accent }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    case "personal_story": return (
      <div className="flex-1 flex flex-col justify-center py-4 z-10 relative">
        {/* Large decorative quote */}
        <div className="absolute top-0 left-0 font-black leading-none pointer-events-none select-none" style={{ fontSize: fs ? 180 : 120, color: T.accent + "18", lineHeight: 1 }}>&ldquo;</div>
        <div className="relative z-10">
          {slide.key_stat && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3" style={{ background: T.accent + "22", color: T.accent, border: `1px solid ${T.accent}44` }}>
              {slide.key_stat}
            </span>
          )}
          <h2 className={`font-extrabold leading-tight mb-4 max-w-2xl ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em", fontStyle: "italic" }}>
            &ldquo;{slide.title}&rdquo;
          </h2>
          {slide.subtitle && <p className={`mb-3 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
          <p className={`leading-relaxed max-w-xl ${fs ? "text-base" : "text-sm"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
        </div>
      </div>
    );

    case "solution": return (
      <div className="flex-1 flex gap-5 items-center py-4 z-10 relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: T.accent }}>
            <div className="w-4 h-0.5 rounded-full" style={{ background: T.accent }} /> The Solution
          </div>
          <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em" }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
          {slide.key_stat && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl w-fit" style={{ background: T.accent + "20", border: `1px solid ${T.accent}40`, color: T.accent }}>
              <span className={`font-black ${fs ? "text-2xl" : "text-xl"}`}>{slide.key_stat}</span>
            </div>
          )}
        </div>
        {/* Product frame */}
        <div className="flex-shrink-0 w-2/5 rounded-2xl overflow-hidden" style={{ border: `2px solid ${T.accent}40`, background: T.accent + "08" }}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ background: T.accent + "15", borderColor: T.accent + "30" }}>
            {["#ff5f56","#ffbd2e","#27c93f"].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}
          </div>
          <div className="p-4">
            <p className={`leading-relaxed ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.85 }}>{slide.main_content}</p>
          </div>
        </div>
      </div>
    );

    case "market": return (
      <div className="flex-1 flex flex-col items-center justify-center py-4 z-10 relative text-center">
        {/* Concentric circles decoration */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="rounded-full" style={{ width: "80%", height: "80%", border: `1px solid ${T.accent}10` }} />
          <div className="rounded-full absolute" style={{ width: "55%", height: "55%", border: `1px solid ${T.accent}16` }} />
          <div className="rounded-full absolute" style={{ width: "32%", height: "32%", border: `2px solid ${T.accent}22` }} />
        </div>
        {slide.key_stat && (
          <div className={`font-black leading-none mb-2 ${fs ? "text-8xl" : "text-6xl md:text-7xl"}`} style={{ color: T.accent }}>
            {slide.key_stat}
          </div>
        )}
        <h2 className={`font-extrabold mb-2 max-w-lg ${fs ? "text-3xl" : "text-xl md:text-2xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em" }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-3 ${fs ? "text-base" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
        <p className={`max-w-md leading-relaxed ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.75 }}>{slide.main_content}</p>
      </div>
    );

    case "product": return (
      <div className="flex-1 flex flex-col justify-center py-4 z-10 relative">
        {slide.key_stat && (
          <div className="flex items-center gap-3 mb-4">
            <span className={`font-black leading-none ${fs ? "text-6xl" : "text-4xl md:text-5xl"}`} style={{ color: T.accent }}>{slide.key_stat}</span>
            <div className="h-8 w-0.5 rounded-full" style={{ background: T.accent + "40" }} />
            <span className={`font-bold ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.textColor, opacity: 0.6 }}>Key Metric</span>
          </div>
        )}
        <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em" }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
        <div className="rounded-xl p-4 max-w-xl" style={{ background: T.accent + "0c", border: `1px solid ${T.accent}28` }}>
          <p className={`leading-relaxed ${fs ? "text-base" : "text-sm"}`} style={{ color: T.textColor, opacity: 0.85 }}>{slide.main_content}</p>
        </div>
        {slide.visual_hint && !fullscreen && (
          <p className="mt-2 text-[10px] italic" style={{ color: T.accent + "60" }}>Visual: {slide.visual_hint}</p>
        )}
      </div>
    );

    case "traction": return (
      <div className="flex-1 flex gap-6 items-center py-4 z-10 relative">
        <div className="flex flex-col justify-center">
          {/* Hero metric */}
          {slide.key_stat && (
            <div className={`font-black leading-none ${fs ? "text-8xl" : "text-6xl md:text-7xl"}`} style={{ color: T.accent }}>
              {slide.key_stat}
            </div>
          )}
          {/* Trend arrow */}
          <div className="flex items-center gap-2 mt-2 mb-4">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <polyline points="0,14 8,6 14,10 24,2" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="20,2 24,2 24,6" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={`font-bold ${fs ? "text-base" : "text-xs"}`} style={{ color: T.accent }}>Growing</span>
          </div>
          <h2 className={`font-extrabold leading-tight mb-2 ${fs ? "text-3xl" : "text-xl md:text-2xl"}`} style={{ color: T.titleColor }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className="text-sm italic mb-2" style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
          <p className={`leading-relaxed max-w-sm ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
        </div>
        {/* Decorative bar chart */}
        <div className="flex-shrink-0 flex items-end gap-2 h-24 pr-4">
          {[0.35, 0.52, 0.44, 0.68, 0.58, 0.75, 0.90, 1.0].map((h, i) => (
            <div key={i} className="w-5 rounded-t" style={{ height: `${h * 100}%`, background: i === 7 ? T.accent : T.accent + (Math.round(i * 18 + 20).toString(16).padStart(2, "0")) }} />
          ))}
        </div>
      </div>
    );

    case "business_model": return (
      <div className="flex-1 flex flex-col justify-center py-4 z-10 relative">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>Revenue Model</div>
        {slide.key_stat && (
          <div className={`font-black mb-2 ${fs ? "text-6xl" : "text-4xl md:text-5xl"}`} style={{ color: T.accent }}>{slide.key_stat}</div>
        )}
        <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
        {/* Revenue flow cards */}
        <div className="flex items-center gap-3 flex-wrap">
          {["Acquire", "Activate", "Monetize"].map((stage, i) => (
            <div key={stage} className="flex items-center gap-3">
              <div className="rounded-xl px-4 py-3 flex flex-col" style={{ background: T.accent + "18", border: `1px solid ${T.accent}30` }}>
                <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: T.accent }}>{stage}</span>
                <span className={fs ? "text-sm" : "text-xs"} style={{ color: T.textColor, opacity: 0.85 }}>Step {i + 1}</span>
              </div>
              {i < 2 && <div className="w-5 h-0.5 rounded-full" style={{ background: T.accent + "50" }} />}
            </div>
          ))}
        </div>
        <p className={`mt-4 leading-relaxed max-w-xl ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
      </div>
    );

    case "competition": return (
      <div className="flex-1 flex gap-6 items-center py-4 z-10 relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>Competitive Landscape</div>
          {slide.key_stat && <div className={`font-black mb-2 ${fs ? "text-5xl" : "text-3xl"}`} style={{ color: T.accent }}>{slide.key_stat}</div>}
          <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-3xl" : "text-xl md:text-2xl"}`} style={{ color: T.titleColor }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className="text-sm italic mb-3" style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
          <p className={`leading-relaxed max-w-sm ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
        </div>
        {/* 2x2 quadrant */}
        <div className="flex-shrink-0 w-40 h-40 relative">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <line x1="80" y1="4" x2="80" y2="156" stroke={T.accent + "40"} strokeWidth="1.5"/>
            <line x1="4" y1="80" x2="156" y2="80" stroke={T.accent + "40"} strokeWidth="1.5"/>
            <text x="83" y="16" fill={T.accent + "80"} fontSize="8" fontWeight="700">INNOVATIVE</text>
            <text x="10" y="16" fill={T.accent + "60"} fontSize="7">LEGACY</text>
            <text x="6" y="76" fill={T.accent + "70"} fontSize="7">NICHE</text>
            <text x="100" y="76" fill={T.accent + "70"} fontSize="7">SCALE</text>
            {/* Competitor dots */}
            {[[30,60],[45,90],[55,40],[35,110]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="5" fill={T.textColor + "30"} stroke={T.textColor + "50"} strokeWidth="1"/>
            ))}
            {/* Us — winner quadrant */}
            <circle cx="118" cy="28" r="8" fill={T.accent} opacity="0.9"/>
            <text x="108" y="18" fill={T.accent} fontSize="7" fontWeight="800">US</text>
          </svg>
        </div>
      </div>
    );

    case "team": return (
      <div className="flex-1 flex flex-col justify-center py-4 z-10 relative">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>The Team</div>
        <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.titleColor }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
        <div className="flex gap-4 mb-4 flex-wrap">
          {["Founder", "Technical", "Business"].map((role, i) => (
            <div key={role} className="flex flex-col items-center gap-2">
              <div className="rounded-full flex items-center justify-center font-black" style={{ width: fs ? 56 : 44, height: fs ? 56 : 44, background: T.accent + (["30","20","18"][i]), border: `2px solid ${T.accent}50`, color: T.accent, fontSize: fs ? 18 : 14 }}>
                {["F","T","B"][i]}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: T.textColor, opacity: 0.7 }}>{role}</span>
            </div>
          ))}
        </div>
        <p className={`leading-relaxed max-w-xl ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
        {slide.key_stat && <div className="mt-3 text-sm font-bold" style={{ color: T.accent }}>{slide.key_stat}</div>}
      </div>
    );

    case "financials": return (
      <div className="flex-1 flex gap-6 items-center py-4 z-10 relative">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>Financial Outlook</div>
          {slide.key_stat && (
            <div className={`font-black leading-none mb-3 ${fs ? "text-7xl" : "text-5xl md:text-6xl"}`} style={{ color: T.accent }}>
              {slide.key_stat}
            </div>
          )}
          <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-3xl" : "text-xl md:text-2xl"}`} style={{ color: T.titleColor }}>
            {slide.title}
          </h2>
          {slide.subtitle && <p className="text-sm italic mb-3" style={{ color: T.accent, opacity: 0.85 }}>{slide.subtitle}</p>}
          <p className={`leading-relaxed max-w-sm ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
        </div>
        {/* Gauge decoration */}
        <div className="flex-shrink-0">
          <svg width={fs ? 120 : 90} height={fs ? 120 : 90} viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke={T.accent + "18"} strokeWidth="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke={T.accent} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${314 * 0.72} 314`} strokeDashoffset={314 * 0.25} transform="rotate(-90 60 60)"/>
            <text x="60" y="65" textAnchor="middle" fill={T.titleColor} fontSize="18" fontWeight="900">72%</text>
            <text x="60" y="80" textAnchor="middle" fill={T.accent + "80"} fontSize="9">margin</text>
          </svg>
        </div>
      </div>
    );

    case "ask": return (
      <div className="flex-1 flex flex-col items-center justify-center py-4 z-10 relative text-center">
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: T.accent }}>The Ask</div>
        {slide.key_stat && (
          <div className={`font-black leading-none mb-2 ${fs ? "text-8xl" : "text-6xl md:text-7xl"}`} style={{ color: T.titleColor }}>
            {slide.key_stat}
          </div>
        )}
        <h2 className={`font-extrabold leading-tight mb-2 max-w-lg ${fs ? "text-4xl" : "text-2xl md:text-3xl"}`} style={{ color: T.accent, letterSpacing: "-0.02em" }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-sm"}`} style={{ color: T.textColor, opacity: 0.85 }}>{slide.subtitle}</p>}
        {/* Use-of-funds decorative bar */}
        <div className="flex w-full max-w-xs h-2 rounded-full overflow-hidden mb-4">
          {[["40%", T.accent], ["25%", T.accent + "aa"], ["20%", T.accent + "77"], ["15%", T.accent + "44"]].map(([w, c]) => (
            <div key={w} className="h-full" style={{ width: w, background: c }} />
          ))}
        </div>
        <div className="flex gap-4 text-[10px] mb-4">
          {["Product 40%", "Team 25%", "Growth 20%", "Ops 15%"].map(l => (
            <span key={l} style={{ color: T.textColor, opacity: 0.6 }}>{l}</span>
          ))}
        </div>
        <p className={`leading-relaxed max-w-md ${fs ? "text-sm" : "text-xs"}`} style={{ color: T.textColor, opacity: 0.8 }}>{slide.main_content}</p>
      </div>
    );

    default: return (
      <div className="flex-1 flex flex-col justify-center py-4 relative z-10">
        {slide.key_stat && (
          <>
            <div className={`font-black mb-2 leading-none ${fs ? "text-8xl" : "text-5xl md:text-7xl"}`} style={{ color: T.accent }}>{slide.key_stat}</div>
            <div className="w-12 h-0.5 mb-4 rounded-full" style={{ background: T.accent + "60" }} />
          </>
        )}
        <h2 className={`font-extrabold leading-tight mb-3 ${fs ? "text-4xl" : "text-2xl md:text-4xl"}`} style={{ color: T.titleColor, letterSpacing: "-0.02em" }}>
          {slide.title}
        </h2>
        {slide.subtitle && <p className={`italic mb-4 ${fs ? "text-lg" : "text-base"}`} style={{ color: T.accent, opacity: 0.9 }}>{slide.subtitle}</p>}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-0.5 flex-shrink-0 rounded-full mt-1" style={{ height: 40, background: T.accent + "50" }} />
          <p className={`leading-relaxed ${fs ? "text-base" : "text-sm md:text-base"}`} style={{ color: T.textColor, opacity: 0.85 }}>{slide.main_content}</p>
        </div>
        {!fs && slide.emotional_purpose && (
          <p className="mt-3 text-[10px] italic" style={{ color: T.textColor + "50" }}>{slide.emotional_purpose}</p>
        )}
      </div>
    );
  }
}

// ─── Slide viewer (Gamma AI style) ───────────────────────────────────────────

function SlideViewer({ result, deckName, deckTheme, startupContext, locale, onSlideUpdate }: {
  result: PitchDeckResult;
  deckName: string;
  deckTheme: DeckTheme;
  startupContext: string;
  locale: string;
  onSlideUpdate: (index: number, slide: PitchSlide) => void;
}) {
  const { t: tl } = useLanguage();
  const fts = tl.features.pitchDeck as Record<string, string>;
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<"slides" | "scripts" | "qa">("slides");
  const [showImproveMenu, setShowImproveMenu] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveSuccess, setImproveSuccess] = useState(false);
  const [investorMode, setInvestorMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = result.slides;
  const slide = slides[current];
  const perTypeTheme = getTheme(slide.slide_type);
  // Use deck theme for background, per-type accent for colors
  const theme = {
    bg: deckTheme.gradient,
    titleColor: deckTheme.textPrimary,
    accent: perTypeTheme.accent,
    textColor: deckTheme.textSecondary.startsWith("rgba") ? deckTheme.textPrimary : deckTheme.textSecondary,
    badge: perTypeTheme.badge,
  };

  const investorThought = result.intelligence?.investor_preview.find(p => p.after_slide === current + 1);

  async function improveSlide(improvement: "persuasive" | "visual" | "concise" | "investor-friendly") {
    setShowImproveMenu(false);
    setImproving(true);
    try {
      const res = await fetch("/api/pitch-deck/improve-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideData: slide, improvement, startupContext, locale }),
      });
      const data = await res.json();
      if (res.ok && data.slide) {
        onSlideUpdate(current, data.slide as PitchSlide);
        setImproveSuccess(true);
        setTimeout(() => setImproveSuccess(false), 2500);
      }
    } finally {
      setImproving(false);
    }
  }

  const prev = () => setCurrent((c) => Math.max(0, c - 1));
  const next = () => setCurrent((c) => Math.min(slides.length - 1, c + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleFullscreen = () => {
    setFullscreen((f) => !f);
  };

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col" : "relative"} style={{ background: fullscreen ? "#000" : undefined }}>
      {/* Tabs */}
      {!fullscreen && (
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "#0F0A1F", border: "1px solid #1A1040" }}>
          {([
            { key: "slides", icon: <Layers className="w-3.5 h-3.5" />, label: fts.slides },
            { key: "scripts", icon: <FileText className="w-3.5 h-3.5" />, label: fts.scripts },
            { key: "qa", icon: <HelpCircle className="w-3.5 h-3.5" />, label: fts.qa },
          ] as const).map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: tab === tb.key ? "#7C3AED" : "transparent", color: tab === tb.key ? "white" : "#8B7CF8" }}
            >
              {tb.icon}{tb.label}
            </button>
          ))}
        </div>
      )}

      {/* SLIDES TAB */}
      {(tab === "slides" || fullscreen) && (
        <div className={fullscreen ? "flex-1 flex flex-col" : ""}>
          {/* Main slide */}
          <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "16/9", borderRadius: fullscreen ? 0 : 16, overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <SlideRenderer slide={{
                  slide_type: slide.slide_type,
                  title: slide.title,
                  body: slide.main_content,
                  keystat: slide.key_stat ?? undefined,
                }} />
                {/* Overlay controls */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none" style={{ zIndex: 10 }}>
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full pointer-events-auto" style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
                    {slide.slide_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {current + 1} / {slides.length}
                    </span>
                    <button onClick={toggleFullscreen} className="p-1 rounded-md transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Bottom watermark + dots */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between" style={{ zIndex: 10 }}>
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {deckName}
                  </span>
                  <div className="flex items-center gap-1">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                        className="transition-all rounded-full"
                        style={{
                          width: i === current ? 20 : 6, height: 6,
                          background: i === current ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Side nav arrows */}
            {current > 0 && (
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {current < slides.length - 1 && (
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Speaker notes toggle button */}
            {slide.speaker_notes && (
              <button
                onClick={() => setShowNotes((s) => !s)}
                className="absolute bottom-3 right-3 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all"
                style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.15)", color: "#ccc" }}
              >
                <Mic className="w-3 h-3" />
                Notes
                {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Speaker notes panel */}
          <AnimatePresence>
            {showNotes && slide.speaker_notes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 rounded-xl text-sm leading-relaxed" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#c4b5fd" }}>
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block mb-1.5">Speaker Notes</span>
                  {slide.speaker_notes}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Improve this slide */}
          {!fullscreen && (
            <div className="mt-3 flex items-center gap-3 relative">
              <div className="relative">
                <button
                  onClick={() => setShowImproveMenu(m => !m)}
                  disabled={improving}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: improving || improveSuccess ? "rgba(201,168,76,0.2)" : "rgba(124,58,237,0.1)", border: `1px solid ${improveSuccess ? "rgba(201,168,76,0.5)" : "rgba(124,58,237,0.25)"}`, color: improveSuccess ? "#C9A84C" : "#8B7CF8" }}
                >
                  {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : improveSuccess ? <Sparkles className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                  {improving ? "Improving…" : improveSuccess ? "Improved!" : "Improve This Slide"}
                  {!improving && !improveSuccess && <ChevronDown className="w-3 h-3" />}
                </button>
                <AnimatePresence>
                  {showImproveMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 z-30 rounded-xl overflow-hidden shadow-2xl"
                      style={{ background: "#0D0A20", border: "1px solid #1A1040", minWidth: 180 }}
                    >
                      {([
                        { key: "persuasive", label: fts.morePitch || "More Persuasive", icon: "💬" },
                        { key: "visual", label: fts.moreVisual || "More Visual", icon: "🎨" },
                        { key: "concise", label: fts.moreConcise || "More Concise", icon: "✂️" },
                        { key: "investor-friendly", label: fts.investorFriendly || "Investor-Friendly", icon: "💰" },
                      ] as const).map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => improveSlide(opt.key)}
                          className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <span>{opt.icon}</span> {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {investorMode && investorThought && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-xs italic px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(139,124,248,0.1)", border: "1px solid rgba(139,124,248,0.2)", color: "#8B7CF8" }}
                >
                  <Eye className="w-3 h-3 flex-shrink-0" />
                  &ldquo;{investorThought.thought}&rdquo;
                </motion.div>
              )}
            </div>
          )}

          {/* Investor view toggle */}
          {!fullscreen && result.intelligence?.investor_preview && (
            <div className="mt-2">
              <button
                onClick={() => setInvestorMode(m => !m)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: investorMode ? "#C9A84C" : "#555" }}
              >
                <Eye className="w-3 h-3" />
                {investorMode ? fts.investorViewOn || "Investor view ON" : `👁 ${fts.investorViewOff || "See through investor eyes"}`}
              </button>
            </div>
          )}

          {/* Thumbnail strip */}
          {!fullscreen && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {slides.map((s, i) => {
                const th = getTheme(s.slide_type);
                const thumbBg = deckTheme.gradient;
                const thumbTitle = deckTheme.textPrimary;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: 100, height: 68,
                      outline: i === current ? `2px solid ${th.accent}` : "2px solid transparent",
                      outlineOffset: 2,
                      background: thumbBg,
                    }}
                  >
                    <div className="w-full h-full flex flex-col justify-between p-1.5" style={{ background: thumbBg }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-bold" style={{ color: th.accent }}>{s.slide_type.replace(/_/g, " ")}</span>
                        <span className="text-[7px]" style={{ color: thumbTitle + "66" }}>{i + 1}</span>
                      </div>
                      <span className="text-[8px] font-semibold leading-tight line-clamp-2" style={{ color: thumbTitle }}>{s.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCRIPTS TAB */}
      {tab === "scripts" && !fullscreen && (
        <div className="space-y-4">
          {[
            { label: fts.openingHook || "Opening Hook", text: result.opening_hook, badge: fts.startStrong || "Start strong", color: "#f59e0b" },
            { label: fts.elevatorPitch || "Elevator Pitch", text: result.elevator_pitch, badge: fts.sec30 || "30 sec", color: "#0ea5e9" },
            { label: fts.threeMinScript || "3-Minute Script", text: result.three_minute_script, badge: fts.fullPitch || "Full pitch", color: "#a855f7" },
            { label: fts.closingStatement || "Closing Statement", text: result.closing_statement, badge: fts.endStrong || "End strong", color: "#22c55e" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-5"
              style={{ background: "rgba(15,10,31,0.9)", border: "1px solid #1A1040" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{s.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.color + "22", color: s.color, border: `1px solid ${s.color}44` }}>{s.badge}</span>
                </div>
                <CopyBtn text={s.text} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#ccc" }}>{s.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Q&A TAB */}
      {tab === "qa" && !fullscreen && (
        <div className="space-y-4">
          {result.investor_questions.map((qa, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl p-5"
              style={{ background: "rgba(15,10,31,0.9)", border: "1px solid #1A1040" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-white text-sm leading-snug">Q: {qa.question}</p>
                <CopyBtn text={qa.answer} label="Copy" />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#8B7CF8" }}>A: {qa.answer}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History sidebar ──────────────────────────────────────────────────────────

function HistoryDrawer({ onLoad }: { onLoad: (deck: PitchDeckResult, name: string) => void }) {
  const { t: tl } = useLanguage();
  const fts = tl.features.pitchDeck as Record<string, string>;
  const [open, setOpen] = useState(false);
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pitch-deck");
      if (res.ok) setDecks(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) fetchDecks(); }, [open]);

  const loadDeck = async (id: string, name: string) => {
    const res = await fetch(`/api/pitch-deck/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    onLoad(data.generatedDeck as PitchDeckResult, name);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#A855F7" }}
      >
        <History className="w-4 h-4" />
        {fts.myDecks || "My Decks"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
              style={{ width: 320, background: "#0D0A20", borderLeft: "1px solid #1A1040" }}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#1A1040" }}>
                <h3 className="font-bold text-white">{fts.mySavedDecks || "My Saved Decks"}</h3>
                <button onClick={() => setOpen(false)} className="text-[#555] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" /></div>
                ) : decks.length === 0 ? (
                  <div className="text-center py-8">
                  <p className="text-white/60 text-sm font-semibold mb-1">Your story deserves a deck worth sharing.</p>
                  <p className="text-[#555] text-xs">Generate your first deck — it gets better every time.</p>
                </div>
                ) : decks.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => loadDeck(d.id, d.startupName)}
                    className="w-full text-left p-3 rounded-xl transition-all hover:border-purple-600"
                    style={{ background: "rgba(124,58,237,0.06)", border: "1px solid #1A1040" }}
                  >
                    <p className="font-semibold text-white text-sm truncate">{d.startupName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#555" }}>
                      {new Date(d.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PitchDeckPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.pitchDeck as Record<string, string>;
  const LOADING_MESSAGES = [ft.loadingMsg1, ft.loadingMsg2, ft.loadingMsg3, ft.loadingMsg4, ft.loadingMsg5, ft.loadingMsg6];
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [direction, setDirection] = useState(1);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [result, setResult] = useState<PitchDeckResult | null>(null);
  const [deckName, setDeckName] = useState("My Startup");
  const [error, setError] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("dark-premium");
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptxError, setPptxError] = useState("");

  useEffect(() => {
    if (step !== 2) return;
    const id = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 2000);
    return () => clearInterval(id);
  }, [step]);

  const generate = useCallback(async (finalAnswers: string[]) => {
    setStep(2);
    setError("");
    const startupName = finalAnswers[0].split(/[,.\n]/)[0].trim() || "My Startup";
    setDeckName(startupName);
    try {
      const res = await fetch("/api/pitch-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, startupName, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That one didn't land. Give it a moment and try again.");
      setStep(1);
    }
  }, [locale]);

  const goNext = () => {
    const updated = [...answers];
    updated[qIndex] = currentAnswer;
    setAnswers(updated);
    if (qIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setQIndex(qIndex + 1);
      setCurrentAnswer(updated[qIndex + 1]);
    } else {
      generate(updated);
    }
  };

  const goBack = () => {
    const updated = [...answers];
    updated[qIndex] = currentAnswer;
    setAnswers(updated);
    setDirection(-1);
    setQIndex(qIndex - 1);
    setCurrentAnswer(updated[qIndex - 1]);
  };

  const skip = () => {
    const updated = [...answers];
    updated[qIndex] = "";
    setAnswers(updated);
    if (qIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setQIndex(qIndex + 1);
      setCurrentAnswer(updated[qIndex + 1]);
    } else {
      generate(updated);
    }
  };

  const reset = () => {
    setStep(0);
    setQIndex(0);
    setAnswers(Array(10).fill(""));
    setCurrentAnswer("");
    setResult(null);
    setError("");
  };

  const handleDownloadPPTX = async () => {
    if (!result) return;
    setPptxLoading(true);
    setPptxError("");
    try {
      await generatePPTX(result, deckName, DECK_THEMES[selectedTheme]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Download failed";
      setPptxError(msg);
      setTimeout(() => setPptxError(""), 5000);
    } finally {
      setPptxLoading(false);
    }
  };

  // ── STEP 0: Intro ──────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-screen relative" style={{ background: "#06040F" }}>
        <Aurora />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <Layers className="w-10 h-10 text-[#C9A84C]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">{ft.title}</h1>
            <p className="text-[#8B7CF8] mb-8 leading-relaxed">{ft.subtitle}</p>
            <div className="flex justify-center gap-6 mb-8 text-sm text-[#8B7CF8]">
              {[ft.feat12slides || "12 slides", ft.featYourVoice || "Your voice", ft.feat5min || "5 min setup"].map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
                  {f}
                </span>
              ))}
            </div>

            {/* Theme selector on intro */}
            <div className="mb-6">
              <p className="text-xs text-[#8B7CF8] mb-3 font-semibold uppercase tracking-widest">{ft.chooseTheme || "Choose a theme"}</p>
              <div className="flex justify-center">
                <ThemeSelector selected={selectedTheme} onChange={setSelectedTheme} />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setStep(1); setCurrentAnswer(""); }}
                className="px-8 py-3 rounded-lg font-semibold text-sm transition-all"
                style={{ background: "#C9A84C", color: "#06040F" }}
              >
                {ft.getStarted}
              </button>
              <HistoryDrawer onLoad={(deck, name) => { setResult(deck); setDeckName(name); setStep(3); }} />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── STEP 1: Questions ──────────────────────────────────────────────────────

  if (step === 1) {
    const q = QUESTIONS[qIndex];
    const progress = ((qIndex + 1) / QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen relative" style={{ background: "#06040F" }}>
        <Aurora />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <div className="flex justify-between text-xs text-[#8B7CF8] mb-2">
                <span>{ft.questionOf} {qIndex + 1} {ft.of} {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#1A1040" }}>
                <motion.div className="h-full rounded-full" style={{ background: "#C9A84C" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={qIndex}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 60 }}
                transition={{ duration: 0.25 }}
              >
                <div className="rounded-xl p-6 mb-4" style={{ background: "rgba(15,10,31,0.9)", border: "1px solid #1A1040" }}>
                  <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest mb-3">{ft.questionOf} {qIndex + 1}</p>
                  <h2 className="text-xl font-bold text-white leading-snug mb-1">{q.q}</h2>
                  <p className="text-xs text-[#8B7CF8]/60">{ft.beSpecific || "The more real you are here, the more powerful your deck becomes."}</p>
                </div>

                {q.type === "text" ? (
                  <input
                    autoFocus
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && currentAnswer.trim()) goNext(); }}
                    placeholder={ft.typeYourAnswer || "Type your answer..."}
                    className="w-full h-12 px-4 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                    style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1040"; }}
                  />
                ) : (
                  <textarea
                    autoFocus
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={ft.typeYourAnswer || "Type your answer..."}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none resize-none transition-all"
                    style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1040"; }}
                  />
                )}

                <div className="flex items-center justify-between mt-4">
                  <div>
                    {qIndex > 0 && (
                      <button onClick={goBack} className="flex items-center gap-1 text-sm text-[#8B7CF8] hover:text-white transition-colors">
                        <ChevronLeft className="w-4 h-4" /> {ft.previous}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={skip} className="text-xs text-[#555] hover:text-[#8B7CF8] transition-colors">{ft.skip || "Skip"}</button>
                    <button
                      onClick={goNext}
                      disabled={!currentAnswer.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: currentAnswer.trim() ? "#C9A84C" : "#1A1040", color: currentAnswer.trim() ? "#06040F" : "#555" }}
                    >
                      {qIndex === QUESTIONS.length - 1 ? ft.generate : ft.next}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {error && (
              <div className="mt-4 p-3 rounded-lg text-sm text-red-400" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Loading ────────────────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="min-h-screen relative" style={{ background: "#06040F" }}>
        <Aurora />
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 80, height: 80, border: "3px solid #1A1040", borderTop: "3px solid #C9A84C", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <Loader2 className="w-8 h-8 text-[#C9A84C] absolute inset-0 m-auto animate-spin" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={loadingMsg} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-lg font-semibold text-white">
                {LOADING_MESSAGES[loadingMsg]}
              </motion.p>
            </AnimatePresence>
            <p className="text-sm text-[#8B7CF8] mt-2">{ft.writingDeck || "Writing your 12-slide deck in your exact voice — this takes a moment."}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3: Results ────────────────────────────────────────────────────────

  if (!result) return null;

  return (
    <div className="min-h-screen relative" style={{ background: "#06040F" }}>
      <Aurora />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{deckName}</h1>
            <p className="text-sm text-[#8B7CF8]">12 {ft.slidesReady || "slides ready to own the room"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowThemeModal(true)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#A855F7" }}
            >
              <Palette className="w-4 h-4" />
              {ft.theme || "Theme"}
            </button>
            <HistoryDrawer onLoad={(deck, name) => { setResult(deck); setDeckName(name); }} />
            <button onClick={reset} className="flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors px-3 py-2">
              <RotateCcw className="w-4 h-4" /> {ft.newDeck || "New"}
            </button>
          </div>
        </div>

        <SlideViewer
          result={result}
          deckName={deckName}
          deckTheme={DECK_THEMES[selectedTheme]}
          startupContext={answers[0] || ""}
          locale={locale}
          onSlideUpdate={(index, updated) => {
            setResult(prev => {
              if (!prev) return prev;
              const slides = [...prev.slides];
              slides[index] = updated;
              return { ...prev, slides };
            });
          }}
        />

        {/* WOW Moment */}
        {result.intelligence?.wow_moment && (
          <div className="mt-6">
            <WowMomentCard wow={result.intelligence.wow_moment} />
          </div>
        )}

        {/* Intelligence panels */}
        {result.intelligence && (
          <div className="mt-4 space-y-3">
            <DeckScorePanel score={result.intelligence.deck_score} />
            <RedFlagsPanel flags={result.intelligence.red_flags} />
          </div>
        )}

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(6,4,15,0.95)", borderTop: "1px solid #1A1040", backdropFilter: "blur(10px)" }}>
          <CopyBtn text={result.three_minute_script} label={ft.copyScript} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadPDF(result, deckName)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#C9A84C", color: "#06040F" }}
            >
              <Download className="w-4 h-4" />
              {ft.downloadPDF}
            </button>
            <div className="relative">
              <button
                onClick={handleDownloadPPTX}
                disabled={pptxLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: pptxError ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)", border: `1px solid ${pptxError ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.3)"}`, color: pptxError ? "#ef4444" : "#3B82F6" }}
              >
                {pptxLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pptxError ? "Failed" : "PPTX"}
              </button>
              {pptxError && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs text-red-300 pointer-events-none" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {pptxError}
                </div>
              )}
            </div>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#8B7CF8] transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> {ft.startOver}
          </button>
        </div>
      </div>

      {/* Theme modal */}
      <AnimatePresence>
        {showThemeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowThemeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-2xl p-6"
              style={{ background: "#0D0A20", border: "1px solid #1A1040", minWidth: 340 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Choose Theme</h3>
                <button onClick={() => setShowThemeModal(false)} className="text-[#555] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ThemeSelector selected={selectedTheme} onChange={(id) => { setSelectedTheme(id); setShowThemeModal(false); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
