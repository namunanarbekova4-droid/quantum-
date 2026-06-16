"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const SITUATION_EMOJIS = ["🤔", "🎯", "⚡", "🔀", "🌑"];

type Message = { role: "user" | "assistant"; content: string };
type Stage = "landing" | "input" | "questions" | "response";

const ROTATING_PROMPTS = [
  "What feels heavy right now?",
  "What decision is keeping you awake?",
  "What are you actually avoiding?",
  "What truth are you scared to admit?",
  "What would you tell a friend in your position?",
];

const TEXTAREA_PLACEHOLDERS = [
  "Tell me what's actually going on...",
  "No polish needed — just what's true right now...",
  "What would you say if you weren't trying to sound okay?",
  "Start anywhere. We'll find the real question together.",
];

const THINKING_MESSAGES = [
  "Thinking deeper...",
  "Looking for what you may be missing...",
  "Trying to understand what's underneath this...",
  "Reading between the lines...",
  "Finding what matters most here...",
];

const FEELINGS = [
  { id: "clearer", label: "Clearer", emoji: "✓", response: "Good. Hold onto that clarity." },
  { id: "motivated", label: "Motivated", emoji: "↑", response: "Use it. The next 24 hours matter." },
  { id: "unsure", label: "Still unsure", emoji: "~", response: "That's okay. Sit with it. The answer will surface." },
  { id: "overwhelmed", label: "Overwhelmed", emoji: "○", response: "That's honest. Take one thing from this and set the rest aside." },
  { id: "honest", label: "That hit", emoji: "•", response: "Then it was worth it." },
];

function useRotatingText(items: string[], interval: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items, interval]);
  return items[index];
}

