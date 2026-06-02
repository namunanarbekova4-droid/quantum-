"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Loader2, AlertTriangle, Trash2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  stage: string;
  risk_status: "GREEN" | "YELLOW" | "RED";
  risk_score?: number;
  last_analysis?: {
    riskStatus: string;
    riskScore: number;
    signals: string[];
    recommendations: string[];
    summary: string;
  };
  analyzed_at?: string;
}

const riskConfig = {
  GREEN: { label: "Healthy", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", dot: "bg-green-400" },
  YELLOW: { label: "Watch", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", dot: "bg-amber-400" },
  RED: { label: "At Risk", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", dot: "bg-red-400" },
};

function AddCompanyModal({ onAdd, onClose }: { onAdd: (c: Partial<Company>) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tools/portfolio-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_company", name, website, industry, stage }),
      });
      const data = await res.json();
      if (res.ok) { onAdd(data); onClose(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Add Portfolio Company</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-[#888888]" /></button>
        </div>
        {[
          { label: "Company Name *", value: name, setter: setName, placeholder: "Acme Corp" },
          { label: "Website", value: website, setter: setWebsite, placeholder: "https://..." },
          { label: "Industry", value: industry, setter: setIndustry, placeholder: "SaaS, Fintech..." },
          { label: "Stage", value: stage, setter: setStage, placeholder: "Seed, Series A..." },
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
        <button
          onClick={submit}
          disabled={!name || loading}
          className={cn("w-full py-2.5 rounded-lg text-sm font-semibold transition-all", name && !loading ? "bg-[#C9A84C] text-[#080808]" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null} Add Company
        </button>
      </motion.div>
    </div>
  );
}

export default function PortfolioHealthPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tools/portfolio-health")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCompanies(data); })
      .finally(() => setLoading(false));
  }, []);

  async function analyzeCompany(company: Company) {
    setAnalyzing(company.id);
    try {
      const res = await fetch("/api/tools/portfolio-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", companyId: company.id, name: company.name, industry: company.industry, stage: company.stage, website: company.website }),
      });
      const data = await res.json();
      if (res.ok) {
        setCompanies((prev) => prev.map((c) =>
          c.id === company.id ? { ...c, risk_status: data.riskStatus, risk_score: data.riskScore, last_analysis: data } : c
        ));
      }
    } finally {
      setAnalyzing(null);
    }
  }

  async function deleteCompany(id: string) {
    await fetch(`/api/tools/portfolio-health?id=${id}`, { method: "DELETE" });
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }

  const riskSummary = {
    GREEN: companies.filter((c) => c.risk_status === "GREEN").length,
    YELLOW: companies.filter((c) => c.risk_status === "YELLOW").length,
    RED: companies.filter((c) => c.risk_status === "RED").length,
  };

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-5xl mx-auto">
      {showAdd && <AddCompanyModal onAdd={(c) => setCompanies((p) => [c as Company, ...p])} onClose={() => setShowAdd(false)} />}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">Portfolio Health</h1>
            </div>
            <p className="text-[#888888] text-sm">Monitor your portfolio companies with AI risk assessment.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold hover:bg-[#C9A84C]/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>

        {/* Risk Summary */}
        {companies.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {(["GREEN", "YELLOW", "RED"] as const).map((status) => (
              <div key={status} className={cn("border rounded-lg p-3 text-center", riskConfig[status].bg)}>
                <p className={cn("text-2xl font-bold", riskConfig[status].color)}>{riskSummary[status]}</p>
                <p className={cn("text-xs font-semibold mt-0.5", riskConfig[status].color)}>{riskConfig[status].label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
          </div>
        ) : companies.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#1a1a1a] rounded-lg p-16 text-center">
            <Building2 className="w-10 h-10 text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">No portfolio companies</p>
            <p className="text-[#888888] text-sm mb-4">Add your first company to start monitoring.</p>
            <button onClick={() => setShowAdd(true)} className="px-5 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold">
              Add Company
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => (
              <div key={company.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", riskConfig[company.risk_status].dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{company.name}</p>
                    <p className="text-xs text-[#888888]">{company.industry || "Unknown"} · {company.stage || "Unknown"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.risk_score !== undefined && (
                      <span className={cn("text-xs font-medium px-2 py-1 rounded border", riskConfig[company.risk_status].bg, riskConfig[company.risk_status].color)}>
                        {riskConfig[company.risk_status].label}
                      </span>
                    )}
                    <button
                      onClick={() => analyzeCompany(company)}
                      disabled={analyzing === company.id}
                      className="p-1.5 text-[#888888] hover:text-[#C9A84C] transition-colors"
                      title="Analyze"
                    >
                      {analyzing === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                    {company.last_analysis && (
                      <button
                        onClick={() => setExpanded(expanded === company.id ? null : company.id)}
                        className="text-xs text-[#888888] hover:text-white transition-colors px-2 py-1 border border-[#1a1a1a] rounded"
                      >
                        {expanded === company.id ? "Hide" : "View"}
                      </button>
                    )}
                    <button onClick={() => deleteCompany(company.id)} className="p-1.5 text-[#888888] hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === company.id && company.last_analysis && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#1a1a1a] px-4 pb-4 pt-3 space-y-3 overflow-hidden"
                    >
                      <p className="text-sm text-white">{company.last_analysis.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Signals</p>
                          {company.last_analysis.signals.map((s, i) => (
                            <p key={i} className="text-xs text-[#888888] flex items-start gap-1.5"><span className="text-[#C9A84C] mt-0.5">·</span>{s}</p>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">Recommendations</p>
                          {company.last_analysis.recommendations.map((r, i) => (
                            <p key={i} className="text-xs text-[#888888] flex items-start gap-1.5"><span className="text-[#C9A84C] mt-0.5">→</span>{r}</p>
                          ))}
                        </div>
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
