"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, BookmarkPlus, CheckCircle, XCircle, AlertCircle,
  TrendingUp, TrendingDown, Lightbulb, Target, ChevronRight,
  ShieldAlert, BarChart2, Brain, ThumbsUp, ThumbsDown, HelpCircle, RefreshCw,
  ChevronDown, MessageCircle, ThumbsUp as UpIcon, GraduationCap, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { getRiskColor, cn } from "@/lib/utils";

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
  historicalContext?: { hasSimilar: boolean; summary: string; similarDecisions: string[] } | null;
  _failed?: boolean;
  _error?: string;
}

interface JournalData {
  why?: string;
  biggestFear?: string;
  keyAssumption?: string;
  expectedOutcome?: string;
  deadline?: string;
}

interface DecisionOutcomeRecord {
  id: string;
  daysAfter: number;
  result: string;
  notes?: string;
  createdAt: string;
}

// ─── Decision Journal Widget ──────────────────────────────────────────────────

function DecisionJournal({ decisionId }: { decisionId: string }) {
  const [open, setOpen] = useState(false);
  const [journal, setJournal] = useState<JournalData>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/decisions/${decisionId}/journal`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setJournal(data); });
  }, [decisionId]);

  const saveField = async (field: string, value: string) => {
    if (loading) return;
    setLoading(true);
    const updated = { ...journal, [field]: value };
    setJournal(updated);
    await fetch(`/api/decisions/${decisionId}/journal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields: { key: keyof JournalData; label: string; placeholder: string; type?: string }[] = [
    { key: "why", label: "Why are you making this decision?", placeholder: "What's driving this decision right now..." },
    { key: "biggestFear", label: "Biggest fear", placeholder: "What outcome are you most afraid of..." },
    { key: "keyAssumption", label: "Key assumption", placeholder: "What must be true for this to work..." },
    { key: "expectedOutcome", label: "Expected outcome", placeholder: "What does success look like in 90 days..." },
    { key: "deadline", label: "Decision deadline", placeholder: "", type: "date" },
  ];

  return (
    <Card className="p-5 sm:p-6">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gold" />
          <h2 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">Decision Journal</h2>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
          <ChevronDown className={cn("w-4 h-4 text-text-secondary transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-text-secondary mt-4 mb-5">
              Capture your reasoning now. Future-you will thank you.
            </p>
            <div className="space-y-4">
              {fields.map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-[#888888] mb-1.5">{label}</label>
                  {type === "date" ? (
                    <input
                      type="date"
                      defaultValue={journal[key] ? String(journal[key]).slice(0, 10) : ""}
                      onBlur={(e) => saveField(key, e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-[#1a1a1a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors"
                    />
                  ) : (
                    <textarea
                      defaultValue={journal[key] ? String(journal[key]) : ""}
                      placeholder={placeholder}
                      rows={2}
                      onBlur={(e) => saveField(key, e.target.value)}
                      className="w-full resize-none bg-[#0d0d0d] border border-[#1a1a1a] rounded px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-gold/40 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Follow-up Tracker ────────────────────────────────────────────────────────

function FollowUpTracker({ decisionId, createdAt }: { decisionId: string; createdAt: string }) {
  const [outcomes, setOutcomes] = useState<DecisionOutcomeRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<{ daysAfter: number; result: string; notes: string } | null>(null);
  const { toast } = useToast();

  const decisionDate = new Date(createdAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - decisionDate.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    fetch(`/api/decisions/${decisionId}/outcome`)
      .then((r) => r.ok ? r.json() : [])
      .then(setOutcomes);
  }, [decisionId]);

  const checkpoints = [7, 30, 90];
  const dueCheckpoints = checkpoints.filter((d) => {
    if (daysSince < d) return false;
    return !outcomes.some((o) => o.daysAfter === d);
  });

  if (dueCheckpoints.length === 0) return null;

  const resultOptions = [
    { value: "SUCCEEDED", label: "Succeeded", color: "text-success border-success/30 bg-success/10" },
    { value: "PARTIAL", label: "Partially", color: "text-gold border-gold/30 bg-gold/10" },
    { value: "FAILED", label: "Failed", color: "text-danger border-danger/30 bg-danger/10" },
    { value: "ONGOING", label: "Still ongoing", color: "text-[#888] border-[#2a2a2a] bg-[#1a1a1a]" },
  ];

  const submit = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/decisions/${decisionId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      if (res.ok) {
        const newOutcome = await res.json();
        setOutcomes((prev) => [...prev, newOutcome]);
        setSelected(null);
        toast("Outcome recorded. This trains your strategic intelligence.", "success");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 border-gold/20">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gold" />
        <h2 className="text-sm font-semibold text-white">Follow-up Check-in</h2>
        <span className="text-xs text-gold bg-gold/10 border border-gold/20 rounded px-2 py-0.5 ml-auto">
          {dueCheckpoints[0]}-day review due
        </span>
      </div>
      <p className="text-xs text-text-secondary mb-4">
        It&apos;s been {daysSince} days. What happened with this decision?
      </p>

      <input type="hidden" value={dueCheckpoints[0]} />

      <div className="flex flex-wrap gap-2 mb-4">
        {resultOptions.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setSelected((prev) => ({ daysAfter: dueCheckpoints[0], result: value, notes: prev?.notes ?? "" }))}
            className={cn(
              "px-3 py-1.5 text-sm rounded border transition-all",
              selected?.result === value ? color : "border-[#1a1a1a] text-text-secondary hover:border-[#2a2a2a] hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <textarea
            placeholder="Any notes on what happened? (optional)"
            rows={2}
            value={selected.notes}
            onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
            className="w-full resize-none bg-[#0d0d0d] border border-[#1a1a1a] rounded px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-gold/40 transition-colors"
          />
          <Button size="sm" onClick={submit} loading={submitting}>Record Outcome</Button>
        </motion.div>
      )}
    </Card>
  );
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

// ─── Community Intelligence (Voting + Comments) ───────────────────────────────

interface VoteCounts { go: number; caution: number; dont: number }
interface Comment { id: string; content: string; upvotes: number; userUpvoted: boolean; displayName: string; created_at: string }

function CommunityIntelligence({ decisionId }: { decisionId: string }) {
  const { toast } = useToast();
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ go: 0, caution: 0, dont: 0 });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [sort, setSort] = useState<"top" | "recent">("top");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotes();
    fetchComments();
  }, [decisionId]);

  useEffect(() => { fetchComments(); }, [sort]);

  const fetchVotes = async () => {
    const res = await fetch(`/api/decisions/${decisionId}/vote`);
    if (res.ok) {
      const data = await res.json();
      setVoteCounts(data.counts);
      setUserVote(data.userVote);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/decisions/${decisionId}/comments?sort=${sort}`);
    if (res.ok) setComments(await res.json());
  };

  const vote = async (type: string) => {
    await fetch(`/api/decisions/${decisionId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote_type: type }),
    });
    setUserVote(type);
    fetchVotes();
  };

  const postComment = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/decisions/${decisionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim(), is_anonymous: true }),
      });
      if (res.ok) {
        setCommentText("");
        fetchComments();
        toast("Comment posted anonymously.", "success");
      }
    } finally {
      setPosting(false);
    }
  };

  const upvote = async (commentId: string) => {
    await fetch(`/api/decisions/${decisionId}/comments/${commentId}/upvote`, { method: "POST" });
    fetchComments();
  };

  const total = voteCounts.go + voteCounts.caution + voteCounts.dont;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const voteOptions = [
    { type: "go", label: "Go for it", color: "text-success", border: "border-success/40", bg: "bg-success/10", barColor: "bg-success" },
    { type: "caution", label: "Proceed with caution", color: "text-gold", border: "border-gold/40", bg: "bg-gold/10", barColor: "bg-gold" },
    { type: "dont", label: "Don't do it", color: "text-danger", border: "border-danger/40", bg: "bg-danger/10", barColor: "bg-danger" },
  ];

  return (
    <Card className="p-5 sm:p-6 space-y-6">
      <h2 className="text-sm font-semibold text-white">Community Intelligence</h2>

      {/* Vote buttons */}
      <div className="flex flex-wrap gap-2">
        {voteOptions.map(({ type, label, color, border, bg }) => (
          <button
            key={type}
            onClick={() => vote(type)}
            className={cn(
              "text-sm px-4 py-2 rounded border font-medium transition-all duration-200",
              userVote === type ? `${bg} ${color} ${border}` : "border-[#1a1a1a] text-text-secondary hover:border-[#2a2a2a] hover:text-white"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Percentage bars */}
      {total > 0 && (
        <div className="space-y-2.5">
          {voteOptions.map(({ type, label, barColor }) => (
            <div key={type}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-secondary">{label}</span>
                <span className="text-white font-mono">{pct(voteCounts[type as keyof VoteCounts])}%</span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct(voteCounts[type as keyof VoteCounts])}%` }}
                  transition={{ duration: 0.6 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-text-secondary">{total} total vote{total !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-[#1a1a1a] pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Community Comments</span>
          <div className="flex gap-1">
            {(["top", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded border transition-all",
                  sort === s ? "border-gold/40 text-gold bg-gold/10" : "border-[#1a1a1a] text-text-secondary hover:text-white"
                )}
              >
                {s === "top" ? "Top" : "Recent"}
              </button>
            ))}
          </div>
        </div>

        {/* Post comment */}
        <div className="flex gap-2 mb-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your perspective anonymously..."
            rows={2}
            className="flex-1 resize-none bg-[#111111] border border-[#1a1a1a] rounded text-sm text-white placeholder-text-secondary px-3 py-2 focus:outline-none focus:border-gold/40 transition-colors"
          />
          <button
            onClick={postComment}
            disabled={!commentText.trim() || posting}
            className="px-3 py-2 rounded bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Comment list */}
        <div className="space-y-3">
          {comments.length === 0 && !loading && (
            <p className="text-xs text-text-secondary text-center py-3">No comments yet. Be the first to share your perspective.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary">{c.displayName}</span>
                <span className="text-xs text-[#444]">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-white leading-relaxed">{c.content}</p>
              <button
                onClick={() => upvote(c.id)}
                className={cn(
                  "flex items-center gap-1.5 mt-2 text-xs transition-colors",
                  c.userUpvoted ? "text-gold" : "text-text-secondary hover:text-white"
                )}
              >
                <UpIcon className="w-3 h-3" />
                <span>{c.upvotes}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── What Would They Do ────────────────────────────────────────────────────────

const LEADERS = [
  { name: "Elon Musk", knownFor: "First Principles" },
  { name: "Jeff Bezos", knownFor: "Customer Obsession" },
  { name: "Steve Jobs", knownFor: "Simplicity & Focus" },
  { name: "Warren Buffett", knownFor: "Value & Moat" },
  { name: "Mark Zuckerberg", knownFor: "Scale & Platforms" },
  { name: "Ray Dalio", knownFor: "Radical Transparency" },
];

interface LeaderAnalysis {
  problemFraming: string;
  questions: string[];
  optimizeFor: string;
  biggestConcern: string;
  likelyDecision: string;
  recommendation: string;
}

function WhatWouldTheyDo({ decisionText }: { decisionText: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, LeaderAnalysis>>({});

  const analyze = async (leaderName: string) => {
    if (results[leaderName]) { setSelected(leaderName); return; }
    setSelected(leaderName);
    setLoading(true);
    try {
      const res = await fetch("/api/leaders/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionText, leaderName }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults((prev) => ({ ...prev, [leaderName]: data }));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentResult = selected ? results[selected] : null;

  return (
    <Card className="p-5 sm:p-6">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full group"
      >
        <h2 className="text-sm font-semibold text-white group-hover:text-gold transition-colors">What Would They Do?</h2>
        <ChevronDown className={cn("w-4 h-4 text-text-secondary transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-5 space-y-5">
              {/* Leader cards */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {LEADERS.map((leader) => {
                  const isSelected = selected === leader.name;
                  const isLoading = loading && isSelected;
                  const hasDone = !!results[leader.name];
                  return (
                    <button
                      key={leader.name}
                      onClick={() => analyze(leader.name)}
                      disabled={loading}
                      className={cn(
                        "flex-shrink-0 w-28 p-3 rounded border text-left transition-all duration-200",
                        isSelected ? "border-gold/40 bg-gold/5" : "border-[#1a1a1a] hover:border-gold/20 bg-[#0d0d0d]",
                        loading && !isSelected && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 mx-auto",
                        isSelected ? "bg-gold text-[#080808]" : "bg-[#1a1a1a] text-text-secondary"
                      )}>
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : leader.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-white leading-tight">{leader.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{leader.knownFor}</p>
                        {hasDone && !isSelected && <div className="w-1 h-1 rounded-full bg-gold mx-auto mt-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Result panel */}
              <AnimatePresence mode="wait">
                {selected && currentResult && !loading && (
                  <motion.div
                    key={selected}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-4"
                  >
                    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">Problem Framing</p>
                        <p className="text-sm text-white">{currentResult.problemFraming}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Questions They&apos;d Ask</p>
                        <ul className="space-y-1">
                          {currentResult.questions?.map((q, i) => (
                            <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-gold flex-shrink-0">?</span> {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Optimizes For</p>
                          <p className="text-sm text-white">{currentResult.optimizeFor}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Biggest Concern</p>
                          <p className="text-sm text-white">{currentResult.biggestConcern}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Likely Decision</p>
                        <span className={cn(
                          "text-sm font-medium",
                          currentResult.likelyDecision?.startsWith("YES") ? "text-success" : currentResult.likelyDecision?.startsWith("NO") ? "text-danger" : "text-gold"
                        )}>{currentResult.likelyDecision}</span>
                      </div>
                    </div>
                    <div className="border-l-2 border-gold pl-4">
                      <p className="text-sm text-white italic leading-relaxed">&ldquo;{currentResult.recommendation}&rdquo;</p>
                      <p className="text-xs text-gold mt-1">— Simulated {selected}</p>
                    </div>
                    <p className="text-xs text-[#444] leading-relaxed">Simulated using publicly known decision-making principles. Not affiliated with or endorsed by these individuals.</p>
                  </motion.div>
                )}
                {selected && loading && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 text-gold animate-spin" />
                    <span className="text-sm text-text-secondary">Simulating {selected}&apos;s decision framework...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Mentor Request Button ─────────────────────────────────────────────────────

function MentorRequestSection({ decisionId }: { decisionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<{ id: string; full_name: string; expertise: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [message, setMessage] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (showModal && mentors.length === 0) {
      fetch("/api/mentors").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setMentors(data.slice(0, 10));
      });
    }
  }, [showModal]);

  const submit = async () => {
    if (!selectedMentor) { toast("Select a mentor", "error"); return; }
    setRequesting(true);
    try {
      const res = await fetch("/api/mentor-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentor_id: selectedMentor, decision_id: decisionId, message }),
      });
      if (res.ok) {
        toast("Mentor request sent!", "success");
        setShowModal(false);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to send request", "error");
      }
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded bg-gold/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-gold" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">Get a Mentor&apos;s Perspective</h3>
            <p className="text-xs text-text-secondary mb-3">Request insights from an experienced operator or investor on this specific decision.</p>
            <Button size="sm" onClick={() => setShowModal(true)}>Request Mentor Insight</Button>
          </div>
        </div>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Request Mentor Insight</h3>
            {mentors.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-text-secondary text-sm text-center">No approved mentors available yet.</p>
                <Button size="sm" variant="outline" onClick={() => { setShowModal(false); router.push("/dashboard/mentors/apply"); }}>
                  Become a Mentor
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Select Mentor</label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors"
                  >
                    <option value="">Choose a mentor...</option>
                    {mentors.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name} — {m.expertise}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add context about what specific guidance you need..."
                    rows={3}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded text-sm text-white placeholder-text-secondary px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={submit} disabled={requesting} className="flex-1">
                    {requesting ? "Sending..." : "Send Request"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
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
              <p className="text-sm text-text-secondary max-w-sm mx-auto mb-4 leading-relaxed">
                We encountered an issue while generating deeper intelligence. This is usually resolved by retrying.
              </p>
              {report._error && (
                <p className="text-xs font-mono text-danger/70 bg-danger/5 border border-danger/10 rounded px-3 py-2 max-w-sm mx-auto mb-8 text-left break-all">
                  {String(report._error)}
                </p>
              )}
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

        {/* Strategic Memory (Historical Context) */}
        {report.historicalContext?.hasSimilar && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="border border-gold/30 bg-gold/5 rounded-lg p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-gold flex-shrink-0" />
                <h2 className="text-sm font-semibold text-gold">Strategic Memory</h2>
              </div>
              <p className="text-sm text-white leading-relaxed mb-3">{report.historicalContext.summary}</p>
              {report.historicalContext.similarDecisions?.length > 0 && (
                <ul className="space-y-1.5">
                  {report.historicalContext.similarDecisions.map((d, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                      <span className="text-gold flex-shrink-0">·</span> {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}

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

        {/* Decision Journal */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <DecisionJournal decisionId={decision.id} />
        </motion.div>

        {/* Follow-up Tracker */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.29 }}>
          <FollowUpTracker decisionId={decision.id} createdAt={decision.createdAt} />
        </motion.div>

        {/* Outcome Feedback */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <OutcomePicker
            decisionId={decision.id}
            initial={report.outcome}
            onSaved={(o) => setDecision((prev) => prev ? { ...prev, report: { ...prev.report, outcome: o as "GOOD" | "BAD" | "UNKNOWN" } } : prev)}
          />
        </motion.div>

        {/* What Would They Do */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
          <WhatWouldTheyDo decisionText={decision.description} />
        </motion.div>

        {/* Community Intelligence */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <CommunityIntelligence decisionId={decision.id} />
        </motion.div>

        {/* Mentor Request */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }}>
          <MentorRequestSection decisionId={decision.id} />
        </motion.div>
      </div>
    </div>
  );
}
