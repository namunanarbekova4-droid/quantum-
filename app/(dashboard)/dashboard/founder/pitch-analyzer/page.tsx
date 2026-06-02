"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, Loader2, AlertTriangle, CheckCircle, XCircle, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideAnalysis {
  slideNumber: number;
  title: string;
  score: number;
  feedback: string;
  rewrite?: string;
  redFlags: string[];
}

interface PitchAnalysis {
  overallScore: number;
  slides: SlideAnalysis[];
  top3Fixes: string[];
  investorRedFlags: string[];
  summary: string;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#C9A84C" : "#ef4444";
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1a1a1a" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="2.5"
          strokeDasharray={`${score} 100`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

function SlideCard({ slide }: { slide: SlideAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = slide.score >= 70 ? "text-green-400 border-green-500/20 bg-green-500/5"
    : slide.score >= 50 ? "text-[#C9A84C] border-[#C9A84C]/20 bg-[#C9A84C]/5"
    : "text-red-400 border-red-500/20 bg-red-500/5";

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#888888] font-mono w-6">#{slide.slideNumber}</span>
          <span className="text-sm font-medium text-white">{slide.title}</span>
          {slide.redFlags.length > 0 && (
            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              {slide.redFlags.length} flag{slide.redFlags.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className={cn("text-sm font-bold px-2 py-1 rounded border", scoreColor)}>{slide.score}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1a1a1a] pt-3">
          <p className="text-sm text-[#888888] leading-relaxed">{slide.feedback}</p>
          {slide.redFlags.length > 0 && (
            <div className="space-y-1">
              {slide.redFlags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {f}
                </div>
              ))}
            </div>
          )}
          {slide.rewrite && (
            <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-[#C9A84C] mb-2 uppercase tracking-wider">Suggested Rewrite</p>
              <p className="text-sm text-white leading-relaxed">{slide.rewrite}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PitchAnalyzerPage() {
  const [companyName, setCompanyName] = useState("");
  const [deckText, setDeckText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PitchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setDeckText(e.target?.result as string || "");
    reader.readAsText(file);
  }

  async function analyze() {
    if (!deckText) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/pitch-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckText, companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Pitch Analyzer</h1>
          </div>
          <p className="text-[#888888] text-sm">Get slide-by-slide AI feedback on your pitch deck.</p>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your startup name"
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40"
              />
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all",
                deckText ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#1a1a1a] hover:border-[#C9A84C]/30"
              )}
            >
              <Upload className="w-8 h-8 text-[#444] mx-auto mb-3" />
              {fileName ? (
                <p className="text-[#C9A84C] text-sm font-medium">{fileName}</p>
              ) : (
                <>
                  <p className="text-white text-sm font-medium mb-1">Upload your pitch deck</p>
                  <p className="text-[#888888] text-xs">Drop a .txt or text-extracted PDF here, or paste content below</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".txt,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">Or paste deck content</label>
              <textarea
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
                placeholder="Paste your pitch deck content here..."
                rows={6}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={analyze}
              disabled={!deckText || loading}
              className={cn(
                "w-full py-3 rounded-lg text-sm font-semibold transition-all",
                deckText && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
              )}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Analyzing every slide...</> : "Analyze Pitch Deck"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Score */}
              <div className="bg-[#111111] border border-[#C9A84C]/20 rounded-lg p-5 flex items-center gap-6">
                <ScoreRing score={result.overallScore} />
                <div>
                  <p className="text-xs text-[#888888] uppercase tracking-wider mb-1">Overall Pitch Score</p>
                  <p className="text-white text-sm leading-relaxed max-w-lg">{result.summary}</p>
                </div>
              </div>

              {/* Top 3 Fixes */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Top 3 Critical Fixes</p>
                {result.top3Fixes.map((fix, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-white">{fix}</p>
                  </div>
                ))}
              </div>

              {/* Investor Red Flags */}
              {result.investorRedFlags.length > 0 && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Investor Red Flags</p>
                  {result.investorRedFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#888888]">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" /> {flag}
                    </div>
                  ))}
                </div>
              )}

              {/* Slides */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Slide-by-Slide Feedback</p>
                {result.slides.map((slide) => (
                  <SlideCard key={slide.slideNumber} slide={slide} />
                ))}
              </div>

              <button
                onClick={() => { setResult(null); setDeckText(""); setFileName(""); }}
                className="w-full py-3 rounded-lg border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 transition-all text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Analyze Another Deck
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