function ThinkingLoader() {
  const message = useRotatingText(THINKING_MESSAGES, 2500);
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[40vh] gap-6"
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-[#C9A84C]"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="text-[#8B7CF8] text-sm text-center"
        >
          {message}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

export default function CompassPage() {
  const { t, locale } = useLanguage();
  const fc = t.features.compass;
  const SITUATIONS = fc.situations.map((label: string, i: number) => ({ id: String(i), label, emoji: SITUATION_EMOJIS[i] }));

  const [stage, setStage] = useState<Stage>("landing");
  const [selectedSituation, setSelectedSituation] = useState<string>("");
  const [initialText, setInitialText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [finalResponse, setFinalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [afterFeel, setAfterFeel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [answerFocused, setAnswerFocused] = useState(false);

  const userMessages = messages.filter((m) => m.role === "user");
  const rotatingSubtitle = useRotatingText(ROTATING_PROMPTS, 3000);
  const textareaPlaceholder = useRotatingText(TEXTAREA_PLACEHOLDERS, 4000);

  async function callAPI(newMessages: Message[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation: selectedSituation, messages: newMessages, locale }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.type === "question") {
        setCurrentQuestion(data.content);
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setStage("questions");
      } else {
        setFinalResponse(data.content);
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setStage("response");
      }
    } catch {
      setError("Lost the connection. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function handleSituationClick(situation: string) {
    setSelectedSituation(situation);
    setStage("input");
  }

  async function handleInitialSubmit() {
    if (!initialText.trim()) return;
    const newMessages: Message[] = [{ role: "user", content: initialText }];
    setMessages(newMessages);
    setCurrentAnswer("");
    await callAPI(newMessages);
  }

  async function handleAnswerSubmit() {
    if (!currentAnswer.trim()) return;
    const newMessages: Message[] = [...messages, { role: "user", content: currentAnswer }];
    setMessages(newMessages);
    setCurrentAnswer("");
    await callAPI(newMessages);
  }

  function reset() {
    setStage("landing");
    setSelectedSituation("");
    setInitialText("");
    setMessages([]);
    setCurrentAnswer("");
    setCurrentQuestion("");
    setFinalResponse("");
    setError("");
    setAfterFeel(null);
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(finalResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedFeeling = FEELINGS.find((f) => f.id === afterFeel);

  return (
    <div className="min-h-screen bg-[#06040F] relative">
      {/* Ambient orb */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] left-[30%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)" }}
        />
      </div>

      {/* Back button */}
      {stage !== "landing" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={reset}
          className="fixed top-6 left-6 z-10 text-[#8B7CF8] hover:text-white transition-colors p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <AnimatePresence mode="wait">
          {/* LANDING */}
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-white mb-4">
                  How are you really feeling about your startup today?
                </h1>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={rotatingSubtitle}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4 }}
                    className="text-[#8B7CF8] text-sm"
                  >
                    {rotatingSubtitle}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-3">
                {SITUATIONS.map((s: { id: string; label: string; emoji: string }, i: number) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => handleSituationClick(s.label)}
                    className="flex items-center gap-5 p-5 bg-[#0F0A1F]/60 border-l-2 border-l-[#C9A84C]/30 border border-[#1A1040] rounded-xl hover:border-[#7C3AED]/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)] hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <span className="text-white/80 text-base group-hover:text-white transition-colors leading-snug">
                      {s.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* INPUT */}
          {stage === "input" && !loading && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              <div className="mb-8">
                <div className="inline-block px-3 py-1 bg-[#7C3AED]/15 border border-[#7C3AED]/30 rounded-full text-[#8B7CF8] text-xs mb-6">
                  {selectedSituation}
                </div>
              </div>

              <textarea
                value={initialText}
                onChange={(e) => setInitialText(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={textareaPlaceholder}
                rows={6}
                className={`w-full bg-transparent text-white placeholder-[#8B7CF8]/30 resize-none outline-none transition-all duration-300 text-base leading-relaxed py-3 ${
                  inputFocused
                    ? "border border-[#7C3AED]/40 rounded-xl px-4"
                    : "border-b border-[#1A1040] px-0"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && initialText.trim().length > 20) {
                    handleInitialSubmit();
                  }
                }}
              />

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <AnimatePresence>
                {initialText.trim().length > 20 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 flex justify-end"
                  >
                    <button
                      onClick={handleInitialSubmit}
                      className="text-[#C9A84C] hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>↵ Continue</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* QUESTIONS */}
          {stage === "questions" && !loading && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              {/* 3-dot progress */}
              <div className="flex items-center justify-center gap-2 mb-10">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i < userMessages.length ? "bg-[#7C3AED]" : "bg-[#1A1040]"
                    }`}
                  />
                ))}
                <span className="text-[#8B7CF8]/40 text-xs ml-3">
                  {Math.min(userMessages.length + 1, 3)} of 3
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 text-center"
              >
                <p className="text-white text-xl font-medium leading-relaxed max-w-prose mx-auto">
                  {currentQuestion}
                </p>
                <div className="mt-6 h-px bg-[#C9A84C]/20 mx-auto w-16" />
              </motion.div>

              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onFocus={() => setAnswerFocused(true)}
                onBlur={() => setAnswerFocused(false)}
                placeholder={textareaPlaceholder}
                rows={5}
                className={`w-full bg-transparent text-white placeholder-[#8B7CF8]/30 resize-none outline-none transition-all duration-300 text-base leading-relaxed py-3 ${
                  answerFocused
                    ? "border border-[#7C3AED]/40 rounded-xl px-4"
                    : "border-b border-[#1A1040] px-0"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && currentAnswer.trim()) {
                    handleAnswerSubmit();
                  }
                }}
              />

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <AnimatePresence>
                {currentAnswer.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 flex justify-end"
                  >
                    <button
                      onClick={handleAnswerSubmit}
                      className="text-[#C9A84C] hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      <span>↵ Continue</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* LOADING */}
          {loading && <ThinkingLoader />}

          {/* RESPONSE */}
          {stage === "response" && !loading && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <div className="mb-6">
                <span className="text-xs text-[#8B7CF8] uppercase tracking-widest">Quantum&apos;s take</span>
                <div className="mt-3 h-px bg-[#C9A84C]/30 w-full" />
              </div>

              <div className="space-y-4">
                {finalResponse.split(/\n\n+/).map((para, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed text-white/90 ${i === 0 ? "text-lg" : "text-base"}`}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* How do you feel after this? */}
              <div className="mt-12">
                <p className="text-[#8B7CF8]/60 text-xs uppercase tracking-widest mb-4">How do you feel after this?</p>
                <div className="flex flex-wrap gap-2">
                  {FEELINGS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAfterFeel(f.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
                        afterFeel === f.id
                          ? "bg-[#C9A84C]/20 border-[#C9A84C]/60 text-[#C9A84C]"
                          : "border-[#1A1040] text-white/50 hover:border-[#7C3AED]/40 hover:text-white/80"
                      }`}
                    >
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedFeeling && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 text-[#C9A84C]/80 text-sm italic"
                    >
                      {selectedFeeling.response}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Action buttons */}
              <div className="mt-10 flex items-center gap-4">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 bg-[#C9A84C] hover:bg-[#D4B85C] text-[#06040F] text-sm font-semibold rounded-xl transition-colors"
                >
                  Go again →
                </button>
                <button
                  onClick={handleCopy}
                  className="px-5 py-2.5 border border-[#1A1040] hover:border-[#7C3AED]/40 text-[#8B7CF8] hover:text-white text-sm rounded-xl transition-colors"
                >
                  {copied ? "Saved." : "Save this →"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
