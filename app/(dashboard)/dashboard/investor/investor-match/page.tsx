"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FounderMatch {
  name: string;
  type: string;
  focus: string;
  checkSize: string;
  stage: string;
  geography: string;
  matchScore: number;
  whyMatched: string;
  investmentFit: string;
  notablePortfolio: string;
}

interface MatchResult {
  matches: FounderMatch[];
  summary: string;
  approach: string;
}

export default function InvestorMatchPage() {
  const [industry, setIndustry] = useState("");
  const [checkSize, setCheckSize] = useState("");
  const [stage, setStage] = useState("");
  const [geography, setGeography] = useState("");
  const [thesis, setThesis] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function findMatches() {
    if (!industry || !stage) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/investor-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, raiseAmount: checkSize, stage, geography, summary: thesis, role: "INVESTOR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Investor Match</h1>
          </div>
          <p className="text-[#888888] text-sm">Find founders that match your investment thesis.</p>
        </div>

        {!result && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Industry Focus *", value: industry, setter: setIndustry, placeholder: "SaaS, Climate Tech, Fintech..." },
                { label: "Stage Preference *", value: stage, setter: setStage, placeholder: "Pre-seed, Seed, Series A..." },
                { label: "Check Size", value: checkSize, setter: setCheckSize, placeholder: "$250K - $2M" },
                { label: "Geography", value: geography, setter: setGeography, placeholder: "US, Europe, Global..." },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-xs text-[#888888]">{f.label}</label>
                  <input
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">Investment Thesis</label>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="What do you look for in founders? What problems are you excited to back?"
                rows={3}
                className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none"
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={findMatches}
              disabled={!industry || !stage || loading}
              className={cn("w-full py-3 rounded-lg text-sm font-semibold transition-all",
                industry && stage && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Finding founders...</> : "Find Founder Matches"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4 space-y-2">
                <p className="text-sm text-white">{result.summary}</p>
                <p className="text-xs text-[#888888] mt-1">{result.approach}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{result.matches.length} Founder Matches</p>
                <button onClick={() => setResult(null)} className="text-xs text-[#888888] hover:text-white flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> New Search
                </button>
              </div>
              <div className="space-y-2">
                {result.matches.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{m.name}</p>
                        <p className="text-xs text-[#888888] mt-0.5">{m.focus} · {m.stage} · {m.geography}</p>
                        <p className="text-sm text-[#888888] mt-2">{m.whyMatched}</p>
                      </div>
                      <span className={cn("text-sm font-bold flex-shrink-0", m.matchScore >= 85 ? "text-green-400" : m.matchScore >= 70 ? "text-[#C9A84C]" : "text-[#888888]")}>
                        {m.matchScore}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
