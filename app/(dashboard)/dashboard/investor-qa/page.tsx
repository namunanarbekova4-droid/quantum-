"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import {
  ChevronRight,
  RotateCcw,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  TrendingUp,
  Atom,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupData {
  startupName: string;
  description: string;
  stage: string;
  raisingAmount: string;
}

interface ScoreResult {
  score: number;
  verdict: "STRONG" | "ACCEPTABLE" | "WEAK";
  whatWorked: string;
  whatsWrong: string;
  betterVersion: string;
}

interface QAEntry {
  question: string;
  answer: string;
  score: number;
  verdict: "STRONG" | "ACCEPTABLE" | "WEAK";
  whatWorked: string;
  whatsWrong: string;
  betterVersion: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-green-500/10 border-green-500/20";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function scoreDot(score: number) {
  if (score >= 70) return "bg-green-400";
  if (score >= 40) return "bg-amber-400";
  return "bg-red-400";
}

function verdictLabel(score: number) {
  if (score >= 75) return "Investor Ready";
  if (score >= 50) return "Almost Ready";
  return "Needs More Practice";
}

function verdictColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function VerdictBadge({ verdict }: { verdict: "STRONG" | "ACCEPTABLE" | "WEAK" }) {
  const styles: Record<string, string> = {
    STRONG: "bg-green-500/10 text-green-400 border-green-500/30",
    ACCEPTABLE: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    WEAK: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold tracking-wider uppercase ${styles[verdict]}`}
    >
      {verdict === "STRONG" && <CheckCircle className="w-3 h-3 mr-1.5" />}
      {verdict === "ACCEPTABLE" && <AlertTriangle className="w-3 h-3 mr-1.5" />}
      {verdict === "WEAK" && <XCircle className="w-3 h-3 mr-1.5" />}
      {verdict}
    </span>
  );
}

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <>
      <style>{`
        @keyframes orb1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.15; }
          33%       { transform: translate(8%, 6%) scale(1.1); opacity: 0.22; }
          66%       { transform: translate(-5%, 10%) scale(0.95); opacity: 0.12; }
        }
        @keyframes orb2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.10; }
          40%       { transform: translate(-10%, -8%) scale(1.15); opacity: 0.18; }
          75%       { transform: translate(6%, -12%) scale(0.9); opacity: 0.08; }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "65vw",
            height: "65vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 40% 40%, #7C3AED 0%, transparent 70%)",
            animation: "orb1 18s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-25%",
            right: "-15%",
            width: "55vw",
            height: "55vw",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 60% 60%, #C9A84C 0%, transparent 70%)",
            animation: "orb2 22s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}

// ─── Setup Screen (step 0) ────────────────────────────────────────────────────

interface SetupScreenProps {
  onStart: (data: SetupData, questions: string[]) => void;
  locale: string;
}

