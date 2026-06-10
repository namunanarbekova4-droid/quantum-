"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronRight, ChevronLeft, Copy, Check, RotateCcw, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

function downloadPDF(result: PitchDeckResult, startupName: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${startupName} — Pitch Deck</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111; }
  .page { width: 100%; page-break-after: always; padding: 48px 56px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; border-bottom: 2px solid #eee; }
  .page:last-of-type { page-break-after: avoid; }
  .slide-number { font-size: 11px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
  .slide-type { display: inline-block; background: #7C3AED; color: #fff; font-size: 10px; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
  h1 { font-size: 32px; font-weight: 800; color: #111; line-height: 1.2; margin-bottom: 10px; }
  .subtitle { font-size: 16px; color: #7C3AED; font-style: italic; margin-bottom: 24px; }
  .content { font-size: 15px; color: #333; line-height: 1.7; }
  .key-stat { font-size: 42px; font-weight: 900; color: #C9A84C; margin: 20px 0; }
  .notes { margin-top: 24px; padding: 16px; background: #f8f6ff; border-left: 3px solid #7C3AED; border-radius: 4px; }
  .notes-label { font-size: 10px; color: #7C3AED; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .notes-text { font-size: 13px; color: #555; font-style: italic; line-height: 1.6; }
  .extra-section { margin-top: 40px; padding: 32px 56px; border-top: 2px solid #eee; }
  .extra-section h2 { font-size: 22px; font-weight: 700; color: #7C3AED; margin-bottom: 16px; }
  .extra-section p { font-size: 14px; color: #333; line-height: 1.8; white-space: pre-wrap; }
  .qa-item { margin-bottom: 20px; padding: 16px; border: 1px solid #eee; border-radius: 8px; }
  .qa-q { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 8px; }
  .qa-a { font-size: 13px; color: #555; line-height: 1.6; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
${result.slides.map(slide => `
<div class="page">
  <div class="slide-number">Slide ${slide.slide_number} of ${result.slides.length}</div>
  <div class="slide-type">${slide.slide_type.replace(/_/g, ' ')}</div>
  <h1>${slide.title}</h1>
  ${slide.subtitle ? `<p class="subtitle">${slide.subtitle}</p>` : ''}
  ${slide.key_stat ? `<div class="key-stat">${slide.key_stat}</div>` : ''}
  <div class="content">${slide.main_content}</div>
  ${slide.speaker_notes ? `<div class="notes"><div class="notes-label">Speaker Notes</div><div class="notes-text">${slide.speaker_notes}</div></div>` : ''}
</div>`).join('')}
<div class="extra-section">
  <h2>3-Minute Script</h2>
  <p>${result.three_minute_script}</p>
</div>
<div class="extra-section">
  <h2>Elevator Pitch (30 sec)</h2>
  <p>${result.elevator_pitch}</p>
</div>
<div class="extra-section">
  <h2>Investor Q&amp;A</h2>
  ${result.investor_questions?.map(qa => `<div class="qa-item"><div class="qa-q">Q: ${qa.question}</div><div class="qa-a">A: ${qa.answer}</div></div>`).join('') ?? ''}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
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

// Loading messages are built dynamically from translations inside the component

// ─── Aurora ───────────────────────────────────────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PitchDeckPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.pitchDeck as Record<string, string>;
  const LOADING_MESSAGES = [ft.loadingMsg1, ft.loadingMsg2, ft.loadingMsg3, ft.loadingMsg4, ft.loadingMsg5, ft.loadingMsg6];
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [current, setCurrent] = useState("");
  const [direction, setDirection] = useState(1);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [result, setResult] = useState<PitchDeckResult | null>(null);
  const [deckName, setDeckName] = useState("My Startup");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"slides" | "scripts" | "qa">("slides");
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  // Rotate loading messages
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
    updated[qIndex] = current;
    setAnswers(updated);
    if (qIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setQIndex(qIndex + 1);
      setCurrent(updated[qIndex + 1]);
    } else {
      generate(updated);
    }
  };

  const goBack = () => {
    const updated = [...answers];
    updated[qIndex] = current;
    setAnswers(updated);
    setDirection(-1);
    setQIndex(qIndex - 1);
    setCurrent(updated[qIndex - 1]);
  };

  const skip = () => {
    const updated = [...answers];
    updated[qIndex] = "";
    setAnswers(updated);
    if (qIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setQIndex(qIndex + 1);
      setCurrent(updated[qIndex + 1]);
    } else {
      generate(updated);
    }
  };

  const reset = () => {
    setStep(0);
    setQIndex(0);
    setAnswers(Array(10).fill(""));
    setCurrent("");
    setResult(null);
    setError("");
    setTab("slides");
  };

  const toggleNotes = (n: number) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
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
            <p className="text-[#8B7CF8] mb-8 leading-relaxed">
              {ft.subtitle}
            </p>
            <div className="flex justify-center gap-6 mb-8 text-sm text-[#8B7CF8]">
              {["12 slides", "Your voice", "5 min setup"].map((f) => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] inline-block" />
                  {f}
                </span>
              ))}
            </div>
            <button
              onClick={() => { setStep(1); setCurrent(""); }}
              className="px-8 py-3 rounded-lg font-semibold text-sm transition-all"
              style={{ background: "#C9A84C", color: "#06040F" }}
            >
              {ft.getStarted}
            </button>
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
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-[#8B7CF8] mb-2">
                <span>{ft.questionOf} {qIndex + 1} {ft.of} {QUESTIONS.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "#1A1040" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "#C9A84C" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Question card */}
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
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && current.trim()) goNext(); }}
                    placeholder="Type your answer..."
                    className="w-full h-12 px-4 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                    style={{ background: "rgba(15,10,31,0.8)", border: "1px solid #1A1040" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#7C3AED"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#1A1040"; }}
                  />
                ) : (
                  <textarea
                    autoFocus
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
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
                    <button onClick={skip} className="text-xs text-[#555] hover:text-[#8B7CF8] transition-colors">
                      Skip
                    </button>
                    <button
                      onClick={goNext}
                      disabled={!current.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: current.trim() ? "#C9A84C" : "#1A1040", color: current.trim() ? "#06040F" : "#555" }}
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
              <motion.p
                key={loadingMsg}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-lg font-semibold text-white"
              >
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
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Pitch Deck</h1>
            <p className="text-sm text-[#8B7CF8]">12 slides ready to present</p>
          </div>
          <button onClick={reset} className="flex items-center gap-2 text-sm text-[#8B7CF8] hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" /> Start Over
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#0F0A1F", border: "1px solid #1A1040" }}>
          {(["slides", "scripts", "qa"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
              style={{
                background: tab === t ? "#7C3AED" : "transparent",
                color: tab === t ? "white" : "#8B7CF8",
              }}
            >
              {t === "qa" ? "Q&A" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* SLIDES TAB */}
        {tab === "slides" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.slides.map((slide) => (
              <motion.div
                key={slide.slide_number}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: slide.slide_number * 0.04 }}
                className="rounded-xl p-5"
                style={{ background: "rgba(15,10,31,0.9)", border: "1px solid #1A1040" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                      {slide.slide_number}
                    </span>
                    <span className="text-xs text-[#555] capitalize">{slide.slide_type.replace(/_/g, " ")}</span>
                  </div>
                  <CopyBtn text={`${slide.title}\n\n${slide.main_content}`} label="Copy" />
                </div>
                <h3 className="text-base font-bold text-white mb-1 leading-snug">{slide.title}</h3>
                {slide.subtitle && <p className="text-sm text-[#8B7CF8] italic mb-2">{slide.subtitle}</p>}
                <p className="text-sm text-[#ccc] leading-relaxed mb-3">{slide.main_content}</p>
                {slide.key_stat && (
                  <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                    <span className="text-lg font-bold text-[#C9A84C]">{slide.key_stat}</span>
                  </div>
                )}
                <button
                  onClick={() => toggleNotes(slide.slide_number)}
                  className="text-xs text-[#7C3AED] hover:text-[#A855F7] transition-colors"
                >
                  {expandedNotes.has(slide.slide_number) ? `▲ ${ft.hideNotes}` : `▼ ${ft.showNotes}`}
                </button>
                {expandedNotes.has(slide.slide_number) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 p-3 rounded-lg text-xs text-[#A855F7] leading-relaxed"
                    style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    {slide.speaker_notes}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* SCRIPTS TAB */}
        {tab === "scripts" && (
          <div className="space-y-4">
            {[
              { label: ft.openingHook, text: result.opening_hook, badge: "Start strong" },
              { label: ft.elevatorPitch, text: result.elevator_pitch, badge: "60 sec" },
              { label: ft.threeMinScript, text: result.three_minute_script, badge: "Full" },
              { label: ft.closingStatement, text: result.closing_statement, badge: "End strong" },
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
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "#A855F7", border: "1px solid rgba(124,58,237,0.2)" }}>{s.badge}</span>
                  </div>
                  <CopyBtn text={s.text} />
                </div>
                <p className="text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap">{s.text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Q&A TAB */}
        {tab === "qa" && (
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
                  <CopyBtn text={qa.answer} label="Copy Answer" />
                </div>
                <p className="text-sm text-[#8B7CF8] leading-relaxed">A: {qa.answer}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(6,4,15,0.95)", borderTop: "1px solid #1A1040", backdropFilter: "blur(10px)" }}>
          <CopyBtn text={result.three_minute_script} label={ft.copyScript} />
          <button
            onClick={() => result && downloadPDF(result, deckName)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "#C9A84C", color: "#06040F" }}
          >
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
