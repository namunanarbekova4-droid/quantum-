"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface EmailVersion {
  subjects: string[];
  body: string;
}

interface EmailResult {
  emails: {
    direct: EmailVersion;
    warm: EmailVersion;
    dataDriven: EmailVersion;
  };
}

const EMAIL_TABS = [
  { key: "direct" as const, label: "Direct" },
  { key: "warm" as const, label: "Warm" },
  { key: "dataDriven" as const, label: "Data-Driven" },
];

function CopyButton({ text, small = false }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-[#8B7CF8] hover:text-white transition-colors ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function FormField({
  label, placeholder, value, onChange, multiline = false,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; multiline?: boolean;
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

export default function InvestorEmailPage() {
  const { t, locale } = useLanguage();
  const fie = t.features.investorEmail;
  const [form, setForm] = useState({
    investorName: "",
    fundName: "",
    whyThisInvestor: "",
    startup: "",
    traction: "",
    amountRaising: "",
  });
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"direct" | "warm" | "dataDriven">("direct");

  function setField(key: string) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/investor-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Didn't generate cleanly. Try again — these things happen.");
    } finally {
      setLoading(false);
    }
  }

  const activeEmail = result?.emails[activeTab];

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-7 h-7 text-[#7C3AED]" />
          <h1 className="text-3xl font-bold text-white">{fie.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {fie.subtitle}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <FormField label={fie.investorName} placeholder="Sarah Chen" value={form.investorName} onChange={setField("investorName")} />
          <FormField label={fie.fund} placeholder="Sequoia Capital" value={form.fundName} onChange={setField("fundName")} />
          <FormField label={fie.whyInvestor} placeholder="Why are you specifically reaching out to them?" value={form.whyThisInvestor} onChange={setField("whyThisInvestor")} multiline />
          <FormField label={fie.startup} placeholder="One line description" value={form.startup} onChange={setField("startup")} />
          <FormField label={fie.traction} placeholder="Key metrics, milestones, proof points" value={form.traction} onChange={setField("traction")} multiline />
          <FormField label={fie.amount} placeholder="e.g. $750K pre-seed" value={form.amountRaising} onChange={setField("amountRaising")} />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={generate}
            disabled={loading || !form.investorName || !form.startup}
            className="w-full py-4 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#06040F] font-bold text-base transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />
                {fie.generating}
              </span>
            ) : (
              fie.generate
            )}
          </button>
        </div>

        {/* Result */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl text-center p-8">
                <Mail className="w-12 h-12 text-[#1A1040] mb-4" />
                <p className="text-white font-semibold text-base mb-2">Most investor emails get ignored.</p>
                <p className="text-white/40 text-sm">The ones that work earn a reply, not a deal. Let&apos;s write one of those.</p>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <div className="w-12 h-12 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mb-4" />
                <p className="text-[#8B7CF8] text-sm">Writing personalized emails...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-[#1A1040]">
                  {EMAIL_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? "text-white border-b-2 border-[#7C3AED]"
                          : "text-[#8B7CF8] hover:text-white"
                      }`}
                    >
                      {tab.key === "direct" ? fie.direct : tab.key === "warm" ? fie.warm : fie.dataDriven}
                    </button>
                  ))}
                </div>

                {activeEmail && (
                  <div className="p-5 space-y-5">
                    {/* Subject lines */}
                    <div>
                      <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-3">{fie.subjectLines}</p>
                      <div className="space-y-2">
                        {activeEmail.subjects.map((subject, i) => (
                          <button
                            key={i}
                            onClick={() => navigator.clipboard.writeText(subject)}
                            className="w-full text-left px-3 py-2.5 bg-[#0F0A1F] border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-white text-sm transition-colors"
                          >
                            {subject}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">Email Body</p>
                        <div className="flex items-center gap-3">
                          <span className="text-white/30 text-xs">{activeEmail.body.split(/\s+/).length} {fie.wordCount}</span>
                          <CopyButton text={activeEmail.body} small />
                        </div>
                      </div>
                      <div className="bg-[#06040F] border border-[#1A1040] rounded-xl p-4 max-h-72 overflow-y-auto">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-line">{activeEmail.body}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
