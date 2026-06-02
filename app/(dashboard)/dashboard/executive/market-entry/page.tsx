"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Loader2, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryStrategy {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

interface MarketEntryAnalysis {
  marketSize: string;
  growthRate: string;
  topCompetitors: string[];
  regulatoryOverview: string;
  culturalConsiderations: string;
  entryStrategies: EntryStrategy[];
  riskScore: number;
  recommendedPath: string;
  budgetEstimate: string;
  timeline: string;
  summary: string;
}

function RiskMeter({ score }: { score: number }) {
  const color = score <= 30 ? "#22c55e" : score <= 60 ? "#C9A84C" : "#ef4444";
  const label = score <= 30 ? "Low Risk" : score <= 60 ? "Medium Risk" : "High Risk";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#888888]">Market Risk Score</span>
        <span style={{ color }} className="font-bold">{label}</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs text-[#444]">
        <span>0</span><span>50</span><span>100</span>
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: EntryStrategy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-sm font-semibold text-white">{strategy.name}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#888888]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#1a1a1a] pt-3">
          <p className="text-sm text-[#888888]">{strategy.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1.5">Pros</p>
              {strategy.pros.map((p, i) => <p key={i} className="text-xs text-[#888888] mb-1 flex gap-1.5"><span className="text-green-400">+</span>{p}</p>)}
            </div>
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1.5">Cons</p>
              {strategy.cons.map((c, i) => <p key={i} className="text-xs text-[#888888] mb-1 flex gap-1.5"><span className="text-red-400">−</span>{c}</p>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketEntryPage() {
  const [targetCountry, setTargetCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [marketPosition, setMarketPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketEntryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!targetCountry || !industry) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/market-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCountry, industry, companySize, marketPosition }),
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
            <Globe className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Market Entry Analyzer</h1>
          </div>
          <p className="text-[#888888] text-sm">AI-powered analysis for entering new markets.</p>
        </div>

        {!result && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Target Country *", value: targetCountry, setter: setTargetCountry, placeholder: "Germany, Japan, Brazil..." },
                { label: "Industry *", value: industry, setter: setIndustry, placeholder: "SaaS, Retail, HealthTech..." },
                { label: "Company Size", value: companySize, setter: setCompanySize, placeholder: "50-person startup, $10M ARR..." },
                { label: "Current Market Position", value: marketPosition, setter: setMarketPosition, placeholder: "Market leader in US, Series B..." },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="text-xs text-[#888888]">{f.label}</label>
                  <input value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder}
                    className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={analyze} disabled={!targetCountry || !industry || loading}
              className={cn("w-full py-3 rounded-lg text-sm font-semibold transition-all",
                targetCountry && industry && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Analyzing market...</> : "Analyze Market Entry"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Summary */}
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4">
                <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider mb-1.5">{targetCountry} — {industry}</p>
                <p className="text-white text-sm leading-relaxed">{result.summary}</p>
              </div>

              {/* Risk Meter */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                <RiskMeter score={result.riskScore} />
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Market Size", value: result.marketSize },
                  { label: "Growth Rate", value: result.growthRate },
                  { label: "Budget Estimate", value: result.budgetEstimate },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3">
                    <p className="text-xs text-[#888888] mb-1">{stat.label}</p>
                    <p className="text-white font-semibold text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Timeline & Recommended Path */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Timeline</p>
                  <p className="text-sm text-white">{result.timeline}</p>
                </div>
                <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider mb-2">Recommended Path</p>
                  <p className="text-sm text-white">{result.recommendedPath}</p>
                </div>
              </div>

              {/* Competitors */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Top Competitors</p>
                <div className="flex flex-wrap gap-2">
                  {result.topCompetitors.map((c, i) => (
                    <span key={i} className="text-xs text-white bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>

              {/* Regulatory & Cultural */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Regulatory Overview</p>
                  <p className="text-sm text-[#888888]">{result.regulatoryOverview}</p>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Cultural Considerations</p>
                  <p className="text-sm text-[#888888]">{result.culturalConsiderations}</p>
                </div>
              </div>

              {/* Entry Strategies */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Entry Strategies</p>
                {result.entryStrategies.map((s, i) => <StrategyCard key={i} strategy={s} />)}
              </div>

              <button onClick={() => setResult(null)}
                className="w-full py-3 rounded-lg border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 transition-all text-sm flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Analyze Another Market
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
