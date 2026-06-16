"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, ArrowRight, Copy, Check, RefreshCw, Edit3, X, Save,
  ChevronDown, ChevronUp, Clock, Target, AlertTriangle, Plus,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Step = "setup" | "generating" | "results";
type TargetType = "customers" | "investors" | "partners";
type EmailGoal = "demo" | "feedback" | "investment" | "partnership";

interface SetupData {
  startupName: string;
  description: string;
  targetType: TargetType;
  yourName: string;
  yourRole: string;
  goal: EmailGoal;
  special: string;
}

interface SubjectLine {
  text: string;
  open_rate: number;
  why_it_works: string;
}

interface Email {
  number: number;
  type: string;
  subject_lines: SubjectLine[];
  body: string;
  word_count: number;
}

interface EmailStrategy {
  best_time: string;
  sequence: string;
  follow_up_timing: string;
  subject_style: string;
}

interface Campaign {
  id: string;
  emails: Email[];
  strategy: EmailStrategy;
}

interface TrackRow {
  id?: string;
  recipientName: string;
  recipientEmail: string;
  emailNumberUsed: number;
  status: "sent" | "opened" | "replied" | "meeting";
  notes: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const GENERATING_MSGS = [
  "Crafting your angle…",
  "Finding the hook that opens doors…",
  "Writing email 1 of 10…",
  "Writing email 2 of 10…",
  "Writing email 3 of 10…",
  "Writing email 4 of 10…",
  "Writing email 5 of 10…",
  "Writing email 6 of 10…",
  "Writing email 7 of 10…",
  "Writing email 8 of 10…",
  "Sharpening subject lines…",
  "Your outreach is ready.",
];

// GOAL_LABELS is now built inside the component using ft (see ColdEmailsPage)

const STATUS_COLORS: Record<string, string> = {
  sent:      "text-[#8B7CF8] bg-[#7C3AED]/10 border-[#7C3AED]/20",
  opened:    "text-amber-400 bg-amber-400/10 border-amber-400/20",
  replied:   "text-green-400 bg-green-400/10 border-green-400/20",
  meeting:   "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20",
};

const SPAM_WORDS = ["free", "guarantee", "act now", "limited time", "click here", "winner", "risk-free"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeBadges(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const hasSpam = SPAM_WORDS.some(w => body.toLowerCase().includes(w));
  const hasCta = /\?|call|meet|demo|chat|schedule|reply|respond/i.test(body);
  return {
    personalized: true,
    clearCta: hasCta,
    under150: words <= 150,
    noSpam: !hasSpam,
    tooLong: words > 150,
    wordCount: words,
  };
}

function rateColor(rate: number) {
  if (rate >= 30) return "text-green-400 bg-green-400/10 border-green-400/20";
  if (rate >= 20) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  return "text-red-400 bg-red-400/10 border-red-400/20";
}

// ─── Quantum atom animation ─────────────────────────────────────────────────────

function QuantumAtom() {
  return (
    <svg width="100" height="100" viewBox="0 0 120 120" className="logo-glow overflow-visible">
      <defs>
        <radialGradient id="ce-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#A07830" />
        </radialGradient>
        <radialGradient id="ce-particle" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="100%" stopColor="#C9A84C" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" transform="rotate(60 60 60)" />
      <ellipse cx="60" cy="60" rx="45" ry="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.4" transform="rotate(120 60 60)" />
      <g className="logo-orbit-1" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="4.5" fill="url(#ce-particle)" />
      </g>
      <g className="logo-orbit-2" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="3.5" fill="url(#ce-particle)" transform="rotate(60 60 60)" />
      </g>
      <g className="logo-orbit-3" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="105" cy="60" r="3" fill="url(#ce-particle)" transform="rotate(120 60 60)" />
      </g>
      <circle cx="60" cy="60" r="9" fill="url(#ce-core)" />
      <circle cx="60" cy="60" r="5" fill="#F5E09A" opacity="0.9" />
    </svg>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────────

function Badge({ ok, warn, label }: { ok?: boolean; warn?: boolean; label: string }) {
  return (
    <span className={cn(
      "text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1",
      ok   && "text-green-400 bg-green-400/10 border-green-400/20",
      warn && "text-amber-400 bg-amber-400/10 border-amber-400/20",
    )}>
      {ok ? "✓" : "⚠"} {label}
    </span>
  );
}

// ─── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all",
        copied
          ? "bg-green-500/20 border-green-500/40 text-green-400"
          : "bg-[#1A1040] border-[#2D1B69] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/50"
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Locked in." : label}
    </button>
  );
}

// ─── Email card ─────────────────────────────────────────────────────────────────

function EmailCard({
  email,
  index,
  campaignSetup,
  locale,
  ft,
  goalLabels,
  onRegenerated,
}: {
  email: Email;
  index: number;
  campaignSetup: SetupData;
  locale: string;
  ft: Record<string, string>;
  goalLabels: Record<EmailGoal, string>;
  onRegenerated: (updated: Email) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(email.body ?? "");
  const [regenerating, setRegen] = useState(false);

  const badges = computeBadges(editBody);

  const handleRegen = async () => {
    setRegen(true);
    try {
      const res = await fetch("/api/cold-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: campaignSetup.startupName,
          description: campaignSetup.description,
          targetType: campaignSetup.targetType,
          yourName: campaignSetup.yourName,
          yourRole: campaignSetup.yourRole,
          goal: goalLabels[campaignSetup.goal],
          special: campaignSetup.special,
          locale,
          regenerateOne: true,
          emailType: email.type,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onRegenerated(data);
        setEditBody(data.body ?? "");
      }
    } finally {
      setRegen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl overflow-hidden"
      style={{ borderLeft: "3px solid #C9A84C" }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#1A1040]/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-[#C9A84C]">#{email.number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{email.type}</p>
          <p className="text-xs text-[#8B7CF8] truncate mt-0.5">
            {email.subject_lines?.[0]?.text ?? "No subject"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", rateColor(email.subject_lines?.[0]?.open_rate ?? 0))}>
            ~{email.subject_lines?.[0]?.open_rate ?? 0}% {ft.openRate}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8B7CF8]/50" /> : <ChevronDown className="w-4 h-4 text-[#8B7CF8]/50" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-[#1A1040]">
              {/* Quality badges */}
              <div className="flex flex-wrap gap-2 pt-4">
                {badges.personalized && <Badge ok label="Personalized" />}
                {badges.clearCta     && <Badge ok label="Clear CTA" />}
                {badges.under150     && <Badge ok label="Under 150 words" />}
                {badges.noSpam       && <Badge ok label="No spam words" />}
                {badges.tooLong      && <Badge warn label={`Too long (${badges.wordCount} words)`} />}
              </div>

              {/* Subject lines */}
              <div>
                <p className="text-xs font-semibold text-[#8B7CF8] uppercase tracking-wider mb-3">Subject lines</p>
                <div className="space-y-2">
                  {(email.subject_lines ?? []).map((sl, si) => (
                    <div key={si} className="flex items-start gap-3 bg-[#06040F] rounded-lg p-3 border border-[#1A1040]">
                      <span className="text-[10px] text-[#555] font-mono w-4 flex-shrink-0 mt-0.5">{si + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{sl.text}</p>
                        <p className="text-[11px] text-[#8B7CF8]/60 mt-0.5">{sl.why_it_works}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", rateColor(sl.open_rate))}>
                          ~{sl.open_rate}%
                        </span>
                        <CopyBtn text={sl.text} label={ft.copySubject} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email body */}
              <div>
                <p className="text-xs font-semibold text-[#8B7CF8] uppercase tracking-wider mb-3">Email body</p>
                {editing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                      rows={12}
                      className="w-full bg-[#06040F] border border-[#7C3AED]/40 text-white text-sm rounded-lg px-4 py-3 resize-none outline-none font-mono leading-relaxed"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C] text-[#06040F] text-xs font-bold rounded-lg hover:bg-[#d4b660] transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={() => { setEditBody(email.body ?? ""); setEditing(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1040] text-[#8B7CF8] text-xs rounded-lg border border-[#2D1B69] hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#06040F] rounded-lg p-4 border border-[#1A1040]">
                    <pre className="text-sm text-[#ddd] whitespace-pre-wrap font-sans leading-relaxed">
                      {editBody}
                    </pre>
                  </div>
                )}
              </div>

              {!editing && (
                <div className="flex flex-wrap gap-2">
                  <CopyBtn text={editBody} label={ft.copyEmail} />
                  <CopyBtn text={email.subject_lines?.[0]?.text ?? ""} label={ft.copySubject} />
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-[#1A1040] border-[#2D1B69] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/50 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleRegen}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-[#1A1040] border-[#2D1B69] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/50 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} />
                    {ft.regenerate}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Outreach tracker ───────────────────────────────────────────────────────────

function OutreachTracker({ campaignId }: { campaignId: string }) {
  const [rows, setRows] = useState<TrackRow[]>([]);
  const [newRow, setNewRow] = useState<Partial<TrackRow>>({
    recipientName: "", recipientEmail: "", emailNumberUsed: 1, status: "sent", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const addRow = async () => {
    if (!newRow.recipientName?.trim() || !newRow.recipientEmail?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cold-emails/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          recipientName: newRow.recipientName,
          recipientEmail: newRow.recipientEmail,
          emailNumberUsed: newRow.emailNumberUsed ?? 1,
          notes: newRow.notes ?? "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRows(r => [...r, { ...newRow as TrackRow, id: data.id }]);
        setNewRow({ recipientName: "", recipientEmail: "", emailNumberUsed: 1, status: "sent", notes: "" });
      }
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (rowId: string, status: string) => {
    setRows(r => r.map(x => x.id === rowId ? { ...x, status: status as TrackRow["status"] } : x));
    await fetch("/api/cold-emails/track", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rowId, status }),
    });
  };

  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="text-sm font-bold text-white">Track Your Outreach</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_80px_1fr_auto] gap-2 items-end">
        <input
          value={newRow.recipientName ?? ""}
          onChange={e => setNewRow(r => ({ ...r, recipientName: e.target.value }))}
          placeholder="Name"
          className="bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-xs rounded-lg px-3 py-2 outline-none"
        />
        <input
          value={newRow.recipientEmail ?? ""}
          onChange={e => setNewRow(r => ({ ...r, recipientEmail: e.target.value }))}
          placeholder="Email"
          type="email"
          className="bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-xs rounded-lg px-3 py-2 outline-none"
        />
        <input
          value={newRow.emailNumberUsed ?? 1}
          onChange={e => setNewRow(r => ({ ...r, emailNumberUsed: Number(e.target.value) }))}
          type="number" min={1} max={10}
          placeholder="#"
          className="bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-xs rounded-lg px-3 py-2 outline-none"
        />
        <input
          value={newRow.notes ?? ""}
          onChange={e => setNewRow(r => ({ ...r, notes: e.target.value }))}
          placeholder="Notes"
          className="bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-xs rounded-lg px-3 py-2 outline-none"
        />
        <button
          onClick={addRow}
          disabled={saving || !newRow.recipientName?.trim() || !newRow.recipientEmail?.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#8B7CF8]/60 border-b border-[#1A1040]">
                <th className="pb-2 text-left font-medium">Name</th>
                <th className="pb-2 text-left font-medium">Email</th>
                <th className="pb-2 text-left font-medium">#</th>
                <th className="pb-2 text-left font-medium">Status</th>
                <th className="pb-2 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1040]">
              {rows.map((row) => (
                <tr key={row.id ?? row.recipientEmail}>
                  <td className="py-2 pr-3 font-medium text-white">{row.recipientName}</td>
                  <td className="py-2 pr-3 text-[#8B7CF8]/70">{row.recipientEmail}</td>
                  <td className="py-2 pr-3 text-center text-[#8B7CF8]/70">#{row.emailNumberUsed}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={row.status}
                      onChange={e => row.id && updateStatus(row.id, e.target.value)}
                      className={cn("text-[10px] font-bold px-2 py-0.5 rounded border bg-transparent cursor-pointer outline-none", STATUS_COLORS[row.status])}
                    >
                      <option value="sent">Sent</option>
                      <option value="opened">Opened</option>
                      <option value="replied">Replied</option>
                      <option value="meeting">Meeting 🎉</option>
                    </select>
                  </td>
                  <td className="py-2 text-[#8B7CF8]/50">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-[#8B7CF8]/50 text-center py-4">Add recipients to track your outreach progress.</p>
      )}
    </div>
  );
}

// ─── Setup screen ───────────────────────────────────────────────────────────────

function SetupScreen({ onSubmit, ft, goalLabels }: { onSubmit: (data: SetupData) => void; ft: Record<string, string>; goalLabels: Record<EmailGoal, string> }) {
  const [form, setForm] = useState<SetupData>({
    startupName: "", description: "", targetType: "customers",
    yourName: "", yourRole: "Founder", goal: "demo", special: "",
  });

  const isValid = form.startupName.trim().length > 0 && form.description.trim().length > 20;

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-[#8B7CF8] uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
          <Send className="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{ft.title}</h1>
          <p className="text-sm text-[#8B7CF8]">{ft.subtitle}</p>
        </div>
      </div>

      <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-6 space-y-6">
        {field(ft.startupName,
          <input
            value={form.startupName}
            onChange={e => setForm(f => ({ ...f, startupName: e.target.value }))}
            placeholder="e.g. Launchpad"
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-[#444]"
          />
        )}
        {field(ft.whatBuilt,
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What you do, who it's for, and why they should care."
            rows={3}
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 resize-none outline-none transition-colors placeholder:text-[#444]"
          />
        )}
        {field(ft.whoEmailing,
          <div className="flex gap-2">
            {(["customers", "investors", "partners"] as TargetType[]).map(t => (
              <button
                key={t}
                onClick={() => setForm(f => ({ ...f, targetType: t }))}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all capitalize",
                  form.targetType === t
                    ? "bg-[#C9A84C]/15 border-[#C9A84C]/60 text-[#C9A84C]"
                    : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8]/60 hover:text-[#8B7CF8] hover:border-[#2D1B69]"
                )}
              >{ft[t]}</button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {field(ft.yourName,
            <input
              value={form.yourName}
              onChange={e => setForm(f => ({ ...f, yourName: e.target.value }))}
              placeholder="Alex Chen"
              className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-[#444]"
            />
          )}
          {field(ft.yourRole,
            <input
              value={form.yourRole}
              onChange={e => setForm(f => ({ ...f, yourRole: e.target.value }))}
              placeholder="Founder & CEO"
              className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 outline-none transition-colors placeholder:text-[#444]"
            />
          )}
        </div>
        {field(ft.whatWant,
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(goalLabels) as [EmailGoal, string][]).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setForm(f => ({ ...f, goal: k }))}
                className={cn(
                  "py-2.5 px-3 rounded-lg text-sm font-medium border transition-all text-left",
                  form.goal === k
                    ? "bg-[#C9A84C]/15 border-[#C9A84C]/60 text-[#C9A84C]"
                    : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8]/60 hover:text-[#8B7CF8] hover:border-[#2D1B69]"
                )}
              >{v}</button>
            ))}
          </div>
        )}
        {field(ft.special,
          <textarea
            value={form.special}
            onChange={e => setForm(f => ({ ...f, special: e.target.value }))}
            placeholder="e.g. Backed by YC, 50 beta users, solving a $5B problem..."
            rows={2}
            className="w-full bg-[#06040F] border border-[#1A1040] focus:border-[#7C3AED]/60 text-white text-sm rounded-lg px-4 py-3 resize-none outline-none transition-colors placeholder:text-[#444]"
          />
        )}
        <button
          onClick={() => isValid && onSubmit(form)}
          disabled={!isValid}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
            isValid
              ? "bg-[#C9A84C] hover:bg-[#d4b660] text-[#06040F] shadow-[0_0_20px_rgba(201,168,76,0.3)]"
              : "bg-[#1A1040] text-[#444] cursor-not-allowed"
          )}
        >
          {ft.generate}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Generating screen ──────────────────────────────────────────────────────────

function GeneratingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => setMsgIndex(i => Math.min(i + 1, GENERATING_MSGS.length - 1)), 2000);
    const progTimer = setInterval(() => setProgress(p => {
      if (p >= 94) return p;
      return p + (p < 30 ? 3 : p < 70 ? 2 : 0.6);
    }), 300);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#06040F] flex flex-col items-center justify-center z-50 px-8"
    >
      <QuantumAtom />
      <div className="mt-10 text-center space-y-4 w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-semibold text-white"
          >
            {GENERATING_MSGS[msgIndex]}
          </motion.p>
        </AnimatePresence>
        <p className="text-sm text-[#8B7CF8]">Writing emails that feel human...</p>
        <div className="w-full h-1.5 bg-[#1A1040] rounded-full overflow-hidden mt-6">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7C3AED, #C9A84C)", width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </div>
        <p className="text-xs text-[#555]">{Math.round(progress)}%</p>
      </div>
    </motion.div>
  );
}

// ─── Results screen ─────────────────────────────────────────────────────────────

function ResultsScreen({
  campaign, setup, locale, onReset, ft, goalLabels,
}: {
  campaign: Campaign; setup: SetupData; locale: string; onReset: () => void; ft: Record<string, string>; goalLabels: Record<EmailGoal, string>;
}) {
  const [emails, setEmails] = useState(campaign.emails ?? []);

  const handleRegenerated = useCallback((index: number, updated: Email) => {
    setEmails(prev => prev.map((e, i) => i === index ? { ...e, ...updated } : e));
  }, []);

  const s = campaign.strategy;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">10 Cold Emails Ready</h1>
          <p className="text-sm text-[#8B7CF8] mt-1">
            Each email uses a different angle to reach your <span className="text-white">{setup.targetType}</span>.
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1040] border border-[#2D1B69] text-[#8B7CF8] hover:text-white hover:border-[#7C3AED]/50 rounded-lg text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Write New Set
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium text-[#8B7CF8] uppercase tracking-wider">YOUR 10 EMAILS</p>
        {emails.map((email, i) => (
          <EmailCard
            key={`${email.number}-${i}`}
            email={email}
            index={i}
            campaignSetup={setup}
            locale={locale}
            ft={ft}
            goalLabels={goalLabels}
            onRegenerated={(updated) => handleRegenerated(i, updated)}
          />
        ))}
      </div>

      {s && (
        <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C9A84C]" />
            <h3 className="text-sm font-bold text-white">{ft.yourStrategy}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: ft.bestTime,    value: s.best_time },
              { label: ft.sequence,    value: s.sequence },
              { label: ft.followUp,    value: s.follow_up_timing },
              { label: ft.subjectStyle, value: s.subject_style },
            ].map(({ label, value }) => value && (
              <div key={label} className="bg-[#06040F] rounded-lg p-3 border border-[#1A1040]">
                <p className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-wide mb-1">{label}</p>
                <p className="text-xs text-[#ccc] leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <OutreachTracker campaignId={campaign.id} />
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ColdEmailsPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.coldEmails as Record<string, string>;
  const goalLabels: Record<EmailGoal, string> = {
    demo: ft.getDemo,
    feedback: ft.getFeedback,
    investment: ft.getMeeting,
    partnership: ft.getPartnership,
  };
  const [step, setStep] = useState<Step>("setup");
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (data: SetupData) => {
    setSetup(data);
    setStep("generating");
    setError("");
    try {
      const res = await fetch("/api/cold-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName: data.startupName,
          description: data.description,
          targetType: data.targetType,
          yourName: data.yourName,
          yourRole: data.yourRole,
          goal: goalLabels[data.goal],
          special: data.special,
          locale,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setCampaign(json);
      setStep("results");
    } catch (err) {
      setStep("setup");
      setError(err instanceof Error ? err.message : "That one didn't land. Give it a moment and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#06040F] p-5 lg:p-8">
      <AnimatePresence mode="wait">
        {step === "generating" && <GeneratingScreen key="generating" />}
      </AnimatePresence>

      {step !== "generating" && (
        <div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
          {step === "setup"   && <SetupScreen onSubmit={handleSubmit} ft={ft} goalLabels={goalLabels} />}
          {step === "results" && campaign && setup && (
            <ResultsScreen
              campaign={campaign}
              setup={setup}
              locale={locale ?? "en"}
              onReset={() => { setStep("setup"); setCampaign(null); }}
              ft={ft}
              goalLabels={goalLabels}
            />
          )}
        </div>
      )}
    </div>
  );
}
