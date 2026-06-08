"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Volume2, VolumeX, Loader2,
  RotateCcw, AlertTriangle, Zap, Eye, HelpCircle, TrendingUp,
  Flame,
} from "lucide-react";
import Link from "next/link";
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

interface Opponent {
  id: string;
  personality: string;
  emoji: string;
  name: string;
  description: string;
  tag: string;
  tagColor: string;
}

// ─── Opponents ────────────────────────────────────────────────────────────────

const OPPONENTS: Opponent[] = [
  {
    id: "brutal-competitor",
    personality: "competitor",
    emoji: "💀",
    name: "The Brutal Competitor",
    description: "A rival founder who built the same thing and wants to destroy your idea.",
    tag: "Most brutal",
    tagColor: "text-red-400 bg-red-500/10 border-red-500/20",
  },
  {
    id: "skeptical-investor",
    personality: "savage-investor",
    emoji: "🦈",
    name: "The Skeptical Investor",
    description: "A VC who has seen 1000 pitches and thinks yours is nothing special.",
    tag: "Cuts deep",
    tagColor: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "angry-customer",
    personality: "tough-mentor",
    emoji: "😤",
    name: "The Angry Customer",
    description: "Your potential user who tried everything and is fed up with bad solutions.",
    tag: "Real talk",
    tagColor: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  {
    id: "technical-expert",
    personality: "brutal-strategist",
    emoji: "🤓",
    name: "The Technical Expert",
    description: "Someone who knows the tech inside out and sees every flaw in your approach.",
    tag: "No mercy",
    tagColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

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
    personality === "savage-investor" ? 0.8 : personality === "competitor" ? 0.85 : 1.0;
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
          className="w-0.5 bg-red-400 rounded-full"
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
    <div className="flex gap-1 items-center px-4 py-3 bg-[#0F0A1F] border border-[#1A1040] rounded-lg w-fit">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-red-400 rounded-full"
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
  const { locale } = useLanguage();

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Step 0
  const [decisionText, setDecisionText] = useState("");
  const [mainClaim, setMainClaim] = useState("");
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);

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

  const opponent = OPPONENTS.find((o) => o.id === selectedOpponentId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const callChat = useCallback(
    async (userMessage: string, currentHistory: Message[]) => {
      if (!opponent) return;
      setIsTyping(true);
      setChatError(null);
      const startupContext = `Startup idea: ${decisionText}${mainClaim ? `\nMain claim: ${mainClaim}` : ""}`;
      try {
        const res = await fetch("/api/enemy-mode/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            personality: opponent.personality,
            history: currentHistory.slice(-20),
            decisionContext: startupContext,
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
            speak(data.reply, opponent.personality);
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
    [opponent, decisionText, mainClaim, voiceEnabled]
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
    await callChat(text, messages);
  }, [input, isTyping, messages, callChat]);

  const endSession = useCallback(async () => {
    if (!opponent) return;
    setVerdictLoading(true);
    setStep(2);
    const startupContext = `Startup idea: ${decisionText}${mainClaim ? `\nMain claim: ${mainClaim}` : ""}`;
    try {
      const res = await fetch("/api/enemy-mode/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personality: opponent.personality,
          decisionContext: startupContext,
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
  }, [opponent, decisionText, mainClaim, messages]);

  const reset = () => {
    setStep(0);
    setDecisionText("");
    setMainClaim("");
    setSelectedOpponentId(null);
    setMessages([]);
    setVerdict(null);
    setInput("");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  };

  const handleSpeak = (text: string, index: number) => {
    if (!opponent) return;
    if (speakingIndex === index) {
      window.speechSynthesis?.cancel();
      setSpeakingIndex(null);
    } else {
      setSpeakingIndex(index);
      speak(text, opponent.personality);
      const words = text.split(" ").length;
      setTimeout(() => setSpeakingIndex((cur) => (cur === index ? null : cur)), (words / 2) * 1000);
    }
  };

  const exchangeCount = messages.filter((m) => m.role === "user").length;
  const canGetConvinced = exchangeCount >= 2;

  // ── STEP 0: SETUP ─────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <>
        <style>{`
          @keyframes float-orb-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(60px, -80px) scale(1.1); }
            66% { transform: translate(-40px, 40px) scale(0.9); }
          }
          @keyframes float-orb-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-70px, 50px) scale(0.95); }
            66% { transform: translate(50px, -60px) scale(1.05); }
          }
        `}</style>

        <div className="relative min-h-screen bg-[#06040F] overflow-hidden">
          {/* Aurora orbs */}
          <div
            className="pointer-events-none absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 70%)",
              animation: "float-orb-1 18s ease-in-out infinite",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)",
              animation: "float-orb-2 22s ease-in-out infinite",
            }}
          />
          {/* Red tint overlay */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "rgba(220,38,38,0.08)" }}
          />

          <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 pt-4"
            >
              <div className="flex items-center justify-center gap-3">
                <Flame className="w-8 h-8 text-red-500" />
                <h1 className="text-3xl font-bold text-white">Startup Roaster</h1>
              </div>
              <p className="text-[#8B7CF8] text-lg">
                Let AI be your harshest critic before the real world is.
              </p>
            </motion.div>

            {/* Opponent grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-3"
            >
              <label className="text-sm font-medium text-[#8B7CF8]">Choose your roaster:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPPONENTS.map((opp) => {
                  const isSelected = selectedOpponentId === opp.id;
                  return (
                    <button
                      key={opp.id}
                      onClick={() => setSelectedOpponentId(opp.id)}
                      className={cn(
                        "text-left p-4 rounded-xl border transition-all duration-200 space-y-2 relative overflow-hidden",
                        isSelected
                          ? "border-[#7f1d1d] bg-[rgba(239,68,68,0.2)]"
                          : "border-[#1A1040] bg-[#0F0A1F] hover:border-red-900/60 hover:bg-red-950/20"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none" />
                      )}
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none mt-0.5">{opp.emoji}</span>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-bold text-white text-sm">{opp.name}</p>
                          <p className="text-[#8B7CF8]/70 text-xs leading-relaxed">{opp.description}</p>
                          <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full border font-medium", opp.tagColor)}>
                            {opp.tag}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Input section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B7CF8]">Describe your startup idea:</label>
                <textarea
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="Tell us what you're building, who it's for, and why it matters..."
                  rows={4}
                  className="w-full bg-[#0F0A1F] border border-[#1A1040] rounded-xl px-4 py-3 text-white placeholder-[#8B7CF8]/40 resize-none focus:outline-none focus:border-red-900/60 transition-colors text-sm"
                />
                <div className="flex justify-between text-xs">
                  <span className={cn(decisionText.length < 50 ? "text-red-400" : "text-green-400")}>
                    {decisionText.length < 50
                      ? `${50 - decisionText.length} more characters needed`
                      : "✓ Ready to roast"}
                  </span>
                  <span className="text-[#8B7CF8]/60">{decisionText.length} chars</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#8B7CF8]">{"What's your main claim?"}</label>
                <input
                  type="text"
                  value={mainClaim}
                  onChange={(e) => setMainClaim(e.target.value)}
                  placeholder="We are 10x better than competitors"
                  className="w-full bg-[#0F0A1F] border border-[#1A1040] rounded-xl px-4 py-3 text-white placeholder-[#8B7CF8]/40 focus:outline-none focus:border-red-900/60 transition-colors text-sm"
                />
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onClick={beginSession}
              disabled={decisionText.length < 50 || !selectedOpponentId}
              className={cn(
                "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2",
                decisionText.length >= 50 && selectedOpponentId
                  ? "bg-[#C9A84C] text-[#06040F] hover:bg-[#C9A84C]/90 shadow-lg shadow-amber-900/20"
                  : "bg-[#0F0A1F] text-[#8B7CF8]/30 cursor-not-allowed border border-[#1A1040]"
              )}
            >
              <Flame className="w-4 h-4" />
              Roast Me →
            </motion.button>
          </div>
        </div>
      </>
    );
  }

  // ── STEP 1: CHAT ──────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-col h-screen bg-[#06040F]">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[#1A1040] bg-[#0F0A1F]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{opponent?.emoji}</span>
            <div>
              <p className="text-white font-bold text-sm leading-tight">{opponent?.name}</p>
              <p className="text-[#8B7CF8] text-xs">Startup Roaster</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                voiceEnabled
                  ? "border-red-500/40 text-red-400 bg-red-500/5"
                  : "border-[#1A1040] text-[#8B7CF8] hover:text-white"
              )}
              title={voiceEnabled ? "Disable voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={endSession}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Get Verdict →
            </button>
          </div>
        </div>

        {/* Messages */}
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
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{opponent?.emoji}</span>
                      <span className="text-xs text-[#8B7CF8]/70 font-medium">{opponent?.name}</span>
                    </div>
                    <div
                      className="rounded-xl px-4 py-3 text-white text-sm leading-relaxed"
                      style={{
                        background: "rgba(127,29,29,0.3)",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      {msg.content}
                    </div>
                    <button
                      onClick={() => handleSpeak(msg.content, i)}
                      className="flex items-center gap-1.5 text-xs text-[#8B7CF8]/60 hover:text-red-400 transition-colors mt-1"
                    >
                      {speakingIndex === i ? (
                        <><Waveform /><span>Stop</span></>
                      ) : (
                        <><Volume2 className="w-3 h-3" /><span>Play</span></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div
                    className="max-w-[80%] rounded-xl px-4 py-3 text-white text-sm leading-relaxed"
                    style={{
                      background: "rgba(201,168,76,0.1)",
                      border: "1px solid rgba(201,168,76,0.25)",
                    }}
                  >
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
              <div className="max-w-[80%] bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                ⚠️ {chatError}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* "I'm convinced" button after 2+ exchanges */}
        <AnimatePresence>
          {canGetConvinced && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex-shrink-0 px-4 pb-2"
            >
              <Link
                href="/dashboard/idea-validator"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-[#C9A84C] border border-[#C9A84C]/30 bg-[#C9A84C]/5 hover:bg-[#C9A84C]/10 transition-colors"
              >
                {"I'm convinced, fix my idea →"}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#1A1040] bg-[#0F0A1F] p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Defend your idea..."
              rows={2}
              className="flex-1 bg-[#06040F] border border-[#1A1040] rounded-xl px-4 py-3 text-white placeholder-[#8B7CF8]/40 resize-none focus:outline-none focus:border-red-900/60 transition-colors text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className={cn(
                "p-3 rounded-xl transition-colors",
                input.trim() && !isTyping
                  ? "bg-[#C9A84C] text-[#06040F] hover:bg-[#C9A84C]/90"
                  : "bg-[#0F0A1F] text-[#8B7CF8]/30 cursor-not-allowed border border-[#1A1040]"
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
    <div className="min-h-screen bg-[#06040F] p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Header */}
          <div className="text-center space-y-3 pt-4">
            <div className="flex items-center justify-center gap-2 text-[#8B7CF8]/70 text-sm">
              <span>{opponent?.emoji}</span>
              <span>{opponent?.name}</span>
              <span>·</span>
              <span>Final Verdict</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-2">
              Roast Complete <Flame className="w-7 h-7 text-red-500" />
            </h2>
            {verdictLoading && (
              <div className="flex items-center justify-center gap-2 text-[#8B7CF8]/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Generating your roast verdict...</span>
              </div>
            )}
            {verdict && (
              <div className="flex justify-center">
                <VerdictBadge label={verdict.recommendationLabel} />
              </div>
            )}
          </div>

          {/* Verdict sections */}
          {verdict && (
            <>
              {[
                {
                  label: "Strongest Weakness",
                  value: verdict.strongestWeakness,
                  icon: AlertTriangle,
                  color: "text-red-400",
                  border: "border-red-500/20",
                  bg: "bg-red-500/5",
                },
                {
                  label: "Biggest Blind Spot",
                  value: verdict.biggestBlindSpot,
                  icon: Eye,
                  color: "text-orange-400",
                  border: "border-orange-500/20",
                  bg: "bg-orange-500/5",
                },
                {
                  label: "What Fails First",
                  value: verdict.whatFailsFirst,
                  icon: Zap,
                  color: "text-yellow-400",
                  border: "border-yellow-500/20",
                  bg: "bg-yellow-500/5",
                },
                {
                  label: "Unanswered Question",
                  value: verdict.unansweredQuestion,
                  icon: HelpCircle,
                  color: "text-amber-400",
                  border: "border-amber-500/20",
                  bg: "bg-amber-500/5",
                },
                {
                  label: "Strategic Strength",
                  value: verdict.strategicStrength,
                  icon: TrendingUp,
                  color: "text-green-400",
                  border: "border-green-500/20",
                  bg: "bg-green-500/5",
                },
              ].map((section, i) => {
                const Icon = section.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn("rounded-xl p-4 space-y-2 border", section.bg, section.border)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", section.color)} />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                        {section.label}
                      </span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{section.value}</p>
                  </motion.div>
                );
              })}

              {/* Final recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-xl p-5 space-y-2"
                style={{
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.25)",
                }}
              >
                <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">
                  Final Recommendation
                </span>
                <p className="text-white text-sm leading-relaxed">{verdict.recommendation}</p>
              </motion.div>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
              >
                <button
                  onClick={reset}
                  className="py-3 rounded-xl border border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-red-900/60 transition-all text-sm font-semibold flex items-center justify-center gap-2 bg-[#0F0A1F]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Roast Again 🔥
                </button>
                <Link
                  href="/dashboard/idea-validator"
                  className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "#C9A84C",
                    color: "#06040F",
                  }}
                >
                  Fix My Idea →
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
