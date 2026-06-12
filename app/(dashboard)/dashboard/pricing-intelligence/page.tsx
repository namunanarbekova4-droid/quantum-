"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Loader2, Sparkles, Check, Copy, AlertTriangle,
  TrendingUp, BarChart3, Info,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface PricingResult {
  recommendedPrice: string;
  strategyName: string;
  strategyRationale: string;
  tiers: {
    name: string;
    price: string;
    description: string;
    features: string[];
    cta: string;
  }[];
  freeVsPaid: { free: string[]; paid: string[] };
  revenueProjections: { users: string; monthly: string; annual: string }[];
  pricingMistakes: string[];
  freeTierRecommendation: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded hover:bg-white/10 text-[#8B7CF8] hover:text-white transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export default function PricingIntelligencePage() {
  const { t, locale } = useLanguage();
  const fpi = t.features.pricingIntelligence;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    product: "",
    targetCustomer: "",
    competitors: "",
    costs: "",
    coreValue: "",
    stage: "early revenue",
  });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pricing-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data as PricingResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tierColors = ["#1A1040", "#7C3AED", "#C9A84C"];
  const tierBorders = ["border-[#1A1040]", "border-[#7C3AED]", "border-[#C9A84C]"];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{fpi.title}</h1>
            <p className="text-[#8B7CF8] text-sm mt-0.5">{fpi.subtitle}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] mb-6 space-y-4">
          {[
            { field: "product", label: fpi.product, placeholder: fpi.placeholderProduct || "What do you build? Who does it help?", rows: 2 },
            { field: "targetCustomer", label: fpi.customer, placeholder: fpi.placeholderCustomer || "e.g. SaaS teams of 10-50...", rows: 2 },
            { field: "competitors", label: fpi.competitors, placeholder: fpi.placeholderCompetitors || "e.g. Competitor A: $49/mo...", rows: 3 },
            { field: "costs", label: fpi.costs, placeholder: fpi.placeholderCosts || "e.g. Cloud hosting $500/mo...", rows: 2 },
            { field: "coreValue", label: fpi.value, placeholder: fpi.placeholderValue || "e.g. 'saves 10hrs/week'...", rows: 2 },
          ].map(({ field, label, placeholder, rows }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{label}</label>
              <textarea
                value={(form as Record<string, string>)[field]}
                onChange={e => set(field, e.target.value)}
                rows={rows}
                placeholder={placeholder}
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{fpi.stage}</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "pre-revenue", label: fpi.stagePreRevenue || "Pre-Revenue" },
                { value: "early revenue", label: fpi.stageEarlyRevenue || "Early Revenue" },
                { value: "scaling", label: fpi.stageScaling || "Scaling" },
              ]).map(s => (
                <button
                  key={s.value}
                  onClick={() => set("stage", s.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.stage === s.value
                      ? "bg-[#7C3AED] text-white border border-[#7C3AED]"
                      : "bg-[#06040F] text-[#8B7CF8] border border-[#1A1040] hover:border-[#7C3AED]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={loading || !form.product || !form.targetCustomer}
            className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? fpi.analyzing : fpi.analyze}
          </button>
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Recommended Price — Hero */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0F0A1F] border border-[#C9A84C]/40 rounded-2xl p-6 text-center shadow-[0_0_40px_rgba(201,168,76,0.15)]"
              >
                <p className="text-[#8B7CF8] text-xs uppercase tracking-widest mb-2">{fpi.recommendedPrice}</p>
                <div className="text-5xl md:text-6xl font-bold text-[#C9A84C] mb-2">{result.recommendedPrice}</div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#A855F7] text-sm font-medium mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  {result.strategyName}
                </div>
                <p className="text-[#8B7CF8]/70 text-sm max-w-xl mx-auto">{result.strategyRationale}</p>
              </motion.div>

              {/* 3-Tier Plans */}
              <div>
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
                  {fpi.tiers}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.tiers.map((tier, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bg-[#0F0A1F] border-2 ${tierBorders[i]} rounded-xl p-5 flex flex-col`}
                    >
                      <h4 className="text-white font-bold mb-1">{tier.name}</h4>
                      <div className="text-2xl font-bold mb-1" style={{ color: i === 2 ? "#C9A84C" : i === 1 ? "#A855F7" : "#8B7CF8" }}>
                        {tier.price}
                      </div>
                      <p className="text-[#8B7CF8]/60 text-xs mb-3">{tier.description}</p>
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {tier.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2 text-xs text-[#8B7CF8]">
                            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div
                        className="text-center py-2 rounded-lg text-xs font-semibold"
                        style={{
                          background: i === 1 ? "#7C3AED" : i === 2 ? "#C9A84C" : "transparent",
                          color: i === 2 ? "#06040F" : "white",
                          border: i === 0 ? "1px solid #1A1040" : "none",
                        }}
                      >
                        {tier.cta}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Free vs Paid */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#C9A84C]" />
                  What to Charge For
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">Keep Free</h4>
                    <ul className="space-y-2">
                      {result.freeVsPaid.free.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#8B7CF8]">
                          <span className="text-green-400 mt-0.5">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-2">Charge For</h4>
                    <ul className="space-y-2">
                      {result.freeVsPaid.paid.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#8B7CF8]">
                          <span className="text-[#C9A84C] mt-0.5">$</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Revenue Projections */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <div className="px-5 py-3 border-b border-[#1A1040] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-white font-semibold text-sm">{fpi.projections}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1A1040]">
                        <th className="text-left px-5 py-3 text-[#8B7CF8] text-xs uppercase tracking-wider">Users</th>
                        <th className="text-left px-5 py-3 text-[#8B7CF8] text-xs uppercase tracking-wider">Monthly Revenue</th>
                        <th className="text-left px-5 py-3 text-[#8B7CF8] text-xs uppercase tracking-wider">Annual Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1040]">
                      {result.revenueProjections.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{row.users}</td>
                          <td className="px-5 py-3 text-[#A855F7] font-semibold">{row.monthly}</td>
                          <td className="px-5 py-3 text-[#C9A84C] font-bold">{row.annual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Mistakes */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  {fpi.mistakes}
                </h3>
                <ol className="space-y-3">
                  {result.pricingMistakes.map((mistake, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-orange-400 font-bold text-sm mt-0.5 w-5 shrink-0">{i + 1}.</span>
                      <span className="text-[#8B7CF8]/80 text-sm">{mistake}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Free Tier Recommendation */}
              <div className="bg-[#0F0A1F] border border-[#7C3AED]/30 rounded-xl p-5 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A855F7]" />
                    Free Tier Recommendation
                  </h3>
                  <CopyButton text={result.freeTierRecommendation} />
                </div>
                <p className="text-[#8B7CF8]/80 text-sm leading-relaxed">{result.freeTierRecommendation}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
