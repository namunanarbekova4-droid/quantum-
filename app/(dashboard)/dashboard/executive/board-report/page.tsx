"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Loader2, AlertTriangle, RotateCcw, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardReport {
  executiveSummary: string;
  financialHighlights: string[];
  strategicInitiatives: string[];
  risks: string[];
  riskMitigation: string[];
  nextQuarterOutlook: string;
  keyMetrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  boardRecommendations: string[];
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-[#888888]" />;
}

export default function BoardReportPage() {
  const [companyName, setCompanyName] = useState("");
  const [quarter, setQuarter] = useState("");
  const [kpis, setKpis] = useState("");
  const [decisions, setDecisions] = useState("");
  const [challenges, setChallenges] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; report: BoardReport } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!kpis && !decisions) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/board-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, quarter, kpis, decisions, challenges, goals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    if (!result) return;
    const r = result.report;
    const text = [
      `BOARD REPORT — ${companyName || "Company"} — ${quarter || "Quarter"}`,
      "",
      "EXECUTIVE SUMMARY",
      r.executiveSummary,
      "",
      "KEY METRICS",
      ...r.keyMetrics.map((m) => `${m.label}: ${m.value} (${m.trend})`),
      "",
      "FINANCIAL HIGHLIGHTS",
      ...r.financialHighlights.map((h) => `• ${h}`),
      "",
      "STRATEGIC INITIATIVES",
      ...r.strategicInitiatives.map((i) => `• ${i}`),
      "",
      "RISKS",
      ...r.risks.map((risk) => `• ${risk}`),
      "",
      "RISK MITIGATION",
      ...r.riskMitigation.map((m) => `• ${m}`),
      "",
      "NEXT QUARTER OUTLOOK",
      r.nextQuarterOutlook,
      "",
      "BOARD RECOMMENDATIONS",
      ...r.boardRecommendations.map((rec) => `• ${rec}`),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `board-report-${quarter || "q"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">Board Report Generator</h1>
          </div>
          <p className="text-[#888888] text-sm">Generate a professional board-ready report from your KPIs and updates.</p>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">Company Name</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Corp"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">Quarter / Period</label>
                <input value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="Q2 2025"
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
            </div>
            {[
              { label: "KPIs & Metrics *", value: kpis, setter: setKpis, placeholder: "Revenue: $2.4M (+18% QoQ), ARR: $9.6M, Churn: 2.1%, New customers: 45..." },
              { label: "Key Decisions Made", value: decisions, setter: setDecisions, placeholder: "Launched enterprise tier, hired VP Sales, expanded to EU market..." },
              { label: "Challenges", value: challenges, setter: setChallenges, placeholder: "Supply chain delays, increased CAC, talent competition..." },
              { label: "Goals for Next Quarter", value: goals, setter: setGoals, placeholder: "Hit $3M revenue, close Series B, expand to 3 new markets..." },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs text-[#888888]">{f.label}</label>
                <textarea value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder} rows={3}
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
              </div>
            ))}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={generate} disabled={(!kpis && !decisions) || loading}
              className={cn("w-full py-3 rounded-lg text-sm font-semibold transition-all",
                (kpis || decisions) && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Generating report...</> : "Generate Board Report"}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{companyName || "Company"} — {quarter || "Board Report"}</h2>
                  <p className="text-xs text-[#888888]">Generated board report</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold hover:bg-[#C9A84C]/90 transition-all">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={() => { setResult(null); }}
                    className="flex items-center gap-2 px-4 py-2 border border-[#1a1a1a] text-[#888888] rounded-lg text-sm hover:text-white hover:border-[#C9A84C]/30 transition-all">
                    <RotateCcw className="w-4 h-4" /> New Report
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-5">
                <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider mb-2">Executive Summary</p>
                <p className="text-white text-sm leading-relaxed">{result.report.executiveSummary}</p>
              </div>

              {/* Key Metrics */}
              {result.report.keyMetrics.length > 0 && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-3">Key Metrics</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {result.report.keyMetrics.map((m, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <TrendIcon trend={m.trend} />
                          <span className="text-xs text-[#888888]">{m.label}</span>
                        </div>
                        <p className="text-white font-semibold text-sm">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              {[
                { title: "Financial Highlights", items: result.report.financialHighlights, color: "text-green-400" },
                { title: "Strategic Initiatives", items: result.report.strategicInitiatives, color: "text-[#C9A84C]" },
                { title: "Risks", items: result.report.risks, color: "text-red-400" },
                { title: "Risk Mitigation", items: result.report.riskMitigation, color: "text-amber-400" },
                { title: "Board Recommendations", items: result.report.boardRecommendations, color: "text-purple-400" },
              ].map((section) => (
                <div key={section.title} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2">
                  <p className={cn("text-xs font-semibold uppercase tracking-wider", section.color)}>{section.title}</p>
                  {section.items.map((item, i) => (
                    <p key={i} className="text-sm text-white flex items-start gap-2">
                      <span className={cn("mt-1 flex-shrink-0", section.color)}>•</span> {item}
                    </p>
                  ))}
                </div>
              ))}

              {/* Outlook */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">Next Quarter Outlook</p>
                <p className="text-sm text-white leading-relaxed">{result.report.nextQuarterOutlook}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
