"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight, RotateCcw, Shield, AlertTriangle, TrendingUp, Eye, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface KillerRisk {
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  mitigation: string;
}

interface ValidatorResult {
  verdict: "EXCEPTIONAL" | "STRONG" | "PROMISING" | "NEEDS_WORK" | "WEAK" | "PIVOT_NOW";
  summary: string;
  scores: {
    problem: number;
    market: number;
    solution: number;
    competition: number;
    founder_fit: number;
    moat: number;
    execution: number;
    revenue: number;
    survival_probability: number;
  };
  biggest_strength: string;
  biggest_weakness: string;
  blind_spots: string[];
  unfair_advantage: {
    exists: boolean;
    description: string;
    strength: "STRONG" | "MODERATE" | "WEAK" | "NONE";
  };
  killer_risks: KillerRisk[];
  investor_reaction: {
    what_they_like: string;
    what_they_challenge: string;
    likely_rejection_reason: string;
  };
  action_plan: string[];
  honest_feedback: string;
}

const VERDICT_CONFIG = {
  EXCEPTIONAL: {
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/40",
    glow: "shadow-[0_0_60px_rgba(52,211,153,0.25)]",
    label: "EXCEPTIONAL",
    sub: "Rare. This has real signal.",
  },
  STRONG: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/40",
    glow: "shadow-[0_0_40px_rgba(34,197,94,0.2)]",
    label: "STRONG",
    sub: "Fundable with focused execution.",
  },
  PROMISING: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    glow: "shadow-[0_0_40px_rgba(234,179,8,0.15)]",
    label: "PROMISING",
    sub: "Real potential. Close the gaps first.",
  },
  NEEDS_WORK: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    glow: "shadow-[0_0_30px_rgba(249,115,22,0.15)]",
    label: "NEEDS WORK",
    sub: "Idea has merit. Thinking needs sharpening.",
  },
  WEAK: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
    label: "WEAK",
    sub: "Major structural problems. Rethink core assumptions.",
  },
  PIVOT_NOW: {
    color: "text-red-300",
    bg: "bg-red-900/20",
    border: "border-red-400/60",
    glow: "shadow-[0_0_50px_rgba(239,68,68,0.3)]",
    label: "PIVOT NOW",
    sub: "This direction is unlikely to work.",
  },
};

const SCORE_LABELS: Record<keyof ValidatorResult["scores"], string> = {
  problem: "Problem",
  market: "Market",
  solution: "Solution",
  competition: "Competition",
  founder_fit: "Founder Fit",
  moat: "Moat",
  execution: "Execution",
  revenue: "Revenue Model",
  survival_probability: "Survival",
};

const RISK_SEVERITY_COLOR = {
  HIGH: "text-red-400 bg-red-500/10 border-red-500/30",
  MEDIUM: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  LOW: "text-green-400 bg-green-500/10 border-green-500/30",
};

const ADVANTAGE_COLOR = {
  STRONG: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  MODERATE: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  WEAK: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  NONE: "text-red-400 border-red-500/40 bg-red-500/10",
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70
      ? "#34d399"
      : score >= 50
      ? "#eab308"
      : score >= 30
      ? "#f97316"
      : "#ef4444";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#8B7CF8] text-xs w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
        />
      </div>
      <span className="text-white text-xs font-bold w-8 text-right">{score}</span>
    </div>
  );
}

function OverallGauge({ score }: { score: number }) {
  const color =
    score >= 70 ? "#34d399" : score >= 50 ? "#eab308" : score >= 30 ? "#f97316" : "#ef4444";
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1A1040" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-black text-3xl">{score}</span>
        <span className="text-[#8B7CF8] text-xs">Overall</span>
      </div>
    </div>
  );
}

