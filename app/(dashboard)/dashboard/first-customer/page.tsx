"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, ArrowRight, MapPin, Briefcase, Zap, Users,
  TrendingUp, ChevronRight, RefreshCw, Mail, AlertTriangle,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "setup" | "searching" | "results";

interface SetupData {
  productDescription: string;
  idealCustomer: string;
  problem: string;
  industry: string;
}

interface CustomerProfile {
  name: string;
  title: string;
  company_type: string;
  location: string;
  why_they_need: string;
  pain_level: "HIGH" | "MEDIUM";
  where_to_find: string[];
  best_approach: string;
  match_score: number;
}

interface Community {
  platform: string;
  name: string;
  members: string;
  why: string;
}

interface AcquisitionPlan {
  today: string;
  this_week: string;
  this_month: string;
}

interface SearchResult {
  id: string;
  profiles: CustomerProfile[];
  communities: Community[];
  acquisition_plan: AcquisitionPlan;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "SaaS / Software", "E-commerce", "FinTech", "HealthTech", "EdTech",
  "Marketing / Growth", "HR / Recruiting", "Legal / Compliance", "Real Estate",
  "Food & Beverage", "Retail", "Manufacturing", "Consulting / Services",
  "Media / Content", "Gaming", "AI / ML", "Other",
];

// ─── Quantum atom for searching screen ─────────────────────────────────────────

function QuantumAtom() {
  return (
    <svg width="100" height="100" viewBox="0 0 120 120" className="logo-glow overflow-visible">
      <defs>
        <radialGradient id="fc-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#A07830" />
        </radialGradient>
        <radialGradient id="fc-particle" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#C9A84C" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" transform="rotate(120 60 60)" />
      <g className="logo-orbit-1" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="4.5" fill="url(#fc-particle)" />
      </g>
      <g className="logo-orbit-2" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="3.5" fill="url(#fc-particle)" transform="rotate(60 60 60)" />
      </g>
      <g className="logo-orbit-3" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="3" fill="url(#fc-particle)" transform="rotate(120 60 60)" />
      </g>
      <circle cx="60" cy="60" r="9" fill="url(#fc-core)" />
      <circle cx="60" cy="60" r="5" fill="#F5E09A" opacity="0.9" />
    </svg>
  );
}

// ─── Profile initials avatar ────────────────────────────────────────────────────

function ProfileAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}>
      {initials}
    </div>
  );
}

// ─── Customer card ──────────────────────────────────────────────────────────────

function CustomerCard({ profile, index, ft }: { profile: CustomerProfile; index: number; ft: Record<string, string> }) {
  const isPainHigh = profile.pain_level === "HIGH";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl overflow-hidden hover:border-[#7C3AED]/40 transition-all"
      style={{ borderLeft: "3px solid #7C3AED" }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <ProfileAvatar name={profile.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-base">{profile.name}</h3>
                <p className="text-sm text-[#8B7CF8]">{profile.title}</p>
                <p className="text-xs text-[#555] mt-0.5">{profile.company_type}</p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-[#C9A84C]">{profile.match_score}%</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  isPainHigh
                    ? "text-red-400 bg-red-400/10 border-red-400/30"
                    : "text-amber-400 bg-amber-400/10 border-amber-400/30"
                )}>
                  {isPainHigh ? ft.highPain : ft.mediumPain}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />
          <span className="text-xs text-[#888]">{profile.location}</span>
        </div>

        {/* Why they need it */}
        <div className="bg-[#06040F] rounded-lg p-3 mb-4 border border-[#1A1040]">
          <p className="text-xs text-[#C9A84C] font-semibold mb-1">{ft.matchScore}</p>
          <p className="text-xs text-[#ccc] leading-relaxed">{profile.why_they_need}</p>
        </div>

        {/* Where to find */}
        <div className="mb-4">
          <p className="text-xs text-[#8B7CF8] font-semibold mb-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {ft.whereToFind}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.where_to_find.map((place, i) => (
              <span key={i} className="text-[11px] bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#A855F7] px-2 py-1 rounded-md">
                {place}
              </span>
            ))}
          </div>
        </div>

        {/* Best approach */}
        <div className="mb-4 p-3 bg-[#06040F] rounded-lg border-l-2 border-[#C9A84C]/40">
          <p className="text-xs text-[#C9A84C] font-semibold mb-1 flex items-center gap-1">
            <Zap className="w-3 h-3" /> {ft.bestApproach}
          </p>
          <p className="text-xs text-[#ccc] leading-relaxed">{profile.best_approach}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href="/dashboard/cold-emails" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] text-xs font-bold rounded-lg transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {ft.writeEmail}
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Setup screen ───────────────────────────────────────────────────────────────

