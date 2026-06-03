"use client";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Loader2, X, ThumbsUp, ThumbsDown, Minus, Brain, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  created_by: string;
}

interface TeamDecision {
  id: string;
  team_id: string;
  title: string;
  description: string;
  status: "voting" | "analyzed";
  consensus?: {
    overallSentiment: string;
    keyConcerns: string[];
    agreementPoints: string[];
    minorityOpinions: string[];
    aiRecommendation: string;
    finalSummary: string;
  };
  team_votes: { vote: string; comment: string; user_id: string }[];
  created_at: string;
}

const sentimentConfig: Record<string, { color: string; bg: string }> = {
  POSITIVE: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  NEUTRAL: { color: "text-[#888888]", bg: "bg-[#1a1a1a] border-[#2a2a2a]" },
  NEGATIVE: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  DIVIDED: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
};

function CreateTeamModal({ onCreate, onClose }: { onCreate: (t: Team) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  async function create() {
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_team", name }) });
      const data = await res.json();
      if (res.ok) { onCreate(data); onClose(); }
    } finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-white font-semibold">Create Team</h3><button onClick={onClose}><X className="w-4 h-4 text-[#888888]" /></button></div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#888888]">Team Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Leadership Team" onKeyDown={(e) => e.key === "Enter" && create()}
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
        </div>
        <button onClick={create} disabled={!name || loading} className={cn("w-full py-2.5 rounded-lg text-sm font-semibold transition-all", name && !loading ? "bg-[#C9A84C] text-[#080808]" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null} Create Team
        </button>
      </motion.div>
    </div>
  );
}

function SubmitDecisionModal({ teamId, onSubmit, onClose }: { teamId: string; onSubmit: (d: TeamDecision) => void; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!title) return;
    setLoading(true);
    try {
      const res = await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit_decision", teamId, title, description }) });
      const data = await res.json();
      if (res.ok) { onSubmit({ ...data, team_votes: [] }); onClose(); }
    } finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between"><h3 className="text-white font-semibold">Submit Team Decision</h3><button onClick={onClose}><X className="w-4 h-4 text-[#888888]" /></button></div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#888888]">Decision Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Should we expand to Asia?"
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#888888]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Context and details..." rows={3}
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40 resize-none" />
        </div>
        <button onClick={submit} disabled={!title || loading} className={cn("w-full py-2.5 rounded-lg text-sm font-semibold transition-all", title && !loading ? "bg-[#C9A84C] text-[#080808]" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null} Submit Decision
        </button>
      </motion.div>
    </div>
  );
}

function DecisionCard({ decision, onVote, onAnalyze }: {
  decision: TeamDecision;
  onVote: (id: string, vote: string, comment: string) => void;
  onAnalyze: (id: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [voting, setVoting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const voteCount = { yes: 0, no: 0, neutral: 0 };
  decision.team_votes.forEach((v) => { if (v.vote in voteCount) voteCount[v.vote as keyof typeof voteCount]++; });

  async function castVote(vote: string) {
    setVoting(true);
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vote", teamDecisionId: decision.id, vote, comment }) });
    onVote(decision.id, vote, comment);
    setVoting(false);
    setComment("");
  }

  async function analyze() {
    setAnalyzing(true);
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "analyze_consensus", teamDecisionId: decision.id, title: decision.title, description: decision.description }) });
    onAnalyze(decision.id);
    setAnalyzing(false);
  }

  const sentiment = decision.consensus?.overallSentiment;
  const sentCfg = sentiment ? sentimentConfig[sentiment] ?? sentimentConfig.NEUTRAL : null;

  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{decision.title}</p>
          {decision.description && <p className="text-xs text-[#888888] mt-1">{decision.description}</p>}
        </div>
        {sentCfg && sentiment && (
          <span className={cn("text-xs font-medium px-2 py-1 rounded border flex-shrink-0", sentCfg.bg, sentCfg.color)}>{sentiment}</span>
        )}
      </div>

      {/* Vote counts */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {[
          { key: "yes", icon: ThumbsUp, color: "text-green-400", bg: "bg-green-400/10" },
          { key: "neutral", icon: Minus, color: "text-[#888888]", bg: "bg-[#1a1a1a]" },
          { key: "no", icon: ThumbsDown, color: "text-red-400", bg: "bg-red-400/10" },
        ].map(({ key, icon: Icon, color, bg }) => (
          <div key={key} className={cn("rounded-lg py-2", bg)}>
            <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
            <p className={cn("font-bold text-sm", color)}>{voteCount[key as keyof typeof voteCount]}</p>
          </div>
        ))}
      </div>

      {/* Vote input */}
      {decision.status === "voting" && (
        <div className="space-y-2">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)"
            className="w-full bg-[#080808] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-xs placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
          <div className="grid grid-cols-3 gap-2">
            {[
              { vote: "yes", label: "Yes", color: "border-green-500/30 text-green-400 hover:bg-green-500/10" },
              { vote: "neutral", label: "Neutral", color: "border-[#2a2a2a] text-[#888888] hover:bg-[#1a1a1a]" },
              { vote: "no", label: "No", color: "border-red-500/30 text-red-400 hover:bg-red-500/10" },
            ].map(({ vote, label, color }) => (
              <button key={vote} onClick={() => castVote(vote)} disabled={voting}
                className={cn("py-2 rounded-lg border text-xs font-medium transition-all", color)}>
                {voting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Consensus */}
      {decision.consensus ? (
        <div className="bg-[#080808] rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-[#C9A84C]">AI Consensus Analysis</p>
          <p className="text-sm text-white">{decision.consensus.finalSummary}</p>
          <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg p-2">
            <p className="text-xs font-semibold text-[#C9A84C] mb-1">Recommendation</p>
            <p className="text-xs text-white">{decision.consensus.aiRecommendation}</p>
          </div>
        </div>
      ) : decision.team_votes.length >= 2 ? (
        <button onClick={analyze} disabled={analyzing}
          className="w-full py-2 rounded-lg border border-[#C9A84C]/20 text-[#C9A84C] text-xs font-medium hover:bg-[#C9A84C]/10 transition-all flex items-center justify-center gap-2">
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
          {analyzing ? "Analyzing consensus..." : "Analyze Consensus"}
        </button>
      ) : (
        <p className="text-xs text-[#888888] text-center">Need {2 - decision.team_votes.length} more vote{2 - decision.team_votes.length > 1 ? "s" : ""} for consensus</p>
      )}
    </div>
  );
}

export default function TeamPage() {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<{ team_id: string; role: string; teams: Team }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<TeamDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDecisions, setLoadingDecisions] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    fetch("/api/team").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setTeams(d); }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;
    setLoadingDecisions(true);
    fetch(`/api/team/decisions?teamId=${selectedTeam}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDecisions(d); })
      .finally(() => setLoadingDecisions(false));
  }, [selectedTeam]);

  async function invite() {
    if (!inviteEmail || !selectedTeam) return;
    await fetch("/api/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "invite", teamId: selectedTeam, email: inviteEmail }) });
    setInviteEmail("");
  }

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-4xl mx-auto">
      {showCreate && <CreateTeamModal onCreate={(t) => { setTeams((p) => [...p, { team_id: t.id, role: "owner", teams: t }]); setSelectedTeam(t.id); }} onClose={() => setShowCreate(false)} />}
      {showSubmit && selectedTeam && <SubmitDecisionModal teamId={selectedTeam} onSubmit={(d) => setDecisions((p) => [d, ...p])} onClose={() => setShowSubmit(false)} />}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">{t.team.title}</h1>
            </div>
            <p className="text-[#888888] text-sm">{t.team.subtitle}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold hover:bg-[#C9A84C]/90 transition-all">
            <Plus className="w-4 h-4" /> New Team
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" /></div>
        ) : teams.length === 0 ? (
          <div className="bg-[#111111] border border-dashed border-[#1a1a1a] rounded-lg p-16 text-center">
            <Users className="w-10 h-10 text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">{t.team.noTeams}</p>
            <p className="text-[#888888] text-sm mb-4">{t.team.noTeamsDesc}</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2 bg-[#C9A84C] text-[#080808] rounded-lg text-sm font-semibold">{t.team.createTeam}</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team selector */}
            <div className="flex gap-2 flex-wrap">
              {teams.map((m) => (
                <button key={m.team_id} onClick={() => setSelectedTeam(m.team_id)}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    selectedTeam === m.team_id ? "bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C]" : "border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#2a2a2a]")}>
                  {m.teams?.name || "Team"} <span className="text-xs opacity-60 ml-1">({m.role})</span>
                </button>
              ))}
            </div>

            {selectedTeam && (
              <div className="space-y-4">
                {/* Invite + Submit */}
                <div className="flex gap-3">
                  <div className="flex flex-1 gap-2">
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t.team.emailPlaceholder}
                      className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-lg px-3 py-2 text-white text-sm placeholder-[#444] focus:outline-none focus:border-[#C9A84C]/40" />
                    <button onClick={invite} disabled={!inviteEmail}
                      className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all", inviteEmail ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/20" : "bg-[#1a1a1a] text-[#444] cursor-not-allowed")}>
                      <Mail className="w-3.5 h-3.5" /> {t.team.invite}
                    </button>
                  </div>
                  <button onClick={() => setShowSubmit(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/20 text-[#C9A84C] rounded-lg text-sm font-medium hover:bg-[#C9A84C]/10 transition-all">
                    <Plus className="w-4 h-4" /> Add Decision
                  </button>
                </div>

                {loadingDecisions ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" /></div>
                ) : decisions.length === 0 ? (
                  <div className="bg-[#111111] border border-dashed border-[#1a1a1a] rounded-lg p-10 text-center">
                    <p className="text-[#888888] text-sm">No decisions yet. Submit the first one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {decisions.map((d) => (
                      <DecisionCard
                        key={d.id}
                        decision={d}
                        onVote={(id, vote, comment) => setDecisions((prev) => prev.map((x) => x.id === id ? { ...x, team_votes: [...x.team_votes, { vote, comment, user_id: "" }] } : x))}
                        onAnalyze={(id) => {
                          fetch(`/api/team/decisions?teamId=${selectedTeam}`).then((r) => r.json()).then((data) => { if (Array.isArray(data)) setDecisions(data); });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
