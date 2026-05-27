"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, BookmarkPlus, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Lightbulb, Target, ChevronRight } from "lucide-react";
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
}

interface Decision {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  riskScore: number;
  recommendation: string;
  report: DecisionReport;
  createdAt: string;
}

export default function DecisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/decisions/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoading(false); return; }
        setDecision(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const recLabel = decision?.recommendation === "YES" ? "Recommended" : decision?.recommendation === "NO" ? "Not Recommended" : "Conditional";
  const recVariant = decision?.recommendation === "YES" ? "success" : decision?.recommendation === "NO" ? "danger" : "warning";
  const RecIcon = decision?.recommendation === "YES" ? CheckCircle : decision?.recommendation === "NO" ? XCircle : AlertCircle;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
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
        <Card className="p-16 text-center max-w-md">
          <h2 className="text-lg font-semibold text-white mb-2">Decision not found</h2>
          <p className="text-sm text-text-secondary mb-6">This decision doesn&apos;t exist or you don&apos;t have access.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/history")}>View History</Button>
        </Card>
      </div>
    );
  }

  const report = decision.report ?? {};

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="gap-2 opacity-40 cursor-not-allowed" onClick={() => toast("Sharing is coming soon.", "info")}>
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button variant="outline" size="sm" className="gap-2 opacity-40 cursor-not-allowed" onClick={() => toast("Saving is coming soon.", "info")}>
          <BookmarkPlus className="w-4 h-4" /> Save
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">{decision.type.replace(/_/g, " ")}</p>
          <h1 className="text-2xl font-bold text-white leading-snug">{decision.title}</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <RecIcon className={`w-8 h-8 flex-shrink-0 ${decision.recommendation === "YES" ? "text-success" : decision.recommendation === "NO" ? "text-danger" : "text-gold"}`} />
            <div>
              <p className="text-xs text-text-secondary mb-1">Recommendation</p>
              <Badge variant={recVariant}>{recLabel}</Badge>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-text-secondary mb-1">Risk Score</p>
            <p className="font-mono text-3xl font-bold" style={{ color: getRiskColor(decision.riskScore) }}>{decision.riskScore}</p>
            <p className="text-xs text-[#444444] mt-1">out of 100</p>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-text-secondary mb-1">Decision Type</p>
            <p className="text-sm font-semibold text-white mt-1">{decision.type.replace(/_/g, " ")}</p>
            <p className="text-xs text-[#444444] mt-1">AI classified</p>
          </Card>
        </motion.div>

        {report.summary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <h2 className="text-sm font-semibold text-gold mb-3 uppercase tracking-wider">Executive Summary</h2>
              <p className="text-sm text-white leading-relaxed">{report.summary}</p>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.pros && report.pros.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-success" />
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
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-danger" />
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

        {report.keyAssumptions && report.keyAssumptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-gold" />
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

        {report.nextSteps && report.nextSteps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="p-6 border-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-gold" />
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
      </div>
    </div>
  );
}
