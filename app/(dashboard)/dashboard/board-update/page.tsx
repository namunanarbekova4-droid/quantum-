"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Copy, Check, Loader2, Sparkles, TrendingUp,
  AlertTriangle, Users, ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface BoardUpdate {
  subjectLine: string;
  metricsTable: { label: string; value: string; change?: string }[];
  winsSection: string;
  challengesSection: string;
  decisionsSection: string;
  asksSection: string;
  nextMonthFocus: string;
  closingLine: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const YEARS = ["2024","2025","2026","2027"];

function CopyChip({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1040] border border-[#7C3AED]/30 rounded-full text-sm text-white hover:bg-[#7C3AED]/20 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#8B7CF8]" />}
      {label}
    </button>
  );
}

function Section({
  title, content, borderColor, icon,
}: {
  title: string;
  content: string;
  borderColor: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          {icon}
          {title}
        </div>
        <button
          onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="p-1.5 rounded hover:bg-white/10 text-[#8B7CF8] hover:text-white transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[#8B7CF8]/80 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export default function BoardUpdatePage() {
  const { t, locale } = useLanguage();
  const fbu = t.features.boardUpdate;
  const [loading, setLoading] = useState(false);
  const [update, setUpdate] = useState<BoardUpdate | null>(null);
  const [fullCopied, setFullCopied] = useState(false);
  const [form, setForm] = useState({
    month: MONTHS[new Date().getMonth()],
    year: String(new Date().getFullYear()),
    mrr: "",
    users: "",
    growth: "",
    wins: "",
    challenges: "",
    decisions: "",
    needs: "",
    goals: "",
    founderName: "",
    companyName: "",
  });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/board-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json();
      setUpdate(data);
    } finally {
      setLoading(false);
    }
  }

  function buildFullEmail() {
    if (!update) return "";
    return `Subject: ${update.subjectLine}\n\n---\n\n📊 METRICS\n${update.metricsTable.map(m => `${m.label}: ${m.value}${m.change ? ` (${m.change})` : ""}`).join("\n")}\n\n✅ WINS\n${update.winsSection}\n\n⚠️ CHALLENGES\n${update.challengesSection}\n\n📋 DECISIONS\n${update.decisionsSection}\n\n🙏 ASKS\n${update.asksSection}\n\n🎯 NEXT MONTH\n${update.nextMonthFocus}\n\n${update.closingLine}`;
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <Send className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{fbu.title}</h1>
            <p className="text-[#8B7CF8] text-sm mt-0.5">{fbu.subtitle}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] mb-6 space-y-5">

          {/* Month/Year + Names */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{fbu.month}</label>
              <select
                value={form.month}
                onChange={e => set("month", e.target.value)}
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C3AED]"
              >
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{fbu.year}</label>
              <select
                value={form.year}
                onChange={e => set("year", e.target.value)}
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7C3AED]"
              >
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{fbu.name}</label>
              <input
                value={form.founderName}
                onChange={e => set("founderName", e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{fbu.company}</label>
              <input
                value={form.companyName}
                onChange={e => set("companyName", e.target.value)}
                placeholder="Acme Inc."
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
              />
            </div>
          </div>

          {/* Metrics */}
          <div>
            <label className="block text-xs font-medium text-[#8B7CF8] mb-2 uppercase tracking-wider">Key Metrics</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7CF8] text-sm">$</span>
                <input
                  type="number"
                  value={form.mrr}
                  onChange={e => set("mrr", e.target.value)}
                  placeholder="MRR"
                  className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg pl-7 pr-3 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B7CF8]" />
                <input
                  type="number"
                  value={form.users}
                  onChange={e => set("users", e.target.value)}
                  placeholder="Total Users"
                  className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg pl-8 pr-3 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8B7CF8]" />
                <input
                  type="number"
                  value={form.growth}
                  onChange={e => set("growth", e.target.value)}
                  placeholder="Growth %"
                  className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg pl-8 pr-3 py-2.5 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>
          </div>

          {/* Textareas */}
          {[
            { field: "wins", label: fbu.wins, placeholder: "What went well? Deals closed, product milestones, partnerships..." },
            { field: "challenges", label: fbu.challenges, placeholder: "What's hard? Be honest — investors appreciate transparency..." },
            { field: "decisions", label: fbu.decisions, placeholder: "Key decisions made this month and the reasoning..." },
            { field: "needs", label: fbu.needs, placeholder: "Intros, advice, resources, connections..." },
            { field: "goals", label: fbu.goals, placeholder: "Top 3 objectives for next month..." },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[#8B7CF8] mb-1.5 uppercase tracking-wider">{label}</label>
              <textarea
                value={(form as Record<string, string>)[field]}
                onChange={e => set(field, e.target.value)}
                rows={3}
                placeholder={placeholder}
                className="w-full bg-[#06040F] border border-[#1A1040] rounded-lg px-4 py-3 text-white text-sm placeholder-[#8B7CF8]/30 focus:outline-none focus:border-[#7C3AED] transition-colors resize-none"
              />
            </div>
          ))}

          <button
            onClick={generate}
            disabled={loading || !form.wins || !form.challenges}
            className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? fbu.generating : fbu.generate}
          </button>
        </div>

        {/* Output */}
        <AnimatePresence>
          {update && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Subject line */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-white font-semibold text-lg">Your Board Update</h2>
                <div className="flex items-center gap-2">
                  <CopyChip text={update.subjectLine} label="Copy Subject" />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(buildFullEmail());
                      setFullCopied(true);
                      setTimeout(() => setFullCopied(false), 2000);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-semibold text-sm rounded-lg transition-all"
                  >
                    {fullCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {fbu.copyAll}
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-4 flex items-center gap-3">
                <span className="text-[#8B7CF8] text-xs uppercase tracking-wider font-medium">Subject:</span>
                <span className="text-white text-sm font-medium flex-1">{update.subjectLine}</span>
              </div>

              {/* Metrics Table */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <div className="px-5 py-3 border-b border-[#1A1040] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
                  <span className="text-white font-semibold text-sm">Key Metrics</span>
                </div>
                <div className="divide-y divide-[#1A1040]">
                  {update.metricsTable.map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <span className="text-[#8B7CF8] text-sm">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold text-sm">{m.value}</span>
                        {m.change && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            m.change.startsWith("+") || m.change.startsWith("↑")
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>{m.change}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Section
                title="Wins This Month"
                content={update.winsSection}
                borderColor="border-l-green-500"
                icon={<Check className="w-4 h-4 text-green-400" />}
              />
              <Section
                title="Challenges"
                content={update.challengesSection}
                borderColor="border-l-orange-500"
                icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
              />
              <Section
                title="Decisions Made"
                content={update.decisionsSection}
                borderColor="border-l-blue-500"
                icon={<ChevronRight className="w-4 h-4 text-blue-400" />}
              />
              <Section
                title="What We Need From You"
                content={update.asksSection}
                borderColor="border-l-[#7C3AED]"
                icon={<Sparkles className="w-4 h-4 text-[#A855F7]" />}
              />
              <Section
                title="Next Month Focus"
                content={update.nextMonthFocus}
                borderColor="border-l-[#C9A84C]"
                icon={<TrendingUp className="w-4 h-4 text-[#C9A84C]" />}
              />

              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-4">
                <p className="text-[#8B7CF8]/80 text-sm italic">{update.closingLine}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
