"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Plus, Trash2, Check, ChevronRight, X, ExternalLink,
  Zap, Radio, Lightbulb, BarChart2, Calendar, AlertTriangle,
  DollarSign, TrendingUp, Cpu, Eye,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertRecord {
  id: string;
  topic: string;
  keywords: string[];
  frequency: string;
  active: boolean;
  lastFired: string | null;
  triggerCount: number;
  templateId: string | null;
  history: HistoryItem[];
}

interface HistoryItem {
  id: string;
  alertId: string;
  headline: string;
  summary: string;
  source: string;
  url: string | null;
  isRead: boolean;
  triggeredAt: string;
  alert?: { topic: string; templateId: string | null };
}

interface PageData {
  alerts: AlertRecord[];
  history: HistoryItem[];
  digestMode: boolean;
  alertIndustry: string | null;
  usedPitch: boolean;
  usedIdea: boolean;
  usedCompass: boolean;
}

// ─── Template definitions ─────────────────────────────────────────────────────

const TEMPLATE_IDS = ["tpl_funding", "tpl_ai_tools", "tpl_competitors", "tpl_problems", "tpl_market"];
const TEMPLATE_ICONS = ["💰", "🚀", "⚠️", "💡", "📈"];
const TEMPLATE_FREQS = ["DAILY", "WEEKLY", "DAILY", "WEEKLY", "WEEKLY"];
const TEMPLATE_TAGS = ["tagPopular", "tagTrending", "tagStrategic", "tagIdeas", "tagWeekly"] as const;
const TAG_COLORS: Record<string, string> = {
  tagPopular: "bg-[#7C3AED]/20 text-[#8B7CF8] border-[#7C3AED]/30",
  tagTrending: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  tagStrategic: "bg-red-500/20 text-red-400 border-red-500/30",
  tagIdeas: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  tagWeekly: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
};

// ─── Signal color by type ─────────────────────────────────────────────────────

function signalBorderColor(tpl: string | null | undefined): string {
  if (!tpl) return "border-l-[#7C3AED]";
  if (tpl === "tpl_funding") return "border-l-[#C9A84C]";
  if (tpl === "tpl_competitors") return "border-l-red-500";
  if (tpl === "tpl_ai_tools" || tpl === "tpl_problems") return "border-l-green-500";
  return "border-l-[#7C3AED]";
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border border-green-500/40 bg-[#0F0A1F] text-green-400 text-sm font-medium shadow-lg flex items-center gap-2"
    >
      <Check className="w-4 h-4" /> {msg}
    </motion.div>
  );
}

// ─── Radar empty animation ────────────────────────────────────────────────────

