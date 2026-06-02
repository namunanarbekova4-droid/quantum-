"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Loader2, AlertTriangle, RotateCcw, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestorMatch {
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
  matches: InvestorMatch[];
  summary: string;
  approach: string;
}

function MatchCard({ match, index }: { match: InvestorMatch; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = match.matchScore >= 85 ? "text-green-400" : match.matchScore >= 70 ? "text-[#C9A84C]" : "text-[#888888]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1a1a1a]/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#C9A84C]">{index + 1}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{match.name}</p>
            <p className="text-xs text-[#888888] truncate">{match.type} · {match.stage}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className="text-xs text-[#888888]">{match.checkSize}</span>
          <span className={cn("text-sm font-bold", scoreColor)}>{match.matchScore}%</span>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#1a1a1a] pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-[#888888]">Focus: </span><span className="text-white">{match.focus}</span></div>
            <div><span className="text-[#888888]">Geography: </span><span className="text-white">{match.geography}</span></div>
            <div><span className="text-[#888888]">Check Size: </span><span className="text-white">{match.checkSize}</span></div>
            <div><span className="text-[#888888]">Portfolio: </span><span className="text-white">{match.notablePortfolio}</span></div>
          </div>
          <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-[#C9A84C]">Why Matched</p>
            <p className="text-sm text-white">{match.whyMatched}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#888888]">Investment Fit</p>
            <p className="text-sm text-[#888888]">{match.investmentFit}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FounderInvestorMatchPage() {
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [raiseAmount, setRaiseAmount] = useState("");
  const [geography, setGeography] = useState("");
  const [summary, setSummary] = useState("");
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
        body: JSON.stringify({ industry, stage, raiseAmount, geography, summary, role: "FOUNDER" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find matches");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Investor Match</h1>
          </div>
          <p className="text-[#888888] text-sm">AI identifies the best-fit investors for your startup.</p>
        </div>

        {!result && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Industry *", value: industry, setter: setIndustry, placeholder: "SaaS, Fintech, HealthTech..." },
                { label: "Stage *", value: stage, setter: setStage, placeholder: "Pre-seed, Seed, Series A..." },
                { label: "Raise Amount", value: raiseAmount, setter: setRaiseAmount, placeholder: "$500K, $2M, $10M..." },
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
              <label className="text-xs text-[#888888]">Startup Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief description of your startup, traction, and what makes it unique..."
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
              className={cn(
                "w-full py-3 rounded-lg text-sm font-semibold transition-all",
                industry && stage && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
              )}
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Finding investors...</> : "Find Investor Matches"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4 space-y-2">
                <p className="text-sm text-white">{result.summary}</p>
                <div className="border-t border-[#C9A84C]/10 pt-2">
                  <p className="text-xs font-semibold text-[#C9A84C] mb-1">Recommended Approach</p>
                  <p className="text-xs text-[#888888]">{result.approach}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{result.matches.length} Investor Matches</p>
                <button
                  onClick={() => setResult(null)}
                  className="text-xs text-[#888888] hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> New Search
                </button>
              </div>

              <div className="space-y-2">
                {result.matches.map((m, i) => (
                  <MatchCard key={i} match={m} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