function SetupScreen({ onSubmit, ft }: { onSubmit: (data: SetupData) => void; ft: Record<string, string> }) {
  const [form, setForm] = useState<SetupData>({
    productDescription: "",
    idealCustomer: "",
    problem: "",
    industry: INDUSTRIES[0],
  });

  const isValid = form.productDescription.trim().length > 10 && form.problem.trim().length > 10;

  const field = (label: string, hint: string, children: React.ReactNode) => (
    <div>
      <label className="block text-sm font-semibold text-white mb-1">{label}</label>
      <p className="text-xs text-[#8B7CF8]/60 mb-2">{hint}</p>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{ft.title}</h1>
            <p className="text-sm text-[#8B7CF8]">{ft.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-6 space-y-6">
        {field(
          ft.productDescription,
          ft.productDescription,
          <textarea
            value={form.productDescription}
            onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
            placeholder="e.g. Automates social media scheduling for e-commerce brands, pulling from their product catalog and posting at optimal times..."
            rows={3}
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 resize-none outline-none transition-colors placeholder:text-[#444]"
          />
        )}

        {field(
          ft.idealCustomer,
          ft.idealCustomer,
          <input
            type="text"
            value={form.idealCustomer}
            onChange={e => setForm(f => ({ ...f, idealCustomer: e.target.value }))}
            placeholder="e.g. Marketing manager at DTC brands doing $1M-$10M revenue"
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-[#444]"
          />
        )}

        {field(
          ft.problem,
          ft.problem,
          <textarea
            value={form.problem}
            onChange={e => setForm(f => ({ ...f, problem: e.target.value }))}
            placeholder="e.g. They spend 5+ hours per week manually creating social posts, posting at wrong times, and get inconsistent engagement..."
            rows={3}
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 resize-none outline-none transition-colors placeholder:text-[#444]"
          />
        )}

        {field(
          ft.industry,
          ft.industry,
          <select
            value={form.industry}
            onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors"
          >
            {INDUSTRIES.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => isValid && onSubmit(form)}
          disabled={!isValid}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
            isValid
              ? "bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] shadow-[0_0_20px_rgba(201,168,76,0.3)]"
              : "bg-[#1A1040] text-[#444] cursor-not-allowed"
          )}
        >
          {ft.findBtn}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Searching screen ───────────────────────────────────────────────────────────

function SearchingScreen({ searchingMsgs }: { searchingMsgs: string[] }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIndex(i => (i + 1) % searchingMsgs.length), 2000);
    const progTimer = setInterval(() => setProgress(p => {
      if (p >= 92) return p;
      return p + (p < 40 ? 3 : p < 70 ? 2 : 0.8);
    }), 300);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, [searchingMsgs.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#06040F] flex flex-col items-center justify-center z-50 px-8"
    >
      <QuantumAtom />

      <div className="mt-10 text-center space-y-4 w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-semibold text-white"
          >
            {searchingMsgs[msgIndex]}
          </motion.p>
        </AnimatePresence>

        <p className="text-sm text-[#8B7CF8]">{searchingMsgs[0]}</p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#1A1040] rounded-full overflow-hidden mt-6">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7C3AED, #C9A84C)", width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </div>
        <p className="text-xs text-[#555]">{Math.round(progress)}%</p>
      </div>
    </motion.div>
  );
}

// ─── Results screen ─────────────────────────────────────────────────────────────

function ResultsScreen({
  result,
  setup,
  onReset,
  ft,
}: {
  result: SearchResult;
  setup: SetupData;
  onReset: () => void;
  ft: Record<string, string>;
}) {
  const planSteps = [
    { label: ft.doToday, value: result.acquisition_plan?.today, color: "#C9A84C", border: "#C9A84C/30" },
    { label: ft.doThisWeek, value: result.acquisition_plan?.this_week, color: "#A855F7", border: "#7C3AED/30" },
    { label: ft.doThisMonth, value: result.acquisition_plan?.this_month, color: "#34D399", border: "#34D399/30" },
  ];

  const platformColors: Record<string, string> = {
    Reddit: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    LinkedIn: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    Twitter: "text-sky-400 bg-sky-400/10 border-sky-400/20",
    Slack: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    default: "text-[#8B7CF8] bg-[#7C3AED]/10 border-[#7C3AED]/20",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{ft.title}</h1>
          <p className="text-sm text-[#8B7CF8] mt-1">
            10 people who need <span className="text-white font-semibold">{setup.industry}</span> solutions like yours, right now.
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1040] border border-[#2D1B69] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/50 rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" /> {ft.findSimilar}
        </button>
      </div>

      {/* Profile grid */}
      <div>
        <h2 className="text-xs font-semibold text-[#8B7CF8]/60 uppercase tracking-widest mb-4">
          10 IDEAL CUSTOMER PROFILES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(result.profiles ?? []).map((profile, i) => (
            <CustomerCard key={i} profile={profile} index={i} ft={ft} />
          ))}
        </div>
      </div>

      {/* Communities */}
      {result.communities?.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#8B7CF8]/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> {ft.whereHang}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.communities.map((c, i) => {
              const colorClass = platformColors[c.platform] ?? platformColors.default;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", colorClass)}>
                      {c.platform}
                    </span>
                    <span className="text-xs text-[#555]">{c.members}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{c.name}</p>
                  <p className="text-xs text-[#8B7CF8]/80 leading-relaxed">{c.why}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acquisition plan */}
      {result.acquisition_plan && (
        <div>
          <h2 className="text-xs font-semibold text-[#8B7CF8]/60 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> {ft.acquisitionPlan}
          </h2>
          <div className="space-y-4">
            {planSteps.map((step, i) => step.value && (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5"
                style={{ borderLeft: `3px solid ${step.color}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{ color: step.color, background: `${step.color}15`, border: `1px solid ${step.color}30` }}>
                    {step.label}
                  </span>
                </div>
                <p className="text-sm text-white leading-relaxed">{step.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* CTA to cold emails */}
      <Link href="/dashboard/cold-emails">
        <div className="group bg-[#0F0A1F] border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 rounded-xl p-6 cursor-pointer transition-all flex items-center gap-5 hover:shadow-[0_0_24px_rgba(201,168,76,0.1)]">
          <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white mb-1">{ft.writeEmail}</p>
            <p className="text-sm text-[#8B7CF8]/80">{ft.bestApproach}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#C9A84C] group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function FirstCustomerPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.findCustomer as Record<string, string>;

  const SEARCHING_MSGS = [ft.searching, ft.scanningCommunities, ft.analyzingPain, ft.searchingProductHunt, ft.findingPeople, ft.matchingProfiles, ft.scoringCompatibility, ft.buildingStrategies];

  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (data: SetupData) => {
    setSetup(data);
    setStep("searching");
    setError("");
    try {
      const res = await fetch("/api/first-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setResult(json);
      setStep("results");
    } catch (err) {
      setStep("setup");
      setError(err instanceof Error ? err.message : ft.errorFill);
    }
  };

  return (
    <div className="min-h-screen bg-[#06040F] p-5 lg:p-8">
      <AnimatePresence mode="wait">
        {step === "searching" && <SearchingScreen key="searching" searchingMsgs={SEARCHING_MSGS} />}
      </AnimatePresence>

      {step !== "searching" && (
        <div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
          {step === "setup" && <SetupScreen onSubmit={handleSubmit} ft={ft} />}
          {step === "results" && result && setup && (
            <ResultsScreen result={result} setup={setup} onReset={() => { setStep("setup"); setResult(null); }} ft={ft} />
          )}
        </div>
      )}
    </div>
  );
}
