"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Send, Volume2, VolumeX, Loader2,
  RotateCcw, AlertTriangle, Zap, Eye, HelpCircle, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "enemy";
  content: string;
}

interface Verdict {
  strongestWeakness: string;
  biggestBlindSpot: string;
  whatFailsFirst: string;
  unansweredQuestion: string;
  strategicStrength: string;
  recommendation: string;
  recommendationLabel: "Strong Move" | "Proceed Carefully" | "Weak Strategy" | "High Risk" | "Not Ready Yet";
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

function speak(text: string, personality: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.name.includes("Google UK English Male")) ||
    voices.find((v) => v.name.includes("Microsoft") && v.lang.startsWith("en")) ||
    voices.find((v) => v.lang === "en-GB") ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;
  utterance.rate = 0.9;
  utterance.pitch =
    personality === "savage-investor" ? 0.8 : personality === "board-member" ? 0.85 : 1.0;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-[#C9A84C] rounded-full"
          animate={{ height: ["4px", "14px", "4px"] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-4 py-3 bg-[#111111] border border-[#1a1a1a] rounded-lg w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-[#888888] rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ─── Verdict Badge ────────────────────────────────────────────────────────────

function VerdictBadge({ label }: { label: string }) {
  const color =
    label === "Strong Move"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : label === "Proceed Carefully"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : label === "Weak Strategy"
      ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
      : "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <span className={cn("px-4 py-2 rounded-full border text-sm font-semibold", color)}>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnemyModePage() {
  const { t } = useLanguage();
  const em = t.enemyMode;

  const PERSONALITIES = [
    { id: "savage-investor", ...em.personalities.savageInvestor, icon: "💰" },
    { id: "competitor",      ...em.personalities.competitor,     icon: "⚔️" },
    { id: "board-member",    ...em.personalities.boardMember,    icon: "🏛️" },
    { id: "tough-mentor",    ...em.personalities.toughMentor,    icon: "🎯" },
    { id: "brutal-strategist", ...em.personalities.brutalStrategist, icon: "📊" },
  ];

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 0
  const [decisionText, setDecisionText] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState<string | null>(null);

  // Step 1
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Step 2
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);

  const personality = PERSONALITIES.find((p) => p.id === selectedPersonality);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const callChat = useCallback(
    async (userMessage: string, currentHistory: Message[]) => {
      setIsTyping(true);
      setChatError(null);
      try {
        const res = await fetch("/api/enemy-mode/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            personality: selectedPersonality,
            history: currentHistory.slice(-20),
            decisionContext: decisionText,
            userRole: "FOUNDER",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setChatError(data.error || `Error ${res.status}`);
          return;
        }
        if (data.reply) {
          const newMessages: Message[] = [
            ...currentHistory,
            ...(userMessage ? [{ role: "user" as const, content: userMessage }] : []),
            { role: "enemy" as const, content: data.reply },
          ];
          setMessages(newMessages);
          if (voiceEnabled) {
            const idx = newMessages.length - 1;
            setSpeakingIndex(idx);
            speak(data.reply, selectedPersonality!);
            const words = data.reply.split(" ").length;
            setTimeout(() => setSpeakingIndex(null), (words / 2) * 1000);
          }
        }
      } catch (err) {
        setChatError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        setIsTyping(false);
      }
    },
    [selectedPersonality, decisionText, voiceEnabled]
  );

  const beginSession = useCallback(async () => {
    setStep(1);
    setMessages([]);
    await callChat("", []);
  }, [callChat]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    const currentMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(currentMessages);
    await callChat(text, messages);
  }, [input, isTyping, messages, callChat]);

  const endSession = useCallback(async () => {
    setVerdictLoading(true);
    setStep(2);
    try {
      const res = await fetch("/api/enemy-mode/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality: selectedPersonality,
          decisionContext: decisionText,
          history: messages,
          userRole: "FOUNDER",
        }),
      });
      const data = await res.json();
      setVerdict(data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerdictLoading(false);
    }
  }, [selectedPersonality, decisionText, messages]);

  const reset = () => {
    setStep(0);
    setDecisionText("");
    setSelectedPersonality(null);
    setMessages([]);
    setVerdict(null);
    setInput("");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const handleSpeak = (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis?.cancel();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speak(text, selectedPersonality!);
      const words = text.split(" ").length;
      setTimeout(() => setSpeakingIndex((cur) => (cur === index ? null : cur)), (words / 2) * 1000);
    }
  };

  // ── STEP 0: SETUP ─────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#080808] p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="text-center space-y-3 pt-4">
            <div className="flex items-center justify-center gap-3">
              <ShieldAlert className="w-8 h-8 text-[#C9A84C]" />
              <h1 className="text-3xl font-bold text-white">{em.title}</h1>
            </div>
            <p className="text-[#888888] text-lg">{em.subtitle}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#888888]">{em.decisionLabel}</label>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder={em.decisionPlaceholder}
              rows={4}
              className="w-full bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white placeholder-[#888888] resize-none focus:outline-none focus:border-[#C9A84C]/40 transition-colors"
            />
            <div className="flex justify-between text-xs text-[#888888]">
              <span>{decisionText.length < 50 ? `${50 - decisionText.length} ${em.charsRemaining}` : em.ready}</span>
              <span>{decisionText.length} {em.chars}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[#888888]">{em.chooseAdversary}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonality(p.id)}
                  className={cn(
                    "text-left p-4 rounded-lg border transition-all duration-200 space-y-2",
                    selectedPersonality === p.id
                      ? "border-[#C9A84C] bg-[#C9A84C]/5"
                      : "border-[#1a1a1a] bg-[#111111] hover:border-[#C9A84C]/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.icon}</span>
                    <span className="font-semibold text-white text-sm">{p.name}</span>
                  </div>
                  <p className="text-[#888888] text-xs leading-relaxed">{p.description}</p>
                  <span className="inline-block text-xs text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
                    {p.voiceStyle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={beginSession}
            disabled={decisionText.length < 50 || !selectedPersonality}
            className={cn(
              "w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200",
              decisionText.length >= 50 && selectedPersonality
                ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90"
                : "bg-[#1a1a1a] text-[#888888] cursor-not-allowed"
            )}
          >
            {em.beginSession}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 1: CHAT ──────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-col h-screen bg-[#080808]">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#080808]">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-[#C9A84C]" />
            <div>
              <span className="text-white font-semibold text-sm">{personality?.name}</span>
              <span className="text-[#888888] text-xs ml-2">{em.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                voiceEnabled
                  ? "border-[#C9A84C]/40 text-[#C9A84C] bg-[#C9A84C]/5"
                  : "border-[#1a1a1a] text-[#888888] hover:text-white"
              )}
              title={voiceEnabled ? em.disableVoice : em.enableVoice}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={endSession}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/5 transition-colors"
            >
              {em.endSession}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "enemy" ? (
                  <div className="max-w-[80%] space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#888888]">{personality?.icon} {personality?.name}</span>
                    </div>
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <button
                      onClick={() => handleSpeak(msg.content, i)}
                      className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#C9A84C] transition-colors mt-1"
                    >
                      {speakingIndex === i ? (
                        <><Waveform /><span>{em.stop}</span></>
                      ) : (
                        <><Volume2 className="w-3 h-3" /><span>{em.play}</span></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="max-w-[80%] bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <TypingIndicator />
            </motion.div>
          )}
          {chatError && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="max-w-[80%] bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                ⚠️ {chatError}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 border-t border-[#1a1a1a] bg-[#080808] p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={em.respondPlaceholder}
              rows={2}
              className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white placeholder-[#888888] resize-none focus:outline-none focus:border-[#C9A84C]/40 transition-colors text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className={cn(
                "p-3 rounded-lg transition-colors",
                input.trim() && !isTyping
                  ? "bg-[#C9A84C] text-[#080808] hover:bg-[#C9A84C]/90"
                  : "bg-[#1a1a1a] text-[#888888] cursor-not-allowed"
              )}
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: VERDICT ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080808] p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="text-center space-y-3 pt-4">
          <div className="flex items-center justify-center gap-2 text-[#888888] text-sm">
            <span>{personality?.icon} {personality?.name}</span>
            <span>·</span>
            <span>{em.finalVerdict}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{em.sessionComplete}</h2>
          {verdictLoading && (
            <div className="flex items-center justify-center gap-2 text-[#888888]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{em.generatingVerdict}</span>
            </div>
          )}
          {verdict && <div className="flex justify-center"><VerdictBadge label={verdict.recommendationLabel} /></div>}
        </div>

        {verdict && (
          <>
            {[
              { label: em.strongestWeakness,    value: verdict.strongestWeakness,  icon: AlertTriangle, color: "text-red-400" },
              { label: em.biggestBlindSpot,     value: verdict.biggestBlindSpot,   icon: Eye,           color: "text-orange-400" },
              { label: em.whatFailsFirst,       value: verdict.whatFailsFirst,     icon: Zap,           color: "text-yellow-400" },
              { label: em.unansweredQuestion,   value: verdict.unansweredQuestion, icon: HelpCircle,    color: "text-amber-400" },
              { label: em.strategicStrength,    value: verdict.strategicStrength,  icon: TrendingUp,    color: "text-green-400" },
            ].map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", section.color)} />
                    <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{section.label}</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{section.value}</p>
                </motion.div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-5 space-y-2"
            >
              <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">{em.finalRecommendation}</span>
              <p className="text-white text-sm leading-relaxed">{verdict.recommendation}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#C9A84C] tracking-widest uppercase">{em.shareTitle}</span>
                <VerdictBadge label={verdict.recommendationLabel} />
              </div>
              <p className="text-[#888888] text-xs">vs. {personality?.name}</p>
              <p className="text-white text-sm italic leading-relaxed border-l-2 border-[#C9A84C]/40 pl-3">
                &ldquo;{verdict.strongestWeakness.split(".")[0]}.&rdquo;
              </p>
              <p className="text-[#888888] text-xs">quantum-s5sr.vercel.app</p>
            </motion.div>
          </>
        )}

        <button
          onClick={reset}
          className="w-full py-3 rounded-lg border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {em.startNewSession}
        </button>
      </motion.div>
    </div>
  );
}
