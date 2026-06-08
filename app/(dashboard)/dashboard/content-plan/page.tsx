"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  Calendar, Copy, Check, RotateCcw, ChevronDown, ChevronUp,
  Download, Zap, Target, Mic, BarChart2, AlertTriangle,
  Star, Lightbulb, Clock, RefreshCw, History,
} from "lucide-react";

const LS_KEY = "quantum_content_plan_answers";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SetupData {
  startupName: string;
  targetAudience: string;
  platforms: string[];
  goal: string;
  topics: string[];
  tone: string;
  personalStory: string;
  avoidContent: string;
}

interface ContentPost {
  day: number;
  week: number;
  platform: string;
  content_type: string;
  title: string;
  hook: string;
  full_post: string;
  best_time_to_post: string;
  expected_engagement: "LOW" | "MEDIUM" | "HIGH";
  why_this_works: string;
}

interface ContentPlan {
  founder_voice: { tone: string; style: string; key_themes: string[] };
  weekly_strategy: { week1: string; week2: string; week3: string; week4: string };
  posts: ContentPost[];
  bonus_content: {
    bio_linkedin: string;
    bio_twitter: string;
    pinned_post: string;
    content_pillars: Array<{ pillar: string; description: string; post_frequency: string }>;
  };
  growth_tips?: string[];
}

interface HistoryItem {
  id: string;
  startupName: string;
  platforms: string[];
  goal: string;
  tone: string;
  createdAt: string;
}

type Step = "setup" | "generating" | "results";
type Tab = "calendar" | "posts" | "strategy" | "bonus";

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLATFORMS = ["LinkedIn", "Twitter/X", "Instagram", "TikTok", "Telegram"];
const GOALS = ["Get first users", "Build personal brand", "Attract investors", "Grow community", "All of the above"];
const TOPICS = ["My founder journey", "Product updates", "Industry insights", "Startup tips", "Behind the scenes", "Failures & lessons", "Wins & milestones", "Hot takes"];
const TONES = ["Bold and direct", "Warm and personal", "Educational and helpful", "Funny and casual", "Professional and data-driven"];

const LOADING_MESSAGES = [
  "Learning your founder voice...",
  "Writing your Week 1 content...",
  "Crafting your LinkedIn posts...",
  "Writing Twitter threads...",
  "Adding personal stories...",
  "Creating your Week 2 content...",
  "Building Week 3 strategy...",
  "Finalizing Week 4 content...",
  "Polishing every post...",
  "Your content plan is almost ready...",
];

function platformColor(p: string) {
  if (p === "LinkedIn") return "bg-blue-600/20 text-blue-400 border-blue-600/30";
  if (p === "Twitter/X") return "bg-white/10 text-white/80 border-white/20";
  if (p === "Instagram") return "bg-pink-500/20 text-pink-400 border-pink-500/30";
  if (p === "TikTok") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  if (p === "Telegram") return "bg-sky-500/20 text-sky-400 border-sky-500/30";
  return "bg-[#7C3AED]/20 text-[#8B7CF8] border-[#7C3AED]/30";
}

function typeColor(t: string) {
  const map: Record<string, string> = {
    story: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    tip: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    opinion: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
    behind_scenes: "bg-green-500/20 text-green-300 border-green-500/30",
    win: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    lesson: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    hot_take: "bg-red-500/20 text-red-300 border-red-500/30",
    product_update: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    thread: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  };
  return map[t] ?? "bg-[#7C3AED]/20 text-[#8B7CF8] border-[#7C3AED]/30";
}

function engagementColor(e: string) {
  if (e === "HIGH") return "bg-green-500/20 text-green-400";
  if (e === "MEDIUM") return "bg-yellow-500/20 text-yellow-400";
  return "bg-white/10 text-white/40";
}

function platformEmoji(p: string) {
  if (p === "LinkedIn") return "💼";
  if (p === "Twitter/X") return "𝕏";
  if (p === "Instagram") return "📸";
  if (p === "TikTok") return "🎵";
  if (p === "Telegram") return "✈️";
  return "📱";
}

// ─── Quantum Atom ─────────────────────────────────────────────────────────────

