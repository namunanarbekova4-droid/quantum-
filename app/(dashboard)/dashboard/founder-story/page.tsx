"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Copy, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";


interface FounderStoryResult {
  linkedinPost: string;
  podcastIntro: string;
  pressBio: string;
  fullStory: string;
  twitterThread: string;
}

const OUTPUT_TABS = [
  { key: "linkedinPost" as const, label: "LinkedIn Post" },
  { key: "podcastIntro" as const, label: "Podcast Intro" },
  { key: "pressBio" as const, label: "Press Bio" },
  { key: "fullStory" as const, label: "Full Story" },
  { key: "twitterThread" as const, label: "Twitter Thread" },
];

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
      className="flex items-center gap-1.5 px-4 py-2 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function FounderStoryPage() {
  const { t, locale } = useLanguage();
  const ffs = t.features.founderStory;
  const QUESTIONS = ffs.questions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(6).fill(""));
  const [currentInput, setCurrentInput] = useState("");
  const [result, setResult] = useState<FounderStoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<keyof FounderStoryResult>("linkedinPost");

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
      const res = await fetch("/api/founder-story", {
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
    setAnswers(Array(6).fill(""));
    setCurrentInput("");
    setResult(null);
    setError("");
    setActiveTab("linkedinPost");
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-7 h-7 text-[#7C3AED]" />
          <h1 className="text-3xl font-bold text-white">{ffs.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {ffs.subtitle}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* QUESTIONS */}
        {!result && !loading && (
          <motion.div key={`q-${currentQuestion}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            {/* Progress */}
            <div className="mb-8">
              <div className="flex justify-between text-[#8B7CF8] text-xs mb-2">
                <span>{ffs.questionOf} {currentQuestion + 1} {ffs.of} {QUESTIONS.length}</span>
                <span>{Math.round((currentQuestion / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-[#1A1040] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#7C3AED] rounded-full"
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
              placeholder="Be specific. Real details make stories stick..."
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
                {currentQuestion === QUESTIONS.length - 1 ? ffs.generate : ffs.nextQuestion}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="w-14 h-14 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[#8B7CF8] text-lg">Crafting your story...</p>
            <p className="text-white/30 text-sm mt-2">Writing 5 formats — takes about 15 seconds</p>
          </motion.div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Tab selector */}
            <div className="flex flex-wrap gap-2">
              {OUTPUT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    activeTab === tab.key
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                      : "bg-[#0F0A1F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 hover:text-white"
                  }`}
                >
                  {tab.key === "linkedinPost" ? ffs.linkedin : tab.key === "podcastIntro" ? ffs.podcast : tab.key === "pressBio" ? ffs.press : tab.key === "fullStory" ? ffs.fullStory : ffs.twitter}
                </button>
              ))}
            </div>

            {/* Content card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1040]">
                  <span className="text-white font-semibold text-sm">
                    {activeTab === "linkedinPost" ? ffs.linkedin : activeTab === "podcastIntro" ? ffs.podcast : activeTab === "pressBio" ? ffs.press : activeTab === "fullStory" ? ffs.fullStory : ffs.twitter}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs">
                      {result[activeTab].split(/\s+/).length} {ffs.words}
                    </span>
                    <CopyButton text={result[activeTab]} />
                  </div>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-line">{result[activeTab]}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center pt-2">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {ffs.startOver}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
