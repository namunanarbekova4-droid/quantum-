"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Copy, Check, Zap, Target, DollarSign, Users, TrendingUp, HelpCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface OnePagerData {
  headline: string;
  problem: string;
  solution: string;
  market: string;
  model: string;
  traction: string;
  team: string;
  ask: string;
  useOfFunds: string;
  closingStatement: string;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  problem: <HelpCircle className="w-4 h-4" />,
  solution: <Zap className="w-4 h-4" />,
  market: <Target className="w-4 h-4" />,
  model: <DollarSign className="w-4 h-4" />,
  traction: <TrendingUp className="w-4 h-4" />,
  team: <Users className="w-4 h-4" />,
};

function FormField({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[#8B7CF8] text-sm font-medium mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 resize-none outline-none transition-colors text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 min-h-[44px] text-white placeholder-white/25 outline-none transition-colors text-sm"
        />
      )}
    </div>
  );
}

export default function OnePagerPage() {
  const { t, locale } = useLanguage();
  const fo = t.features.onePager;
  const [form, setForm] = useState({
    startupName: "",
    tagline: "",
    problem: "",
    solution: "",
    targetMarket: "",
    businessModel: "",
    traction: "",
    team: "",
    amountRaising: "",
    useOfFunds: "",
  });
  const [result, setResult] = useState<OnePagerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function setField(key: string) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/one-pager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data.onePager);
    } catch {
      setError("Didn't generate cleanly. Try again — these things happen.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    if (!result) return;
    const text = [
      result.headline,
      "",
      "THE PROBLEM",
      result.problem,
      "",
      "OUR SOLUTION",
      result.solution,
      "",
      "MARKET OPPORTUNITY",
      result.market,
      "",
      "BUSINESS MODEL",
      result.model,
      "",
      "TRACTION",
      result.traction,
      "",
      "TEAM",
      result.team,
      "",
      "THE ASK",
      result.ask,
      "",
      "USE OF FUNDS",
      result.useOfFunds,
      "",
      result.closingStatement,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sectionData = result
    ? [
        { key: "problem", label: "The Problem", text: result.problem },
        { key: "solution", label: "Our Solution", text: result.solution },
        { key: "market", label: "Market Opportunity", text: result.market },
        { key: "model", label: "Business Model", text: result.model },
        { key: "traction", label: "Traction", text: result.traction },
        { key: "team", label: "Team", text: result.team },
        { key: "ask", label: "The Ask", text: result.ask },
        { key: "useOfFunds", label: "Use of Funds", text: result.useOfFunds },
      ]
    : [];

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">{fo.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {fo.subtitle}
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="space-y-4">
          <FormField label={fo.startupName} placeholder="Quantum" value={form.startupName} onChange={setField("startupName")} />
          <FormField label={fo.tagline} placeholder="One line that says it all" value={form.tagline} onChange={setField("tagline")} />
          <FormField label={fo.problem} placeholder="What problem are you solving? (2-3 sentences)" value={form.problem} onChange={setField("problem")} multiline />
          <FormField label={fo.solution} placeholder="How do you solve it? (2-3 sentences)" value={form.solution} onChange={setField("solution")} multiline />
          <FormField label={fo.targetMarket} placeholder="Who are your customers?" value={form.targetMarket} onChange={setField("targetMarket")} />
          <FormField label={fo.businessModel} placeholder="How do you make money?" value={form.businessModel} onChange={setField("businessModel")} />
          <FormField label={fo.traction} placeholder="What have you built or achieved?" value={form.traction} onChange={setField("traction")} multiline />
          <FormField label={fo.team} placeholder="Founders and their backgrounds" value={form.team} onChange={setField("team")} multiline />
          <FormField label={fo.amountRaising} placeholder="e.g. $500K pre-seed" value={form.amountRaising} onChange={setField("amountRaising")} />
          <FormField label={fo.useOfFunds} placeholder="How will you use the money?" value={form.useOfFunds} onChange={setField("useOfFunds")} multiline />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={generate}
            disabled={loading || !form.startupName || !form.problem}
            className="w-full py-4 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#06040F] font-bold text-base transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />
                {fo.generating}
              </span>
            ) : (
              fo.generate
            )}
          </button>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl text-center p-8"
              >
                <FileText className="w-12 h-12 text-[#1A1040] mb-4" />
                <p className="text-white font-semibold text-base mb-2">One page.</p><p className="text-white/40 text-sm">One clear reason to keep reading.</p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl"
              >
                <div className="w-12 h-12 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mb-4" />
                <p className="text-[#8B7CF8] text-sm">Crafting your one-pager...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-[#1A1040] bg-gradient-to-r from-[#7C3AED]/10 to-transparent">
                  <h2 className="text-2xl font-black text-white mb-1">{result.headline}</h2>
                </div>

                {/* Sections */}
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  {sectionData.map((section) => (
                    <div key={section.key}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[#7C3AED]">{SECTION_ICONS[section.key] || <FileText className="w-4 h-4" />}</span>
                        <h3 className="text-[#8B7CF8] font-semibold text-xs uppercase tracking-wider">{section.label}</h3>
                      </div>
                      <p className="text-white text-sm leading-relaxed">{section.text}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-[#1A1040]">
                    <p className="text-[#C9A84C] text-sm italic leading-relaxed">{result.closingStatement}</p>
                  </div>
                </div>

                {/* Copy button */}
                <div className="p-4 border-t border-[#1A1040]">
                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? fo.copied : fo.copy}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
