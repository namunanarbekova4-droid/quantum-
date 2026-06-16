"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ArrowLeft, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const SITUATION_EMOJIS = ["🤔", "🎯", "⚡", "🔀", "🌑"];

type Message = { role: "user" | "assistant"; content: string };
type Stage = "landing" | "input" | "questions" | "response";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-10 h-10 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
    </div>
  );
}

export default function CompassPage() {
  const { t, locale } = useLanguage();
  const fc = t.features.compass;
  const SITUATIONS = fc.situations.map((label, i) => ({ id: String(i), label, emoji: SITUATION_EMOJIS[i] }));
  const [stage, setStage] = useState<Stage>("landing");
  const [selectedSituation, setSelectedSituation] = useState<string>("");
  const [initialText, setInitialText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [finalResponse, setFinalResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const userMessages = messages.filter((m) => m.role === "user");

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
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          {stage !== "landing" && (
            <button onClick={reset} className="text-[#8B7CF8] hover:text-white transition-colors mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Compass className="w-7 h-7 text-[#7C3AED]" />
          <h1 className="text-3xl font-bold text-white">{fc.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {fc.subtitle}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* LANDING STATE */}
        {stage === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-white/60 text-center mb-8 text-lg">{fc.situationPrompt}</p>
            <div className="grid gap-4">
              {SITUATIONS.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSituationClick(s.label)}
                  className="flex items-center gap-5 p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl hover:border-[#7C3AED]/60 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all text-left group"
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-white text-lg font-medium group-hover:text-[#8B7CF8] transition-colors">
                    {s.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* INPUT STATE */}
        {stage === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-6">
              <div className="inline-block px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-full text-[#8B7CF8] text-sm mb-4">
                {selectedSituation}
              </div>
              <h2 className="text-2xl font-bold text-white">{fc.situationPrompt}</h2>
            </div>
            <textarea
              value={initialText}
              onChange={(e) => setInitialText(e.target.value)}
              placeholder={fc.answerPlaceholder}
              rows={6}
              className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#C9A84C]/50 rounded-xl p-4 text-white placeholder-white/30 resize-none outline-none transition-colors text-base"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleInitialSubmit}
                disabled={loading || !initialText.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] hover:bg-[#D4B85C] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[#06040F] font-semibold transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#06040F]/30 border-t-[#06040F] rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {loading ? fc.thinking : fc.continue}
              </button>
            </div>
          </motion.div>
        )}

        {/* QUESTIONS STATE */}
        {stage === "questions" && !loading && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-8 justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < userMessages.length
                      ? "bg-[#7C3AED] scale-110"
                      : i === userMessages.length - 1
                      ? "bg-[#7C3AED]"
                      : "bg-[#1A1040]"
                  }`}
                />
              ))}
              <span className="text-[#8B7CF8] text-sm ml-2">
                {fc.questionOf} {Math.min(userMessages.length, 3)} {fc.of} 3
              </span>
            </div>

            <div className="mb-6 p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
              <p className="text-white text-xl leading-relaxed">{currentQuestion}</p>
            </div>

            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={fc.answerPlaceholder}
              rows={5}
              className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-4 text-white placeholder-white/30 resize-none outline-none transition-colors text-base"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAnswerSubmit}
                disabled={loading || !currentAnswer.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {fc.continue}
              </button>
            </div>
          </motion.div>
        )}

        {/* LOADING */}
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingSpinner />
            <p className="text-center text-[#8B7CF8] text-sm">Mapping your direction…</p>
          </motion.div>
        )}

        {/* FINAL RESPONSE */}
        {stage === "response" && !loading && (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <Compass className="w-5 h-5 text-[#7C3AED]" />
              <span className="text-[#8B7CF8] font-medium">Quantum Compass</span>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#7C3AED] to-[#C9A84C] rounded-full" />
              <div className="pl-6 p-6 bg-[#0F0A1F] border border-[#1A1040] rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                <p className="text-white text-base leading-relaxed whitespace-pre-line">{finalResponse}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl text-[#8B7CF8] hover:text-white transition-colors text-sm"
              >
                {fc.next ?? "Start over"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
