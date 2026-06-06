"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Copy, Check } from "lucide-react";

interface PressReleaseResult {
  headlines: string[];
  subheadline: string;
  leadParagraph: string;
  body: string;
  polishedQuote: string;
  boilerplate: string;
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
          className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 outline-none transition-colors text-sm"
        />
      )}
    </div>
  );
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-[#8B7CF8] hover:text-white transition-colors text-xs"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function PressReleasePage() {
  const [form, setForm] = useState({
    announcement: "",
    significance: "",
    rawQuote: "",
    keyFacts: "",
    targetMedia: "",
    announcementDate: "",
  });
  const [result, setResult] = useState<PressReleaseResult | null>(null);
  const [selectedHeadline, setSelectedHeadline] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  function setField(key: string) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/press-release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
      setSelectedHeadline(0);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    if (!result) return;
    const text = [
      result.headlines[selectedHeadline],
      result.subheadline,
      "",
      result.leadParagraph,
      "",
      result.body,
      "",
      `"${result.polishedQuote}"`,
      "",
      "###",
      "",
      result.boilerplate,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Newspaper className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">Press Release AI</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          Professional press releases that journalists actually want to read
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <FormField label="What's the announcement?" placeholder="We just raised $1M, launched our product, hit 1000 users..." value={form.announcement} onChange={setField("announcement")} multiline />
          <FormField label="Why is it significant?" placeholder="Why does this matter to the world?" value={form.significance} onChange={setField("significance")} multiline />
          <FormField label="Your quote (raw thoughts)" placeholder="What do you want to say in your own words?" value={form.rawQuote} onChange={setField("rawQuote")} multiline />
          <FormField label="Key facts & numbers" placeholder="Stats, metrics, milestones that support the announcement" value={form.keyFacts} onChange={setField("keyFacts")} multiline />
          <FormField label="Target media" placeholder="TechCrunch, local press, industry publications..." value={form.targetMedia} onChange={setField("targetMedia")} />
          <FormField label="Announcement date" placeholder="June 15, 2025" value={form.announcementDate} onChange={setField("announcementDate")} />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={generate}
            disabled={loading || !form.announcement}
            className="w-full py-4 bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-base transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Writing press release...
              </span>
            ) : (
              "Generate Press Release"
            )}
          </button>
        </div>

        {/* Output */}
        <div>
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl text-center p-8">
                <Newspaper className="w-12 h-12 text-[#1A1040] mb-4" />
                <p className="text-white/30 text-sm">Your press release will appear here</p>
              </motion.div>
            )}

            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <div className="w-12 h-12 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mb-4" />
                <p className="text-[#8B7CF8] text-sm">Writing your press release...</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1040]">
                  <span className="text-white font-semibold text-sm">Press Release</span>
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-[#8B7CF8] hover:text-white transition-colors text-xs"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAll ? "Copied" : "Copy all"}
                  </button>
                </div>

                <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
                  {/* Headline options */}
                  <div>
                    <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-3">Headlines (click to select)</p>
                    <div className="space-y-2">
                      {result.headlines.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedHeadline(i)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                            selectedHeadline === i
                              ? "bg-[#7C3AED]/20 border-[#7C3AED]/60 text-white"
                              : "bg-[#06040F] border-[#1A1040] text-white/60 hover:border-[#7C3AED]/30 hover:text-white"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subheadline */}
                  <div>
                    <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-2">Subheadline</p>
                    <p className="text-white/80 text-sm italic leading-relaxed">{result.subheadline}</p>
                  </div>

                  {/* Lead paragraph */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">Lead Paragraph</p>
                      <CopyBlock text={result.leadParagraph} />
                    </div>
                    <p className="text-white text-sm leading-relaxed">{result.leadParagraph}</p>
                  </div>

                  {/* Body */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">Body</p>
                      <CopyBlock text={result.body} />
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.body}</p>
                  </div>

                  {/* Quote */}
                  <div className="p-4 bg-[#7C3AED]/10 border-l-4 border-[#7C3AED] rounded-r-xl">
                    <p className="text-white text-sm italic leading-relaxed">&ldquo;{result.polishedQuote}&rdquo;</p>
                  </div>

                  {/* Boilerplate */}
                  <div>
                    <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-2">About the Company</p>
                    <p className="text-white/60 text-sm leading-relaxed">{result.boilerplate}</p>
                    <p className="text-white/30 text-xs mt-2 text-center">###</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
