"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, FileText, Bell, Users, Brain, TrendingUp, TrendingDown, Minus, Zap, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type Plan, PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/plans";
import { StrategicToolsHub } from "@/components/dashboard/StrategicToolsHub";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface IntelligenceData {
  score: number;
  subScores: {
    execution: number;
    riskIntelligence: number;
    timing: number;
    consistency: number;
    marketAwareness: number;
  };
  trend: "improving" | "declining" | "stable";
  blindSpots: { pattern: string; severity: string; recommendation: string; supportCount: number }[];
  totalDecisions: number;
  outcomesTracked: number;
}

interface MarketSignal {
  id: string;
  title: string;
  summary: string;
  impact: string;
  category: string;
}

interface DecisionItem {
  id: string;
  title: string;
  description: string;
  riskScore: number | null;
  recommendation: string | null;
  createdAt: string;
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_INTEL: IntelligenceData = {
  score: 847,
  subScores: { execution: 82, riskIntelligence: 79, timing: 91, consistency: 88, marketAwareness: 76 },
  trend: "improving",
  blindSpots: [],
  totalDecisions: 3,
  outcomesTracked: 2,
};

const DEMO_SIGNALS: MarketSignal[] = [
  { id: "d1", title: "AI & Tech: Strong growth signal", summary: "AI sector investment up 34% this quarter — significant opportunity in your market.", impact: "high", category: "Technology" },
  { id: "d2", title: "SaaS: Moderate opportunity", summary: "Enterprise SaaS adoption accelerating in emerging markets with favorable conditions.", impact: "medium", category: "SaaS" },
  { id: "d3", title: "Fintech: High competition warning", summary: "3 major competitors raised funding this week — market is heating up rapidly.", impact: "low", category: "Fintech" },
];

const DEMO_DECISIONS: DecisionItem[] = [
  { id: "demo1", title: "European market expansion", description: "Should we expand to the European market before raising Series B?", riskScore: 67, recommendation: "PROCEED WITH CAUTION", createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: "demo2", title: "CMO hiring decision", description: "Should I hire a CMO now or wait until after funding?", riskScore: 34, recommendation: "GO FOR IT", createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() },
  { id: "demo3", title: "Enterprise pivot strategy", description: "Should we pivot our product to focus on enterprise clients only?", riskScore: 78, recommendation: "RECONSIDER", createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString() },
];

// ─── Intelligence Panel ────────────────────────────────────────────────────────

function IntelligencePanel({ isDemo }: { isDemo: boolean }) {
  const [tab, setTab] = useState<"score" | "insights">("score");
  const [intel, setIntel] = useState<IntelligenceData | null>(null);
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loadingIntel, setLoadingIntel] = useState(!isDemo);
  const [loadingSignals, setLoadingSignals] = useState(!isDemo);
  const { t } = useLanguage();

