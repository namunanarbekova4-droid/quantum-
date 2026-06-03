"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, Loader2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BriefingEvent {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: string;
  roleImplication: string;
}

interface Briefing {
  summary: string;
  eventCount: number;
  events: BriefingEvent[];
  generatedAt: string;
}

const riskConfig = {
  LOW: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", label: "Low Risk" },
  MEDIUM: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Medium Risk" },
  HIGH: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "High Risk" },
};

function EventCard({ event, index }: { event: BriefingEvent; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const cfg = riskConfig[event.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-[#1a1a1a]/40 transition-colors gap-3"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={cn("text-xs font-semibold px-2 py-1 rounded border flex-shrink-0 mt-0.5", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-sm font-semibold text-white leading-snug">{event.headline}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#888888] flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-[#888888] flex-shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#1a1a1a]"
          >
            <div className="px-4 pb-4 pt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">What Happened</p>
                <p className="text-sm text-white">{event.whatHappened}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">Why It Matters</p>
                <p className="text-sm text-[#888888]">{event.whyItMatters}</p>
              </div>
              <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider mb-1">Recommended Action</p>
                <p className="text-sm text-white">{event.recommendedAction}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1">Role Implication</p>
                <p className="text-sm text-[#888888]">{event.roleImplication}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadBriefing() {
    setError(null);
    try {
      const res = await fetch("/api/briefing");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load briefing");
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await fetch("/api/briefing", { method: "DELETE" });
    await loadBriefing();
  }

  useEffect(() => { loadBriefing(); }, []);

  const generatedTime = briefing?.generatedAt
    ? new Date(briefing.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Newspaper className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">Daily Briefing</h1>
            </div>
            <p className="text-[#888888] text-sm">
              {generatedTime ? `Generated today at ${generatedTime}` : "Personalized intelligence briefing"}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 rounded-lg text-xs transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 animate-pulse">
                <div className="h-3 bg-[#1a1a1a] rounded w-full mb-2" />
                <div className="h-3 bg-[#1a1a1a] rounded w-2/3" />
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 text-[#888888] text-xs pt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A84C]" />
              Generating your personalized briefing...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 text-sm font-medium">Briefing unavailable</p>
              <p className="text-[#888888] text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {briefing && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Summary banner */}
            <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-4 flex items-start gap-3">
              <Zap className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold text-sm">{briefing.summary}</p>
                <p className="text-[#888888] text-xs mt-1">{briefing.eventCount} events analyzed for your role</p>
              </div>
            </div>

            {/* Events */}
            <div className="space-y-3">
              {briefing.events.map((event, i) => (
                <EventCard key={i} event={event} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
