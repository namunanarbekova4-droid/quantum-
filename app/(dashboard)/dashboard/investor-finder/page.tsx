"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mail,
  Plus,
  ChevronLeft,
  Building2,
  MapPin,
  DollarSign,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// ---- Types ----
interface InvestorProfile {
  id: string;
  name: string;
  title: string;
  fund: string;
  location: string;
  checkSize: string;
  industries: string[];
  stages: string[];
  whyMatch: string;
  matchScore: number;
  linkedin: string;
  twitter: string;
  portfolio: string[];
}

interface PipelineRecord {
  id: string;
  investorName: string;
  fund: string;
  matchScore: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

// ---- Constants ----
const INDUSTRIES = ["AI", "EdTech", "Fintech", "HealthTech", "Consumer", "SaaS", "Other"];
const STAGES_OPTIONS = ["Idea", "MVP", "Revenue", "Growth"];
const GEO_OPTIONS = ["Kazakhstan", "Central Asia", "Global", "USA", "Europe"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_contacted: { label: "Not Contacted", color: "bg-[#2a2a3a] text-[#8B7CF8]" },
  email_sent: { label: "Email Sent", color: "bg-blue-900/40 text-blue-300" },
  replied: { label: "Replied", color: "bg-yellow-900/40 text-yellow-300" },
  meeting_scheduled: { label: "Meeting Scheduled", color: "bg-[#7C3AED]/30 text-[#8B7CF8]" },
  passed: { label: "Passed", color: "bg-red-900/40 text-red-300" },
  invested: { label: "🎉 Invested!", color: "bg-[#C9A84C]/20 text-[#C9A84C]" },
};

const STATUS_KEYS = Object.keys(STATUS_CONFIG);

const LOADING_MESSAGES = [
  "Scanning investor databases...",
  "Matching your startup profile...",
  "Analyzing investment thesis fit...",
  "Ranking by match score...",
];

// ---- Helper: initials ----
function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

// ---- Helper: score color ----
function scoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 75) return "text-[#C9A84C]";
  return "text-[#8B7CF8]";
}

