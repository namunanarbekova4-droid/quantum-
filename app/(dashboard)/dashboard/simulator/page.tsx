"use client";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Loader2, AlertTriangle, RotateCcw, Download, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface Scenario {
  label: string;
  probability: number;
  businessImpact: string;
  risks: string[];
  preparationSteps: string[];
  financialEffect: string;
  recommendation: string;
}

interface SimulationResult {
  bestCase: Scenario;
  baseCase: Scenario;
  worstCase: Scenario;
  overallAssessment: string;
  keyDrivers: string[];
}

const VARIABLES = [
  "Currency change",
  "Revenue change",
  "Team size change",
  "Market growth",
  "Competitor enters market",
  "Recession scenario",
  "Interest rate change",
  "Regulatory change",
  "Customer acquisition cost change",
];

const HORIZONS = ["3 months", "6 months", "1 year", "2 years"];

function ScenarioCard({ scenario, variant }: { scenario: Scenario; variant: "best" | "base" | "worst" }) {
  const [expanded, setExpanded] = useState(variant === "base");
  const config = {
    best: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", bar: "#22c55e" },
    base: { color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10 border-[#C9A84C]/20", bar: "#C9A84C" },
    worst: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", bar: "#ef4444" },
  }[variant];

  return (
    <div className={cn("border rounded-lg overflow-hidden", config.bg)}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cn("text-sm font-bold", config.color)}>{scenario.label}</p>
            <p className="text-xs text-[#888888] mt-0.5">{scenario.businessImpact.slice(0, 80)}...</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={cn("text-xl font-bold", config.color)}>{scenario.probability}%</p>
            <p className="text-xs text-[#888888]">probability</p>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-white">{scenario.businessImpact}</p>
          <div className="bg-[#080808]/60 rounded-lg p-3">
            <p className="text-xs font-semibold text-[#888888] mb-2">Financial Effect</p>
            <p className="text-sm text-white">{scenario.financialEffect}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-semibold text-[#888888] uppercase tracking-wider mb-1.5">Risks</p>
              {scenario.risks.map((r, i) => <p key={i} className="text-[#888888] mb-1 flex gap-1.5"><span className="text-red-400">!</span>{r}</p>)}
            </div>
            <div>
              <p className="font-semibold text-[#888888] uppercase tracking-wider mb-1.5">Prep Steps</p>
              {scenario.preparationSteps.map((s, i) => <p key={i} className="text-[#888888] mb-1 flex gap-1.5"><span className={config.color}>→</span>{s}</p>)}
            </div>
          </div>
          <div className={cn("rounded-lg p-3", config.bg)}>
            <p className="text-xs font-semibold mb-1" style={{ color: "inherit" }}>Recommendation</p>
            <p className={cn("text-sm", config.color)}>{scenario.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function buildChart(result: SimulationResult) {
  const points = 8;
  return Array.from({ length: points }, (_, i) => ({
    period: `T+${i}`,
    best: 100 + (result.bestCase.probability / 2) * (i / (points - 1)),
    base: 100 + ((result.baseCase.probability - 50) / 3) * (i / (points - 1)),
    worst: 100 - (result.worstCase.probability / 2) * (i / (points - 1)),
  }));
}

export default function SimulatorPage() {
  const { t } = useLanguage();
  const [description, setDescription] = useState("");
  const [variable, setVariable] = useState(VARIABLES[0]);
  const [variableChange, setVariableChange] = useState(0);
  const [timeHorizon, setTimeHorizon] = useState(HORIZONS[2]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate() {
    if (!description) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, variable, variableChange, timeHorizon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!result) return;
    const text = [
      `SCENARIO SIMULATION REPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `Scenario: ${description}`,
      `Variable: ${variable} (${variableChange > 0 ? "+" : ""}${variableChange}%)`,
      `Time Horizon: ${timeHorizon}`,
      ``,
      `OVERALL ASSESSMENT`,
      result.overallAssessment,
      ``,
      `KEY DRIVERS`,
      ...result.keyDrivers.map((d) => `• ${d}`),
      ``,
      `BEST CASE (${result.bestCase.probability}% probability)`,
      result.bestCase.businessImpact,
      `Financial: ${result.bestCase.financialEffect}`,
      ``,
      `BASE CASE (${result.baseCase.probability}% probability)`,
      result.baseCase.businessImpact,
      `Financial: ${result.baseCase.financialEffect}`,
      ``,
      `WORST CASE (${result.worstCase.probability}% probability)`,
      result.worstCase.businessImpact,
      `Financial: ${result.worstCase.financialEffect}`,
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenario-simulation-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartData = result ? buildChart(result) : [];

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Beaker className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">{t.simulator.title}</h1>
          </div>
          <p className="text-[#888888] text-sm">{t.simulator.subtitle}</p>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#888888]">{t.simulator.decisionLabel} *</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the business situation you want to model. E.g. 'We are considering entering the European market with our SaaS product next quarter...'"
                rows={4}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">{t.simulator.variablesLabel}</label>
                <select value={variable} onChange={(e) => setVariable(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                  {VARIABLES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#888888]">{t.simulator.horizonLabel}</label>
                <select value={timeHorizon} onChange={(e) => setTimeHorizon(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C9A84C]/40 appearance-none">
                  {HORIZONS.map((h) => <option key={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>{variable}</span>
                <span className={cn("font-semibold", variableChange > 0 ? "text-green-400" : variableChange < 0 ? "text-red-400" : "text-[#888888]")}>
                  {variableChange > 0 ? "+" : ""}{variableChange}%
                </span>
              </div>
              <input type="range" min={-100} max={100} value={variableChange} onChange={(e) => setVariableChange(Number(e.target.value))}
                className="w-full accent-[#C9A84C] cursor-pointer" />
              <div className="flex justify-between text-xs text-[#444]">
                <span>-100%</span><span>0</span><span>+100%</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <button onClick={simulate} disabled={!description || loading}
              className={cn("w-full py-3 rounded-lg text-sm font-semibold transition-all",
                description && !loading ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline mr-2" />{t.simulator.running}</> : t.simulator.run}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#888888]">{description.slice(0, 80)}{description.length > 80 ? "..." : ""}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={exportReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-[#080808] rounded-lg text-xs font-semibold hover:bg-[#C9A84C]/90 transition-all">
                    <Download className="w-3.5 h-3.5" /> {t.simulator.exportPdf}
                  </button>
                  <button onClick={() => { setResult(null); setError(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1a1a1a] text-[#888888] rounded-lg text-xs hover:text-white hover:border-[#C9A84C]/30 transition-all">
                    <RotateCcw className="w-3.5 h-3.5" /> New
                  </button>
                </div>
              </div>

              {/* Overall */}
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
                  <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">{t.simulator.scenarioLabel}</p>
                </div>
                <p className="text-sm text-white">{result.overallAssessment}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.keyDrivers.map((d, i) => (
                    <span key={i} className="text-xs text-[#888888] bg-[#111111] border border-[#1a1a1a] px-2.5 py-1 rounded-full">{d}</span>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-4">Scenario Projection</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      {[{ id: "best", color: "#22c55e" }, { id: "base", color: "#C9A84C" }, { id: "worst", color: "#ef4444" }].map((g) => (
                        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={g.color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="period" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }} labelStyle={{ color: "#888" }} />
                    <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                    <Area type="monotone" dataKey="best" name="Best Case" stroke="#22c55e" fill="url(#best)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="base" name="Base Case" stroke="#C9A84C" fill="url(#base)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="worst" name="Worst Case" stroke="#ef4444" fill="url(#worst)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Scenario Cards */}
              <div className="space-y-3">
                <ScenarioCard scenario={result.bestCase} variant="best" />
                <ScenarioCard scenario={result.baseCase} variant="base" />
                <ScenarioCard scenario={result.worstCase} variant="worst" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
