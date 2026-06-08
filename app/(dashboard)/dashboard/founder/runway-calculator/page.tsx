"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, RotateCcw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface RunwayResult {
  baseRunwayMonths: number;
  fundraiseWindow: string;
  scenarios: {
    conservative: { label: string; months: number; endDate: string; burnRate: number; notes: string };
    base: { label: string; months: number; endDate: string; burnRate: number; notes: string };
    optimistic: { label: string; months: number; endDate: string; burnRate: number; notes: string };
  };
  aiRecommendations: {
    costReduction: string[];
    hiringTiming: string;
    cashPreservation: string[];
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  summary: string;
}

const urgencyColors = {
  LOW: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
  HIGH: { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  CRITICAL: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

function buildChartData(result: RunwayResult, cashInBank: number) {
  const months = Math.max(result.scenarios.conservative.months, result.scenarios.optimistic.months) + 3;
  return Array.from({ length: months + 1 }, (_, i) => ({
    month: `M${i}`,
    conservative: Math.max(0, cashInBank - result.scenarios.conservative.burnRate * i),
    base: Math.max(0, cashInBank - result.scenarios.base.burnRate * i),
    optimistic: Math.max(0, cashInBank - result.scenarios.optimistic.burnRate * i),
  }));
}

export default function RunwayCalculatorPage() {
  const { t } = useLanguage();
  const ft = t.features.runwayCalculator as Record<string, string>;

  const urgencyConfig = {
    LOW: { ...urgencyColors.LOW, label: ft.low },
    MEDIUM: { ...urgencyColors.MEDIUM, label: ft.medium },
    HIGH: { ...urgencyColors.HIGH, label: ft.high },
    CRITICAL: { ...urgencyColors.CRITICAL, label: ft.critical },
  };

  const [cashInBank, setCashInBank] = useState("");
  const [burnRate, setBurnRate] = useState("");
  const [revenue, setRevenue] = useState("");
  const [growth, setGrowth] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunwayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function calculate() {
    if (!cashInBank || !burnRate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/runway-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashInBank: Number(cashInBank.replace(/,/g, "")),
          monthlyBurnRate: Number(burnRate.replace(/,/g, "")),
          monthlyRevenue: Number(revenue.replace(/,/g, "") || 0),
          revenueGrowthRate: Number(growth || 0),
          teamSize: Number(teamSize || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calculation failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate");
    } finally {
      setLoading(false);
    }
  }

  const chartData = result ? buildChartData(result, Number(cashInBank.replace(/,/g, ""))) : [];

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">{ft.title}</h1>
          </div>
          <p className="text-[#888888] text-sm">{ft.subtitle}</p>
        </div>

        {/* Input Form */}
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Financial Inputs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: ft.cashInBank, value: cashInBank, setter: setCashInBank, required: true, placeholder: "500,000" },
              { label: ft.monthlyBurn, value: burnRate, setter: setBurnRate, required: true, placeholder: "50,000" },
              { label: ft.monthlyRevenue, value: revenue, setter: setRevenue, required: false, placeholder: "20,000" },
              { label: "Revenue Growth (% / month)", value: growth, setter: setGrowth, required: false, placeholder: "5" },
              { label: ft.teamSize, value: teamSize, setter: setTeamSize, required: false, placeholder: "12" },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-xs text-[#888888]">
                  {field.label} {field.required && <span className="text-[#C9A84C]">*</span>}
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={calculate}
              disabled={!cashInBank || !burnRate || loading}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all",
                cashInBank && burnRate && !loading
                  ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90"
                  : "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              {loading ? ft.analyzing : ft.calculate}
            </button>
            {result && (
              <button
                onClick={() => { setResult(null); setError(null); }}
                className="px-4 py-2.5 rounded-lg text-sm text-[#888888] border border-[#1a1a1a] hover:text-white hover:border-[#C9A84C]/30 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Urgency Banner */}
              <div className={cn("border rounded-lg p-4 flex items-center justify-between", urgencyConfig[result.aiRecommendations.urgency].bg)}>
                <div>
                  <p className={cn("font-bold text-lg", urgencyConfig[result.aiRecommendations.urgency].color)}>
                    {result.baseRunwayMonths} {ft.months} {ft.baseRunway}
                  </p>
                  <p className="text-[#888888] text-sm mt-0.5">{result.summary}</p>
                </div>
                <span className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border", urgencyConfig[result.aiRecommendations.urgency].bg, urgencyConfig[result.aiRecommendations.urgency].color)}>
                  {urgencyConfig[result.aiRecommendations.urgency].label}
                </span>
              </div>

              {/* Scenarios Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["conservative", "base", "optimistic"] as const).map((key) => {
                  const s = result.scenarios[key];
                  const colors = {
                    conservative: "border-red-500/20 text-red-400",
                    base: "border-[#C9A84C]/20 text-[#C9A84C]",
                    optimistic: "border-green-500/20 text-green-400",
                  };
                  return (
                    <div key={key} className={cn("bg-[#111111] border rounded-lg p-4", colors[key].split(" ")[0])}>
                      <p className={cn("text-xs font-semibold uppercase tracking-wider mb-2", colors[key].split(" ")[1])}>
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold text-white">{s.months}mo</p>
                      <p className="text-xs text-[#888888] mt-1">Until {s.endDate}</p>
                      <p className="text-xs text-[#888888] mt-2 leading-relaxed">{s.notes}</p>
                    </div>
                  );
                })}
              </div>

              {/* Chart */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Cash Runway Projection</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="conservative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="optimistic" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                      labelStyle={{ color: "#888" }}
                      formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
                    />
                    <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                    <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#ef4444" fill="url(#conservative)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="base" name="Base Case" stroke="#C9A84C" fill="url(#base)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#22c55e" fill="url(#optimistic)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Fundraise Window */}
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">{ft.fundraiseWindow}</span>
                </div>
                <p className="text-white text-sm">{result.fundraiseWindow}</p>
              </div>

              {/* AI Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{ft.costReduction}</span>
                  </div>
                  <ul className="space-y-2">
                    {result.aiRecommendations.costReduction.map((item, i) => (
                      <li key={i} className="text-sm text-white flex items-start gap-2">
                        <span className="text-[#C9A84C] text-xs mt-1 flex-shrink-0">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{ft.cashPreservation}</span>
                  </div>
                  <ul className="space-y-2">
                    {result.aiRecommendations.cashPreservation.map((item, i) => (
                      <li key={i} className="text-sm text-white flex items-start gap-2">
                        <span className="text-[#C9A84C] text-xs mt-1 flex-shrink-0">→</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hiring Timing */}
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-2">{ft.hiringTiming}</p>
                <p className="text-sm text-white">{result.aiRecommendations.hiringTiming}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