// ---- Investor Card ----
function InvestorCard({
  investor,
  onAddToPipeline,
  savedIds,
}: {
  investor: InvestorProfile;
  onAddToPipeline: (inv: InvestorProfile) => void;
  savedIds: Set<string>;
}) {
  const isSaved = savedIds.has(investor.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#7C3AED]/50 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-[#C9A84C] font-bold text-sm uppercase">
            {initials(investor.name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-tight">{investor.name}</h3>
          <p className="text-[#8B7CF8] text-sm">
            {investor.title} · {investor.fund}
          </p>
          <p className="text-[#8B7CF8]/60 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {investor.location}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[#C9A84C] font-semibold text-sm flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {investor.checkSize}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {investor.industries.map((ind) => (
          <span key={ind} className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#8B7CF8] rounded-full text-xs border border-[#7C3AED]/30">
            {ind}
          </span>
        ))}
        {investor.stages.map((s) => (
          <span key={s} className="px-2 py-0.5 bg-[#1A1040] text-[#8B7CF8]/70 rounded-full text-xs border border-[#1A1040]">
            {s}
          </span>
        ))}
      </div>

      {/* Why Match */}
      <div className="bg-[#06040F] rounded-xl p-3">
        <p className="text-[#8B7CF8]/80 text-xs font-medium mb-1">Why they match:</p>
        <p className="text-[#8B7CF8] text-sm italic leading-relaxed">{investor.whyMatch}</p>
      </div>

      {/* Match Score */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8B7CF8]/60">Match Score</span>
          <span className={`font-bold text-base ${scoreColor(investor.matchScore)}`}>
            {investor.matchScore}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${investor.matchScore}%`,
              background:
                investor.matchScore >= 90
                  ? "#4ade80"
                  : investor.matchScore >= 75
                  ? "#C9A84C"
                  : "#7C3AED",
            }}
          />
        </div>
      </div>

      {/* Portfolio */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Building2 className="w-3.5 h-3.5 text-[#8B7CF8]/50 flex-shrink-0" />
        {investor.portfolio.map((p) => (
          <span key={p} className="text-xs text-[#8B7CF8]/60">
            {p}
          </span>
        ))}
      </div>

      {/* Contact + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#1A1040]">
        <div className="flex items-center gap-3">
          <a
            href={`https://${investor.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8B7CF8]/60 hover:text-[#7C3AED] transition-colors text-xs font-medium"
            title="LinkedIn"
          >
            LinkedIn
          </a>
          <a
            href={`https://twitter.com/${investor.twitter.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8B7CF8]/60 hover:text-[#7C3AED] transition-colors text-xs font-medium"
            title="Twitter"
          >
            Twitter
          </a>
          <span className="text-[#8B7CF8]/40 text-xs">{investor.twitter}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/investor-email?investorName=${encodeURIComponent(investor.name)}&fund=${encodeURIComponent(investor.fund)}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#8B7CF8] rounded-lg text-xs hover:bg-[#7C3AED]/30 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Write Email →
          </Link>
          <button
            onClick={() => onAddToPipeline(investor)}
            disabled={isSaved}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              isSaved
                ? "bg-green-900/20 border border-green-500/30 text-green-400 cursor-default"
                : "bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {isSaved ? "Saved" : "Add to Pipeline"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---- Pipeline Row ----
function PipelineRow({
  record,
  onUpdate,
}: {
  record: PipelineRecord;
  onUpdate: (id: string, patch: { status?: string; notes?: string }) => void;
}) {
  const [notes, setNotes] = useState(record.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);
  const cfg = STATUS_CONFIG[record.status] ?? STATUS_CONFIG.not_contacted;

  function saveNotes() {
    setEditingNotes(false);
    if (notes !== (record.notes ?? "")) {
      onUpdate(record.id, { notes });
    }
  }

  return (
    <tr className="border-b border-[#1A1040] hover:bg-[#0F0A1F]/60 transition-colors">
      <td className="py-3 px-4 text-white font-medium text-sm">{record.investorName}</td>
      <td className="py-3 px-4 text-[#8B7CF8]/80 text-sm">{record.fund}</td>
      <td className="py-3 px-4">
        <span className={`font-bold text-sm ${scoreColor(record.matchScore)}`}>
          {record.matchScore}%
        </span>
      </td>
      <td className="py-3 px-4">
        <select
          value={record.status}
          onChange={(e) => onUpdate(record.id, { status: e.target.value })}
          className={`text-xs px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${cfg.color} bg-transparent`}
          style={{ WebkitAppearance: "none" }}
        >
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s} className="bg-[#0F0A1F] text-white">
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
      </td>
      <td className="py-3 px-4 min-w-[160px]">
        {editingNotes ? (
          <input
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            onKeyDown={(e) => e.key === "Enter" && saveNotes()}
            className="w-full bg-[#1A1040] text-white text-xs px-2 py-1 rounded outline-none border border-[#7C3AED]/40"
          />
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="text-xs text-[#8B7CF8]/60 hover:text-[#8B7CF8] transition-colors text-left w-full truncate"
          >
            {notes || <span className="italic opacity-50">Add note…</span>}
          </button>
        )}
      </td>
      <td className="py-3 px-4">
        <span className="text-[#8B7CF8]/40 text-xs">
          {new Date(record.createdAt).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
}

// ---- Main Page ----
export default function InvestorFinderPage() {
  const { locale } = useLanguage();

  // Step: 0 = setup, 1 = results
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<"investors" | "pipeline">("investors");

  // Form
  const [startupName, setStartupName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("AI");
  const [stage, setStage] = useState("Seed");
  const [amount, setAmount] = useState("");
  const [geography, setGeography] = useState("Global");

  // Results
  const [investors, setInvestors] = useState<InvestorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState("");

  // Pipeline
  const [pipeline, setPipeline] = useState<PipelineRecord[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Load pipeline on mount
  useEffect(() => {
    fetch("/api/investor-finder")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.records) setPipeline(data.records);
      })
      .catch(() => {});
  }, []);

  // Loading message cycle
  useEffect(() => {
    if (!loading) return;
    setLoadingMsg(0);
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleFind() {
    if (!startupName.trim() || !description.trim()) {
      setError("Please fill in startup name and description.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/investor-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "find",
          startupName,
          description,
          industry,
          stage,
          amount,
          geography,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setInvestors(data.investors ?? []);
      setStep(1);
      setTab("investors");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToPipeline(inv: InvestorProfile) {
    try {
      const res = await fetch("/api/investor-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          investorName: inv.name,
          fund: inv.fund,
          matchScore: inv.matchScore,
        }),
      });
      const data = await res.json();
      if (res.ok && data.record) {
        setPipeline((prev) => [data.record, ...prev]);
        setSavedIds((prev) => { const next = new Set(prev); next.add(inv.id); return next; });
      }
    } catch {
      // silent
    }
  }

  async function handleUpdateRecord(id: string, patch: { status?: string; notes?: string }) {
    try {
      const res = await fetch("/api/investor-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, ...patch }),
      });
      const data = await res.json();
      if (res.ok && data.record) {
        setPipeline((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      }
    } catch {
      // silent
    }
  }

  // ---- Aurora background ----
  const auroraStyle = `
    @keyframes auroraFloat1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(40px, -30px) scale(1.1); }
    }
    @keyframes auroraFloat2 {
      0%, 100% { transform: translate(0, 0) scale(1.05); }
      50% { transform: translate(-30px, 40px) scale(0.95); }
    }
  `;

  return (
    <div className="min-h-screen bg-[#06040F] relative overflow-hidden">
      {/* Aurora orbs */}
      <style>{auroraStyle}</style>
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "20%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          animation: "auroraFloat1 8s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          right: "15%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
          animation: "auroraFloat2 10s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            // ======================== SETUP SCREEN ========================
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto"
            >
              {/* Title */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#C9A84C]" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Investor Finder</h1>
                <p className="text-[#8B7CF8] leading-relaxed">
                  AI finds investors who fund startups like yours. Track your outreach pipeline.
                </p>
              </div>

              {/* Form */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 flex flex-col gap-5">
                {/* Startup name */}
                <div>
                  <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                    Your startup name
                  </label>
                  <input
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="e.g. Quantum AI"
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white placeholder-[#8B7CF8]/40 outline-none focus:border-[#7C3AED]/60 transition-colors text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                    What does it do?
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your product, market, and traction..."
                    className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white placeholder-[#8B7CF8]/40 outline-none focus:border-[#7C3AED]/60 transition-colors text-sm resize-none"
                  />
                </div>

                {/* Industry + Stage row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                      Industry
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#7C3AED]/60 transition-colors text-sm appearance-none cursor-pointer"
                    >
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i} className="bg-[#0F0A1F]">
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                      Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#7C3AED]/60 transition-colors text-sm appearance-none cursor-pointer"
                    >
                      {STAGES_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-[#0F0A1F]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amount + Geography row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                      Amount raising
                    </label>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="$50K - $500K"
                      className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white placeholder-[#8B7CF8]/40 outline-none focus:border-[#7C3AED]/60 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#8B7CF8] mb-1.5 font-medium">
                      Geography preference
                    </label>
                    <select
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                      className="w-full bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#7C3AED]/60 transition-colors text-sm appearance-none cursor-pointer"
                    >
                      {GEO_OPTIONS.map((g) => (
                        <option key={g} value={g} className="bg-[#0F0A1F]">
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  onClick={handleFind}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#C9A84C] to-[#E5C76B] text-[#06040F] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#06040F]/40 border-t-[#06040F] rounded-full animate-spin" />
                      <span>{LOADING_MESSAGES[loadingMsg]}</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Find My Investors →
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            // ======================== RESULTS SCREEN ========================
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-[#8B7CF8] hover:text-white transition-colors text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Search Again
                  </button>
                  <div className="w-px h-5 bg-[#1A1040]" />
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#C9A84C]" />
                    <span className="text-white font-bold text-lg">Investor Finder</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-1">
                  <button
                    onClick={() => setTab("investors")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      tab === "investors"
                        ? "bg-[#7C3AED] text-white"
                        : "text-[#8B7CF8] hover:text-white"
                    }`}
                  >
                    Investors ({investors.length})
                  </button>
                  <button
                    onClick={() => setTab("pipeline")}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      tab === "pipeline"
                        ? "bg-[#7C3AED] text-white"
                        : "text-[#8B7CF8] hover:text-white"
                    }`}
                  >
                    Pipeline ({pipeline.length})
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {tab === "investors" ? (
                  // ---- Investors Grid ----
                  <motion.div
                    key="investors-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                  >
                    {investors.map((inv, i) => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                      >
                        <InvestorCard
                          investor={inv}
                          onAddToPipeline={handleAddToPipeline}
                          savedIds={savedIds}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  // ---- Pipeline Table ----
                  <motion.div
                    key="pipeline-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {pipeline.length === 0 ? (
                      <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-12 text-center">
                        <Star className="w-10 h-10 text-[#8B7CF8]/30 mx-auto mb-3" />
                        <p className="text-[#8B7CF8]/60 text-sm">
                          No investors in your pipeline yet.
                        </p>
                        <p className="text-[#8B7CF8]/40 text-xs mt-1">
                          Add investors from the Investors tab.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[#1A1040]">
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Name
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Fund
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Match%
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Notes
                                </th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-[#8B7CF8]/60 uppercase tracking-wider">
                                  Added
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {pipeline.map((record) => (
                                <PipelineRow
                                  key={record.id}
                                  record={record}
                                  onUpdate={handleUpdateRecord}
                                />
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
