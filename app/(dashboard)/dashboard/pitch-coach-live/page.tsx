"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { getSpeechLocale, getFillerWords, getWeakWords, getStrongWords, SupportedLanguage } from "@/lib/i18n/language-context";
import {
  Mic, MicOff, StopCircle, RotateCcw, Copy, Check,
  AlertTriangle, Flame, Star, Zap, TrendingUp, Award,
  Clock, BarChart2, History, Pause, Play,
  XCircle, CheckCircle,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "setup" | "recording" | "analyzing" | "results";

interface SetupData {
  startupName: string;
  startupDescription: string;
  audienceType: string;
  targetDuration: number;
  pitchGoal: string;
  biggestFear: string;
}

interface FillerCounts {
  um: number; uh: number; like: number; so: number; you_know: number;
}

interface Analysis {
  overall_score: number;
  grade: string;
  bottom_line: string;
  ready_to_pitch: boolean;
  what_worked: Array<{ moment: string; why: string }>;
  critical_problems: Array<{
    problem_name: string;
    severity: "HIGH" | "MEDIUM";
    what_you_said: string;
    why_its_weak: string;
    rewritten_version: string;
  }>;
  missing_completely: string[];
  filler_analysis: {
    total_count: number;
    per_minute: number;
    breakdown: FillerCounts;
    verdict: string;
  };
  pacing: {
    words_per_minute: number;
    verdict: "TOO_SLOW" | "PERFECT" | "TOO_FAST";
    slowest_section: string;
    fastest_section: string;
  };
  investor_reaction: string;
  the_killer_rewrite: string;
  before_next_pitch: string[];
  // New fields
  investor_reactions?: {
    vc: string; angel: string; accelerator: string; customer: string;
  };
  pitch_timeline?: Array<{ label: string; type: "strength" | "weakness" | "neutral"; position: number; note: string }>;
  fundability_probability?: number;
  practice_drills?: Array<{ name: string; instruction: string; duration: string }>;
  emotional_summary?: string;
}

interface HistorySession {
  id: string;
  startupName: string;
  audienceType: string;
  overallScore: number;
  grade: string;
  createdAt: string;
}

// ─── Speech recognition shim ──────────────────────────────────────────────────

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
interface ISpeechRecognitionAlternative { transcript: string; confidence: number; }
interface ISpeechRecognitionResult {
  isFinal: boolean; length: number;
  [j: number]: ISpeechRecognitionAlternative;
}
interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResult[];
}
interface ISpeechRecognitionErrorEvent { error: string; }

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Legacy English-only filler list kept for FillerCounts type compatibility
const FILLER_WORDS_EN = ["um", "uh", "like", "so", "you know", "basically", "kind of", "sort of"];

function countFillers(text: string): FillerCounts {
  const lower = text.toLowerCase();
  const c = (w: string) => (lower.match(new RegExp(`\\b${w.replace(" ", "\\s+")}\\b`, "gi")) ?? []).length;
  return { um: c("um"), uh: c("uh"), like: c("like"), so: c("so"), you_know: c("you know") };
}

function countFillersLocale(text: string, locale: string): Record<string, number> {
  const lang = locale as SupportedLanguage;
  const fillers = getFillerWords(lang);
  const lower = text.toLowerCase();
  const counts: Record<string, number> = {};
  for (const f of fillers) {
    const matches = lower.match(new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) ?? [];
    counts[f] = matches.length;
  }
  return counts;
}

function totalFillers(f: FillerCounts) {
  return f.um + f.uh + f.like + f.so + f.you_know;
}

