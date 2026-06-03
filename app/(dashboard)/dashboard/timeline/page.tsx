"use client";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, XCircle, MinusCircle, Loader2, ChevronDown, ChevronUp, AlertTriangle, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface Outcome {
  outcome: "correct" | "incorrect" | "partial";
  what_happened: string;
  lesson_learned: string;
  reviewed_at: string;
}

interface TimelineItem {
  id: string;
  title: string;
  type: string;
  riskScore: number | null;
  recommendation: string | null;
  createdAt: string;
  outcome: Outcome | null;
  pendingReview: boolean;
}

interface Insights {
  insights: { pattern: string; evidence: string; confidence: string; recommendation: string }[];
  accuracyScore: number;
  strongestCategory: string;
  summary: string;
}

const outcomeConfig = {
  correct: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20", label: "Correct" },
  partial: { icon: MinusCircle, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Partial" },
  incorrect: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Incorrect" },
};

function ReviewModal({ item, onSave, onClose }: {
  item: TimelineItem;
  onSave: (outcome: Outcome) => void;
  onClose: () => void;
}) {
  const [outcome, setOutcome] = useState<"correct" | "incorrect" | "partial">("correct");
  const [whatHappened, setWhatHappened] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId: item.id, outcome, whatHappened, lessonLearned }),
      });
      if (res.ok) {
        onSave({ outcome, what_happened: whatHappened, lesson_learned: lessonLearned, reviewed_at: new Date().toISOString() });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full max-w-md space-y-4"
      >
        <div>
          <h3 className="text-white font-semibold">How did this decision turn out?</h3>
          <p className="text-xs text-[#888888] mt-1 leading-relaxed">{item.title}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["correct", "partial", "incorrect"] as const).map((o) => {
            const cfg = outcomeConfig[o];
            const Icon = cfg.icon;
            return (
              <button key={o} onClick={() => setOutcome(o)}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all",
                  outcome === o ? `${cfg.bg} ${cfg.color}` : "border-[#2a2a2a] text-[#888888] hover:border-[#3a3a3a]")}>
                <Icon className="w-5 h-5" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#888888]">What happened?</label>
          <textarea value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)}
            placeholder="Describe the actual outcome..." rows={3}
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#888888]">Lesson learned</label>
          <textarea value={lessonLearned} onChange={(e) => setLessonLearned(e.target.value)}
            placeholder="What would you do differently?" rows={2}
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#1a1a1a] text-[#888888] text-sm hover:text-white transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-[#C9A84C] text-[#080808] text-sm font-semibold hover:bg-[#C9A84C]/90 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Save Outcome"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function TimelinePage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [reviewing, setReviewing] = useState<TimelineItem | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setItems(d); })
      .finally(() => setLoading(false));
  }, []);

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/timeline", { method: "PUT" });
      const data = await res.json();
      if (data.insights) setInsights(data);
    } finally {
      setLoadingInsights(false);
    }
  }

  const pending = items.filter((i) => i.pendingReview && !i.outcome);
  const reviewed = items.filter((i) => i.outcome);

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      {reviewing && (
        <ReviewModal
          item={reviewing}
          onSave={(outcome) => setItems((prev) => prev.map((i) => i.id === reviewing!.id ? { ...i, outcome, pendingReview: false } : i))}
          onClose={() => setReviewing(null)}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">{t.timeline.title}</h1>
          </div>
          <p className="text-[#888888] text-sm">{t.timeline.subtitle}</p>
        </div>

        {/* Stats */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{items.length}</p>
              <p className="text-xs text-[#888888] mt-0.5">Total Decisions</p>
            </div>
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{reviewed.filter((i) => i.outcome?.outcome === "correct").length}</p>
              <p className="text-xs text-[#888888] mt-0.5">Correct</p>
            </div>
            <div className="bg-[#111111] border border-amber-400/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{pending.length}</p>
              <p className="text-xs text-[#888888] mt-0.5">Pending Review</p>
            </div>
          </div>
        )}

        {/* Pending Reviews */}
        {pending.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-white">Awaiting Your Review</p>
            </div>
            {pending.map((item) => (
              <div key={item.id} className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <p className="text-xs text-[#888888] mt-0.5">
                    {new Date(item.createdAt).toLocaleDateString()} · {item.type}
                  </p>
                </div>
                <button onClick={() => setReviewing(item)}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#C9A84C] text-[#080808] rounded-lg text-xs font-semibold hover:bg-[#C9A84C]/90 transition-all">
                  Review
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights */}
        {reviewed.length >= 3 && (
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#C9A84C]" />
                <p className="text-sm font-semibold text-white">Decision Intelligence</p>
              </div>
              {!insights && (
                <button onClick={loadInsights} disabled={loadingInsights}
                  className="text-xs text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors">
                  {loadingInsights ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : t.timeline.getInsights}
                </button>
              )}
            </div>
            {insights && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#C9A84C]">{insights.accuracyScore}%</p>
                    <p className="text-xs text-[#888888]">Accuracy Score</p>
                  </div>
                  <div className="flex-1 border-l border-[#1a1a1a] pl-3">
                    <p className="text-sm text-white">{insights.summary}</p>
                    {insights.strongestCategory && (
                      <p className="text-xs text-[#888888] mt-1">Strongest in: <span className="text-[#C9A84C]">{insights.strongestCategory}</span></p>
                    )}
                  </div>
                </div>
                {insights.insights.map((ins, i) => (
                  <div key={i} className="bg-[#080808] rounded-lg p-3 space-y-1">
                    <p className="text-sm text-white font-medium">{ins.pattern}</p>
                    <p className="text-xs text-[#888888]">{ins.evidence}</p>
                    <p className="text-xs text-[#C9A84C]">→ {ins.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Full Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#1a1a1a] rounded-lg p-16 text-center">
            <Clock className="w-10 h-10 text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">{t.timeline.noDecisions}</p>
            <p className="text-[#888888] text-sm">{t.timeline.noDecisionsDesc}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{t.nav.history}</p>
            {items.map((item) => {
              const outcfg = item.outcome ? outcomeConfig[item.outcome.outcome] : null;
              const OutIcon = outcfg?.icon;
              return (
                <div key={item.id} className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#1a1a1a]/40 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: outcfg ? undefined : "#2a2a2a", background: outcfg ? undefined : "#2a2a2a" }}>
                      {outcfg && <div className={cn("w-2 h-2 rounded-full", outcfg.color.replace("text-", "bg-").replace("-400", "-400"))} />}
                      {!outcfg && <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-[#888888] mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()} · {item.type}
                        {item.riskScore && ` · Risk ${item.riskScore}`}
                      </p>
                    </div>
                    {outcfg && OutIcon && (
                      <span className={cn("text-xs font-medium px-2 py-1 rounded border flex-shrink-0", outcfg.bg, outcfg.color)}>
                        {outcfg.label}
                      </span>
                    )}
                    {item.pendingReview && !item.outcome && (
                      <button onClick={(e) => { e.stopPropagation(); setReviewing(item); }}
                        className="text-xs text-amber-400 border border-amber-400/20 px-2 py-1 rounded hover:bg-amber-400/10 transition-colors flex-shrink-0">
                        Review
                      </button>
                    )}
                    {expandedId === item.id ? <ChevronUp className="w-4 h-4 text-[#888888] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#888888] flex-shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {expandedId === item.id && item.outcome && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#1a1a1a] px-4 pb-4 pt-3 space-y-2 overflow-hidden">
                        {item.outcome.what_happened && (
                          <div><p className="text-xs text-[#888888]">What happened</p><p className="text-sm text-white">{item.outcome.what_happened}</p></div>
                        )}
                        {item.outcome.lesson_learned && (
                          <div><p className="text-xs text-[#888888]">Lesson learned</p><p className="text-sm text-[#C9A84C]">{item.outcome.lesson_learned}</p></div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