function QuantumAtom({ size = 80 }: { size?: number }) {
  const s = size;
  return (
    <div className="relative mx-auto mb-6" style={{ width: s, height: s }}>
      <div className="absolute inset-0 rounded-full logo-glow" style={{ background: "radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 rounded-full border border-[#C9A84C]/20 logo-orbit-1" />
      <div className="absolute inset-2 rounded-full border border-[#7C3AED]/20 logo-orbit-2" />
      <div className="absolute inset-4 rounded-full border border-[#8B7CF8]/20 logo-orbit-3" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-[#C9A84C] rounded-full flex items-center justify-center font-mono font-black text-[#06040F] shadow-[0_0_20px_rgba(201,168,76,0.5)]"
          style={{ width: s * 0.38, height: s * 0.38, fontSize: s * 0.16 }}>
          Q
        </div>
      </div>
    </div>
  );
}

// ─── Multi/single select chip ─────────────────────────────────────────────────

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        selected
          ? "bg-[#C9A84C] border-[#C9A84C] text-[#06040F]"
          : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#C9A84C]/40"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy Post", successLabel }: { text: string; label?: string; successLabel?: string }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: show text area
      prompt("Copy this text:", text);
    }
  }
  return (
    <button
      onClick={doCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        copied
          ? "bg-green-500/20 border border-green-500/40 text-green-400"
          : "bg-[#06040F] border border-[#1A1040] text-[#8B7CF8] hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
      }`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? (successLabel ?? "Copied!") : label}
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border border-green-500/40 bg-[#0F0A1F] text-green-400 text-sm font-semibold shadow-xl"
    >
      {msg}
    </motion.div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: ContentPost;
  onRegenerate: () => void;
  regenerating: boolean;
  locale: string;
}

function PostCard({ post, onRegenerate, regenerating, locale }: PostCardProps) {
  const { t: tl } = useLanguage();
  const ft = tl.features.contentPlan as Record<string, string>;
  const [expanded, setExpanded] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyPost() {
    try {
      await navigator.clipboard.writeText(post.full_post);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this post:", post.full_post);
    }
  }

  const lines = post.full_post.split("\n");
  const preview = lines.slice(0, 3).join("\n");
  const hasMore = lines.length > 3;

  return (
    <motion.div
      layout
      className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="text-[#C9A84C] font-black text-sm w-12 flex-shrink-0">Day {post.day}</span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${platformColor(post.platform)}`}>
            {platformEmoji(post.platform)} {post.platform}
          </span>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${typeColor(post.content_type)}`}>
            {post.content_type.replace(/_/g, " ")}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${engagementColor(post.expected_engagement)}`}>
            {post.expected_engagement}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/30 text-xs flex-shrink-0">
          <Clock className="w-3 h-3" /> {post.best_time_to_post}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white font-bold text-sm mb-2 leading-snug">{post.hook}</p>
        <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
          {expanded || !hasMore ? post.full_post : preview}
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-[#8B7CF8] text-xs mt-2 hover:text-white transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Show less</> : <><ChevronDown className="w-3 h-3" /> Read full post</>}
          </button>
        )}
        {showWhy && (
          <p className="mt-2 text-[#8B7CF8] text-xs italic border-l-2 border-[#7C3AED]/40 pl-3">
            {post.why_this_works}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap border-t border-[#1A1040] pt-3">
        <button
          onClick={copyPost}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? "bg-green-500/20 border border-green-500/40 text-green-400"
              : "bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20"
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? ft.copied : ft.copy}
        </button>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 disabled:opacity-40 transition-all"
        >
          {regenerating
            ? <><div className="w-3 h-3 border border-[#8B7CF8]/40 border-t-[#8B7CF8] rounded-full animate-spin" /> {ft.generating}</>
            : <><RefreshCw className="w-3 h-3" /> {ft.regeneratePost}</>
          }
        </button>
        <button
          onClick={() => setShowWhy(w => !w)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#1A1040] text-white/30 hover:text-[#8B7CF8] transition-colors"
        >
          <Lightbulb className="w-3 h-3" /> {ft.whyWorks}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

interface SetupScreenProps {
  onGenerate: (data: SetupData) => void;
  history: HistoryItem[];
  historyLoading: boolean;
  ft: Record<string, string>;
}

function SetupScreen({ onGenerate, history, historyLoading, ft }: SetupScreenProps) {
  const [form, setForm] = useState<SetupData>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) return JSON.parse(saved);
      } catch { /* ok */ }
    }
    return {
      startupName: "", targetAudience: "",
      platforms: ["LinkedIn"], goal: "Build personal brand",
      topics: ["My founder journey", "Startup tips"],
      tone: "Bold and direct", personalStory: "", avoidContent: "",
    };
  });
  const [error, setError] = useState("");

  // Save to localStorage on change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(form)); } catch { /* ok */ }
  }, [form]);

  function toggleMulti(field: "platforms" | "topics", val: string) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(val)
        ? prev[field].filter(v => v !== val)
        : [...prev[field], val],
    }));
  }

  function submit() {
    if (!form.startupName.trim()) { setError("Please enter your startup name."); return; }
    if (!form.targetAudience.trim()) { setError("Please describe your target audience."); return; }
    if (form.platforms.length === 0) { setError("Please select at least one platform."); return; }
    if (form.topics.length === 0) { setError("Please select at least one topic."); return; }
    setError("");
    onGenerate(form);
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED] transition-colors";
  const labelCls = "block text-xs font-semibold text-[#8B7CF8] mb-2 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-[#06040F] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <QuantumAtom size={80} />
          <h1 className="text-3xl font-black text-white mb-2">{ft.title}</h1>
          <p className="text-[#8B7CF8] text-sm">{ft.subtitle}</p>
        </motion.div>

        {/* History */}
        {!historyLoading && history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Your Previous Plans
            </p>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-[#1A1040] bg-[#0F0A1F]">
                  <div>
                    <p className="text-white text-sm font-semibold">{h.startupName}</p>
                    <p className="text-[#8B7CF8] text-xs mt-0.5">
                      {new Date(h.createdAt).toLocaleDateString()} · {h.platforms.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <span className="text-[#8B7CF8]/50 text-xs">{h.tone}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl p-6 space-y-6 shadow-[0_0_40px_rgba(124,58,237,0.08)]"
        >
          {/* Q1 */}
          <div>
            <label className={labelCls}>1. Your startup name and what it does</label>
            <input value={form.startupName} onChange={e => setForm({ ...form, startupName: e.target.value })}
              placeholder="e.g. Quantum — AI platform for young founders"
              className={inputCls} />
          </div>

          {/* Q2 */}
          <div>
            <label className={labelCls}>2. Who is your target audience?</label>
            <input value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="e.g. Early stage founders, age 18-30, building their first startup"
              className={inputCls} />
          </div>

          {/* Q3 */}
          <div>
            <label className={labelCls}>3. What platforms do you post on?</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <Chip key={p} label={p} selected={form.platforms.includes(p)} onClick={() => toggleMulti("platforms", p)} />
              ))}
            </div>
          </div>

          {/* Q4 */}
          <div>
            <label className={labelCls}>4. What is your main goal with content?</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <Chip key={g} label={g} selected={form.goal === g} onClick={() => setForm({ ...form, goal: g })} />
              ))}
            </div>
          </div>

          {/* Q5 */}
          <div>
            <label className={labelCls}>5. What topics do you want to cover?</label>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(t => (
                <Chip key={t} label={t} selected={form.topics.includes(t)} onClick={() => toggleMulti("topics", t)} />
              ))}
            </div>
          </div>

          {/* Q6 */}
          <div>
            <label className={labelCls}>6. How would you describe your tone?</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <Chip key={t} label={t} selected={form.tone === t} onClick={() => setForm({ ...form, tone: t })} />
              ))}
            </div>
          </div>

          {/* Q7 */}
          <div>
            <label className={labelCls}>7. Share one personal story from your founder journey</label>
            <textarea value={form.personalStory} onChange={e => setForm({ ...form, personalStory: e.target.value })}
              placeholder="E.g. The moment I decided to build this, a failure I learned from, something surprising I discovered..."
              rows={4} className={`${inputCls} resize-none`} />
          </div>

          {/* Q8 */}
          <div>
            <label className={labelCls}>8. Anything to avoid? <span className="text-white/30 normal-case font-normal">(optional)</span></label>
            <textarea value={form.avoidContent} onChange={e => setForm({ ...form, avoidContent: e.target.value })}
              placeholder="E.g. Don't want to seem too salesy, avoid technical jargon..."
              rows={2} className={`${inputCls} resize-none`} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={submit}
            className="w-full h-12 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-black rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" /> {ft.generate}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Generating screen ────────────────────────────────────────────────────────

function GeneratingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 3000);
    const progInterval = setInterval(() => setProgress(p => Math.min(p + 1, 92)), 900);
    return () => { clearInterval(msgInterval); clearInterval(progInterval); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#06040F]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm w-full">
        <QuantumAtom size={96} />
        <h2 className="text-2xl font-bold text-white mb-2">Building Your Content Plan</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-[#8B7CF8] text-sm mb-8 h-5"
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
        <div className="w-full bg-[#1A1040] rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C9A84C]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-white/30 text-xs mt-3">{progress}% — This takes 30-60 seconds</p>
      </motion.div>
    </div>
  );
}

// ─── Calendar tab ─────────────────────────────────────────────────────────────

function CalendarTab({ posts, onRegenerate, regenerating }: {
  posts: ContentPost[];
  onRegenerate: (post: ContentPost) => void;
  regenerating: Set<number>;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const weeks = [1, 2, 3, 4];
  const weekDays = [
    [1, 2, 3, 4, 5, 6, 7],
    [8, 9, 10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20, 21],
    [22, 23, 24, 25, 26, 27, 28, 29, 30],
  ];

  const postsByDay = new Map<number, ContentPost>();
  posts.forEach(p => postsByDay.set(p.day, p));

  return (
    <div className="space-y-6">
      {weeks.map((w, wi) => (
        <div key={w}>
          <h3 className="text-[#C9A84C] text-sm font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Week {w}
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays[wi].map(day => {
              const post = postsByDay.get(day);
              const isExpanded = expanded === day;
              return (
                <div key={day} className="relative">
                  {post ? (
                    <motion.div
                      layout
                      onClick={() => setExpanded(isExpanded ? null : day)}
                      className={`rounded-xl border cursor-pointer transition-all ${
                        isExpanded
                          ? "border-[#C9A84C]/50 bg-[#C9A84C]/10"
                          : "border-[#1A1040] bg-[#0F0A1F] hover:border-[#C9A84C]/30 hover:shadow-[0_0_12px_rgba(201,168,76,0.15)]"
                      } p-2`}
                    >
                      <p className="text-white/40 text-[9px] mb-1">Day {day}</p>
                      <div className={`w-full h-1 rounded-full mb-1.5 ${
                        post.content_type === "story" ? "bg-purple-500" :
                        post.content_type === "tip" ? "bg-blue-500" :
                        post.content_type === "opinion" ? "bg-[#C9A84C]" :
                        post.content_type === "behind_scenes" ? "bg-green-500" :
                        post.content_type === "win" ? "bg-yellow-500" :
                        post.content_type === "lesson" ? "bg-orange-500" :
                        post.content_type === "hot_take" ? "bg-red-500" :
                        "bg-teal-500"
                      }`} />
                      <p className="text-[9px] text-white/50 leading-tight line-clamp-2">{post.hook}</p>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute top-full left-0 z-20 w-64 mt-1 bg-[#0F0A1F] border border-[#C9A84C]/30 rounded-xl p-3 shadow-xl"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${platformColor(post.platform)}`}>{platformEmoji(post.platform)} {post.platform}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold capitalize ${typeColor(post.content_type)}`}>{post.content_type.replace(/_/g, " ")}</span>
                          </div>
                          <p className="text-white font-semibold text-xs mb-2">{post.hook}</p>
                          <p className="text-white/60 text-xs leading-relaxed line-clamp-4">{post.full_post}</p>
                          <div className="flex gap-2 mt-3">
                            <CopyBtn text={post.full_post} />
                            <button onClick={() => { onRegenerate(post); setExpanded(null); }}
                              disabled={regenerating.has(post.day)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 disabled:opacity-40">
                              <RefreshCw className="w-3 h-3" /> Regen
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="rounded-xl border border-[#1A1040]/50 bg-[#06040F] p-2 opacity-40" style={{ minHeight: 60 }}>
                      <p className="text-white/20 text-[9px]">Day {day}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── All posts tab ────────────────────────────────────────────────────────────

function AllPostsTab({ posts, setup, onRegenerate, regenerating, locale }: {
  posts: ContentPost[];
  setup: SetupData;
  onRegenerate: (post: ContentPost) => void;
  regenerating: Set<number>;
  locale: string;
}) {
  const [filterPlatform, setFilterPlatform] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterWeek, setFilterWeek] = useState("All");

  const platforms = ["All", ...Array.from(new Set(posts.map(p => p.platform)))];
  const types = ["All", ...Array.from(new Set(posts.map(p => p.content_type)))];
  const weeks = ["All", "Week 1", "Week 2", "Week 3", "Week 4"];

  const filtered = posts.filter(p => {
    if (filterPlatform !== "All" && p.platform !== filterPlatform) return false;
    if (filterType !== "All" && p.content_type !== filterType) return false;
    if (filterWeek !== "All" && p.week !== parseInt(filterWeek.split(" ")[1])) return false;
    return true;
  });

  const filterBtnCls = (active: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
      active ? "bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]" : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/30"
    }`;

  return (
    <div>
      {/* Filters */}
      <div className="space-y-3 mb-6 p-4 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
        <div className="flex flex-wrap gap-1.5">
          {platforms.map(p => (
            <button key={p} onClick={() => setFilterPlatform(p)} className={filterBtnCls(filterPlatform === p)}>{p}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={filterBtnCls(filterType === t)}>
              {t === "All" ? t : t.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {weeks.map(w => (
            <button key={w} onClick={() => setFilterWeek(w)} className={filterBtnCls(filterWeek === w)}>{w}</button>
          ))}
        </div>
        <p className="text-white/30 text-xs">{filtered.length} posts</p>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <AnimatePresence>
          {filtered.map(post => (
            <motion.div key={`${post.day}-${post.platform}`} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PostCard
                post={post}
                onRegenerate={() => onRegenerate(post)}
                regenerating={regenerating.has(post.day)}
                locale={locale}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">No posts match these filters.</p>
        )}
      </div>
    </div>
  );
}

// ─── Strategy tab ─────────────────────────────────────────────────────────────

function StrategyTab({ plan, setup }: { plan: ContentPlan; setup: SetupData }) {
  const ws = plan.weekly_strategy;
  const weekStrategies = [
    { week: 1, strategy: ws.week1, theme: "Introduction & Awareness", color: "border-[#7C3AED]/40 bg-[#7C3AED]/5" },
    { week: 2, strategy: ws.week2, theme: "Value & Education", color: "border-blue-500/40 bg-blue-500/5" },
    { week: 3, strategy: ws.week3, theme: "Stories & Connection", color: "border-green-500/40 bg-green-500/5" },
    { week: 4, strategy: ws.week4, theme: "Conversion & CTA", color: "border-[#C9A84C]/40 bg-[#C9A84C]/5" },
  ];

  const postsByPlatform = new Map<string, ContentPost[]>();
  plan.posts.forEach(p => {
    if (!postsByPlatform.has(p.platform)) postsByPlatform.set(p.platform, []);
    postsByPlatform.get(p.platform)!.push(p);
  });

  return (
    <div className="space-y-6">
      {/* Content pillars */}
      <div>
        <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
          <Star className="w-4 h-4" /> Your Content Pillars
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plan.bonus_content?.content_pillars?.map((pillar, i) => (
            <div key={i} className="p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-white font-bold text-sm">{pillar.pillar}</p>
                <span className="text-[#C9A84C] text-xs font-semibold flex-shrink-0 bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                  {pillar.post_frequency}
                </span>
              </div>
              <p className="text-[#8B7CF8] text-xs leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly strategy */}
      <div>
        <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Weekly Strategy
        </h3>
        <div className="space-y-3">
          {weekStrategies.map(w => (
            <div key={w.week} className={`p-4 rounded-xl border ${w.color}`}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[#C9A84C] font-black text-sm">Week {w.week}</span>
                <span className="text-white/50 text-xs">{w.theme}</span>
              </div>
              <p className="text-white text-sm leading-relaxed">{w.strategy}</p>
              <p className="text-white/30 text-xs mt-1">
                {plan.posts.filter(p => p.week === w.week).length} posts
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Posting schedule */}
      <div>
        <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Best Posting Schedule
        </h3>
        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1040]">
                <th className="text-left px-4 py-3 text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">Platform</th>
                <th className="text-left px-4 py-3 text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">Posts</th>
                <th className="text-left px-4 py-3 text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Best Time</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(postsByPlatform.entries()).map(([platform, platformPosts]) => (
                <tr key={platform} className="border-b border-[#1A1040]/50 last:border-0">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${platformColor(platform)}`}>
                      {platformEmoji(platform)} {platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-bold">{platformPosts.length}</td>
                  <td className="px-4 py-3 text-white/40 text-xs hidden sm:table-cell">
                    {platformPosts[0]?.best_time_to_post ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth tips */}
      {plan.growth_tips && plan.growth_tips.length > 0 && (
        <div>
          <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Growth Tips for You
          </h3>
          <div className="space-y-3">
            {plan.growth_tips.map((tip, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F]">
                <span className="w-5 h-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#C9A84C] text-xs font-black flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-white/80 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bonus tab ────────────────────────────────────────────────────────────────

function BonusTab({ plan }: { plan: ContentPlan }) {
  const bc = plan.bonus_content;
  if (!bc) return <p className="text-white/40 text-sm text-center py-8">Bonus content not available.</p>;

  return (
    <div className="space-y-6">
      {/* Optimized bios */}
      <div>
        <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
          <Mic className="w-4 h-4" /> Optimized Bios
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-blue-600/30 bg-blue-600/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">💼 LinkedIn Bio</p>
              <CopyBtn text={bc.bio_linkedin} />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{bc.bio_linkedin}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">𝕏 Twitter Bio</p>
              <CopyBtn text={bc.bio_twitter} />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{bc.bio_twitter}</p>
          </div>
        </div>
      </div>

      {/* Pinned post */}
      {bc.pinned_post && (
        <div>
          <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" /> Start With This Post
          </h3>
          <div className="p-5 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5">
            <p className="text-[#C9A84C] text-xs font-semibold mb-2 uppercase tracking-wider">📌 Pin this first</p>
            <p className="text-white text-sm leading-relaxed mb-4 whitespace-pre-wrap">{bc.pinned_post}</p>
            <CopyBtn text={bc.pinned_post} label="Copy Pinned Post" />
          </div>
        </div>
      )}

      {/* Content pillars visual */}
      {bc.content_pillars && bc.content_pillars.length > 0 && (
        <div>
          <h3 className="text-[#C9A84C] text-sm font-bold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Your Content Pillars
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bc.content_pillars.map((pillar, i) => {
              const colors = [
                "border-purple-500/30 bg-purple-500/5",
                "border-blue-500/30 bg-blue-500/5",
                "border-green-500/30 bg-green-500/5",
                "border-[#C9A84C]/30 bg-[#C9A84C]/5",
                "border-pink-500/30 bg-pink-500/5",
              ];
              return (
                <div key={i} className={`p-4 rounded-xl border ${colors[i % colors.length]}`}>
                  <p className="text-white font-bold text-sm mb-1">{pillar.pillar}</p>
                  <p className="text-white/50 text-xs mb-2 leading-relaxed">{pillar.description}</p>
                  <p className="text-[#C9A84C] text-xs font-semibold">{pillar.post_frequency}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

interface ResultsScreenProps {
  plan: ContentPlan;
  setup: SetupData;
  planId: string;
  locale: string;
  onRegenerate: () => void;
  ft: Record<string, string>;
}

function ResultsScreen({ plan, setup, planId, locale, onRegenerate, ft }: ResultsScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("calendar");
  const [posts, setPosts] = useState<ContentPost[]>(plan.posts ?? []);
  const [regenerating, setRegenerating] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState("");
  const [copiedWeek, setCopiedWeek] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleRegenerate(post: ContentPost) {
    const newSet = new Set(Array.from(regenerating));
    newSet.add(post.day);
    setRegenerating(newSet);
    try {
      const res = await fetch("/api/content-plan/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: post.day, week: post.week,
          platform: post.platform, contentType: post.content_type,
          startupName: setup.startupName, targetAudience: setup.targetAudience,
          tone: setup.tone, personalStory: setup.personalStory, goal: setup.goal,
          existingTitles: posts.map(p => p.title).filter(t => t !== post.title),
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.full_post) {
        setPosts(prev => prev.map(p => p.day === post.day ? { ...data, day: post.day, week: post.week } : p));
        showToast("Post rewritten! Day " + post.day + " updated.");
      }
    } catch { /* silent */ }
    setRegenerating(prev => {
      const s = new Set(Array.from(prev));
      s.delete(post.day);
      return s;
    });
  }

  function copyWeek(weekNum: number) {
    const weekPosts = posts.filter(p => p.week === weekNum);
    const text = weekPosts.map(p =>
      `--- Day ${p.day} | ${p.platform} | ${p.content_type.replace(/_/g, " ")} ---\n${p.full_post}`
    ).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedWeek(true);
      showToast(`Week ${weekNum} — ${weekPosts.length} posts copied to clipboard!`);
      setTimeout(() => setCopiedWeek(false), 3000);
    }).catch(() => prompt("Copy Week " + weekNum + ":", text));
  }

  function downloadPlan() {
    const lines: string[] = [];
    lines.push("30-DAY CONTENT PLAN");
    lines.push(`Startup: ${setup.startupName}`);
    lines.push(`Generated by Quantum | ${new Date().toLocaleDateString()}`);
    lines.push("=".repeat(60));

    if (plan.founder_voice) {
      lines.push("\nYOUR CONTENT VOICE");
      lines.push(`Tone: ${plan.founder_voice.tone}`);
      lines.push(`Style: ${plan.founder_voice.style}`);
      lines.push(`Key themes: ${plan.founder_voice.key_themes?.join(", ")}`);
    }

    [1, 2, 3, 4].forEach(w => {
      const weekPosts = posts.filter(p => p.week === w);
      if (weekPosts.length === 0) return;
      lines.push(`\n${"=".repeat(60)}`);
      lines.push(`WEEK ${w}`);
      const ws = plan.weekly_strategy as Record<string, string>;
      lines.push(`Strategy: ${ws[`week${w}`] ?? ""}`);
      lines.push("");
      weekPosts.forEach(post => {
        lines.push(`--- Day ${post.day} | ${post.platform} | ${post.content_type.replace(/_/g, " ").toUpperCase()} ---`);
        lines.push(`Best time: ${post.best_time_to_post}`);
        lines.push(`Hook: ${post.hook}`);
        lines.push("");
        lines.push(post.full_post);
        lines.push("");
      });
    });

    if (plan.bonus_content) {
      lines.push("=".repeat(60));
      lines.push("BONUS CONTENT");
      lines.push("\nLinkedIn Bio:");
      lines.push(plan.bonus_content.bio_linkedin ?? "");
      lines.push("\nTwitter Bio:");
      lines.push(plan.bonus_content.bio_twitter ?? "");
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-plan-${setup.startupName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Plan downloaded!");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "calendar", label: "📅 Calendar" },
    { id: "posts", label: "📝 All Posts" },
    { id: "strategy", label: "💡 Strategy" },
    { id: "bonus", label: "🎁 Bonus" },
  ];

  return (
    <div className="min-h-screen bg-[#06040F] pb-32">
      {/* Header */}
      <div className="bg-[#0F0A1F] border-b border-[#1A1040] px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-1">30-Day Content Plan</p>
          <h1 className="text-2xl font-black text-white mb-3">{setup.startupName}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {setup.platforms.map(p => (
              <span key={p} className={`px-2 py-0.5 rounded-full border text-xs font-bold ${platformColor(p)}`}>
                {platformEmoji(p)} {p}
              </span>
            ))}
            {plan.founder_voice?.tone && (
              <span className="px-2 py-0.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-bold">
                ✍️ {plan.founder_voice.tone.split(" ").slice(0, 4).join(" ")}
              </span>
            )}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "📝", value: `${posts.length}`, label: "Posts total" },
              { icon: "📅", value: "4", label: "Weeks planned" },
              { icon: "🎯", value: setup.goal.split(" ").slice(0, 2).join(" "), label: "Goal" },
              { icon: "✍️", value: setup.tone.split(" ")[0], label: "Voice" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#06040F] border border-[#1A1040] rounded-xl p-3 text-center">
                <p className="text-lg mb-0.5">{stat.icon}</p>
                <p className="text-white font-black text-sm">{stat.value}</p>
                <p className="text-white/30 text-[10px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="sticky top-0 z-10 bg-[#0F0A1F]/90 backdrop-blur border-b border-[#1A1040]">
        <div className="max-w-4xl mx-auto flex overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? "text-[#C9A84C]" : "text-[#8B7CF8]/60 hover:text-[#8B7CF8]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "calendar" && (
              <CalendarTab posts={posts} onRegenerate={handleRegenerate} regenerating={regenerating} />
            )}
            {activeTab === "posts" && (
              <AllPostsTab posts={posts} setup={setup} onRegenerate={handleRegenerate} regenerating={regenerating} locale={locale} />
            )}
            {activeTab === "strategy" && (
              <StrategyTab plan={{ ...plan, posts }} setup={setup} />
            )}
            {activeTab === "bonus" && (
              <BonusTab plan={plan} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast} />}
      </AnimatePresence>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0F0A1F]/95 backdrop-blur border-t border-[#1A1040] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadPlan}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] font-black rounded-xl transition-colors text-sm"
          >
            <Download className="w-4 h-4" /> {ft.downloadCSV}
          </button>
          <button
            onClick={() => copyWeek(1)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              copiedWeek
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-[#7C3AED]/40 text-[#8B7CF8] hover:bg-[#7C3AED]/10"
            }`}
          >
            {copiedWeek ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy Week 1
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1A1040] text-[#8B7CF8]/60 hover:text-[#8B7CF8] hover:border-[#7C3AED]/30 text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" /> {ft.newPlan}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContentPlanPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.contentPlan as Record<string, string>;
  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [planId, setPlanId] = useState("");
  const [apiError, setApiError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    fetch("/api/content-plan")
      .then(r => r.json())
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => { /* silent */ })
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleGenerate = useCallback(async (data: SetupData) => {
    setSetup(data);
    setApiError("");
    setStep("generating");

    try {
      const res = await fetch("/api/content-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      const body = await res.json();
      if (!res.ok) {
        setApiError(body.error ?? "Generation failed. Your answers are saved. Click to try again.");
        setStep("setup");
        return;
      }
      setPlan(body.plan);
      setPlanId(body.id ?? "");
      setStep("results");
      // Clear localStorage after successful generation
      try { localStorage.removeItem(LS_KEY); } catch { /* ok */ }
    } catch {
      setApiError("Connection error. Your answers are saved. Please try again.");
      setStep("setup");
    }
  }, [locale]);

  const handleRegeneratePlan = useCallback(() => {
    // Go back to setup with answers pre-filled (they're already in localStorage)
    setStep("setup");
    setPlan(null);
    setPlanId("");
    setApiError("");
  }, []);

  return (
    <div className="min-h-screen bg-[#06040F]">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {apiError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 py-3 rounded-xl border border-red-500/40 bg-[#0F0A1F] text-red-400 text-sm flex items-start gap-2 shadow-xl">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}
            <SetupScreen
              onGenerate={handleGenerate}
              history={history}
              historyLoading={historyLoading}
              ft={ft}
            />
          </motion.div>
        )}
        {step === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GeneratingScreen />
          </motion.div>
        )}
        {step === "results" && plan && setup && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsScreen
              plan={plan}
              setup={setup}
              planId={planId}
              locale={locale}
              onRegenerate={handleRegeneratePlan}
              ft={ft}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
