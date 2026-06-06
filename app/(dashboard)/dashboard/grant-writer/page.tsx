"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, ChevronDown, ChevronUp, Copy, Check,
  ArrowLeft, Loader2, Sparkles, Calendar, Building2, DollarSign,
} from "lucide-react";

interface Grant {
  name: string;
  organization: string;
  amount: string;
  deadline: string;
  eligibility: string;
  description: string;
}

interface ApplicationSection {
  title: string;
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/10 text-[#8B7CF8] hover:text-white transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function SectionCard({ section }: { section: ApplicationSection }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white text-sm">{section.title}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={section.content} />
          {open ? <ChevronUp className="w-4 h-4 text-[#8B7CF8]" /> : <ChevronDown className="w-4 h-4 text-[#8B7CF8]" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 text-sm text-[#8B7CF8]/80 leading-relaxed whitespace-pre-wrap border-t border-[#1A1040] pt-4">
              {section.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GrantWriterPage() {
  const [step, setStep] = useState<"find" | "write">("find");
  const [loading, setLoading] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [sections, setSections] = useState<ApplicationSection[]>([]);
  const [founderBackground, setFounderBackground] = useState("");
  const [form, setForm] = useState({
    industry: "",
    country: "",
    stage: "MVP",
    description: "",
  });

  async function findGrants() {
    if (!form.industry || !form.country || !form.description) return;
    setLoading(true);
    try {
      const res = await fetch("/api/grant-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find", ...form }),
      });
      const data = await res.json();
      setGrants(data.grants || []);
    } finally {
      setLoading(false);
    }
  }

  async function writeApplication(grant?: Grant) {
    const g = grant || selectedGrant;
    if (!g) return;
    setLoading(true);
    setSelectedGrant(g);
    setStep("write");
    setSections([]);
    try {
      const res = await fetch("/api/grant-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "write",
          grantName: g.name,
          grantOrg: g.organization,
          startupDescription: form.description,
          founderBackground,
        }),
      });
      const data = await res.json();
      setSections(data.sections || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {step === "write" && (
            <button
              onClick={() => setStep("find")}
              className="p-2 rounded-lg border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:bg-[#1A1040] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Grant Writer</h1>
            <p className="text-[#8B7CF8] text-sm mt-0.5">
              {step === "find" ? "Find relevant grants and write your application" : `Writing application for: ${selectedGrant?.name}`}
            </p>
          </div>
        </div>

        {step === "find" && (
          <>
            {/* Find Grants Form */}
            <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] mb-6">
              <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C9A84C]" />
                Tell us about your startup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Industry</label>
                  <input
                    value={form.industry}
                    onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                    placeholder="e.g. CleanTech, HealthTech, EdTech..."
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#8B7CF8]/40 focus:outline-none focus:border-[#7C3AED] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Country</label>
                  <input
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="e.g. United States, UK, Canada..."
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#8B7CF8]/40 focus:outline-none focus:border-[#7C3AED] transition-colors"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Startup Stage</label>
                <div className="flex gap-2">
                  {["idea", "MVP", "revenue"].map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(p => ({ ...p, stage: s }))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        form.stage === s
                          ? "bg-[#7C3AED] text-white border border-[#7C3AED]"
                          : "bg-[#06040F] text-[#8B7CF8] border border-[#1A1040] hover:border-[#7C3AED]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Brief Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe what your startup does, who it helps, and your traction so far..."
                  className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B7CF8]/40 focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
                />
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">Founder Background (optional)</label>
                <input
                  value={founderBackground}
                  onChange={e => setFounderBackground(e.target.value)}
                  placeholder="e.g. PhD in Chemistry, 5 years at NASA, serial entrepreneur..."
                  className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#8B7CF8]/40 focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
              </div>
              <button
                onClick={findGrants}
                disabled={loading || !form.industry || !form.country || !form.description}
                className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Finding Grants..." : "Find Relevant Grants"}
              </button>
            </div>

            {/* Grant Cards */}
            <AnimatePresence>
              {grants.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h2 className="text-white font-semibold text-lg">
                    Found {grants.length} relevant grants
                  </h2>
                  {grants.map((grant, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 shadow-[0_0_30px_rgba(124,58,237,0.15)] hover:border-[#7C3AED]/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-base mb-1">{grant.name}</h3>
                          <p className="text-[#8B7CF8] text-sm flex items-center gap-1.5 mb-3">
                            <Building2 className="w-3.5 h-3.5" />
                            {grant.organization}
                          </p>
                          <p className="text-[#8B7CF8]/70 text-sm mb-3">{grant.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1 text-[#C9A84C] font-medium">
                              <DollarSign className="w-3.5 h-3.5" />
                              {grant.amount}
                            </span>
                            <span className="flex items-center gap-1 text-[#8B7CF8]">
                              <Calendar className="w-3.5 h-3.5" />
                              {grant.deadline}
                            </span>
                            <span className="text-[#8B7CF8]/60 bg-[#1A1040] px-2 py-0.5 rounded">
                              {grant.eligibility}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => writeApplication(grant)}
                          className="shrink-0 px-4 py-2 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold text-sm rounded-lg transition-all"
                        >
                          Write Application
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {step === "write" && (
          <div className="space-y-4">
            {/* Grant context bar */}
            {selectedGrant && (
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-white font-medium">{selectedGrant.name}</span>
                <span className="text-[#8B7CF8]">{selectedGrant.organization}</span>
                <span className="text-[#C9A84C] font-medium">{selectedGrant.amount}</span>
                <button
                  onClick={() => writeApplication()}
                  disabled={loading}
                  className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 border border-[#7C3AED]/30 text-[#A855F7] rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Regenerate All Sections
                </button>
              </div>
            )}

            {loading && sections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                <p className="text-[#8B7CF8] text-sm">Writing your grant application...</p>
              </div>
            )}

            {sections.map((section, i) => (
              <motion.div
                key={`${section.title}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <SectionCard section={section} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