export default function IdeaValidatorPage() {
  const { t, locale } = useLanguage();
  const fv = t.features.ideaValidator;
  const QUESTIONS = fv.questions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(8).fill(""));
  const [currentInput, setCurrentInput] = useState("");
  const [result, setResult] = useState<ValidatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNext() {
    if (!currentInput.trim()) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = currentInput;
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setCurrentInput("");
    } else {
      submitAnswers(newAnswers);
    }
  }

  async function submitAnswers(finalAnswers: string[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/idea-validator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, locale }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Analysis hit a snag. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCurrentQuestion(0);
    setAnswers(Array(8).fill(""));
    setCurrentInput("");
    setResult(null);
    setError("");
  }

  const progress = (currentQuestion / QUESTIONS.length) * 100;
  const overallScore = result
    ? Math.round(
        Object.values(result.scores).reduce((a, b) => a + b, 0) /
          Object.values(result.scores).length
      )
    : 0;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">{fv.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">{fv.subtitle}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* QUESTIONS */}
        {!result && !loading && (
          <motion.div
            key={`q-${currentQuestion}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="mb-8">
              <div className="flex justify-between text-[#8B7CF8] text-xs mb-2">
                <span>
                  {fv.questionOf} {currentQuestion + 1} {fv.of} {QUESTIONS.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#C9A84C] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentQuestion / QUESTIONS.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <p className="text-white text-2xl font-medium mb-8 leading-relaxed">
              {QUESTIONS[currentQuestion]}
            </p>

            <textarea
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handleNext();
              }}
              placeholder="Describe your idea honestly — including the parts you're unsure about."
              rows={6}
              autoFocus
              className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-5 text-white placeholder-white/30 resize-none outline-none transition-colors text-base"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[#8B7CF8]/50 text-xs">⌘ + Enter to continue</span>
              <button
                onClick={handleNext}
                disabled={!currentInput.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
              >
                {currentQuestion === QUESTIONS.length - 1 ? fv.validate : fv.nextQuestion}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#7C3AED]/20 border-t-[#7C3AED] animate-spin" />
              <div className="absolute inset-2 rounded-full border border-[#C9A84C]/20 border-b-[#C9A84C] animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <p className="text-white text-lg font-medium">Running 9-dimension analysis…</p>
            <p className="text-[#8B7CF8] text-sm mt-2">Thinking like a YC partner. This takes ~15 seconds.</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Verdict Glow Card */}
            <div
              className={`p-8 rounded-2xl border text-center ${VERDICT_CONFIG[result.verdict].bg} ${VERDICT_CONFIG[result.verdict].border} ${VERDICT_CONFIG[result.verdict].glow}`}
            >
              <div className={`text-5xl font-black mb-2 tracking-wide ${VERDICT_CONFIG[result.verdict].color}`}>
                {VERDICT_CONFIG[result.verdict].label}
              </div>
              <p className="text-white/50 text-sm mb-4">{VERDICT_CONFIG[result.verdict].sub}</p>
              {result.summary && (
                <p className="text-white/70 text-sm leading-relaxed max-w-xl mx-auto">{result.summary}</p>
              )}
            </div>

            {/* 9-Dimension Scores */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <OverallGauge score={overallScore} />
                </div>
                <div className="flex-1 space-y-3 pt-2">
                  {(Object.keys(result.scores) as Array<keyof ValidatorResult["scores"]>).map((key) => (
                    <ScoreBar key={key} label={SCORE_LABELS[key]} score={result.scores[key]} />
                  ))}
                </div>
              </div>
            </div>

            {/* Strength & Weakness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl">
                <p className="text-green-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> {fv.biggestStrength}
                </p>
                <p className="text-white text-sm leading-relaxed">{result.biggest_strength}</p>
              </div>
              <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {fv.biggestRisk || "Biggest Weakness"}
                </p>
                <p className="text-white text-sm leading-relaxed">{result.biggest_weakness}</p>
              </div>
            </div>

            {/* Blind Spots */}
            {result.blind_spots && result.blind_spots.length > 0 && (
              <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <h3 className="text-[#C9A84C] font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> What You&apos;re Probably Missing
                </h3>
                <ul className="space-y-3">
                  {result.blind_spots.map((spot, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] flex-shrink-0 mt-2" />
                      <p className="text-white/80 text-sm leading-relaxed">{spot}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unfair Advantage */}
            {result.unfair_advantage && (
              <div className={`p-5 border rounded-2xl ${ADVANTAGE_COLOR[result.unfair_advantage.strength]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <Zap className="w-4 h-4" /> Unfair Advantage
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">{result.unfair_advantage.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold flex-shrink-0 ${ADVANTAGE_COLOR[result.unfair_advantage.strength]}`}>
                    {result.unfair_advantage.strength}
                  </span>
                </div>
              </div>
            )}

            {/* Killer Risks */}
            {result.killer_risks && result.killer_risks.length > 0 && (
              <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <h3 className="text-red-400 font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Killer Risks
                </h3>
                <div className="space-y-4">
                  {result.killer_risks.map((risk, i) => (
                    <div key={i} className="p-4 bg-[#06040F] border border-[#1A1040] rounded-xl">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-white/90 text-sm font-medium flex-1">{risk.risk}</span>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${RISK_SEVERITY_COLOR[risk.severity]}`}>
                            S:{risk.severity[0]}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${RISK_SEVERITY_COLOR[risk.likelihood]}`}>
                            L:{risk.likelihood[0]}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#8B7CF8] text-xs">→ {risk.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investor Reaction */}
            {result.investor_reaction && (
              <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl">
                <h3 className="text-[#8B7CF8] font-semibold mb-4">What a VC Partner Really Thinks</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">What They Like</p>
                    <p className="text-white/80 text-sm leading-relaxed">{result.investor_reaction.what_they_like}</p>
                  </div>
                  <div>
                    <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-1">First Challenge</p>
                    <p className="text-white/80 text-sm leading-relaxed">{result.investor_reaction.what_they_challenge}</p>
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">Why They&apos;d Pass</p>
                    <p className="text-white/80 text-sm leading-relaxed">{result.investor_reaction.likely_rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Plan */}
            {result.action_plan && result.action_plan.length > 0 && (
              <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <h3 className="text-[#7C3AED] font-semibold mb-4">
                  {fv.thingsToValidate || "3 Things to Do Next"}
                </h3>
                <ol className="space-y-3">
                  {result.action_plan.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#8B7CF8] text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-white text-sm leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Honest Feedback */}
            {result.honest_feedback && (
              <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <h3 className="text-white font-semibold mb-4">{fv.honestFeedback}</h3>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                  {result.honest_feedback}
                </p>
              </div>
            )}

            <div className="flex justify-center pb-8">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {fv.startOver}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
