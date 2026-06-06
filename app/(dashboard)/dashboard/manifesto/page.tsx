"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronRight, Copy, Check, RotateCcw } from "lucide-react";

const QUESTIONS = [
  "What does your company exist to do in the world? Not what it sells — what it DOES.",
  "What do you believe about your industry that most people disagree with?",
  "What kind of people do you want to work with? What makes someone fit here?",
  "What are you willing to say NO to, even if it means losing money?",
  "What does the world look like in 10 years if you succeed completely?",
  "What's the one sentence that would make the right person say 'I need to be part of this'?",
];

interface ManifestoResult {
  manifesto: string;
  coreValues: Array<{ name: string; explanation: string }>;
  missionStatement: string;
  visionStatement: string;
  culturePrinciples: string[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-lg text-[#8B7CF8] hover:text-white transition-colors text-xs"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ManifestoPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(6).fill(""));
  const [currentInput, setCurrentInput] = useState("");
  const [result, setResult] = useState<ManifestoResult | null>(null);
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
      const res = await fetch("/api/manifesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
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
    setAnswers(Array(6).fill(""));
    setCurrentInput("");
    setResult(null);
    setError("");
  }

  function buildDownloadText() {
    if (!result) return "";
    return [
      "COMPANY MANIFESTO",
      "=================",
      "",
      result.manifesto,
      "",
      "MISSION",
      result.missionStatement,
      "",
      "VISION",
      result.visionStatement,
      "",
      "CORE VALUES",
      ...result.coreValues.map((v) => `${v.name}: ${v.explanation}`),
      "",
      "CULTURE PRINCIPLES",
      ...result.culturePrinciples,
    ].join("\n");
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">Manifesto Builder</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          Define who you are, what you stand for, and why it matters
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* QUESTIONS */}
        {!result && !loading && (
          <motion.div key={`q-${currentQuestion}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-[#8B7CF8] text-xs mb-2">
                <span>Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                <span>{Math.round((currentQuestion / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#C9A84C] rounded-full"
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
              placeholder="Go deep. This becomes your company's DNA..."
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
                className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
              >
                {currentQuestion === QUESTIONS.length - 1 ? "Build Manifesto" : "Next"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="w-14 h-14 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[#8B7CF8] text-lg">Forging your manifesto...</p>
            <p className="text-white/30 text-sm mt-2">This may take 15 seconds</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#0F0A1F] border border-[#7C3AED]/30 rounded-2xl">
                <p className="text-[#7C3AED] text-xs font-semibold uppercase tracking-wider mb-2">Mission</p>
                <p className="text-white text-sm leading-relaxed">{result.missionStatement}</p>
              </div>
              <div className="p-5 bg-[#0F0A1F] border border-[#C9A84C]/30 rounded-2xl">
                <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-wider mb-2">Vision</p>
                <p className="text-white text-sm leading-relaxed">{result.visionStatement}</p>
              </div>
            </div>

            {/* Manifesto */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Manifesto</h3>
                <CopyButton text={result.manifesto} />
              </div>
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{result.manifesto}</p>
            </div>

            {/* Core Values */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <h3 className="text-white font-bold mb-5">Core Values</h3>
              <div className="space-y-4">
                {result.coreValues.map((v, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#8B7CF8] text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{v.name}</p>
                      <p className="text-white/60 text-sm mt-1 leading-relaxed">{v.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Culture Principles */}
            <div className="p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <h3 className="text-white font-bold mb-4">Culture Principles</h3>
              <div className="space-y-2">
                {result.culturePrinciples.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-[#1A1040] last:border-0">
                    <span className="text-[#C9A84C]">→</span>
                    <p className="text-white text-sm">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <CopyButton text={buildDownloadText()} />
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Start over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
