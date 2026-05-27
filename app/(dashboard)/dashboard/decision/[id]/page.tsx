"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Share2, BookmarkPlus, CheckCircle, XCircle, AlertCircle,
  TrendingUp, TrendingDown, Lightbulb, Target, ChevronRight,
  ShieldAlert, BarChart2, Brain, ThumbsUp, ThumbsDown, HelpCircle, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { getRiskColor } from "@/lib/utils";

interface DecisionReport {
  summary?: string;
  recommendation?: string;
  riskScore?: number;
  pros?: string[];
  cons?: string[];
  keyAssumptions?: string[];
  implications?: string[];
  nextSteps?: string[];
  preMortem?: string[];
  benchmark?: { label?: string; successRate?: number; insight?: string; context?: string };
  confidence?: { score?: number; explanation?: string; missingData?: string[] };
  outcome?: "GOOD" | "BAD" | "UNKNOWN";
  _failed?: boolean;
  _error?: string;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  riskScore: number | null;
  recommendation: string | null;
  report: DecisionReport;
  createdAt: string;
}

function OutcomePicker({ decisionId, initial, onSaved }: { decisionId: string; initial?: string; onSaved: (o: string) => void }) {
  const [selected, setSelected] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async (outcome: string) => {
    if (saving) return;
    setSaving(true);
    setSelected(outcome);
    await fetch(`/api/decisions/${decisionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    setSaving(false);
    onSaved(outcome);
    toast("Outcome recorded. Quantum learns from your feedback.", "success");
  };

  const options = [
    { value: "GOOD", label: "Good outcome", Icon: ThumbsUp, color: "text-success", bg: "bg-success/10 border-success/30" },
    { value: "BAD", label: "Bad outcome", Icon: ThumbsDown, color: "text-danger", bg: "bg-danger/10 border-danger/30" },
    { value: "UNKNOWN", label: "Still unknown", Icon: HelpCircle, color: "text-[#888888]", bg: "bg-[#1a1a1a] border-[#2a2a2a]" },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-white mb-1">How did this decision turn out?</h2>
      <p className="text-xs text-text-secondary mb-4">Your feedback improves future analysis quality.</p>
      <div className="flex flex-wrap gap-3">
        {options.map(({ value, label, Icon, color, bg }) => (
          <button
            key={value}
            onClick={() => save(value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm font-medium transition-all duration-200 ${
              selected === value ? `${bg} ${color}` : "border-[#1a1a1a] text-text-secondary hover:border-[#2a2a2a] hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function DecisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchDecision = async () => {
    if (!id) return;
    const r = await fetch(`/api/decisions/${id}`);
    const data = await r.json();
    if (!data.error) setDecision(data);
    setLoading(false);
  };

  useEffect(() => { fetchDecision(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    if (!id || retrying) return;
    setRetrying(true);
    try {
      const r = await fetch(`/api/decisions/${id}`, { method: "POST" });
      const data = await r.json();
      if (!data.error) {
        setDecision(data);
      } else {
        toast("Analysis failed again. Please try once more.", "error");
        await fetchDecision();
      }
    } catch {
      toast("Something went wrong. Please try again.", "error");
    } finally {
      setRetrying(false);
    }
  };

  const recLabel = decision?.recommendation === "YES" ? "Recommended" : decision?.recommendation === "NO" ? "Not Recommended" : "Conditional";
  const recVariant = decision?.recommendation === "YES" ? "success" : decision?.recommendation === "NO" ? "danger" : "warning";
  const RecIcon = decision?.recommendation === "YES" ? CheckCircle : decision?.recommendation === "NO" ? XCircle : AlertCircle;

  const PageHeader = () => (
    <div className="border-b border-[#1a1a1a] px-4 sm:px-6 py-4 flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2 flex-shrink-0">
        <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
      </Button>
      <div className="flex-1 min-w-0" />
      <Button variant="ghost" size="sm" className="gap-2 opacity-40 cursor-not-allowed hidden sm:flex" onClick={() => toast("Sharing is coming soon.", "info")}>
        <Share2 className="w-4 h-4" /> Share
      </Button>
      <Button variant="outline" size="sm" className="gap-2 opacity-40 cursor-not-allowed hidden sm:flex" onClick={() => toast("Saving is coming soon.", "info")}>
        <BookmarkPlus className="w-4 h-4" /> Save
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Analyzing your decision...</p>
          <p className="text-xs text-[#444444] mt-1">This takes about 10 seconds</p>
        </div>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md w-full">
          <h2 className="text-lg font-semibold text-white mb-2">Decision not found</h2>
          <p className="text-sm text-text-secondary mb-6">This decision doesn&apos;t exist or you don&apos;t have access.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/history")}>View History</Button>
        </Card>
      </div>
    );
  }

  const report = decision.report ?? {};
  const isFailed = report._failed === true || (decision.riskScore === null && !decision.recommendation);
  const confidence = report.confidence;
  const benchmark = report.benchmark;

  // Analysis interrupted state
  if (isFailed) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <PageHeader />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">{decision.type.replace(/_/g, " ")}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-8 break-words">{decision.title}</h1>
            <Card className="p-10 sm:p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-[#555555]" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Analysis interrupted</h2>
              <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
                We encountered an issue while generating deeper intelligence. This is usually resolved by retrying.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleRetry} loading={retrying} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry Analysis
                </Button>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="gap-2">
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <PageHeader />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">{decision.type.replace(/_/g, " ")}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug break-words">{decision.title}</h1>
        </motion.div>

        {/* Metrics row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 flex items-center gap-3 col-span-2 sm:col-span-1">
            <RecIcon className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 ${decision.recommendation === "YES" ? "text-success" : decision.recommendation === "NO" ? "text-danger" : "text-gold"}`} />
            <div className="min-w-0">
              <p className="text-xs text-text-secondary mb-1">Verdict</p>
              <Badge variant={recVariant}>{recLabel}</Badge>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-xs text-text-secondary mb-1">Risk Score</p>
            <p className="font-mono text-2xl sm:text-3xl font-bold" style={{ color: decision.riskScore !== null ? getRiskColor(decision.riskScore) : "#888" }}>
              {decision.riskScore ?? "—"}
            </p>
            <p className="text-xs text-[#444444] mt-0.5">/ 100</p>
          </Card>
          <Card className="p-4 sm:p-5">
            <p className="text-xs text-text-secondary mb-1">AI Confidence</p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-gold">{confidence?.score ?? "—"}</p>
            <p className="text-xs text-[#444444] mt-0.5">/ 100</p>
          </Card>
          {benchmark?.successRate !== undefined && (
            <Card className="p-4 sm:p-5">
              <p className="text-xs text-text-secondary mb-1">Benchmark</p>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-white">{benchmark.successRate}%</p>
              <p className="text-xs text-[#444444] mt-0.5">success rate</p>
            </Card>
          )}
        </motion.div>

        {/* Executive Summary */}
        {report.summary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-5 sm:p-6">
              <h2 className="text-xs font-semibold text-gold mb-3 uppercase tracking-wider">Executive Summary</h2>
              <p className="text-sm text-white leading-relaxed">{report.summary}</p>
            </Card>
          </motion.div>
        )}

        {/* Confidence Explanation */}
        {confidence?.explanation && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-gold flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Confidence Analysis</h2>
                <span className="ml-auto font-mono text-xs text-gold flex-shrink-0">{confidence.score}/100</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">{confidence.explanation}</p>
              {confidence.missingData && confidence.missingData.length > 0 && (
                <div className="border-t border-[#1a1a1a] pt-4">
                  <p className="text-xs font-semibold text-[#555555] uppercase tracking-wider mb-2">Data that would sharpen this analysis</p>
                  <ul className="space-y-1.5">
                    {confidence.missingData.map((d, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-[#444444] mt-0.5 flex-shrink-0">·</span> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Historical Benchmark */}
        {benchmark?.insight && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-gold flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Historical Benchmark</h2>
                {benchmark.label && <span className="ml-auto text-xs text-[#555555] text-right hidden sm:block">{benchmark.label}</span>}
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${benchmark.successRate ?? 0}%` }} />
                </div>
                <span className="font-mono text-sm font-bold text-gold flex-shrink-0">{benchmark.successRate}% success</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{benchmark.insight}</p>
              {benchmark.context && <p className="text-xs text-[#444444] mt-2">{benchmark.context}</p>}
            </Card>
          </motion.div>
        )}

        {/* Strengths & Risks */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.pros && report.pros.length > 0 && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Strengths</h2>
              </div>
              <ul className="space-y-2.5">
                {report.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="text-success mt-0.5 flex-shrink-0">+</span> {p}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {report.cons && report.cons.length > 0 && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-danger flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Risks</h2>
              </div>
              <ul className="space-y-2.5">
                {report.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="text-danger mt-0.5 flex-shrink-0">−</span> {c}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>

        {/* Key Assumptions */}
        {report.keyAssumptions && report.keyAssumptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-gold flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Key Assumptions</h2>
              </div>
              <ul className="space-y-2">
                {report.keyAssumptions.map((a, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-2.5">
                    <span className="text-gold font-mono text-xs mt-1 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span> {a}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Pre-Mortem */}
        {report.preMortem && report.preMortem.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Card className="p-5 sm:p-6 border-danger/20">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-danger flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Pre-Mortem: What Could Cause This to Fail?</h2>
              </div>
              <ul className="space-y-2.5">
                {report.preMortem.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <span className="text-danger mt-0.5 flex-shrink-0">!</span> {f}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Next Steps */}
        {report.nextSteps && report.nextSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
            <Card className="p-5 sm:p-6 border-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-gold flex-shrink-0" />
                <h2 className="text-sm font-semibold text-white">Recommended Next Steps</h2>
              </div>
              <ul className="space-y-3">
                {report.nextSteps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-white">
                    <ChevronRight className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Outcome Feedback */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <OutcomePicker
            decisionId={decision.id}
            initial={report.outcome}
            onSaved={(o) => setDecision((prev) => prev ? { ...prev, report: { ...prev.report, outcome: o as "GOOD" | "BAD" | "UNKNOWN" } } : prev)}
          />
        </motion.div>
      </div>
    </div>
  );
}