function SetupScreen({ onStart, locale }: SetupScreenProps) {
  const [form, setForm] = useState<SetupData>({
    startupName: "",
    description: "",
    stage: "MVP",
    raisingAmount: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!form.startupName.trim() || !form.description.trim()) {
      setError("Please fill in your startup name and description.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/investor-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_questions",
          ...form,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");
      onStart(form, data.questions as string[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 max-w-2xl mx-auto w-full"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 mb-5">
          <TrendingUp className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Investor Q&A Trainer
        </h1>
        <p className="text-[#8B7CF8] text-lg max-w-lg mx-auto leading-relaxed">
          Practice the questions that make founders sweat. Master them before
          you walk in the room.
        </p>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl border border-[#1A1040] p-8 space-y-5"
        style={{ background: "#0F0A1F" }}
      >
        {/* Startup Name */}
        <div>
          <label className="block text-sm font-medium text-[#8B7CF8] mb-2">
            Startup Name
          </label>
          <input
            type="text"
            value={form.startupName}
            onChange={(e) => setForm((f) => ({ ...f, startupName: e.target.value }))}
            placeholder="e.g. QuantumLeap"
            className="w-full px-4 py-3 rounded-xl bg-[#06040F] border border-[#1A1040] text-white placeholder-[#3D3060] focus:outline-none focus:border-[#7C3AED] transition-colors text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#8B7CF8] mb-2">
            What does your startup do?
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            placeholder="Describe your product, market, and traction in 2-3 sentences..."
            className="w-full px-4 py-3 rounded-xl bg-[#06040F] border border-[#1A1040] text-white placeholder-[#3D3060] focus:outline-none focus:border-[#7C3AED] transition-colors text-sm resize-none"
          />
        </div>

        {/* Stage + Raising */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[#8B7CF8] mb-2">
              Stage
            </label>
            <select
              value={form.stage}
              onChange={(e) =>
                setForm((f) => ({ ...f, stage: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl bg-[#06040F] border border-[#1A1040] text-white focus:outline-none focus:border-[#7C3AED] transition-colors text-sm appearance-none"
            >
              <option value="Idea">Idea</option>
              <option value="MVP">MVP</option>
              <option value="Early Revenue">Early Revenue</option>
              <option value="Growing">Growing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8B7CF8] mb-2">
              How much are you raising?
            </label>
            <input
              type="text"
              value={form.raisingAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, raisingAmount: e.target.value }))
              }
              placeholder="$50K – $500K"
              className="w-full px-4 py-3 rounded-xl bg-[#06040F] border border-[#1A1040] text-white placeholder-[#3D3060] focus:outline-none focus:border-[#7C3AED] transition-colors text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            background: loading ? "#7C3AED80" : "#C9A84C",
            color: "#06040F",
          }}
        >
          {loading ? (
            <>
              <Atom className="w-5 h-5 animate-spin" />
              Generating your questions...
            </>
          ) : (
            <>
              Start Training
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Training Screen (step 1) ─────────────────────────────────────────────────

interface TrainingScreenProps {
  setupData: SetupData;
  questions: string[];
  locale: string;
  onComplete: (entries: QAEntry[]) => void;
}

function TrainingScreen({
  setupData,
  questions,
  locale,
  onComplete,
}: TrainingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scoring, setScoring] = useState(false);
  const [feedback, setFeedback] = useState<ScoreResult | null>(null);
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / total) * 100;

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setScoring(true);
    setScoreError(null);
    try {
      const res = await fetch("/api/investor-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score_answer",
          question: currentQuestion,
          answer,
          startupName: setupData.startupName,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed");
      setFeedback(data as ScoreResult);
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScoring(false);
    }
  };

  const nextQuestion = () => {
    if (!feedback) return;
    const newEntry: QAEntry = {
      question: currentQuestion,
      answer,
      score: feedback.score,
      verdict: feedback.verdict,
      whatWorked: feedback.whatWorked,
      whatsWrong: feedback.whatsWrong,
      betterVersion: feedback.betterVersion,
    };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);

    if (currentIndex + 1 >= total) {
      onComplete(newEntries);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setAnswer("");
    setFeedback(null);
    setScoreError(null);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const endSession = () => {
    const partialEntries = entries;
    if (feedback) {
      partialEntries.push({
        question: currentQuestion,
        answer,
        score: feedback.score,
        verdict: feedback.verdict,
        whatWorked: feedback.whatWorked,
        whatsWrong: feedback.whatsWrong,
        betterVersion: feedback.betterVersion,
      });
    }
    onComplete(partialEntries);
  };

  return (
    <motion.div
      key="training"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 max-w-2xl mx-auto w-full"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[#8B7CF8]">
          Question {currentIndex + 1} of {total}
        </span>
        <button
          onClick={endSession}
          className="flex items-center gap-1.5 text-xs text-[#8B7CF8] hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg border border-[#1A1040] hover:border-red-500/30"
        >
          <X className="w-3.5 h-3.5" /> End Session
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-[#1A1040] mb-8 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #7C3AED, #C9A84C)" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-[#1A1040] overflow-hidden mb-5"
          style={{ background: "#0F0A1F", borderLeft: "4px solid #C9A84C" }}
        >
          <div className="p-6">
            <p className="text-xl font-bold text-white leading-relaxed mb-2">
              {currentQuestion}
            </p>
            <p className="text-xs text-[#3D3060]">
              This is what investors actually ask
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer textarea */}
      <div className="relative mb-4">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!feedback || scoring}
          rows={5}
          placeholder="Type your answer here... Be specific. Investors hate vague answers."
          className="w-full px-4 py-4 rounded-xl bg-[#0F0A1F] border border-[#1A1040] text-white placeholder-[#3D3060] focus:outline-none focus:border-[#7C3AED] transition-colors text-sm resize-none disabled:opacity-60"
        />
        <span className="absolute bottom-3 right-3 text-xs text-[#3D3060]">
          {answer.length} chars
        </span>
      </div>

      {scoreError && (
        <p className="text-red-400 text-sm flex items-center gap-1.5 mb-3">
          <AlertTriangle className="w-4 h-4" /> {scoreError}
        </p>
      )}

      {/* Submit button */}
      {!feedback && (
        <button
          onClick={submitAnswer}
          disabled={scoring || !answer.trim()}
          className="w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 mb-6"
          style={{ background: "#C9A84C", color: "#06040F" }}
        >
          {scoring ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Evaluating your answer...
            </>
          ) : (
            <>
              Submit Answer
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      )}

      {/* Feedback card */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[#1A1040] p-6 mb-5 space-y-5"
            style={{ background: "#0F0A1F" }}
          >
            {/* Score + Verdict */}
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border ${scoreBg(feedback.score)}`}
              >
                <span className={scoreColor(feedback.score)}>
                  {feedback.score}
                </span>
              </div>
              <div>
                <VerdictBadge verdict={feedback.verdict} />
                <p className="text-xs text-[#8B7CF8] mt-1.5">out of 100</p>
              </div>
            </div>

            {/* What worked */}
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1.5">
                What worked
              </p>
              <p className="text-sm text-green-300/80 leading-relaxed">
                {feedback.whatWorked}
              </p>
            </div>

            {/* What's missing */}
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1.5">
                What&apos;s missing
              </p>
              <p className="text-sm text-red-300/80 leading-relaxed">
                {feedback.whatsWrong}
              </p>
            </div>

            {/* Better version */}
            <div
              className="rounded-xl p-4 border border-[#C9A84C]/20"
              style={{ background: "#C9A84C10" }}
            >
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider mb-2">
                Better version
              </p>
              <p className="text-sm text-[#C9A84C]/90 leading-relaxed italic">
                &ldquo;{feedback.betterVersion}&rdquo;
              </p>
            </div>

            {/* Next button */}
            <button
              onClick={nextQuestion}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: currentIndex + 1 >= total ? "#7C3AED" : "#C9A84C",
                color: "#06040F",
              }}
            >
              {currentIndex + 1 >= total ? (
                <>See Results</>
              ) : (
                <>
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Results Screen (step 2) ──────────────────────────────────────────────────

interface ResultsScreenProps {
  setupData: SetupData;
  entries: QAEntry[];
  locale: string;
  onReset: () => void;
}

function ResultsScreen({ setupData, entries, locale, onReset }: ResultsScreenProps) {
  const [saved, setSaved] = useState(false);

  const overallScore =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length)
      : 0;

  // Find 3 weakest answers by score
  const sortedByScore = [...entries].sort((a, b) => a.score - b.score);
  const weakestIds = new Set(
    sortedByScore
      .slice(0, 3)
      .map((e) => entries.findIndex((x) => x === e))
  );

  // Save session on mount
  useEffect(() => {
    if (entries.length === 0 || saved) return;
    setSaved(true);
    fetch("/api/investor-qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_session",
        startupName: setupData.startupName,
        description: setupData.description,
        stage: setupData.stage,
        raisingAmount: setupData.raisingAmount,
        questionsAndAnswers: entries,
        overallScore,
        locale,
      }),
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 max-w-2xl mx-auto w-full"
    >
      {/* Overall score hero */}
      <div
        className="rounded-2xl border border-[#1A1040] p-8 mb-6 text-center"
        style={{ background: "#0F0A1F" }}
      >
        <p className="text-sm font-medium text-[#8B7CF8] uppercase tracking-wider mb-3">
          Overall Readiness Score
        </p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`text-8xl font-black mb-3 ${verdictColor(overallScore)}`}
        >
          {overallScore}
        </motion.div>
        <p className={`text-2xl font-bold mb-1 ${verdictColor(overallScore)}`}>
          {verdictLabel(overallScore)}
        </p>
        <p className="text-sm text-[#8B7CF8]">
          Based on {entries.length} answer{entries.length !== 1 ? "s" : ""}
        </p>

        <button
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: "#7C3AED", color: "white" }}
        >
          <RotateCcw className="w-4 h-4" />
          Practice Again
        </button>
      </div>

      {/* Q&A breakdown */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white mb-4">
            Your Answers Breakdown
          </h2>
          {entries.map((entry, i) => {
            const isWeak = weakestIds.has(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-5 ${
                  isWeak
                    ? "border-red-500/40"
                    : "border-[#1A1040]"
                }`}
                style={{ background: "#0F0A1F" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${scoreDot(
                      entry.score
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-white leading-snug line-clamp-2">
                        {entry.question}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-lg font-black ${scoreColor(entry.score)}`}
                        >
                          {entry.score}
                        </span>
                        <VerdictBadge verdict={entry.verdict} />
                      </div>
                    </div>
                    {isWeak && (
                      <p className="text-xs text-red-400/80 flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3" /> Needs improvement
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && (
        <div
          className="rounded-2xl border border-[#1A1040] p-8 text-center"
          style={{ background: "#0F0A1F" }}
        >
          <p className="text-[#8B7CF8]">No answers recorded yet.</p>
          <button
            onClick={onReset}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: "#7C3AED", color: "white" }}
          >
            <RotateCcw className="w-4 h-4" /> Start Over
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InvestorQAPage() {
  const { locale } = useLanguage();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [setupData, setSetupData] = useState<SetupData>({
    startupName: "",
    description: "",
    stage: "MVP",
    raisingAmount: "",
  });
  const [questions, setQuestions] = useState<string[]>([]);
  const [entries, setEntries] = useState<QAEntry[]>([]);

  const handleStart = useCallback(
    (data: SetupData, qs: string[]) => {
      setSetupData(data);
      setQuestions(qs);
      setEntries([]);
      setStep(1);
    },
    []
  );

  const handleComplete = useCallback((completedEntries: QAEntry[]) => {
    setEntries(completedEntries);
    setStep(2);
  }, []);

  const handleReset = useCallback(() => {
    setStep(0);
    setQuestions([]);
    setEntries([]);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "#06040F" }}
    >
      <AuroraBackground />

      <div className="relative z-10 px-4 py-12 md:py-16">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <SetupScreen key="setup" onStart={handleStart} locale={locale} />
          )}
          {step === 1 && (
            <TrainingScreen
              key="training"
              setupData={setupData}
              questions={questions}
              locale={locale}
              onComplete={handleComplete}
            />
          )}
          {step === 2 && (
            <ResultsScreen
              key="results"
              setupData={setupData}
              entries={entries}
              locale={locale}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
