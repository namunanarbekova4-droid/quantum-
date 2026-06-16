"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const DEMO_LENGTHS = ["3min", "5min", "10min"] as const;
type DemoLength = typeof DEMO_LENGTHS[number];

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

function formatScript(script: string) {
  const lines = script.split("\n");
  return lines.map((line, i) => {
    const timingMatch = line.match(/^\[(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\]/);
    const clickMatch = line.match(/^\[CLICK:/);
    const quoteMatch = line.match(/^".*"$/);
    const separatorMatch = line === "---";

    if (separatorMatch) {
      return <hr key={i} className="border-[#1A1040] my-4" />;
    }
    if (timingMatch) {
      return (
        <div key={i} className="flex items-center gap-3 mt-5 mb-2">
          <span className="px-2.5 py-1 bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded text-[#8B7CF8] text-xs font-mono">
            {timingMatch[0]}
          </span>
          <span className="text-white font-medium text-sm">{line.replace(timingMatch[0], "").trim()}</span>
        </div>
      );
    }
    if (clickMatch) {
      return (
        <p key={i} className="text-[#C9A84C] text-sm font-mono my-1.5 pl-4">
          {line}
        </p>
      );
    }
    if (quoteMatch) {
      return (
        <p key={i} className="text-green-300 text-sm italic my-1.5 pl-4 border-l-2 border-green-500/30">
          {line}
        </p>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-white/70 text-sm my-1 pl-2">{line}</p>;
  });
}

export default function DemoScriptPage() {
  const { t, locale } = useLanguage();
  const fds = t.features.demoScript;
  const [form, setForm] = useState({
    productDescription: "",
    mainFeatures: "",
    targetAudience: "",
    wowMoment: "",
    commonObjections: "",
  });
  const [demoLength, setDemoLength] = useState<DemoLength>("5min");
  const [script, setScript] = useState("");
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
      const res = await fetch("/api/demo-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, demoLength, locale }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setScript(data.script);
    } catch {
      setError("Didn't generate cleanly. Try again — these things happen.");
    } finally {
      setLoading(false);
    }
  }

  function copyScript() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Play className="w-7 h-7 text-[#7C3AED]" />
          <h1 className="text-3xl font-bold text-white">{fds.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {fds.subtitle}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <FormField label={fds.productDescription} placeholder={fds.phProductDescription} value={form.productDescription} onChange={setField("productDescription")} multiline />

          {/* Demo length tabs */}
          <div>
            <label className="block text-[#8B7CF8] text-sm font-medium mb-1.5">{fds.demoLength}</label>
            <div className="flex gap-2">
              {DEMO_LENGTHS.map((len) => (
                <button
                  key={len}
                  onClick={() => setDemoLength(len)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    demoLength === len
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                      : "bg-[#0F0A1F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40"
                  }`}
                >
                  {len === "3min" ? fds.min3 : len === "5min" ? fds.min5 : fds.min10}
                </button>
              ))}
            </div>
          </div>

          <FormField label={fds.mainFeatures} placeholder={fds.phMainFeatures} value={form.mainFeatures} onChange={setField("mainFeatures")} multiline />
          <FormField label={fds.targetAudience} placeholder={fds.phTargetAudience} value={form.targetAudience} onChange={setField("targetAudience")} />
          <FormField label={fds.wowMoment} placeholder={fds.phWowMoment} value={form.wowMoment} onChange={setField("wowMoment")} />
          <FormField label={fds.commonObjections} placeholder={fds.phCommonObjections} value={form.commonObjections} onChange={setField("commonObjections")} multiline />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={generate}
            disabled={loading || !form.productDescription}
            className="w-full py-4 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#06040F] font-bold text-base transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />
                {fds.generating}
              </span>
            ) : (
              fds.generate
            )}
          </button>
        </div>

        {/* Script output */}
        <div>
          <AnimatePresence mode="wait">
            {!script && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl text-center p-8">
                <Play className="w-12 h-12 text-[#1A1040] mb-4" />
                <p className="text-white font-semibold text-base mb-2">The best demos show, don&apos;t tell.</p>
                <p className="text-white/40 text-sm">Let&apos;s build yours.</p>
                <div className="mt-4 space-y-1.5 text-left">
                  <p className="text-[#8B7CF8]/50 text-xs"><span className="text-[#7C3AED]">[00:00 - 00:30]</span> Scene timing</p>
                  <p className="text-[#8B7CF8]/50 text-xs"><span className="text-green-400">"Exact words to say"</span></p>
                  <p className="text-[#8B7CF8]/50 text-xs"><span className="text-[#C9A84C]">[CLICK: action]</span></p>
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <div className="w-12 h-12 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mb-4" />
                <p className="text-[#8B7CF8] text-sm">{fds.writingScript}</p>
              </motion.div>
            )}

            {script && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1040]">
                  <span className="text-white font-semibold text-sm">{fds.demoScriptLabel} — {demoLength}</span>
                  <button
                    onClick={copyScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-[#8B7CF8] hover:text-white transition-colors text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? fds.copied : fds.copy}
                  </button>
                </div>
                <div className="p-5 max-h-[70vh] overflow-y-auto">
                  {formatScript(script)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