function RadarPulse() {
  return (
    <div className="relative w-16 h-16 mx-auto">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-[#7C3AED]/40"
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <Radio className="w-7 h-7 text-[#7C3AED]" />
      </div>
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, gold }: { checked: boolean; onChange: (v: boolean) => void; gold?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
        checked ? (gold ? "bg-[#C9A84C]" : "bg-[#7C3AED]") : "bg-[#1A1040]"
      }`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  idx,
  tl,
  activated,
  onActivate,
}: {
  idx: number;
  tl: Record<string, string | string[]>;
  activated: boolean;
  onActivate: () => void;
}) {
  const titleKey = `tpl${idx + 1}Title` as keyof typeof tl;
  const descKey = `tpl${idx + 1}Desc` as keyof typeof tl;
  const tagKey = TEMPLATE_TAGS[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`p-4 rounded-xl border transition-all duration-200 ${
        activated
          ? "border-green-500/40 bg-green-500/5"
          : "border-[#1A1040] bg-[#0F0A1F] hover:border-[#7C3AED]/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{TEMPLATE_ICONS[idx]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-white text-sm font-semibold">{tl[titleKey] as string}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLORS[tagKey]}`}>
              {tl[tagKey] as string}
            </span>
          </div>
          <p className="text-[#8B7CF8] text-xs leading-relaxed">{tl[descKey] as string}</p>
        </div>
      </div>
      <div className="mt-3">
        {activated ? (
          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> {tl.alreadyActive as string}
          </div>
        ) : (
          <button
            onClick={onActivate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A84C] text-[#06040F] text-xs font-bold hover:bg-[#D4B85C] transition-colors"
          >
            {tl.createAlert as string} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Active alert card ────────────────────────────────────────────────────────

function ActiveAlertCard({
  alert,
  tl,
  onToggle,
  onDelete,
}: {
  alert: AlertRecord;
  tl: Record<string, string | string[]>;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const freqLabel: Record<string, string> = {
    REALTIME: tl.realtime as string,
    DAILY: tl.daily as string,
    WEEKLY: tl.weekly as string,
  };
  const freqColors: Record<string, string> = {
    REALTIME: "bg-red-500/20 text-red-400 border-red-500/30",
    DAILY: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
    WEEKLY: "bg-[#7C3AED]/20 text-[#8B7CF8] border-[#7C3AED]/30",
  };
  const lastFiredText = alert.lastFired
    ? `${tl.lastTriggered as string} ${new Date(alert.lastFired).toLocaleDateString()}`
    : tl.never as string;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-4 rounded-xl border bg-[#0F0A1F] transition-opacity ${
        alert.active ? "border-[#1A1040]" : "border-[#1A1040] opacity-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          alert.active ? "bg-[#7C3AED]/20 text-[#8B7CF8]" : "bg-[#1A1040] text-[#8B7CF8]/40"
        }`}>
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white text-sm font-semibold truncate">{alert.topic}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${freqColors[alert.frequency] ?? freqColors.DAILY}`}>
              {freqLabel[alert.frequency] ?? alert.frequency}
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${alert.active ? "bg-green-400" : "bg-[#8B7CF8]/30"}`} />
              <span className="text-[10px] text-[#8B7CF8]/60">{alert.active ? tl.activeNow as string : tl.paused as string}</span>
            </span>
          </div>
          <p className="text-xs text-[#8B7CF8]/50 mt-0.5">{lastFiredText}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle checked={alert.active} onChange={onToggle} />
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-[#8B7CF8]/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title={tl.deleteAlert as string}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── History feed item ────────────────────────────────────────────────────────

function HistoryFeedItem({
  item,
  tl,
  onMarkRead,
}: {
  item: HistoryItem;
  tl: Record<string, string | string[]>;
  onMarkRead: () => void;
}) {
  const borderColor = signalBorderColor(item.alert?.templateId);
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "< 1h ago";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F] border-l-4 ${borderColor} ${
        item.isRead ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[#8B7CF8] text-[10px] font-medium uppercase tracking-wider">{item.alert?.topic ?? "Signal"}</p>
            <span className="text-[#8B7CF8]/30 text-[10px]">·</span>
            <span className="text-[#8B7CF8]/40 text-[10px]">{timeAgo(item.triggeredAt)}</span>
          </div>
          <p className="text-white text-sm font-semibold leading-snug mb-1">{item.headline}</p>
          <p className="text-[#8B7CF8] text-xs leading-relaxed">{item.summary}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[#8B7CF8]/40 text-[10px]">{item.source}</span>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#C9A84C] text-[10px] font-medium hover:text-[#D4B85C] transition-colors"
              >
                {tl.readMore as string} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {!item.isRead && (
          <button
            onClick={onMarkRead}
            className="flex-shrink-0 w-2 h-2 rounded-full bg-[#7C3AED] mt-1.5 hover:bg-[#C9A84C] transition-colors"
            title={tl.markRead as string}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Smart suggestion card ────────────────────────────────────────────────────

function SmartSuggest({
  icon,
  text,
  btnLabel,
  onAction,
  onDismiss,
}: {
  icon: React.ReactNode;
  text: string;
  btnLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0 text-[#8B7CF8]">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-white text-sm leading-relaxed mb-2">{text}</p>
        <button
          onClick={onAction}
          className="text-xs font-bold text-[#C9A84C] hover:text-[#D4B85C] transition-colors flex items-center gap-1"
        >
          {btnLabel} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <button onClick={onDismiss} className="text-[#8B7CF8]/40 hover:text-white transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Create modal (3 steps) ───────────────────────────────────────────────────

function CreateModal({
  open,
  onClose,
  onCreated,
  tl,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (a: AlertRecord) => void;
  tl: Record<string, string | string[]>;
}) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [freq, setFreq] = useState("DAILY");
  const [loading, setLoading] = useState(false);

  const chips = (tl.exampleChips as string[]) ?? [];

  async function submit() {
    if (!topic.trim()) return;
    setLoading(true);
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, frequency: freq }),
    });
    if (res.ok) {
      const data = await res.json();
      onCreated(data);
    }
    setLoading(false);
    onClose();
    setStep(0); setTopic(""); setFreq("DAILY");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_40px_rgba(124,58,237,0.2)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1040]">
          <div className="flex items-center gap-3">
            {[tl.stepWhat as string, tl.stepWhen as string, tl.stepConfirm as string].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                  i <= step ? "bg-[#7C3AED] text-white" : "bg-[#1A1040] text-[#8B7CF8]"
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? "text-white" : "text-[#8B7CF8]/40"}`}>{s}</span>
                {i < 2 && <div className="w-4 h-px bg-[#1A1040] mx-1" />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-[#8B7CF8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-[#8B7CF8] text-sm mb-3">{tl.topic as string}</p>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && topic.trim()) setStep(1); }}
                  placeholder={tl.topicPlaceholder as string}
                  autoFocus
                  className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-white/30 outline-none bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED] transition-colors mb-4"
                />
                <div className="flex flex-wrap gap-2 mb-5">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setTopic(chip)}
                      className="px-3 py-1.5 rounded-full text-xs border border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 hover:text-white transition-colors bg-[#06040F]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  disabled={!topic.trim()}
                  className="w-full h-10 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-colors"
                >
                  {tl.stepWhen as string} →
                </button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-[#8B7CF8] text-sm mb-4">{tl.frequency as string}</p>
                <div className="space-y-2 mb-5">
                  {[
                    { val: "REALTIME", label: tl.realtime as string, icon: <Zap className="w-4 h-4 text-red-400" />, desc: "Instant" },
                    { val: "DAILY", label: tl.daily as string, icon: <Calendar className="w-4 h-4 text-[#C9A84C]" />, desc: "9am daily" },
                    { val: "WEEKLY", label: tl.weekly as string, icon: <BarChart2 className="w-4 h-4 text-[#8B7CF8]" />, desc: "Monday morning" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setFreq(opt.val)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        freq === opt.val ? "border-[#7C3AED] bg-[#7C3AED]/10" : "border-[#1A1040] bg-[#06040F] hover:border-[#7C3AED]/40"
                      }`}
                    >
                      {opt.icon}
                      <div>
                        <p className="text-white text-sm font-medium">{opt.label}</p>
                        <p className="text-[#8B7CF8] text-xs">{opt.desc}</p>
                      </div>
                      {freq === opt.val && <Check className="w-4 h-4 text-[#7C3AED] ml-auto" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(0)} className="flex-1 h-10 border border-[#1A1040] text-[#8B7CF8] rounded-xl text-sm hover:border-[#7C3AED]/40 transition-colors">←</button>
                  <button onClick={() => setStep(2)} className="flex-1 h-10 bg-[#7C3AED] text-white rounded-xl text-sm font-medium hover:bg-[#6D28D9] transition-colors">{tl.stepConfirm as string} →</button>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-[#8B7CF8] text-sm mb-4">{tl.previewTitle as string}</p>
                <div className="p-4 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5 mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-[#8B7CF8]" />
                    <p className="text-white font-semibold text-sm">{topic}</p>
                  </div>
                  <p className="text-xs text-[#8B7CF8]">
                    {freq === "REALTIME" ? tl.realtime as string : freq === "DAILY" ? tl.daily as string : tl.weekly as string}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 h-10 border border-[#1A1040] text-[#8B7CF8] rounded-xl text-sm hover:border-[#7C3AED]/40 transition-colors">←</button>
                  <button
                    onClick={submit}
                    disabled={loading}
                    className="flex-1 h-10 bg-[#C9A84C] text-[#06040F] rounded-xl text-sm font-bold hover:bg-[#D4B85C] disabled:opacity-50 transition-colors"
                  >
                    {loading ? "..." : tl.createAlert as string}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { t } = useLanguage();
  const tl = t.alerts as Record<string, string | string[]>;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [activatedTpls, setActivatedTpls] = useState<Set<string>>(new Set());
  const [digestMode, setDigestMode] = useState(false);
  const [dismissedSuggests, setDismissedSuggests] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const d: PageData = await res.json();
        setData(d);
        setDigestMode(d.digestMode);
        const actTpls = new Set(d.alerts.filter((a) => a.templateId).map((a) => a.templateId!));
        setActivatedTpls(actTpls);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function activateTemplate(idx: number) {
    const tplId = TEMPLATE_IDS[idx];
    if (activatedTpls.has(tplId)) return;
    const titleKey = `tpl${idx + 1}Title`;
    const topic = tl[titleKey] as string;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, frequency: TEMPLATE_FREQS[idx], templateId: tplId }),
    });
    if (res.ok || res.status === 409) {
      setActivatedTpls((prev) => { const s = new Set(Array.from(prev)); s.add(tplId); return s; });
      if (res.ok) {
        const newAlert: AlertRecord = await res.json();
        setData((prev) => prev ? { ...prev, alerts: [newAlert, ...prev.alerts] } : prev);
      }
      setToast(tl.activated as string);
    }
  }

  async function toggleAlert(id: string, active: boolean) {
    const res = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    if (res.ok) {
      const updated: AlertRecord = await res.json();
      setData((prev) => prev ? {
        ...prev,
        alerts: prev.alerts.map((a) => a.id === id ? { ...a, ...updated } : a),
      } : prev);
    }
  }

  async function deleteAlert(id: string) {
    await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setData((prev) => prev ? { ...prev, alerts: prev.alerts.filter((a) => a.id !== id) } : prev);
  }

  async function toggleDigest(val: boolean) {
    setDigestMode(val);
    await fetch("/api/alerts/digest", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ digestMode: val }),
    });
  }

  async function markRead(id: string) {
    await fetch("/api/alerts/history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setData((prev) => prev ? {
      ...prev,
      history: prev.history.map((h) => h.id === id ? { ...h, isRead: true } : h),
    } : prev);
  }

  async function markAllRead() {
    await fetch("/api/alerts/history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setData((prev) => prev ? {
      ...prev,
      history: prev.history.map((h) => ({ ...h, isRead: true })),
    } : prev);
  }

  const activeAlerts = data?.alerts ?? [];
  const history = data?.history ?? [];
  const unreadCount = history.filter((h) => !h.isRead).length;

  // Smart suggestions visibility
  const showPitchSuggest = data?.usedPitch && !dismissedSuggests.has("pitch") && !activatedTpls.has("tpl_funding");
  const showIdeaSuggest = data?.usedIdea && !dismissedSuggests.has("idea") && !activatedTpls.has("tpl_problems");
  const showCompassSuggest = data?.usedCompass && !dismissedSuggests.has("compass") && !activatedTpls.has("tpl_market");
  const smartSuggests = [
    showPitchSuggest && { key: "pitch", icon: <DollarSign className="w-4 h-4" />, text: tl.smartSuggestPitch as string, btn: tl.smartSuggestPitchBtn as string, tplIdx: 0 },
    showIdeaSuggest && { key: "idea", icon: <Lightbulb className="w-4 h-4" />, text: tl.smartSuggestIdea as string, btn: tl.smartSuggestIdeaBtn as string, tplIdx: 3 },
    showCompassSuggest && { key: "compass", icon: <TrendingUp className="w-4 h-4" />, text: tl.smartSuggestCompass as string, btn: tl.smartSuggestCompassBtn as string, tplIdx: 4 },
  ].filter(Boolean).slice(0, 2) as { key: string; icon: React.ReactNode; text: string; btn: string; tplIdx: number }[];

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-7 h-7 text-[#7C3AED]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#C9A84C] text-[#06040F] text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{tl.title as string}</h1>
            <p className="text-[#8B7CF8] text-sm">{tl.subtitle as string}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Digest mode toggle */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1A1040] bg-[#0F0A1F]">
            <span className="text-xs text-[#8B7CF8] font-medium">{tl.digestMode as string}</span>
            <Toggle checked={digestMode} onChange={toggleDigest} gold />
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> {tl.newAlert as string}
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Smart AI Suggestions ── */}
          <AnimatePresence>
            {smartSuggests.length > 0 && (
              <motion.section key="smart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> {tl.smartSuggestTitle as string}
                </p>
                <div className="space-y-3">
                  {smartSuggests.map((s) => (
                    <SmartSuggest
                      key={s.key}
                      icon={s.icon}
                      text={s.text}
                      btnLabel={s.btn}
                      onAction={() => activateTemplate(s.tplIdx)}
                      onDismiss={() => setDismissedSuggests((prev) => { const ns = new Set(Array.from(prev)); ns.add(s.key); return ns; })}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Recommended Templates ── */}
          <section>
            <div className="mb-4">
              <p className="text-white font-semibold text-base">{tl.recommendedTitle as string}</p>
              <p className="text-[#8B7CF8] text-xs">{tl.recommendedSubtitle as string}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_IDS.map((tplId, i) => (
                <TemplateCard
                  key={tplId}
                  idx={i}
                  tl={tl}
                  activated={activatedTpls.has(tplId)}
                  onActivate={() => activateTemplate(i)}
                />
              ))}
            </div>
          </section>

          {/* ── Active Alerts ── */}
          <section>
            <p className="text-white font-semibold text-base mb-4">{tl.activeTitle as string}</p>
            {activeAlerts.length === 0 ? (
              <div className="p-8 rounded-xl border border-[#1A1040] bg-[#0F0A1F] text-center">
                <Bell className="w-8 h-8 text-[#1A1040] mx-auto mb-3" />
                <p className="text-[#8B7CF8] text-sm">{tl.noAlerts as string}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {activeAlerts.map((alert) => (
                    <ActiveAlertCard
                      key={alert.id}
                      alert={alert}
                      tl={tl}
                      onToggle={() => toggleAlert(alert.id, !alert.active)}
                      onDelete={() => deleteAlert(alert.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* ── Alert History Feed ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-semibold text-base">{tl.historyTitle as string}</p>
                <p className="text-[#8B7CF8] text-xs">{tl.historySubtitle as string}</p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#8B7CF8] hover:text-white transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> {tl.markAllRead as string}
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="p-10 rounded-xl border border-[#1A1040] bg-[#0F0A1F] flex flex-col items-center gap-4">
                <RadarPulse />
                <p className="text-[#8B7CF8] text-sm text-center max-w-xs leading-relaxed">
                  {tl.historyEmpty as string}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <HistoryFeedItem key={item.id} item={item} tl={tl} onMarkRead={() => markRead(item.id)} />
                ))}
              </div>
            )}
          </section>

          {/* ── Digest mode (mobile) ── */}
          <section className="sm:hidden">
            <div className="p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F] flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm font-semibold">{tl.digestMode as string}</p>
                <p className="text-[#8B7CF8] text-xs">{tl.digestModeDesc as string}</p>
              </div>
              <Toggle checked={digestMode} onChange={toggleDigest} gold />
            </div>
          </section>

        </div>
      )}

      {/* Create modal */}
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(a) => {
          setData((prev) => prev ? { ...prev, alerts: [a, ...prev.alerts] } : prev);
          setToast(tl.activated as string);
        }}
        tl={tl}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </div>
  );
}
