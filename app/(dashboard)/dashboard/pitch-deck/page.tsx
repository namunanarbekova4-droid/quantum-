"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, ChevronRight, ChevronLeft, Copy, Check, RotateCcw, Loader2,
  Download, History, X, FileText, Mic, HelpCircle, Play, Pause,
  ChevronDown, ChevronUp, Maximize2, Minimize2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

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

function downloadPDF(result: PitchDeckResult, startupName: string) {
  const slidesHtml = result.slides.map((slide) => {
    const th = getTheme(slide.slide_type);
    return `
<div class="page" style="background:${th.bg};color:${th.textColor};">
  <div class="slide-header">
    <span class="badge" style="background:${th.accent}22;color:${th.accent};border:1px solid ${th.accent}44;">${slide.slide_type.replace(/_/g, " ")}</span>
    <span class="slide-num" style="color:${th.textColor}88;">Slide ${slide.slide_number} / ${result.slides.length}</span>
  </div>
  ${slide.key_stat ? `<div class="key-stat" style="color:${th.accent};">${slide.key_stat}</div>` : ""}
  <h1 style="color:${th.titleColor};">${slide.title}</h1>
  ${slide.subtitle ? `<p class="subtitle" style="color:${th.accent};">${slide.subtitle}</p>` : ""}
  <p class="content" style="color:${th.textColor};">${slide.main_content}</p>
  ${slide.speaker_notes ? `<div class="notes" style="border-color:${th.accent}44;background:${th.accent}11;"><span class="notes-label" style="color:${th.accent};">SPEAKER NOTES</span><br/><span style="color:${th.textColor}cc;">${slide.speaker_notes}</span></div>` : ""}
</div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${startupName} — Pitch Deck</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Helvetica Neue',Arial,sans-serif;}
  .page{width:100%;min-height:100vh;padding:52px 64px;display:flex;flex-direction:column;justify-content:center;page-break-after:always;}
  .page:last-of-type{page-break-after:avoid;}
  .slide-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
  .badge{font-size:11px;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;}
  .slide-num{font-size:12px;letter-spacing:1px;}
  .key-stat{font-size:56px;font-weight:900;line-height:1;margin-bottom:16px;}
  h1{font-size:38px;font-weight:800;line-height:1.15;margin-bottom:10px;}
  .subtitle{font-size:18px;font-style:italic;margin-bottom:24px;opacity:0.85;}
  .content{font-size:16px;line-height:1.8;opacity:0.9;}
  .notes{margin-top:28px;padding:16px 20px;border-radius:8px;border:1px solid;}
  .notes-label{font-size:10px;font-weight:700;letter-spacing:2px;display:block;margin-bottom:6px;}
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
}

interface PitchDeckResult {
  slides: PitchSlide[];
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
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
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Slide viewer (Gamma AI style) ───────────────────────────────────────────

function SlideViewer({ result, deckName }: { result: PitchDeckResult; deckName: string }) {
  const [current, setCurrent] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<"slides" | "scripts" | "qa">("slides");
  const containerRef = useRef<HTMLDivElement>(null);
  const slides = result.slides;
  const slide = slides[current];
  const theme = getTheme(slide.slide_type);

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
            { key: "slides", icon: <Layers className="w-3.5 h-3.5" />, label: "Slides" },
            { key: "scripts", icon: <FileText className="w-3.5 h-3.5" />, label: "Scripts" },
            { key: "qa", icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Q&A" },
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
                className="absolute inset-0 flex flex-col justify-between p-8 md:p-12"
                style={{ background: theme.bg }}
              >
                {/* Top row: badge + slide num */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: theme.accent + "22", color: theme.accent, border: `1px solid ${theme.accent}44` }}>
                    {slide.slide_type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: theme.textColor + "88" }}>
                      {current + 1} / {slides.length}
                    </span>
                    <button onClick={toggleFullscreen} className="p-1 rounded-md transition-opacity hover:opacity-70" style={{ color: theme.textColor + "88" }}>
                      {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Center content */}
                <div className="flex-1 flex flex-col justify-center py-4">
                  {slide.key_stat && (
                    <div className="text-5xl md:text-7xl font-black mb-3 leading-none" style={{ color: theme.accent }}>
                      {slide.key_stat}
                    </div>
                  )}
                  <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-3" style={{ color: theme.titleColor }}>
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="text-base md:text-lg italic mb-4" style={{ color: theme.accent, opacity: 0.9 }}>
                      {slide.subtitle}
                    </p>
                  )}
                  <p className="text-sm md:text-base leading-relaxed max-w-3xl" style={{ color: theme.textColor, opacity: 0.85 }}>
                    {slide.main_content}
                  </p>
                </div>

                {/* Bottom: startup name watermark */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: theme.textColor + "44" }}>
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
                          background: i === current ? theme.accent : theme.textColor + "44",
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

          {/* Thumbnail strip */}
          {!fullscreen && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {slides.map((s, i) => {
                const th = getTheme(s.slide_type);
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: 100, height: 56,
                      outline: i === current ? `2px solid ${th.accent}` : "2px solid transparent",
                      outlineOffset: 2,
                      background: th.bg,
                    }}
                  >
                    <div className="w-full h-full flex flex-col justify-between p-1.5" style={{ background: th.bg }}>
                      <span className="text-[7px] font-bold" style={{ color: th.accent }}>{s.slide_type.replace(/_/g, " ")}</span>
                      <span className="text-[8px] font-semibold leading-tight line-clamp-2" style={{ color: th.titleColor }}>{s.title}</span>
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
            { label: "Opening Hook", text: result.opening_hook, badge: "Start strong", color: "#f59e0b" },
            { label: "Elevator Pitch", text: result.elevator_pitch, badge: "30 sec", color: "#0ea5e9" },
            { label: "3-Minute Script", text: result.three_minute_script, badge: "Full pitch", color: "#a855f7" },
            { label: "Closing Statement", text: result.closing_statement, badge: "End strong", color: "#22c55e" },
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
        My Decks
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
                <h3 className="font-bold text-white">My Saved Decks</h3>
                <button onClick={() => setOpen(false)} className="text-[#555] hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" /></div>
                ) : decks.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "#555" }}>No saved decks yet</p>
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
      setError(e instanceof Error ? e.message : "Something went wrong");
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
              {["12 slides", "Your voice", "5 min setup"].map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
                  {f}
                </span>
              ))}
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
                  <p className="text-xs text-[#8B7CF8]/60">Be specific — the more detail you give, the better your deck</p>
                </div>

                {q.type === "text" ? (
                  <input
                    autoFocus
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && currentAnswer.trim()) goNext(); }}
                    placeholder="Type your answer..."
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
                    placeholder="Type your answer... Be specific. The more detail, the better your deck."
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
                    <button onClick={skip} className="text-xs text-[#555] hover:text-[#8B7CF8] transition-colors">Skip</button>
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
            <p className="text-sm text-[#8B7CF8] mt-2">Writing your 12-slide deck in your exact voice...</p>
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
            <p className="text-sm text-[#8B7CF8]">12 slides ready to present</p>
          </div>
          <div className="flex items-center gap-2">
            <HistoryDrawer onLoad={(deck, name) => { setResult(deck); setDeckName(name); }} />
            <button onClick={reset} className="flex items-center gap-2 text-sm text-[#555] hover:text-white transition-colors px-3 py-2">
              <RotateCcw className="w-4 h-4" /> New
            </button>
          </div>
        </div>

        <SlideViewer result={result} deckName={deckName} />

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(6,4,15,0.95)", borderTop: "1px solid #1A1040", backdropFilter: "blur(10px)" }}>
          <CopyBtn text={result.three_minute_script} label={ft.copyScript} />
          <button
            onClick={() => downloadPDF(result, deckName)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#C9A84C", color: "#06040F" }}
          >
            <Download className="w-4 h-4" />
            {ft.downloadPDF}
          </button>
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#8B7CF8] transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> {ft.startOver}
          </button>
        </div>
      </div>
    </div>
  );
}