  useEffect(() => {
    if (isDemo) {
      setIntel(DEMO_INTEL);
      setSignals(DEMO_SIGNALS);
      return;
    }
    fetch("/api/user/intelligence")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setIntel(data); })
      .finally(() => setLoadingIntel(false));
    fetch("/api/market-radar")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setSignals(data); })
      .finally(() => setLoadingSignals(false));
  }, [isDemo]);

  const subScoreLabels: { key: keyof IntelligenceData["subScores"]; label: string }[] = [
    { key: "execution", label: "Execution" },
    { key: "riskIntelligence", label: "Risk Intelligence" },
    { key: "timing", label: "Timing" },
    { key: "consistency", label: "Consistency" },
    { key: "marketAwareness", label: "Market Awareness" },
  ];

  const TrendIcon = intel?.trend === "improving" ? TrendingUp : intel?.trend === "declining" ? TrendingDown : Minus;
  const trendColor = intel?.trend === "improving" ? "text-green-400" : intel?.trend === "declining" ? "text-red-400" : "text-[#888]";

  const impactColors: Record<string, string> = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-[#888] bg-[#1a1a1a] border-[#2a2a2a]",
  };

  const severityColors: Record<string, string> = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    low: "text-[#888] bg-[#1a1a1a] border-[#2a2a2a]",
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-white">{t.dashboard.quantumIntelligence}</h2>
          {isDemo && (
            <span className="ml-auto text-[10px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-2 py-0.5 rounded-full">
              {t.dashboard.demoLabel}
            </span>
          )}
        </div>

        <div className="flex gap-1 mb-5 bg-[#0d0d0d] rounded p-1">
          {(["score", "insights"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded transition-all font-medium",
                tab === tabKey ? "bg-[#1a1a1a] text-white" : "text-[#888] hover:text-white"
              )}
            >
              {tabKey === "score" ? t.dashboard.tabScore : t.dashboard.tabInsights}
            </button>
          ))}
        </div>

        {tab === "score" && (
          <div>
            {loadingIntel ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-16 bg-[#1a1a1a] rounded w-32" />
                <div className="h-3 bg-[#1a1a1a] rounded" />
                <div className="h-3 bg-[#1a1a1a] rounded w-3/4" />
              </div>
            ) : !intel || (intel.totalDecisions === 0 && !isDemo) ? (
              <div className="text-center py-4">
                <p className="text-sm text-white mb-1">{t.dashboard.scoreUnlock}</p>
                <p className="text-xs text-[#888]">{t.dashboard.scoreUnlockDesc}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-bold font-mono" style={{ color: "#C9A84C" }}>
                    {intel.score}
                  </span>
                  <div className="pb-1.5">
                    <p className="text-xs text-[#888]">{t.dashboard.scoreTitle}</p>
                    <p className="text-xs text-[#555]">{t.dashboard.scoreBased} {intel.totalDecisions} {t.dashboard.scoreDecisions}</p>
                  </div>
                  <div className={cn("ml-auto flex items-center gap-1 text-xs pb-1.5", trendColor)}>
                    <TrendIcon className="w-3 h-3" />
                    <span className="capitalize">{intel.trend}</span>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {subScoreLabels.map(({ key, label }) => {
                    const val = intel.subScores[key] ?? 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#888]">{label}</span>
                          <span className="text-white font-mono">{val}</span>
                        </div>
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                            className="h-full rounded-full bg-gold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "insights" && (
          <div className="space-y-3">
            {loadingIntel ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-12 bg-[#1a1a1a] rounded" />
                <div className="h-12 bg-[#1a1a1a] rounded" />
              </div>
            ) : !intel || intel.blindSpots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-white mb-1">{t.dashboard.noPatterns}</p>
                <p className="text-xs text-[#888]">{t.dashboard.noPatternsDesc}</p>
              </div>
            ) : (
              intel.blindSpots.map((spot, i) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{spot.pattern}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded border", severityColors[spot.severity] ?? severityColors.low)}>
                      {spot.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#888] leading-relaxed">{spot.recommendation}</p>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Market Radar */}
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-gold" />
          <h2 className="text-sm font-semibold text-white">{t.dashboard.marketRadar}</h2>
          <Zap className="w-3.5 h-3.5 text-gold ml-auto" />
          {isDemo && (
            <span className="text-[10px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-2 py-0.5 rounded-full">
              {t.dashboard.demoLabel}
            </span>
          )}
        </div>

        {loadingSignals ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-[#1a1a1a] rounded" />
            <div className="h-14 bg-[#1a1a1a] rounded" />
            <div className="h-14 bg-[#1a1a1a] rounded" />
          </div>
        ) : signals.length === 0 ? (
          <p className="text-xs text-[#888] text-center py-4">{t.dashboard.noSignals}</p>
        ) : (
          <div className="space-y-3">
            {signals.slice(0, 3).map((signal) => (
              <div key={signal.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-white leading-tight">{signal.title}</p>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border flex-shrink-0", impactColors[signal.impact] ?? impactColors.low)}>
                    {signal.impact}
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed line-clamp-2">{signal.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Risk Badge ─────────────────────────────────────────────────────────────────

function RiskBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-red-400 bg-red-400/10 border-red-400/20"
    : score >= 40 ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
    : "text-green-400 bg-green-400/10 border-green-400/20";
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded border font-mono font-semibold", color)}>
      {score}
    </span>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

interface PlanData {
  plan: Plan;
  usage: { decisionsThisMonth: number };
  limits: { decisionsPerMonth: number };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loadingDecisions, setLoadingDecisions] = useState(true);
  const [demoDismissed, setDemoDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPlanData(data); });

    fetch("/api/decisions?limit=3")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { if (Array.isArray(data)) setDecisions(data); })
      .finally(() => setLoadingDecisions(false));
  }, []);

  const isDemo = !loadingDecisions && decisions.length === 0;
  const showDemoBanner = isDemo && !demoDismissed;
  const displayDecisions = isDemo ? DEMO_DECISIONS : decisions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: decision }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          toast("You've reached your plan limit. Upgrade for more decisions.", "error");
          return;
        }
        throw new Error("Failed");
      }
      router.push(`/dashboard/decision/${data.id}`);
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(iso).toLocaleDateString();
  };

  const recommendationColor = (rec: string | null) => {
    if (!rec) return "text-[#888]";
    const r = rec.toUpperCase();
    if (r.includes("GO FOR IT") || r.includes("PROCEED")) return "text-green-400";
    if (r.includes("RECONSIDER") || r.includes("AVOID")) return "text-red-400";
    return "text-amber-400";
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Demo Banner */}
      <AnimatePresence>
        {showDemoBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-[#0d0d0d] border border-[#C9A84C]/25 rounded-lg shadow-[0_0_20px_rgba(201,168,76,0.06)]"
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {t.dashboard.demoLabel}
              </span>
              <p className="text-xs text-[#888]">{t.dashboard.demoBanner}</p>
            </div>
            <button
              onClick={() => setDemoDismissed(true)}
              className="text-[#555] hover:text-[#888] transition-colors flex-shrink-0"
              aria-label={t.dashboard.demoDismiss}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{t.dashboard.greeting}, {userName}.</h1>
          {planData && (
            <span className={`px-2 py-0.5 text-xs font-semibold border border-current rounded-full ${PLAN_DISPLAY[planData.plan].color}`}>
              {PLAN_DISPLAY[planData.plan].label}
            </span>
          )}
        </div>
        <p className="text-text-secondary mt-1">{t.dashboard.subtitle}</p>
      </motion.div>

      {planData && planData.plan === "FREE_TRIAL" && planData.usage.decisionsThisMonth >= 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-[#C9A84C]">
            You&apos;ve used {planData.usage.decisionsThisMonth} of {PLAN_LIMITS.FREE_TRIAL.decisionsPerMonth} free decisions.{" "}
            <Link href="/pricing" className="underline font-semibold hover:text-[#d4b660] transition-colors">
              Upgrade for unlimited access.
            </Link>
          </p>
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 space-y-6">
          {/* New Decision Form */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">{t.dashboard.newDecision}</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder={t.dashboard.placeholder}
                  className="w-full h-32 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm rounded-lg p-4 resize-none focus:outline-none focus:border-gold/50 focus:shadow-[0_0_0_2px_rgba(201,168,76,0.08)] placeholder:text-[#444444] transition-all duration-200"
                />
                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                  {t.dashboard.quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setDecision(action + ": ")}
                      className="px-3 py-1 text-xs font-medium text-text-secondary border border-[#1a1a1a] rounded hover:border-gold/30 hover:text-gold transition-all duration-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">{decision.length} {t.dashboard.characters}</p>
                  <Button type="submit" loading={loading} disabled={!decision.trim()} className="gap-2">
                    {t.dashboard.analyzeDecision}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Recent Decisions */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{t.dashboard.recentDecisions}</h2>
              <Link href="/dashboard/history" className="text-xs text-text-secondary hover:text-gold transition-colors">
                {t.dashboard.viewAll}
              </Link>
            </div>
            {loadingDecisions ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-[#111] rounded-lg" />
                <div className="h-20 bg-[#111] rounded-lg" />
              </div>
            ) : (
              <div className="space-y-3">
                {displayDecisions.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      "bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 transition-colors",
                      isDemo ? "opacity-80 cursor-default" : "hover:border-gold/20 cursor-pointer"
                    )}
                    onClick={() => !isDemo && router.push(`/dashboard/decision/${d.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-snug line-clamp-1">{d.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {d.recommendation && (
                            <span className={cn("text-xs font-semibold", recommendationColor(d.recommendation))}>
                              {d.recommendation}
                            </span>
                          )}
                          <span className="text-xs text-[#555]">{formatDate(d.createdAt)}</span>
                        </div>
                      </div>
                      {d.riskScore !== null && <RiskBadge score={d.riskScore} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Alert Feed */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{t.dashboard.alertFeed}</h2>
              <Link href="/dashboard/alerts" className="text-xs text-text-secondary hover:text-gold transition-colors">
                {t.dashboard.manage}
              </Link>
            </div>
            {isDemo ? (
              <div className="space-y-2">
                {[
                  "AI sector growth up 34% this quarter — opportunity for your market",
                  "3 competitors raised funding this week — market is heating up",
                  "Economic indicators suggest favorable conditions for B2B expansion",
                ].map((alert, i) => (
                  <div key={i} className="bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 opacity-80">
                    <div className="flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#888] leading-relaxed">{alert}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-10 text-center border-dashed border-[#1a1a1a]">
                <Bell className="w-7 h-7 text-[#333333] mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-1">{t.dashboard.noAlerts}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{t.dashboard.noAlertsDesc}</p>
              </Card>
            )}
          </motion.div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
            <IntelligencePanel isDemo={isDemo} />
          </motion.div>

          {/* Active Rooms */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">{t.dashboard.activeRooms}</h2>
              <Link href="/dashboard/rooms" className="text-xs text-text-secondary hover:text-gold transition-colors">
                {t.dashboard.viewAll}
              </Link>
            </div>
            {isDemo ? (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 opacity-80">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Series B Strategy Discussion</p>
                    <p className="text-xs text-[#555] mt-1">2 participants · Active 2 hours ago</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
              </div>
            ) : (
              <Card className="p-10 text-center border-dashed border-[#1a1a1a]">
                <Users className="w-7 h-7 text-[#333333] mx-auto mb-3" />
                <p className="text-sm font-medium text-white mb-1">{t.dashboard.noRooms}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{t.dashboard.noRoomsDesc}</p>
              </Card>
            )}
          </motion.div>

          {/* Enemy Mode card (moved from sidebar) */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
            <Link href="/dashboard/enemy-mode">
              <Card className="p-4 border-[#1a1a1a] hover:border-[#C9A84C]/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A84C]/15 transition-colors">
                    <ShieldAlert className="w-4 h-4 text-[#C9A84C]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.dashboard.enemyModeTitle}</p>
                    <p className="text-xs text-[#888] mt-0.5">{t.dashboard.enemyModeDesc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#555] ml-auto group-hover:text-[#C9A84C] transition-colors" />
                </div>
              </Card>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Strategic Tools Hub */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.55 }} className="mt-8">
        <StrategicToolsHub
          role={((session?.user as { role?: string })?.role ?? "FOUNDER") as "FOUNDER" | "INVESTOR" | "EXECUTIVE"}
          plan={(planData?.plan ?? "FREE_TRIAL") as import("@/lib/plans").Plan}
        />
      </motion.div>
    </div>
  );
}
