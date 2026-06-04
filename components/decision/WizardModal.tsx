"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, SkipForward, Brain, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QA { question: string; answer: string }

interface Props {
  decisionText: string;
  onComplete: (answers: QA[]) => void;
  onCancel: () => void;
}

export function WizardModal({ decisionText, onComplete, onCancel }: Props) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/decisions/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
        } else if (!cancelled) {
          // No questions generated — skip wizard
          onComplete([]);
        }
      })
      .catch(() => { if (!cancelled) onComplete([]); })
      .finally(() => { if (!cancelled) setLoadingQ(false); });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loadingQ && inputRef.current) inputRef.current.focus();
  }, [step, loadingQ]);

  function handleNext() {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function handleSkip() {
    setSkipped((prev) => new Set(prev).add(step));
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    const qa: QA[] = questions
      .map((q, i) => ({ question: q, answer: skipped.has(i) ? "" : (answers[i] ?? "") }))
      .filter((qa) => qa.answer.trim().length > 0);
    onComplete(qa);
  }

  const current = questions[step];
  const answer = answers[step] ?? "";
  const isLast = step === questions.length - 1;
  const progress = questions.length > 0 ? ((step + 1) / questions.length) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-lg bg-[#0d0d0d] border border-[#1f1f1f] rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(201,168,76,0.08)" }}
      >
        {/* Gold progress bar */}
        <div className="h-0.5 bg-[#1a1a1a]">
          <motion.div
            className="h-full bg-[#C9A84C]"
            animate={{ width: loadingQ ? "30%" : `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="p-8">
          {loadingQ ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto">
                <Brain className="w-5 h-5 text-[#C9A84C] animate-pulse" />
              </div>
              <div>
                <p className="text-white font-semibold">Quantum is building context</p>
                <p className="text-[#555] text-sm mt-1">Generating targeted questions for your decision...</p>
              </div>
              <Loader2 className="w-4 h-4 text-[#C9A84C] animate-spin mx-auto" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                    <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest">Context needed</span>
                  </div>
                  <span className="text-xs text-[#444] font-mono">{step + 1} / {questions.length}</span>
                </div>

                {/* Question */}
                <h2 className="text-lg font-bold text-white leading-snug">{current}</h2>

                {/* Answer input */}
                <textarea
                  ref={inputRef}
                  value={answer}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [step]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNext();
                  }}
                  placeholder="Type your answer... (or skip)"
                  rows={3}
                  className="w-full bg-[#111111] border border-[#1a1a1a] focus:border-[#C9A84C]/40 rounded-xl px-4 py-3 text-white text-sm placeholder-[#444] resize-none focus:outline-none transition-colors"
                />

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex items-center gap-1.5 text-xs text-[#555] hover:text-[#888] transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip (lowers confidence)
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 rounded-lg border border-[#1a1a1a] text-[#555] text-sm hover:text-white hover:border-[#2a2a2a] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNext}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                        answer.trim()
                          ? "bg-[#C9A84C] text-[#080808] hover:bg-[#d4b660]"
                          : "bg-[#1a1a1a] text-[#444] cursor-not-allowed"
                      )}
                      disabled={!answer.trim()}
                    >
                      {isLast ? "Begin Analysis" : "Next"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Hint */}
                <p className="text-[10px] text-[#333] text-center">
                  Answers are used only to sharpen the analysis — never stored or shared.
                </p>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
