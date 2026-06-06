"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronRight, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const QUESTIONS = [
  "What's your startup idea? Describe it like you'd explain to a stranger at a coffee shop.",
  "What problem does it solve? Be specific — whose problem, exactly?",
  "Why does this problem exist right now? What makes today different from 5 years ago?",
  "Who is your first paying customer and why would they pay on day one?",
  "What have you built or tested so far?",
  "Who are your top 3 competitors and what's your unfair advantage?",
  "How do you make money?",
  "Why are YOU the right person to solve this?",
];

interface ValidatorResult {
  verdict: "STRONG" | "PROMISING" | "NEEDS_WORK" | "PIVOT";
  problem_score: number;
  solution_score: number;
  market_score: number;
  overall_score: number;
  biggest_strength: string;
  biggest_risk: string;
  three_things_to_validate: string[];
  honest_feedback: string;
}

const VERDICT_CONFIG = {
  STRONG: { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/40", label: "STRONG" },
  PROMISING: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40", label: "PROMISING" },
  NEEDS_WORK: { color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/40", label: "NEEDS WORK" },
  PIVOT: { color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40", label: "PIVOT" },
};

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#eab308" : score >= 30 ? "#f97316" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1A1040" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${score} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{score}</span>
        </div>
      </div>
      <span className="text-[#8B7CF8] text-xs text-center">{label}</span>
    </div>
  );
}

export default function IdeaValidatorPage() {
  const { t, locale } = useLanguage();
  const fv = t.features.ideaValidator;
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
      setError("Something went wrong. Please try again.");
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

  const progress = ((currentQuestion + (loading ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">{fv.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {fv.subtitle}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* QUESTIONS */}
        {!result && !loading && (
          <motion.div key={`q-${currentQuestion}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-[#8B7CF8] text-xs mb-2">
                <span>{fv.questionOf} {currentQuestion + 1} {fv.of} {QUESTIONS.length}</span>
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
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleNext(); }}
              placeholder="Answer honestly — the AI will see through vague answers..."
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
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="w-14 h-14 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[#8B7CF8] text-lg">Analyzing your idea...</p>
            <p className="text-white/30 text-sm mt-2">This takes about 10 seconds</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Verdict */}
            <div className={`p-6 rounded-2xl border ${VERDICT_CONFIG[result.verdict].bg} ${VERDICT_CONFIG[result.verdict].border} text-center`}>
              <div className={`text-4xl font-black mb-1 ${VERDICT_CONFIG[result.verdict].color}`}>
                {VERDICT_CONFIG[result.verdict].label}
              </div>
              <p className="text-white/50 text-sm">{fv.verdict}</p>
            </div>

            {/* Score gauges */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <h3 className="text-white font-semibold mb-6 text-center">Scores</h3>
              <div className="flex justify-around">
                <ScoreGauge label="Problem" score={result.problem_score} />
                <ScoreGauge label="Solution" score={result.solution_score} />
                <ScoreGauge label="Market" score={result.market_score} />
                <ScoreGauge label="Overall" score={result.overall_score} />
              </div>
            </div>

            {/* Strength & Risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-2xl">
                <p className="text-green-400 font-semibold text-sm mb-2">Biggest Strength</p>
                <p className="text-white text-sm leading-relaxed">{result.biggest_strength}</p>
              </div>
              <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl">
                <p className="text-red-400 font-semibold text-sm mb-2">Biggest Risk</p>
                <p className="text-white text-sm leading-relaxed">{result.biggest_risk}</p>
              </div>
            </div>

            {/* 3 Things to Validate */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <h3 className="text-[#7C3AED] font-semibold mb-4">3 Things to Validate Next</h3>
              <ol className="space-y-3">
                {result.three_things_to_validate.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#8B7CF8] text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-white text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Honest Feedback */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <h3 className="text-white font-semibold mb-4">Honest Feedback</h3>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.honest_feedback}</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Validate another idea
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
