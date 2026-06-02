"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Upload, Loader2, AlertTriangle, RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DealAnalysis {
  teamScore: number;
  marketSize: string;
  businessModelStrength: number;
  riskFactors: string[];
  competitiveLandscape: string;
  financialProjectionsReview: string;
  recommendation: "INVEST" | "PASS" | "DUE_DILIGENCE";
  confidenceLevel: number;
  summary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
}

const recConfig = {
  INVEST: { label: "INVEST", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", Icon: CheckCircle },
  PASS: { label: "PASS", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", Icon: XCircle },
  DUE_DILIGENCE: { label: "DUE DILIGENCE", color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10 border-[#C9A84C]/20", Icon: Clock },
};

function ScoreBar({ label, value, color = "#C9A84C" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#888888]">{label}</span>
        <span className="text-white font-medium">{value}/100</span>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function DealAnalyzerPage() {
  const [companyName, setCompanyName] = useState("");
  const [deckText, setDeckText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DealAnalysis | null>(null);
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
    setProgress(0);

    const interval = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 800);
    try {
      const res = await fetch("/api/tools/deal-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckText, companyName }),
      });
      clearInterval(interval);
      setProgress(100);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data.analysis);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
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
            <TrendingUp className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Deal Analyzer</h1>
          </div>
          <p className="text-[#888888] text-sm">Upload a pitch deck for deep AI investment analysis.</p>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">Company Name</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company being evaluated"
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
                <p className="text-[#C9A84C] text-sm font-medium">{fileName} ✓</p>
              ) : (
                <>
                  <p className="text-white text-sm font-medium mb-1">Upload pitch deck</p>
                  <p className="text-[#888888] text-xs">Drop .txt file or paste content below</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">Or paste deck content</label>
              <textarea
                value={deckText}
                onChange={(e) => setDeckText(e.target.value)}
                placeholder="Paste pitch deck content..."
                rows={5}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none"
              />
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-[#C9A84C] rounded-full"
                  />
                </div>
                <p className="text-xs text-[#888888] text-center">Analyzing deal... {progress}%</p>
              </div>
            )}

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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Analyzing deal...</> : "Analyze Deal"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Recommendation */}
              {(() => {
                const cfg = recConfig[result.recommendation];
                const Icon = cfg.Icon;
                return (
                  <div className={cn("border rounded-lg p-5 flex items-center gap-4", cfg.bg)}>
                    <Icon className={cn("w-8 h-8 flex-shrink-0", cfg.color)} />
                    <div>
                      <p className={cn("text-xl font-bold", cfg.color)}>{cfg.label}</p>
                      <p className="text-[#888888] text-sm mt-0.5">{result.summary}</p>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <p className="text-xs text-[#888888]">Confidence</p>
                      <p className={cn("text-2xl font-bold", cfg.color)}>{result.confidenceLevel}%</p>
                    </div>
                  </div>
                );
              })()}

              {/* Scores */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Key Scores</p>
                <ScoreBar label="Team Evaluation" value={result.teamScore} />
                <ScoreBar label="Business Model Strength" value={result.businessModelStrength} />
              </div>

              {/* Market & Competitive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Market Size</p>
                  <p className="text-sm text-white">{result.marketSize}</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Financials</p>
                  <p className="text-sm text-white">{result.financialProjectionsReview}</p>
                </div>
              </div>

              {/* Competitive */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Competitive Landscape</p>
                <p className="text-sm text-white">{result.competitiveLandscape}</p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Key Strengths</p>
                  {result.keyStrengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" /> {s}
                    </div>
                  ))}
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Key Weaknesses</p>
                  {result.keyWeaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-white">
                      <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {w}
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Risk Factors</p>
                {result.riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[#888888]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" /> {r}
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setResult(null); setDeckText(""); setFileName(""); setProgress(0); }}
                className="w-full py-3 rounded-lg border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 transition-all text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Analyze Another Deal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
