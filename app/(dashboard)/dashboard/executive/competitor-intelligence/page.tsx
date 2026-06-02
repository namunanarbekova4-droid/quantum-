"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Plus, Loader2, Trash2, RefreshCw, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Competitor {
  id: string;
  name: string;
  website: string;
  industry: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  threat_score?: number;
  last_analysis?: {
    riskLevel: string;
    threatScore: number;
    recentMoves: string[];
    hiringSignals: string[];
    fundingActivity: string;
    productLaunches: string[];
    strategicImplications: string[];
    recommendedResponse: string;
    summary: string;
  };
}

const riskConfig = {
  LOW: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", dot: "bg-green-400" },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
  HIGH: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", dot: "bg-orange-400" },
  CRITICAL: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
};

function AddModal({ onAdd, onClose }: { onAdd: (c: Competitor) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/competitor-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name, website, industry }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onAdd(data);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Add Competitor</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#888888]" /></button>
        </div>
        {[
          { label: "Competitor Name *", value: name, setter: setName, placeholder: "Competitor Corp" },
          { label: "Website", value: website, setter: setWebsite, placeholder: "https://..." },
          { label: "Industry", value: industry, setter: setIndustry, placeholder: "SaaS, Fintech..." },
        ].map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-xs text-[#888888]">{f.label}</label>
            <input value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder}
              className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
          </div>
        ))}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={submit} disabled={!name || loading}
          className={cn("w-full py-2.5 rounded-lg text-sm font-semibold transition-all", name && !loading ? "bg-[#C9A84C] text-[#080808]" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null} Add Competitor
        </button>
      </motion.div>
    </div>
  );
}

export default function CompetitorIntelligencePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tools/competitor-intelligence")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCompetitors(d); })
      .finally(() => setLoading(false));
  }, []);

  async function analyze(c: Competitor) {
    setAnalyzing(c.id);
    try {
      const res = await fetch("/api/tools/competitor-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", competitorId: c.id, name: c.name, industry: c.industry, website: c.website }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompetitors((prev) => prev.map((x) =>
          x.id === c.id ? { ...x, risk_level: data.riskLevel, threat_score: data.threatScore, last_analysis: data } : x
        ));
        setExpanded(c.id);
      }
    } finally {
      setAnalyzing(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/tools/competitor-intelligence?id=${id}`, { method: "DELETE" });
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-5xl mx-auto">
      {showAdd && <AddModal onAdd={(c) => setCompetitors((p) => [c, ...p])} onClose={() => setShowAdd(false)} />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">Competitor Intelligence</h1>
            </div>
            <p className="text-[#888888] text-sm">Track up to 10 competitors with AI risk monitoring.</p>
          </div>
          <button onClick={() => setShowAdd(true)} disabled={competitors.length >= 10}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              competitors.length < 10 ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
            <Plus className="w-4 h-4" /> Add Competitor
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" /></div>
        ) : competitors.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#1a1a1a] rounded-lg p-16 text-center">
            <Eye className="w-10 h-10 text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">No competitors tracked</p>
            <p className="text-[#888888] text-sm mb-4">Add up to 10 competitors to monitor.</p>
            <button onClick={() => setShowAdd(true)} className="px-5 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold">Add Competitor</button>
          </div>
        ) : (
          <div className="space-y-3">
            {competitors.map((c) => (
              <div key={c.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", riskConfig[c.risk_level].dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-[#888888]">{c.industry || "Unknown industry"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.threat_score !== undefined && (
                      <span className={cn("text-xs font-medium px-2 py-1 rounded border", riskConfig[c.risk_level].bg, riskConfig[c.risk_level].color)}>
                        {c.risk_level}
                      </span>
                    )}
                    <button onClick={() => analyze(c)} disabled={analyzing === c.id} className="p-1.5 text-[#888888] hover:text-[#C9A84C] transition-colors" title="Analyze">
                      {analyzing === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    {c.last_analysis && (
                      <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                        className="text-xs text-[#888888] hover:text-white px-2 py-1 border border-[#1a1a1a] rounded transition-colors">
                        {expanded === c.id ? "Hide" : "View"}
                      </button>
                    )}
                    <button onClick={() => remove(c.id)} className="p-1.5 text-[#888888] hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === c.id && c.last_analysis && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#1a1a1a] px-4 pb-4 pt-3 space-y-3 overflow-hidden"
                    >
                      <p className="text-sm text-white">{c.last_analysis.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-semibold text-[#888888] uppercase tracking-wider mb-1.5">Recent Moves</p>
                          {c.last_analysis.recentMoves.map((s, i) => <p key={i} className="text-[#888888] flex gap-1.5 mb-1"><span className="text-[#C9A84C]">·</span>{s}</p>)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#888888] uppercase tracking-wider mb-1.5">Strategic Implications</p>
                          {c.last_analysis.strategicImplications.map((s, i) => <p key={i} className="text-[#888888] flex gap-1.5 mb-1"><span className="text-[#C9A84C]">→</span>{s}</p>)}
                        </div>
                      </div>
                      <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-[#C9A84C] mb-1">Recommended Response</p>
                        <p className="text-sm text-white">{c.last_analysis.recommendedResponse}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
