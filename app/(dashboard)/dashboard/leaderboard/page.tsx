"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";
import Link from "next/link";
import {
  Flame, Zap, Lightbulb, Users, Trophy, Globe, Flag, Calendar,
  Share2, Copy, Check, ArrowRight, Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderEntry {
  id: string;
  rank: number;
  country: string;
  streakDays: number;
  founderScore: number;
  decisionsCount: number;
  toolsUsed: number;
  topTool: string;
  messagesCount: number;
  joinedAt: string;
  isMe: boolean;
}

interface LeaderboardData {
  leaders: LeaderEntry[];
  me: LeaderEntry | null;
  myStreak: number;
}

type Filter = "global" | "country" | "week" | "streak";

// ─── Badge helpers ─────────────────────────────────────────────────────────

function getBadges(entry: LeaderEntry): string[] {
  const b: string[] = [];
  if (entry.streakDays >= 30) b.push("🔥30");
  else if (entry.streakDays >= 7) b.push("🔥7");
  else if (entry.streakDays >= 3) b.push("🔥3");
  if (entry.decisionsCount > 0) b.push("⚡");
  if (entry.toolsUsed >= 3) b.push("💡");
  if (entry.messagesCount > 0) b.push("🤝");
  return b;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={doCopy}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-colors border border-[#1A1040] hover:border-[#7C3AED]/40 text-[#8B7CF8] hover:text-white"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

// ─── Podium card ─────────────────────────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_COLORS = [
  { border: "border-[#C9A84C]/60", glow: "shadow-[0_0_40px_rgba(201,168,76,0.25)]", text: "text-[#C9A84C]", size: "scale-105" },
  { border: "border-[#9CA3AF]/50", glow: "shadow-[0_0_20px_rgba(156,163,175,0.15)]", text: "text-[#9CA3AF]", size: "scale-100" },
  { border: "border-[#CD7F32]/50", glow: "shadow-[0_0_20px_rgba(205,127,50,0.15)]", text: "text-[#CD7F32]", size: "scale-95" },
];

function PodiumCard({ entry, tl }: { entry: LeaderEntry; tl: Record<string, string> }) {
  const idx = entry.rank - 1;
  const c = PODIUM_COLORS[idx] ?? PODIUM_COLORS[2];
  const initials = entry.country.slice(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className={`relative flex flex-col items-center p-5 rounded-2xl bg-[#0F0A1F] border ${c.border} ${c.glow} ${c.size} transform`}
    >
      <div className="text-2xl mb-2">{MEDALS[idx]}</div>
      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/30 border border-[#7C3AED]/50 flex items-center justify-center text-white font-bold text-sm mb-3">
        {initials}
      </div>
      <p className="text-white text-xs font-semibold text-center mb-1">{tl.founderFrom} {entry.country}</p>
      <div className={`text-lg font-black ${c.text} mb-1`}>#{entry.rank}</div>
      <div className="flex items-center gap-1 text-xs text-[#8B7CF8] mb-1">
        <Flame className="w-3 h-3 text-orange-400" /> {entry.streakDays} {tl.days}
      </div>
      <div className={`text-sm font-bold ${c.text}`}>{entry.founderScore} pts</div>
      <div className="text-[10px] text-[#8B7CF8]/60 mt-1">{entry.topTool}</div>
      <div className="flex gap-1 mt-2 flex-wrap justify-center">
        {getBadges(entry).map((b, i) => (
          <span key={i} className="text-xs">{b}</span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── My rank card ─────────────────────────────────────────────────────────────

function MyRankCard({ me, tl }: { me: LeaderEntry; tl: Record<string, string> }) {
  const motivation =
    me.rank <= 10 ? tl.motivationTop10
    : me.rank <= 100 ? tl.motivationTop100
    : tl.motivationBelow;

  const shareText = `I'm #${me.rank} on Quantum Founder Wall\n🔥 ${me.streakDays} day streak\n"For founders before the world believes"\nqsmart.tech`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-[#C9A84C]/40 bg-[#0F0A1F] shadow-[0_0_30px_rgba(201,168,76,0.15)] flex flex-col md:flex-row items-center md:items-start gap-5"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="w-14 h-14 rounded-full bg-[#7C3AED]/30 border-2 border-[#C9A84C]/60 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(me.country ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#C9A84C] font-black text-xl">#{me.rank}</span>
            <span className="text-white font-semibold">{tl.you}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[#8B7CF8]">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {me.streakDays} {tl.days}</span>
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-[#C9A84C]" /> {me.founderScore} pts</span>
            <span className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> {me.toolsUsed} tools</span>
          </div>
          <p className="text-xs text-[#8B7CF8]/60 mt-1">{tl.bestStreak}: {me.streakDays} {tl.days}</p>
          <p className="text-xs text-[#C9A84C] mt-1 font-medium">{motivation}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap justify-center md:justify-end">
        <CopyBtn text={shareText} label={tl.shareRank} copiedLabel={tl.shareCopied} />
      </div>
    </motion.div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function TableRow({ entry, tl }: { entry: LeaderEntry; tl: Record<string, string> }) {
  const daysAgo = Math.floor((Date.now() - new Date(entry.joinedAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border-b border-[#1A1040] transition-all group ${
        entry.isMe
          ? "bg-[#C9A84C]/5 border-l-2 border-l-[#C9A84C]"
          : "hover:bg-[#7C3AED]/5"
      }`}
    >
      <td className="px-4 py-3 text-center">
        {entry.rank <= 3 ? (
          <span className="text-lg">{MEDALS[entry.rank - 1]}</span>
        ) : (
          <span className={`font-bold text-sm ${entry.isMe ? "text-[#C9A84C]" : "text-[#8B7CF8]"}`}>
            #{entry.rank}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            entry.isMe ? "bg-[#C9A84C]/20 border border-[#C9A84C]/50 text-[#C9A84C]" : "bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#8B7CF8]"
          }`}>
            {(entry.country ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              {entry.isMe ? `${tl.you} — ` : ""}{tl.founderFrom} {entry.country}
            </p>
            <div className="flex gap-1 mt-0.5">
              {getBadges(entry).map((b, i) => <span key={i} className="text-[11px]">{b}</span>)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="flex items-center justify-center gap-1 text-sm font-semibold text-orange-400">
          <Flame className="w-3.5 h-3.5" /> {entry.streakDays}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-sm text-[#8B7CF8]">{entry.decisionsCount}</td>
      <td className="px-4 py-3 text-center text-sm text-[#8B7CF8]">{entry.toolsUsed}</td>
      <td className="px-4 py-3 text-center">
        <span className={`text-sm font-bold ${entry.isMe ? "text-[#C9A84C]" : "text-white"}`}>
          {entry.founderScore}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-xs text-[#8B7CF8]/50">{daysAgo}d ago</td>
    </motion.tr>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ me, tl }: { me: LeaderEntry | null; tl: Record<string, string> }) {
  const shareLink = "https://qsmart.tech";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="text-6xl mb-6">🔥</div>
      <h2 className="text-2xl font-bold text-white mb-3">{tl.noData}</h2>
      <p className="text-[#8B7CF8] text-sm mb-8 max-w-sm mx-auto leading-relaxed">{tl.noDataDesc}</p>

      {me && (
        <div className="max-w-xs mx-auto mb-8 p-5 rounded-2xl border border-[#C9A84C]/40 bg-[#0F0A1F] shadow-[0_0_30px_rgba(201,168,76,0.1)]">
          <div className="w-14 h-14 rounded-full bg-[#7C3AED]/30 border-2 border-[#C9A84C]/60 flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
            {(me.country ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <p className="text-[#C9A84C] font-black text-2xl mb-1">{tl.youAreFirst}</p>
          <div className="flex justify-center gap-4 text-sm text-[#8B7CF8] mt-2">
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {me.streakDays} {tl.days}</span>
            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-[#C9A84C]" /> {me.founderScore} pts</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#06040F] rounded-xl font-bold text-sm hover:bg-[#D4B85C] transition-colors"
        >
          {tl.cta} <ArrowRight className="w-4 h-4" />
        </Link>
        <CopyBtn text={shareLink} label={tl.inviteFounder} copiedLabel={tl.inviteCopied} />
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTERS: { key: Filter; icon: React.ReactNode }[] = [
  { key: "global", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "country", icon: <Flag className="w-3.5 h-3.5" /> },
  { key: "week", icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: "streak", icon: <Flame className="w-3.5 h-3.5" /> },
];

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const tl = t.leaderboard as Record<string, string>;
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [filter, setFilter] = useState<Filter>("global");
  const [loading, setLoading] = useState(true);

  const filterLabels: Record<Filter, string> = {
    global: tl.global,
    country: tl.byCountry,
    week: tl.thisWeek,
    streak: tl.longestStreak,
  };

  const load = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?filter=${f}`);
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const me = data?.me ?? null;
  const leaders = data?.leaders ?? [];
  const top3 = leaders.filter((l) => l.rank <= 3 && !l.isMe);
  const rest = leaders.filter((l) => l.rank > 3 || l.isMe);
  const isEmpty = leaders.length === 0 || (leaders.length === 1 && leaders[0].isMe);

  // Streak banner: show if user hasn't visited today (streak is same as yesterday)
  const showStreakBanner = session && me && me.streakDays > 0;

  return (
    <div className="min-h-screen p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">{tl.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">{tl.subtitle}</p>
      </motion.div>

      {/* Streak banner */}
      <AnimatePresence>
        {showStreakBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 px-4 py-3 rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/10 flex items-center gap-3"
          >
            <Flame className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span className="text-sm text-white">
              {tl.streakBanner} <strong className="text-[#C9A84C]">{me?.streakDays}</strong> {tl.streakBannerEnd}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My rank card */}
      {me && !loading && (
        <div className="mb-8">
          <MyRankCard me={me} tl={tl} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              filter === key
                ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                : "bg-[#0F0A1F] border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 hover:text-white"
            }`}
          >
            {icon}
            {filterLabels[key]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <EmptyState key="empty" me={me} tl={tl} />
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Top 3 podium */}
              {top3.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-end justify-center gap-4">
                    {top3.length > 1 && <PodiumCard entry={top3[1]} tl={tl} />}
                    {top3[0] && <PodiumCard entry={top3[0]} tl={tl} />}
                    {top3.length > 2 && <PodiumCard entry={top3[2]} tl={tl} />}
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.1)]">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1A1040] text-[#8B7CF8] text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-center w-14">{tl.rank}</th>
                        <th className="px-4 py-3 text-left">Founder</th>
                        <th className="px-4 py-3 text-center">🔥 {tl.streak}</th>
                        <th className="px-4 py-3 text-center">⚡ {tl.decisions}</th>
                        <th className="px-4 py-3 text-center">💡 {tl.toolsUsed}</th>
                        <th className="px-4 py-3 text-center">🏆 {tl.score}</th>
                        <th className="px-4 py-3 text-center">{tl.joined}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Always show current user at their real rank if not in top 50 */}
                      {me && !leaders.find((l) => l.isMe) && (
                        <TableRow entry={me} tl={tl} />
                      )}
                      {rest.map((entry) => (
                        <TableRow key={entry.id} entry={entry} tl={tl} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Score explanation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-4 rounded-xl border border-[#1A1040] bg-[#0F0A1F]"
              >
                <p className="text-[#8B7CF8] text-xs font-semibold mb-2 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-[#C9A84C]" /> Score Formula
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-[#8B7CF8]/70">
                  <span>🔥 Daily Streak × 10 (40%)</span>
                  <span>⚡ Decisions × 4 (20%)</span>
                  <span>💡 Tools Used × 33 (20%)</span>
                  <span>🤝 Community × 5 (20%)</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