function calcWPM(text: string, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round((text.trim().split(/\s+/).filter(Boolean).length / seconds) * 60);
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function scoreColor(s: number) {
  if (s >= 70) return "#22C55E";
  if (s >= 55) return "#EAB308";
  return "#EF4444";
}

function gradeColor(g: string) {
  if (g === "A") return "text-green-400";
  if (g === "B") return "text-[#C9A84C]";
  if (g === "C") return "text-yellow-400";
  return "text-red-400";
}

function highlightFillers(text: string, locale: string = 'en'): React.ReactNode[] {
  const lang = locale as SupportedLanguage;
  const fillers = getFillerWords(lang);
  const weakWords = getWeakWords(lang);
  const strongWords = getStrongWords(lang);

  // For CJK languages (Chinese), do character-level detection instead of word-boundary regex
  if (lang === 'zh') {
    const nodes: React.ReactNode[] = [];
    let remaining = text;
    let i = 0;
    while (remaining.length > 0) {
      let matched = false;
      for (const w of fillers) {
        if (remaining.startsWith(w)) {
          nodes.push(<span key={i++} className="text-red-400 font-semibold">{w}</span>);
          remaining = remaining.slice(w.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        for (const w of weakWords) {
          if (remaining.startsWith(w)) {
            nodes.push(<span key={i++} className="text-yellow-400">{w}</span>);
            remaining = remaining.slice(w.length);
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        for (const w of strongWords) {
          if (remaining.startsWith(w)) {
            nodes.push(<span key={i++} className="text-[#C9A84C] font-semibold">{w}</span>);
            remaining = remaining.slice(w.length);
            matched = true;
            break;
          }
        }
      }
      if (!matched) {
        nodes.push(<span key={i++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      }
    }
    return nodes;
  }

  // Word-boundary detection for Latin/Cyrillic scripts
  const tokens = text.split(/(\s+)/);
  return tokens.map((token, i) => {
    const clean = token.toLowerCase().trim();
    if (fillers.some(f => clean === f || clean.startsWith(f + ',') || clean.startsWith(f + '.'))) {
      return <span key={i} className="text-red-400 font-semibold">{token}</span>;
    }
    if (weakWords.some(w => clean.includes(w))) {
      return <span key={i} className="text-yellow-400">{token}</span>;
    }
    if (strongWords.some(s => clean.includes(s.toLowerCase()))) {
      return <span key={i} className="text-[#C9A84C] font-semibold">{token}</span>;
    }
    return <span key={i}>{token}</span>;
  });
}

// Structure detector keyword map — multilingual
const STRUCTURE_KEYWORDS_BY_LANG: Record<string, Record<string, string[]>> = {
  en: {
    problem: ['problem', 'pain', 'struggle', 'challenge', 'frustrated', 'broken'],
    solution: ['solution', 'we built', 'our product', 'we solve', 'helps'],
    market: ['market', 'billion', 'million', 'customers', 'opportunity'],
    whyNow: ['now', 'timing', 'trend', 'shift', 'moment', 'regulation'],
    traction: ['users', 'revenue', 'growth', 'mrr', 'retention'],
    businessModel: ['pricing', 'subscription', 'charge', 'revenue model', 'saas'],
    ask: ['raise', 'looking for', 'seeking', 'investment', 'round', 'funding'],
  },
  ru: {
    problem: ['проблема', 'боль', 'сложность', 'трудность', 'не работает', 'сломано'],
    solution: ['решение', 'мы создали', 'наш продукт', 'мы решаем', 'помогает'],
    market: ['рынок', 'миллиард', 'миллион', 'клиенты', 'возможность'],
    whyNow: ['сейчас', 'момент', 'тренд', 'регуляция', 'сдвиг'],
    traction: ['пользователи', 'выручка', 'рост', 'retention', 'MRR'],
    businessModel: ['подписка', 'цена', 'монетизация', 'модель'],
    ask: ['привлекаем', 'ищем', 'инвестиции', 'раунд', 'финансирование'],
  },
  es: {
    problem: ['problema', 'dolor', 'dificultad', 'frustración', 'roto'],
    solution: ['solución', 'construimos', 'nuestro producto', 'resolvemos', 'ayuda'],
    market: ['mercado', 'billones', 'millones', 'clientes', 'oportunidad'],
    whyNow: ['ahora', 'momento', 'tendencia', 'regulación', 'cambio'],
    traction: ['usuarios', 'ingresos', 'crecimiento', 'mrr', 'retención'],
    businessModel: ['suscripción', 'precio', 'monetización', 'modelo'],
    ask: ['buscamos', 'inversión', 'ronda', 'financiamiento', 'captar'],
  },
  zh: {
    problem: ['问题', '痛点', '困难', '挑战', '不方便'],
    solution: ['解决方案', '我们开发', '我们的产品', '帮助', '解决'],
    market: ['市场', '亿', '万', '客户', '机会'],
    whyNow: ['现在', '时机', '趋势', '政策', '转变'],
    traction: ['用户', '收入', '增长', 'MRR', '留存'],
    businessModel: ['订阅', '定价', '商业模式', '变现'],
    ask: ['融资', '寻找', '投资', '轮', '资金'],
  },
  kk: {
    problem: ['мәселе', 'проблема', 'қиындық', 'ауыртпалық'],
    solution: ['шешім', 'біз жасадық', 'біздің өнім', 'шешеді', 'көмектеседі'],
    market: ['нарық', 'миллиард', 'миллион', 'тұтынушылар', 'мүмкіндік'],
    whyNow: ['қазір', 'уақыт', 'тренд', 'өзгеріс'],
    traction: ['қолданушылар', 'табыс', 'өсім', 'retention'],
    businessModel: ['жазылым', 'баға', 'монетизация', 'модель'],
    ask: ['инвестиция', 'іздейміз', 'қаражат', 'раунд'],
  },
};

const STRUCTURE_SECTION_KEYS = ["problem", "solution", "market", "whyNow", "traction", "businessModel", "ask"] as const;

// Labels by locale — covers all 5 supported languages
const STRUCTURE_LABELS_BY_LANG: Record<string, Record<string, string>> = {
  en: { problem: "Problem", solution: "Solution", market: "Market", whyNow: "Why Now", traction: "Traction", businessModel: "Model", ask: "Ask" },
  ru: { problem: "Проблема", solution: "Решение", market: "Рынок", whyNow: "Почему сейчас", traction: "Трекшн", businessModel: "Модель", ask: "Запрос" },
  es: { problem: "Problema", solution: "Solución", market: "Mercado", whyNow: "Por qué ahora", traction: "Tracción", businessModel: "Modelo", ask: "Solicitud" },
  zh: { problem: "问题", solution: "解决方案", market: "市场", whyNow: "为何现在", traction: "牵引力", businessModel: "模式", ask: "融资需求" },
  kz: { problem: "Мәселе", solution: "Шешім", market: "Нарық", whyNow: "Неліктен қазір", traction: "Трекшн", businessModel: "Модель", ask: "Сұраныс" },
  kk: { problem: "Мәселе", solution: "Шешім", market: "Нарық", whyNow: "Неліктен қазір", traction: "Трекшн", businessModel: "Модель", ask: "Сұраныс" },
};

function getStructureLabels(locale: string): Record<string, string> {
  return STRUCTURE_LABELS_BY_LANG[locale] ?? STRUCTURE_LABELS_BY_LANG.en;
}

const STRUCTURE_SECTION_LABELS: Array<{ key: string; label: string }> = STRUCTURE_SECTION_KEYS.map(k => ({ key: k, label: STRUCTURE_LABELS_BY_LANG.en[k] }));

// Keep STRUCTURE_SECTIONS for backward compatibility with any existing usage
const STRUCTURE_SECTIONS = STRUCTURE_SECTION_LABELS.map(s => ({
  ...s,
  keywords: STRUCTURE_KEYWORDS_BY_LANG.en[s.key] ?? [],
}));

function detectStructure(text: string, locale: string = 'en'): Record<string, boolean> {
  const lower = text.toLowerCase();
  const out: Record<string, boolean> = {};
  const keywordsMap = STRUCTURE_KEYWORDS_BY_LANG[locale] ?? STRUCTURE_KEYWORDS_BY_LANG.en;
  for (const s of STRUCTURE_SECTION_LABELS) {
    const keywords = keywordsMap[s.key] ?? [];
    out[s.key] = keywords.some(k => lower.includes(k));
  }
  return out;
}

// Live confidence: start 60, -10 per 5 fillers, +10 if WPM 110-170, -10 if WPM <80 or >190
function calcConfidence(fillerCount: number, wpm: number): number {
  let c = 60;
  c -= Math.floor(fillerCount / 5) * 10;
  if (wpm >= 110 && wpm <= 170) c += 10;
  if (wpm > 0 && (wpm < 80 || wpm > 190)) c -= 10;
  return Math.max(0, Math.min(100, c));
}

function confidenceLabel(c: number): { label: string; emoji: string; color: string } {
  if (c >= 85) return { label: "Investor-Ready", emoji: "🔥", color: "#C9A84C" };
  if (c >= 65) return { label: "Confident", emoji: "🟢", color: "#22C55E" };
  if (c >= 45) return { label: "Uncertain", emoji: "🟡", color: "#EAB308" };
  return { label: "Nervous", emoji: "🔴", color: "#EF4444" };
}

// ─── Quantum Atom ─────────────────────────────────────────────────────────────

function QuantumAtom() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-6">
      <div className="absolute inset-0 rounded-full logo-glow" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20 logo-orbit-1" />
      <div className="absolute inset-2 rounded-full border border-[#7C3AED]/20 logo-orbit-2" />
      <div className="absolute inset-4 rounded-full border border-[#8B7CF8]/20 logo-orbit-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-[#C9A84C] rounded-full flex items-center justify-center font-mono font-black text-[#06040F] text-sm shadow-[0_0_20px_rgba(201,168,76,0.5)]">
          Q
        </div>
      </div>
    </div>
  );
}

// ─── Ambient orbs background ───────────────────────────────────────────────────

function AmbientOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircleGauge({ score, size = 140 }: { score: number; size?: number }) {
  const r = size * 0.4;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A1040" strokeWidth={size * 0.08} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black text-white" style={{ fontSize: size * 0.22 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, title, icon, color, children }: {
  id?: string; title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5 mb-4 scroll-mt-20">
      <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${color}`}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ title, value, sub, color }: {
  title: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-[#06040F] border border-[#1A1040] rounded-xl p-3">
      <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider mb-1">{title}</p>
      <p className={`font-black text-lg leading-none ${color}`}>{value}</p>
      {sub && <p className="text-white/40 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Premium Waveform ──────────────────────────────────────────────────────────

function Waveform({ data }: { data: number[] }) {
  const bars = data.length > 0 ? data : Array.from({ length: 30 }, () => 8);
  return (
    <div className="flex items-end gap-[3px] h-20 justify-center">
      {bars.slice(0, 30).map((v, i) => {
        const h = Math.max(4, Math.min(80, (v / 255) * 80));
        const isGold = i % 2 === 0;
        return (
          <motion.div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              background: isGold ? "#C9A84C" : "#7C3AED",
              width: "5px",
              minHeight: "4px",
              boxShadow: h > 40
                ? (isGold ? "0 0 8px rgba(201,168,76,0.4)" : "0 0 8px rgba(124,58,237,0.4)")
                : "none",
            }}
            animate={{ height: `${h}px` }}
            transition={{ duration: 0.08, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

// ─── Coach Tip ────────────────────────────────────────────────────────────────

const TIP_STYLES = {
  green:  "border-green-500/40 bg-green-500/10 text-green-300",
  yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  red:    "border-red-500/40 bg-red-500/10 text-red-300",
  purple: "border-[#7C3AED]/40 bg-[#7C3AED]/10 text-[#8B7CF8]",
  gold:   "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]",
};

type TipVariant = keyof typeof TIP_STYLES;

const TIP_TITLE: Record<TipVariant, string> = {
  green: "🎯 Strong",
  gold: "💡 Missed Opportunity",
  red: "⚠ Investor Risk",
  purple: "✨ Persuasion Upgrade",
  yellow: "⚡ Energy",
};

interface CoachTipData { id: number; msg: string; variant: TipVariant; at?: string; }

function CoachTipCard({ tip }: { tip: CoachTipData }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      className={`p-4 rounded-xl border text-xs leading-relaxed ${TIP_STYLES[tip.variant]}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-bold text-[11px] uppercase tracking-wide">{TIP_TITLE[tip.variant]}</span>
        {tip.at && <span className="text-[10px] opacity-60 font-mono">{tip.at}</span>}
      </div>
      {tip.msg}
    </motion.div>
  );
}

// ─── Analyze cards (setup) ─────────────────────────────────────────────────────

const ANALYZE_ITEMS = [
  { icon: "🎯", label: "Persuasion" },
  { icon: "⚡", label: "Energy" },
  { icon: "🧠", label: "Clarity" },
  { icon: "💬", label: "Storytelling" },
  { icon: "🏗", label: "Structure" },
  { icon: "😬", label: "Filler Words" },
  { icon: "👀", label: "Body Language" },
  { icon: "🎤", label: "Confidence" },
  { icon: "📈", label: "Investor Readiness" },
];

const AUDIENCE_OPTIONS = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "accelerator", label: "Accelerator" },
  { value: "demoday", label: "Demo Day" },
  { value: "customer", label: "Customer" },
  { value: "competition", label: "Competition" },
];

const GOAL_OPTIONS = [
  "Raise Money", "Get a Meeting", "Get Users", "Build Excitement", "Win Competition",
];

// ─── Setup screen (PREP MODE) ───────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (d: SetupData) => void }) {
  const { t } = useLanguage();
  const ft = t.features.pitchCoachLive as unknown as Record<string, string>;
  const [form, setForm] = useState<SetupData>({
    startupName: "",
    startupDescription: "",
    audienceType: "angel",
    targetDuration: 3,
    pitchGoal: "Raise Money",
    biggestFear: "",
  });
  const [error, setError] = useState("");
  const [permError, setPermError] = useState("");
  const [requesting, setRequesting] = useState(false);

  async function handleStart() {
    if (!form.startupName.trim()) { setError("Please enter your startup name."); return; }
    if (!form.startupDescription.trim()) { setError("Please describe what your startup does."); return; }
    setError("");
    setRequesting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onStart(form);
    } catch {
      setPermError("Microphone access is required. Please allow microphone in browser settings.");
    }
    setRequesting(false);
  }

  const SRAvailable = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED] transition-colors";
  const labelCls = "block text-xs font-medium text-[#8B7CF8] mb-1.5";

  const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all border ${
        active
          ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
          : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
      <AmbientOrbs />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl"
      >
        <div className="text-center mb-8">
          <QuantumAtom />
          <h1 className="text-4xl font-black text-white mb-2">Prepare Your Pitch</h1>
          <p className="text-[#8B7CF8] text-sm">Tell Quantum who you&apos;re facing. Every session is personalized.</p>
        </div>

        {!SRAvailable && (
          <div className="mb-5 p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Your browser doesn&apos;t support live speech recognition.</p>
              <p className="text-yellow-300/70 text-xs">Please use Chrome, Edge, or Safari on desktop for the best experience.</p>
            </div>
          </div>
        )}

        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 space-y-6 shadow-[0_0_40px_rgba(124,58,237,0.1)]">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{ft.startupName || "Startup name"}</label>
              <input
                value={form.startupName}
                onChange={e => setForm({ ...form, startupName: e.target.value })}
                placeholder="e.g. Quantum"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{ft.targetDuration || "Target duration"}</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(d => (
                  <button
                    key={d}
                    onClick={() => setForm({ ...form, targetDuration: d })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                      form.targetDuration === d
                        ? "bg-[#C9A84C] border-[#C9A84C] text-[#06040F]"
                        : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#C9A84C]/40"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>{ft.startupDescription || "What does your startup do?"}</label>
            <textarea
              value={form.startupDescription}
              onChange={e => setForm({ ...form, startupDescription: e.target.value })}
              placeholder="What you build, who it helps, and why it matters. 2-3 sentences."
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div>
            <label className={labelCls}>Who are you pitching to?</label>
            <div className="grid grid-cols-3 gap-2">
              {AUDIENCE_OPTIONS.map(a => (
                <Pill key={a.value} active={form.audienceType === a.value} onClick={() => setForm({ ...form, audienceType: a.value })}>
                  {a.label}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>What&apos;s your goal?</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(g => (
                <Pill key={g} active={form.pitchGoal === g} onClick={() => setForm({ ...form, pitchGoal: g })}>
                  {g}
                </Pill>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Biggest fear (optional)</label>
            <textarea
              value={form.biggestFear}
              onChange={e => setForm({ ...form, biggestFear: e.target.value })}
              placeholder="What worries you most? (optional) — e.g. sounding unconfident, forgetting key points..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {permError && (
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs">
              {permError}
              <button onClick={() => setPermError("")} className="ml-2 underline">Retry</button>
            </div>
          )}

          <motion.button
            onClick={handleStart}
            disabled={requesting}
            whileTap={{ scale: 0.98 }}
            animate={{ boxShadow: ["0 0 0px rgba(201,168,76,0)", "0 0 24px rgba(201,168,76,0.45)", "0 0 0px rgba(201,168,76,0)"] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            className="w-full h-14 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-60 text-[#06040F] font-black rounded-xl flex items-center justify-center gap-2 transition-colors text-base"
          >
            {requesting ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#06040F]/40 border-t-[#06040F] rounded-full animate-spin" /> Requesting mic...</span>
            ) : (
              <><Mic className="w-5 h-5" /> Start Coaching Session →</>
            )}
          </motion.button>
        </div>

        {/* What Quantum will analyze */}
        <div className="mt-8">
          <p className="text-[#8B7CF8] text-xs font-bold uppercase tracking-wider mb-3 text-center">What Quantum will analyze</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {ANALYZE_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0F0A1F] border border-[#1A1040] hover:border-[#C9A84C]/40 hover:shadow-[0_0_16px_rgba(201,168,76,0.12)] transition-all"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-white/80 text-xs font-semibold">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Recording screen ─────────────────────────────────────────────────────────

interface RecordingProps {
  setup: SetupData;
  locale: string; // language code from useLanguage()
  onDone: (transcript: string, duration: number, fillers: FillerCounts, wpm: number) => void;
  onBack: () => void;
}

function RecordingScreen({ setup, locale, onDone, onBack }: RecordingProps) {
  const { t: tl } = useLanguage();
  const ft = tl.features.pitchCoachLive as unknown as Record<string, string>;
  const [transcript, setTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(Array(30).fill(8));
  const [fillers, setFillers] = useState<FillerCounts>({ um: 0, uh: 0, like: 0, so: 0, you_know: 0 });
  const [wpm, setWpm] = useState(0);
  const [tips, setTips] = useState<CoachTipData[]>([]);
  const [tipIdRef] = useState({ v: 0 });
  const [browserOk] = useState(() => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState("");
  const [noSpeechWarning, setNoSpeechWarning] = useState(false);

  const recRef = useRef<ISpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const transcriptRef = useRef("");
  const finalTextRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const isActiveRef = useRef(true);
  const noSpeechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetSec = setup.targetDuration * 60;

  useEffect(() => {
    startSession();
    return cleanup;
  }, []); // eslint-disable-line

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Premium coaching cards rotation
  useEffect(() => {
    const pool: CoachTipData[] = [
      { id: 0, msg: "That conviction in your voice — investors lean in when they hear it. Hold this energy.", variant: "green" },
      { id: 0, msg: "An investor wanted a number right here. \"Big market\" means nothing without a figure.", variant: "gold" },
      { id: 0, msg: "Too many hedges — \"I think\", \"maybe\", \"kind of\" make you sound unsure of your own company.", variant: "red" },
      { id: 0, msg: "Tie this to one real customer's story. Specifics persuade; abstractions evaporate.", variant: "purple" },
      { id: 0, msg: "You're burying the ask. State exactly what you need in the first 60 seconds.", variant: "red" },
      { id: 0, msg: "Strongest moment of the pitch. This is the version of you that gets funded.", variant: "green" },
      { id: 0, msg: "Reframe the problem as a cost. Investors fund painkillers, not vitamins.", variant: "purple" },
      { id: 0, msg: "Drop a metric here — revenue, growth rate, retention. Data is the room's trust currency.", variant: "gold" },
    ];
    const interval = setInterval(() => {
      const tip = pool[Math.floor(Math.random() * pool.length)];
      tipIdRef.v += 1;
      const newTip = { ...tip, id: tipIdRef.v, at: fmtTime(elapsedRef.current) };
      setTips(prev => [...prev.slice(-1), newTip]);
      setTimeout(() => {
        setTips(prev => prev.filter(t => t.id !== newTip.id));
      }, 9000);
    }, 18000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  useEffect(() => {
    noSpeechTimerRef.current = setTimeout(() => {
      if (transcriptRef.current.trim().length === 0) setNoSpeechWarning(true);
    }, 15000);
    return () => { if (noSpeechTimerRef.current) clearTimeout(noSpeechTimerRef.current); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (transcript.trim().length > 0) setNoSpeechWarning(false);
  }, [transcript]);

  async function startSession() {
    isActiveRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextCtor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArr);
        setWaveformData(Array.from(dataArr).slice(0, 30));
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      // waveform won't animate, recording still works
    }

    if (!browserOk) return;
    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;

    function startRecognition() {
      if (!isActiveRef.current) return;
      try {
        const rec = new SRClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = getSpeechLocale(locale as SupportedLanguage);
        (rec as ISpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;

        rec.onresult = (e: ISpeechRecognitionEvent) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalTextRef.current += e.results[i][0].transcript + " ";
            else interim = e.results[i][0].transcript;
          }
          const full = finalTextRef.current + interim;
          transcriptRef.current = full;
          setTranscript(full);
          setFillers(countFillers(full));
        };

        rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
          if (e.error === "no-speech") return;
        };

        rec.onend = () => {
          if (isActiveRef.current && !pausedRef.current) {
            setTimeout(() => {
              if (isActiveRef.current && !pausedRef.current) startRecognition();
            }, 100);
          }
        };

        recRef.current = rec;
        rec.start();
      } catch { /* handled */ }
    }

    startRecognition();

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(e => e + 1);
      if (elapsedRef.current % 10 === 0) {
        setWpm(calcWPM(transcriptRef.current, elapsedRef.current));
      }
    }, 1000);
  }

  function cleanup() {
    isActiveRef.current = false;
    recRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => { /* ok */ });
  }

  function handleStop() {
    cleanup();
    const text = manualMode ? manualText : transcriptRef.current;
    const f = countFillers(text);
    const w = calcWPM(text, Math.max(1, elapsedRef.current));
    onDone(text, elapsedRef.current, f, w);
  }

  function togglePause() {
    if (paused) {
      pausedRef.current = false;
      setPaused(false);
      if (browserOk && !manualMode) {
        const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        try {
          const rec = new SRClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = getSpeechLocale(locale as SupportedLanguage);
          (rec as ISpeechRecognition & { maxAlternatives?: number }).maxAlternatives = 1;
          rec.onresult = (e: ISpeechRecognitionEvent) => {
            let interim = "";
            for (let i = e.resultIndex; i < e.results.length; i++) {
              if (e.results[i].isFinal) finalTextRef.current += e.results[i][0].transcript + " ";
              else interim = e.results[i][0].transcript;
            }
            const full = finalTextRef.current + interim;
            transcriptRef.current = full;
            setTranscript(full);
            setFillers(countFillers(full));
          };
          rec.onend = () => {
            if (isActiveRef.current && !pausedRef.current) {
              setTimeout(() => { if (isActiveRef.current && !pausedRef.current) rec.start(); }, 100);
            }
          };
          rec.onerror = (e: ISpeechRecognitionErrorEvent) => { if (e.error !== "no-speech") return; };
          recRef.current = rec;
          rec.start();
        } catch { /* ok */ }
      }
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      pausedRef.current = true;
      setPaused(true);
      recRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function switchToManual() {
    setManualMode(true);
    setNoSpeechWarning(false);
    recRef.current?.stop();
  }

  const activeTranscript = manualMode ? manualText : transcript;
  const totalF = totalFillers(fillers);
  const paceVerdict = wpm === 0 ? "—" : wpm < 100 ? "TOO SLOW" : wpm > 170 ? "TOO FAST" : "PERFECT";
  const paceColor = wpm === 0 ? "text-white/40" : (wpm < 100 || wpm > 170) ? "text-red-400" : "text-green-400";
  const energy = wpm === 0 ? "—" : wpm > 140 ? "HIGH" : wpm > 110 ? "MEDIUM" : "LOW";
  const energyColor = energy === "HIGH" ? "text-green-400" : energy === "MEDIUM" ? "text-yellow-400" : "text-red-400";
  const timeProgress = Math.min(1, elapsed / Math.max(1, targetSec));
  const timeStatus = elapsed > targetSec * 1.1 ? "Running long" : elapsed < targetSec * 0.5 && elapsed > 20 ? "Too slow" : "On track";
  const canStop = activeTranscript.trim().split(/\s+/).filter(Boolean).length >= 10;

  const confidence = calcConfidence(totalF, wpm);
  const conf = confidenceLabel(confidence);
  const structure = detectStructure(activeTranscript, locale);

  if (!browserOk && !manualMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
        <div className="text-center max-w-sm">
          <MicOff className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2 text-lg">Speech recognition not available</p>
          <p className="text-[#8B7CF8] text-sm mb-2">Supported browsers: Chrome, Edge, Safari on desktop.</p>
          <p className="text-[#8B7CF8] text-sm mb-6">You can still get your pitch analyzed by typing or pasting it below.</p>
          <button
            onClick={() => setManualMode(true)}
            className="w-full h-12 bg-[#C9A84C] text-[#06040F] font-black rounded-xl text-sm mb-3"
          >
            Type / Paste My Pitch
          </button>
          <button onClick={onBack} className="text-[#8B7CF8] text-sm hover:text-white transition-colors">← Back to setup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06040F] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#1A1040] bg-[#0F0A1F] flex-shrink-0">
        <button onClick={onBack} className="text-[#8B7CF8] hover:text-white transition-colors text-sm flex items-center gap-2">
          ← <span className="font-semibold text-white/80">{setup.startupName}</span>
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          {manualMode ? (
            <span className="text-[#C9A84C] text-xs font-bold tracking-widest">TEXT MODE</span>
          ) : (
            <>
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-red-500"
                animate={{ opacity: paused ? 0.4 : [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-red-400 text-xs font-bold tracking-widest">{paused ? "PAUSED" : "LIVE"}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 font-mono">
          <span className="text-[#C9A84C] font-bold text-lg">{fmtTime(elapsed)}</span>
          <span className="text-white/30 text-sm"> / {fmtTime(targetSec)}</span>
        </div>
      </div>

      {/* No-speech warning */}
      <AnimatePresence>
        {noSpeechWarning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-yellow-300 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>No speech detected. Speak clearly into your microphone, or use text input.</span>
            </div>
            <button
              onClick={switchToManual}
              className="flex-shrink-0 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold hover:bg-yellow-500/30 transition-colors"
            >
              Use Text Input
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content — single centered column */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Live confidence meter */}
          {!manualMode && (
            <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">Live Confidence</span>
                <span className="text-xs font-bold" style={{ color: conf.color }}>{conf.emoji} {conf.label}</span>
              </div>
              <div className="h-2.5 bg-[#1A1040] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: conf.color, boxShadow: `0 0 12px ${conf.color}66` }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Waveform */}
          {!manualMode && (
            <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4 flex items-center justify-center" style={{ minHeight: 110 }}>
              <Waveform data={waveformData} />
            </div>
          )}

          {/* Manual or live transcript */}
          {manualMode ? (
            <div className="flex flex-col gap-2">
              <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">Paste or type your pitch below</p>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder="Type or paste your pitch here..."
                className="w-full px-4 py-3 rounded-2xl bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED] text-white text-sm leading-relaxed outline-none resize-none transition-colors placeholder-white/25"
                style={{ minHeight: 240 }}
              />
              <p className="text-white/30 text-xs">{manualText.trim().split(/\s+/).filter(Boolean).length} words</p>
            </div>
          ) : (
            <div
              ref={transcriptScrollRef}
              className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-4 overflow-y-auto"
              style={{ minHeight: 160, maxHeight: "40vh" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">{ft.smartTranscript || "Smart Transcript"}</p>
                <button onClick={switchToManual} className="text-[10px] text-white/30 hover:text-[#8B7CF8] transition-colors underline">
                  {ft.switchToText || "Switch to text input"}
                </button>
              </div>
              <div className="text-sm leading-relaxed">
                {transcript
                  ? highlightFillers(transcript, locale)
                  : <span className="text-white/25 italic">Start speaking — your words appear here...</span>}
              </div>
            </div>
          )}

          {/* Pitch structure detector */}
          <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-3 sticky top-2 z-10">
            <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider mb-2">{ft.pitchStructure || "Pitch Structure"}</p>
            <div className="flex flex-wrap gap-2">
              {STRUCTURE_SECTION_KEYS.map(key => {
                const ok = structure[key];
                const labels = getStructureLabels(locale);
                return (
                  <span
                    key={key}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                      ok
                        ? "border-green-500/40 bg-green-500/15 text-green-300"
                        : "border-red-500/30 bg-red-500/5 text-red-400/70"
                    }`}
                  >
                    {ok ? "✅" : "❌"} {labels[key]}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Live metrics */}
          <div className="grid grid-cols-3 gap-2">
            <MetricCard title={ft.pace || "Pace"} value={wpm > 0 ? `${wpm}` : "—"} sub={paceVerdict} color={paceColor} />
            <MetricCard
              title={ft.fillerWordsMetric || "Fillers"}
              value={String(totalF)}
              sub={totalF > 0 ? `um ${fillers.um} · uh ${fillers.uh}` : (ft.keepItUp || "Clean")}
              color={totalF > 8 ? "text-red-400" : totalF > 3 ? "text-yellow-400" : "text-green-400"}
            />
            <MetricCard title={ft.energy || "Energy"} value={energy} sub={ft.basedOnPace || "from pace"} color={energyColor} />
          </div>

          {/* Time check */}
          <div className="bg-[#06040F] border border-[#1A1040] rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider">{ft.timeCheck || "Time Check"}</p>
              <p className={`text-xs font-bold ${elapsed > targetSec * 1.1 ? "text-red-400" : "text-green-400"}`}>{timeStatus}</p>
            </div>
            <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#C9A84C]" animate={{ width: `${timeProgress * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          {/* Coaching cards */}
          <div className="space-y-2 min-h-[40px]">
            <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5" /> {ft.liveCoaching || "Live Coaching"}
            </p>
            <AnimatePresence>
              {tips.map(tip => <CoachTipCard key={tip.id} tip={tip} />)}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 pt-2 pb-6">
            {!manualMode && (
              <button
                onClick={togglePause}
                className="w-12 h-12 rounded-full border border-[#1A1040] bg-[#0F0A1F] flex items-center justify-center text-[#8B7CF8] hover:text-white hover:border-[#7C3AED] transition-colors flex-shrink-0"
              >
                {paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!canStop}
              className="flex-1 h-14 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-black rounded-xl transition-colors text-base shadow-[0_0_24px_rgba(239,68,68,0.25)]"
            >
              <StopCircle className="w-5 h-5" />
              {manualMode ? "Analyze My Pitch →" : "Stop & Get Feedback →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analyzing screen ─────────────────────────────────────────────────────────

function AnalyzingScreen() {
  const { t: tl } = useLanguage();
  const ft = tl.features.pitchCoachLive as unknown as Record<string, unknown>;
  const steps = (ft.analyzingSteps as string[]) ?? ["Transcribing pitch...", "Detecting filler words...", "Analyzing structure...", "Scoring delivery...", "Simulating investor reactions...", "Generating your practice plan..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(p => Math.min(p + 1, steps.length)), 1100);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
      <AmbientOrbs />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative text-center max-w-sm">
        <div className="w-16 h-16 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Pitch</h2>
        <p className="text-[#8B7CF8] text-sm mb-8">Going through every line. This takes about 30 seconds.</p>
        <div className="space-y-2 text-left">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i < done ? "text-green-400" : "text-white/25"}`}>
              <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border ${i < done ? "border-green-500 bg-green-500/20" : "border-[#1A1040]"}`}>
                {i < done && <Check className="w-2.5 h-2.5" />}
              </div>
              {s}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Investor reaction card ─────────────────────────────────────────────────────

function ReactionCard({ emoji, role, text }: { emoji: string; role: string; text: string }) {
  return (
    <div className="p-4 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/5">
      <p className="text-sm font-bold text-white mb-1.5 flex items-center gap-2"><span className="text-lg">{emoji}</span> {role}</p>
      <p className="text-white/70 text-sm leading-relaxed italic">&quot;{text}&quot;</p>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  analysis, setup, sessionId, onRetry,
}: {
  analysis: Analysis; setup: SetupData; sessionId: string; onRetry: () => void;
}) {
  const { t: tl } = useLanguage();
  const ft = tl.features.pitchCoachLive as unknown as Record<string, string>;
  const [copied, setCopied] = useState(false);
  const [rewriteCopied, setRewriteCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const score = analysis.overall_score;

  const fundability = typeof analysis.fundability_probability === "number"
    ? Math.round(analysis.fundability_probability)
    : Math.round(score * 0.85 + (analysis.ready_to_pitch ? 10 : 0));
  const fundabilityClamped = Math.max(0, Math.min(100, fundability));

  const bannerCfg = score > 80
    ? { cls: "border-green-500/50 bg-green-500/10 text-green-300", msg: "You're onto something. This could get a meeting if you tighten the close." }
    : score >= 70
    ? { cls: "border-blue-500/50 bg-blue-500/10 text-blue-300", msg: "Solid foundation. A few sharp changes and this becomes fundable." }
    : score >= 55
    ? { cls: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300", msg: "Not pitch-ready yet — but that's fixable. Here's exactly what to work on." }
    : { cls: "border-red-500/50 bg-red-500/10 text-red-300", msg: "This needs real work. That's honest, and it's useful. Let's go through it." };

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/pitch-coach-live");
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }

  function copyShare() {
    const text = `🎤 Investor Readiness: ${score}/100 (${analysis.grade})\n${analysis.bottom_line}\n\nPracticed with Quantum Pitch Coach Live`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyRewrite() {
    navigator.clipboard.writeText(analysis.the_killer_rewrite || "");
    setRewriteCopied(true);
    setTimeout(() => setRewriteCopied(false), 2000);
  }

  const chartData = history.map(h => ({
    name: new Date(h.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    score: h.overallScore,
  })).reverse();

  const improving = chartData.length > 1 && chartData[chartData.length - 1].score > chartData[0].score;

  // Build timeline from API field or fallback to what_worked / critical_problems
  const timeline = (analysis.pitch_timeline && analysis.pitch_timeline.length > 0)
    ? analysis.pitch_timeline
    : [
        ...(analysis.what_worked || []).map((w, i) => ({
          label: w.moment.slice(0, 24), type: "strength" as const,
          position: (i + 1) / ((analysis.what_worked?.length || 1) + 1), note: w.why,
        })),
        ...(analysis.critical_problems || []).map((p, i) => ({
          label: p.problem_name, type: "weakness" as const,
          position: (i + 1) / ((analysis.critical_problems?.length || 1) + 1), note: p.why_its_weak,
        })),
      ];

  const reactions = analysis.investor_reactions;
  const base = analysis.investor_reaction || "";
  const angelText = reactions?.angel
    ?? (score > 75 ? "Credible founder. " + base : score < 55 ? "Unclear value. " + base.slice(0, 100) : base);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#06040F]">
      <div className="max-w-3xl mx-auto p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 p-5 rounded-2xl border mb-6 ${bannerCfg.cls}`}
          >
            {score >= 70 ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="font-bold leading-snug">{bannerCfg.msg}</p>
          </motion.div>

          {/* Pitch moment timeline */}
          {timeline.length > 0 && (
            <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5 mb-4">
              <p className="text-[#8B7CF8] text-[10px] font-semibold uppercase tracking-wider mb-4">Pitch Moment Timeline</p>
              <div className="relative h-16 overflow-x-auto">
                <div className="absolute left-0 right-0 top-8 h-[2px] bg-[#1A1040]" />
                <div className="relative flex justify-between min-w-[420px]">
                  {timeline.slice(0, 8).map((m, i) => {
                    const color = m.type === "strength" ? "#22C55E" : m.type === "weakness" ? "#EF4444" : "#EAB308";
                    const emoji = m.type === "strength" ? "🔥" : m.type === "weakness" ? "⚠" : "•";
                    return (
                      <button
                        key={i}
                        onClick={() => scrollTo(m.type === "weakness" ? "lose-room" : "what-worked")}
                        className="flex flex-col items-center group"
                        style={{ flex: 1 }}
                        title={m.note}
                      >
                        <span className="text-[9px] text-white/50 mb-1 max-w-[60px] truncate">{m.label}</span>
                        <span
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] mt-3"
                          style={{ background: color, boxShadow: `0 0 8px ${color}99` }}
                        >{emoji}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* HERO: Investor Readiness Score */}
          <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 mb-4 text-center">
            <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider mb-3">Investor Readiness Score™</p>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="inline-block mb-4"
            >
              <CircleGauge score={score} size={150} />
            </motion.div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className={`text-6xl font-black ${gradeColor(analysis.grade)}`}>{analysis.grade}</span>
              <span className={`px-4 py-1.5 rounded-full border text-sm font-bold ${
                analysis.ready_to_pitch
                  ? "border-green-500/50 bg-green-500/20 text-green-400"
                  : "border-red-500/50 bg-red-500/20 text-red-400"
              }`}>
                {analysis.ready_to_pitch ? "✓ Investor-Ready" : "✗ Not Ready Yet"}
              </span>
            </div>

            {/* Fundability */}
            <div className="max-w-md mx-auto mb-4 p-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider">Fundability Score</span>
                <span className="text-[#C9A84C] font-black text-xl">{fundabilityClamped}%</span>
              </div>
              <div className="h-2 bg-[#1A1040] rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-[#C9A84C]"
                  style={{ boxShadow: "0 0 12px rgba(201,168,76,0.5)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${fundabilityClamped}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <p className="text-white/60 text-xs">{fundabilityClamped}% chance of earning a follow-up meeting</p>
            </div>

            <p className="text-white font-bold text-lg leading-snug max-w-xl mx-auto">
              {(analysis.bottom_line || "").split(/(?<=\.)\s/)[0]}
            </p>
            {analysis.emotional_summary && (
              <p className="text-[#8B7CF8] text-sm mt-3 italic max-w-xl mx-auto">{analysis.emotional_summary}</p>
            )}
            <p className="text-[#8B7CF8] text-xs mt-2">{setup.startupName} · {setup.audienceType}</p>
          </div>

          {/* Investor reaction simulation */}
          {base && (
            <Section title="Investor Reaction Simulation" icon={<Zap className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
              <div className="grid sm:grid-cols-2 gap-3">
                <ReactionCard emoji="🦈" role="Skeptical VC" text={reactions?.vc ?? base} />
                <ReactionCard emoji="👼" role="Angel Investor" text={angelText} />
                <ReactionCard emoji="🚀" role="Accelerator Partner" text={reactions?.accelerator ?? base} />
                <ReactionCard emoji="🤝" role="Potential Customer" text={reactions?.customer ?? base} />
              </div>
            </Section>
          )}

          {/* What could lose the room */}
          {analysis.critical_problems?.length > 0 && (
            <Section id="lose-room" title="What Could Lose The Room" icon={<AlertTriangle className="w-4 h-4 text-red-400" />} color="text-red-400">
              <p className="text-white/50 text-xs italic mb-4">Investors decide in 90 seconds. This is what breaks the spell.</p>
              <div className="space-y-4">
                {analysis.critical_problems.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-red-400 font-bold text-sm">{p.problem_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.severity === "HIGH"
                          ? "border-red-500/50 bg-red-500/20 text-red-400"
                          : "border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                      }`}>{p.severity}</span>
                    </div>
                    <p className="text-white/50 text-xs italic">What you said: &quot;{p.what_you_said}&quot;</p>
                    <p className="text-white/70 text-sm">{p.why_its_weak}</p>
                    <div className="pt-2 border-t border-red-500/20">
                      <motion.div
                        animate={{ boxShadow: ["0 0 0 rgba(201,168,76,0)", "0 0 14px rgba(201,168,76,0.25)", "0 0 0 rgba(201,168,76,0)"] }}
                        transition={{ duration: 2.4, repeat: Infinity }}
                        className="p-3 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/5"
                      >
                        <p className="text-[#C9A84C] text-xs font-bold mb-1.5">→ Rewrite:</p>
                        <p className="text-[#C9A84C]/90 text-sm leading-relaxed">{p.rewritten_version}</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>
          )}

          {/* What worked */}
          {analysis.what_worked?.length > 0 && (
            <Section id="what-worked" title={ft.whatLandedWell || "What Landed Well"} icon={<Star className="w-4 h-4 text-green-400" />} color="text-green-400">
              <div className="space-y-3">
                {analysis.what_worked.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                    <p className="text-green-300 text-sm italic mb-1">&quot;{w.moment}&quot;</p>
                    <p className="text-white/70 text-xs">{w.why}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Missing completely */}
          {analysis.missing_completely?.length > 0 && (
            <Section title={ft.whatNeverSaid || "What You Never Said"} icon={<XCircle className="w-4 h-4 text-orange-400" />} color="text-orange-400">
              <div className="flex flex-wrap gap-2">
                {analysis.missing_completely.map((item, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-300 text-sm">{item}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Killer rewrite — side by side */}
          {analysis.the_killer_rewrite && (
            <Section title="Killer Rewrite™" icon={<Flame className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-white/10 bg-[#06040F]">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">What You Said</p>
                  <p className="text-white/50 text-sm leading-relaxed italic">
                    &quot;{analysis.critical_problems?.[0]?.what_you_said || analysis.bottom_line}&quot;
                  </p>
                </div>
                <motion.div
                  animate={{ boxShadow: ["0 0 0 rgba(201,168,76,0)", "0 0 18px rgba(201,168,76,0.3)", "0 0 0 rgba(201,168,76,0)"] }}
                  transition={{ duration: 2.6, repeat: Infinity }}
                  className="p-4 rounded-xl border border-[#C9A84C]/50 bg-[#C9A84C]/5 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#C9A84C] text-xs font-bold uppercase tracking-wider">What Lands Better</p>
                    <button onClick={copyRewrite} className="text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors">
                      {rewriteCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{analysis.the_killer_rewrite}</p>
                </motion.div>
              </div>
            </Section>
          )}

          {/* Filler words */}
          {analysis.filler_analysis && (
            <Section title={ft.fillerWords || "Filler Words"} icon={<Clock className="w-4 h-4 text-[#8B7CF8]" />} color="text-[#8B7CF8]">
              <div className="flex items-start gap-6 mb-4">
                <div>
                  <p className={`text-5xl font-black ${analysis.filler_analysis.total_count > 10 ? "text-red-400" : analysis.filler_analysis.total_count > 5 ? "text-yellow-400" : "text-green-400"}`}>
                    {analysis.filler_analysis.total_count}
                  </p>
                  <p className="text-white/40 text-xs mt-1">{analysis.filler_analysis.per_minute}/min</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(analysis.filler_analysis.breakdown ?? {}).map(([word, cnt]) => cnt > 0 && (
                    <span key={word} className="px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-medium">
                      {word.replace("_", " ")} ×{cnt as number}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-white/60 text-sm italic mb-3">{analysis.filler_analysis.verdict}</p>
              <p className="text-[#8B7CF8] text-xs p-3 rounded-lg border border-[#1A1040] bg-[#06040F]">
                💡 Replace filler words with silence. A pause is more powerful than &quot;um&quot;.
              </p>
            </Section>
          )}

          {/* Pacing */}
          {analysis.pacing && (
            <Section title={ft.pacingAnalysis || "Pacing"} icon={<TrendingUp className="w-4 h-4 text-[#7C3AED]" />} color="text-[#7C3AED]">
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <p className={`text-5xl font-black ${analysis.pacing.verdict === "PERFECT" ? "text-green-400" : "text-yellow-400"}`}>
                    {analysis.pacing.words_per_minute}
                  </p>
                  <p className="text-white/40 text-xs mt-1">words per minute</p>
                </div>
                <div>
                  <span className={`px-3 py-1.5 rounded-full border text-sm font-bold ${
                    analysis.pacing.verdict === "PERFECT"
                      ? "border-green-500/50 bg-green-500/20 text-green-400"
                      : analysis.pacing.verdict === "TOO_FAST"
                      ? "border-red-500/50 bg-red-500/20 text-red-400"
                      : "border-yellow-500/50 bg-yellow-500/20 text-yellow-400"
                  }`}>{analysis.pacing.verdict.replace("_", " ")}</span>
                  <p className="text-white/30 text-xs mt-2">Ideal: 130–150 WPM</p>
                </div>
              </div>
              <div className="h-2 bg-[#1A1040] rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${analysis.pacing.verdict === "PERFECT" ? "bg-green-500" : "bg-yellow-500"}`}
                  style={{ width: `${Math.min(100, (analysis.pacing.words_per_minute / 200) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/50">
                <p>Slowest: {analysis.pacing.slowest_section}</p>
                <p>Fastest: {analysis.pacing.fastest_section}</p>
              </div>
            </Section>
          )}

          {/* Practice Plan */}
          {(analysis.practice_drills?.length || analysis.before_next_pitch?.length) ? (
            <Section title="Practice Plan™" icon={<Award className="w-4 h-4 text-[#C9A84C]" />} color="text-[#C9A84C]">
              <div className="grid sm:grid-cols-3 gap-3">
                {(analysis.practice_drills && analysis.practice_drills.length > 0
                  ? analysis.practice_drills.slice(0, 3)
                  : (analysis.before_next_pitch || []).slice(0, 3).map((item, i) => ({
                      name: `Drill ${i + 1}`, instruction: item, duration: "5 min",
                    }))
                ).map((drill, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/5"
                  >
                    <div className="text-2xl mb-2">{["🎯", "🗣", "⚡"][i] ?? "🎯"}</div>
                    <p className="text-[#C9A84C] font-bold text-sm mb-1">{drill.name}</p>
                    <p className="text-white/70 text-xs leading-relaxed mb-2">{drill.instruction}</p>
                    <span className="text-[10px] text-white/40 font-mono">{drill.duration} drill</span>
                  </motion.div>
                ))}
              </div>
            </Section>
          ) : null}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-6">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-black rounded-xl transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" /> {ft.practiceAgain || "Practice Again"}
            </button>
            <button
              onClick={copyShare}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#7C3AED]/40 text-[#8B7CF8] hover:bg-[#7C3AED]/10 transition-colors text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Locked in." : "Share My Score"}
            </button>
            <button
              onClick={() => { setShowHistory(h => !h); if (!showHistory) loadHistory(); }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1A1040] text-[#8B7CF8]/60 hover:text-[#8B7CF8] hover:border-[#7C3AED]/30 transition-colors text-sm"
            >
              <History className="w-4 h-4" /> {showHistory ? "Hide History" : "View History"}
            </button>
          </div>

          {/* History panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-5">
                  <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" /> Your Progress
                    {improving && <span className="text-green-400 text-xs flex items-center gap-1">↗ Improving</span>}
                  </h3>
                  {historyLoading ? (
                    <div className="text-center py-8 text-[#8B7CF8] text-sm">Loading...</div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-8">
                    <p className="text-white font-semibold text-sm mb-1">Your next pitch starts here.</p>
                    <p className="text-white/40 text-xs">The best founders rehearse more than people think. Each session makes the next one sharper.</p>
                  </div>
                  ) : (
                    <>
                      {chartData.length > 1 && (
                        <div className="mb-5 h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                              <XAxis dataKey="name" tick={{ fill: "#8B7CF8", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fill: "#8B7CF8", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                              <Tooltip
                                contentStyle={{ background: "#0F0A1F", border: "1px solid #1A1040", borderRadius: 8, fontSize: 12 }}
                                labelStyle={{ color: "#8B7CF8" }}
                                itemStyle={{ color: "#C9A84C" }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={2} dot={{ fill: "#C9A84C", r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <div className="space-y-2">
                        {history.map(h => (
                          <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-[#1A1040] bg-[#06040F]">
                            <div>
                              <p className="text-white text-sm font-medium">{h.startupName}</p>
                              <p className="text-[#8B7CF8] text-xs">{new Date(h.createdAt).toLocaleDateString()} · {h.audienceType}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-black ${gradeColor(h.grade)}`}>{h.grade}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                h.overallScore >= 70 ? "bg-green-500/20 text-green-400" :
                                h.overallScore >= 55 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>{h.overallScore}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/20 text-xs pb-4">Session ID: {sessionId}</p>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PitchCoachLivePage() {
  const { locale } = useLanguage();
  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [apiError, setApiError] = useState("");

  const handleStart = useCallback((data: SetupData) => {
    setSetup(data);
    setStep("recording");
    setApiError("");
  }, []);

  const handleRecordingDone = useCallback(async (
    t: string, d: number, f: FillerCounts, w: number
  ) => {
    const wordCount = t.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 15) {
      setApiError("No speech detected. Please speak clearly into your microphone or use the text input option.");
      setStep("setup");
      return;
    }

    setStep("analyzing");

    try {
      const res = await fetch("/api/analyze-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: t,
          startupName: setup?.startupName,
          startupDescription: setup?.startupDescription,
          audienceType: setup?.audienceType,
          targetDuration: setup?.targetDuration,
          pitchGoal: setup?.pitchGoal,
          biggestFear: setup?.biggestFear,
          language: locale === "ru" ? "Russian" : locale === "es" ? "Spanish" : locale === "zh" ? "Chinese" : "English",
        }),
      });

      const analysisData = await res.json();

      if (!res.ok) {
        const errMsg = analysisData.error ?? "";
        if (res.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("unavailable")) {
          setApiError("AI analysis temporarily unavailable. Please try again in a few minutes.");
        } else {
          setApiError("Analysis hit a snag. Check your connection and try again.");
        }
        setStep("setup");
        return;
      }

      setAnalysis(analysisData as Analysis);

      fetch("/api/pitch-coach-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: setup?.startupName,
          startupDescription: setup?.startupDescription,
          audienceType: setup?.audienceType,
          targetDuration: setup?.targetDuration,
          actualDuration: d,
          transcript: t,
          wordCount,
          fillerWordCount: totalFillers(f),
          wordsPerMinute: w,
          locale,
        }),
      })
        .then(r => r.json())
        .then(saved => { if (saved?.id) setSessionId(saved.id); })
        .catch(() => { /* non-critical */ });

      setStep("results");
    } catch {
      setApiError("Lost the connection. Try again when you're back online.");
      setStep("setup");
    }
  }, [setup, locale]);

  const handleRetry = useCallback(() => {
    setStep("setup");
    setAnalysis(null);
    setApiError("");
    setSessionId("");
  }, []);

  return (
    <div className="min-h-screen bg-[#06040F]">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-center gap-2 shadow-xl">
                <AlertTriangle className="w-4 h-4" /> {apiError}
              </div>
            )}
            <SetupScreen onStart={handleStart} />
          </motion.div>
        )}
        {step === "recording" && setup && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-center gap-2 shadow-xl">
                <AlertTriangle className="w-4 h-4" /> {apiError}
              </div>
            )}
            <RecordingScreen
              setup={setup}
              locale={locale}
              onDone={handleRecordingDone}
              onBack={() => setStep("setup")}
            />
          </motion.div>
        )}
        {step === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyzingScreen />
          </motion.div>
        )}
        {step === "results" && analysis && setup && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen
              analysis={analysis}
              setup={setup}
              sessionId={sessionId}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
