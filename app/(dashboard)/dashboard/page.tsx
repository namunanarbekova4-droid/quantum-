"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Mic2, Video, Layers, Target, Send, Search,
  Compass, Lightbulb, UserPlus, FileText, Newspaper,
  Play, Mail, Heart, BookOpen, DollarSign, Calendar,
  Calculator, ArrowRight, ShieldAlert, Trophy, Bell,
  Flame, Star, TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ─── Time-based greeting ───────────────────────────────────────────────────────

function getGreeting(locale: string): string {
  const hour = new Date().getHours();
  type LocaleKey = "en" | "ru" | "es" | "zh";
  const greetings: Record<LocaleKey, [string, string, string]> = {
    en: ["Good morning", "Good afternoon", "Good evening"],
    ru: ["Доброе утро", "Добрый день", "Добрый вечер"],
    es: ["Buenos días", "Buenas tardes", "Buenas noches"],
    zh: ["早上好", "下午好", "晚上好"],
  };
  const parts = (greetings as Record<string, [string, string, string]>)[locale] ?? greetings.en;
  if (hour >= 5 && hour < 12) return parts[0];
  if (hour >= 12 && hour < 18) return parts[1];
  return parts[2];
}

// ─── Tool data ─────────────────────────────────────────────────────────────────

interface Tool {
  name: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  isNew?: boolean;
}

interface ToolGroup {
  title: string;
  tools: Tool[];
}

const TOOL_GROUPS: ToolGroup[] = [
  {
    title: "PITCH",
    tools: [
      { name: "Pitch Coach Live",  desc: "Speak your pitch. Get instant AI coaching.",     href: "/dashboard/pitch-coach",  icon: Mic2,     isNew: true },
      { name: "Pitch Deck Creator",desc: "Full professional deck in your voice.",           href: "/dashboard/pitch-deck",   icon: Layers,   isNew: true },
      { name: "Pitch Mirror",      desc: "Practice and perfect your delivery.",             href: "/dashboard/pitch-mirror", icon: Video },
    ],
  },
  {
    title: "FIND & GROW",
    tools: [
      { name: "Find First Customer",desc: "We find real people who need you today.",        href: "/dashboard/find-customer",   icon: Target, isNew: true },
      { name: "Cold Email Writer",  desc: "10 personalized emails ready to send.",          href: "/dashboard/cold-emails",     icon: Send,   isNew: true },
      { name: "Investor Finder",    desc: "Find investors and track your outreach.",        href: "/dashboard/investor-finder", icon: Search, isNew: true },
    ],
  },
  {
    title: "BUILD",
    tools: [
      { name: "Quantum Compass",    desc: "For when you feel lost or stuck.",               href: "/dashboard/compass",        icon: Compass },
      { name: "Idea Validator",     desc: "Brutal honest feedback on your idea.",           href: "/dashboard/idea-validator", icon: Lightbulb },
      { name: "Co-founder Match",   desc: "Find your perfect co-founder.",                  href: "/dashboard/cofounder",      icon: UserPlus },
    ],
  },
  {
    title: "CREATE",
    tools: [
      { name: "One Pager Generator",desc: "Professional investor one-pager.",               href: "/dashboard/one-pager",      icon: FileText },
      { name: "Press Release AI",   desc: "Launch announcements that get noticed.",         href: "/dashboard/press-release",  icon: Newspaper },
      { name: "Demo Script Writer", desc: "Exactly what to say during your demo.",          href: "/dashboard/demo-script",    icon: Play },
    ],
  },
  {
    title: "STRATEGY",
    tools: [
      { name: "Pricing Intelligence",desc: "Find the perfect price for your product.",     href: "/dashboard/pricing-intelligence",     icon: DollarSign },
      { name: "Content Plan",        desc: "30 days of content in your voice.",             href: "/dashboard/content-plan",             icon: Calendar, isNew: true },
      { name: "Runway Calculator",   desc: "Know exactly how long your money lasts.",       href: "/dashboard/founder/runway-calculator",icon: Calculator },
    ],
  },
  {
    title: "WRITE",
    tools: [
      { name: "Investor Email Writer",desc: "Emails investors actually reply to.",          href: "/dashboard/investor-email",  icon: Mail },
      { name: "Founder Story Builder",desc: "Your story told the way it deserves.",         href: "/dashboard/founder-story",   icon: Heart },
      { name: "Manifesto Builder",    desc: "Define what your company stands for.",         href: "/dashboard/manifesto",       icon: BookOpen },
    ],
  },
];

// ─── Tool card ─────────────────────────────────────────────────────────────────

function ToolCard({ tool, delay }: { tool: Tool; delay: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link href={tool.href}>
        <div className="group relative bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 hover:border-[#7C3AED]/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)] transition-all duration-200 cursor-pointer h-full flex flex-col">
          {tool.isNew && (
            <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40 px-1.5 py-0.5 rounded tracking-wide">
              NEW
            </span>
          )}
          <div className="w-11 h-11 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mb-4 group-hover:bg-[#C9A84C]/10 group-hover:border-[#C9A84C]/30 transition-colors flex-shrink-0">
            <Icon className="w-5 h-5 text-[#8B7CF8] group-hover:text-[#C9A84C] transition-colors" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">{tool.name}</h3>
          <p className="text-xs text-[#8B7CF8]/80 leading-relaxed flex-1 mb-3">{tool.desc}</p>
          <span className="text-xs font-semibold text-[#C9A84C] flex items-center gap-1 mt-auto">
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Leaderboard preview ───────────────────────────────────────────────────────

interface LeaderUser {
  id: string;
  name: string | null;
  country: string | null;
  founderScore: number;
  streakDays: number;
}

function LeaderboardPreview() {
  const [top3, setTop3] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.ok ? r.json() : { top: [] })
      .then((d) => setTop3((d.top ?? []).slice(0, 3)))
      .finally(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-bold text-white">Founder Wall</span>
        </div>
        <Link href="/dashboard/leaderboard" className="text-xs text-[#8B7CF8] hover:text-[#C9A84C] transition-colors flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-[#1A1040] rounded-lg" />)}
        </div>
      ) : top3.length === 0 ? (
        <p className="text-xs text-[#555] text-center py-4">Be the first on the leaderboard 🔥</p>
      ) : (
        <div className="space-y-2">
          {top3.map((user, i) => (
            <div key={user.id} className="flex items-center gap-3 px-3 py-2 bg-[#06040F] rounded-lg">
              <span className="text-base">{medals[i]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name ?? "Founder"}</p>
                <div className="flex items-center gap-2">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-[10px] text-[#8B7CF8]">{user.streakDays} day streak</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#C9A84C] font-mono">{user.founderScore}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Alerts preview ────────────────────────────────────────────────────────────

interface AlertHistoryItem {
  id: string;
  headline: string;
  source: string;
  triggeredAt: string;
}

function AlertsPreview() {
  const [recent, setRecent] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setRecent((d?.history ?? []).slice(0, 2)))
      .finally(() => setLoading(false));
  }, []);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-bold text-white">Recent Alerts</span>
        </div>
        <Link href="/dashboard/alerts" className="text-xs text-[#8B7CF8] hover:text-[#C9A84C] transition-colors flex items-center gap-1">
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-[#1A1040] rounded-lg" />)}
        </div>
      ) : recent.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <Bell className="w-6 h-6 text-[#333] mx-auto" />
          <p className="text-xs text-[#555]">No alerts yet. Set up signal radar.</p>
          <Link href="/dashboard/alerts" className="text-xs text-[#C9A84C] hover:underline">
            Set up alerts →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((item) => (
            <div key={item.id} className="px-3 py-2.5 bg-[#06040F] border-l-2 border-[#7C3AED]/50 rounded-r-lg">
              <p className="text-xs font-medium text-white line-clamp-1">{item.headline}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[#8B7CF8]">{item.source}</span>
                <span className="text-[10px] text-[#444]">{timeAgo(item.triggeredAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLanguage();
  const userName = session?.user?.name?.split(" ")[0] ?? "Founder";

  const greeting = getGreeting(locale ?? "en");

  let cardDelay = 0;
  function nextDelay() {
    cardDelay += 0.04;
    return cardDelay;
  }

  return (
    <div className="p-5 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {userName}. 👋
        </h1>
        <p className="text-[#8B7CF8] mt-1 text-sm">
          For founders before the world believes. What are we building today?
        </p>
      </motion.div>

      {/* Tools grid */}
      <div className="space-y-8">
        {TOOL_GROUPS.map((group) => (
          <div key={group.title}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: cardDelay }}
              className="text-[10px] font-semibold uppercase tracking-widest text-[#8B7CF8]/60 mb-3"
            >
              {group.title}
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tools.map((tool) => (
                <ToolCard key={tool.href} tool={tool} delay={nextDelay()} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Challenge a Decision — full width */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Link href="/dashboard/enemy-mode">
          <div className="group bg-[#0F0A1F] border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-[0_0_32px_rgba(201,168,76,0.1)] flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A84C]/15 transition-colors">
              <ShieldAlert className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">Challenge Any Decision</h3>
              <p className="text-sm text-[#8B7CF8]/80 leading-relaxed">
                Get AI to argue against your biggest decision before you commit. Find the flaws before investors do.
              </p>
            </div>
            <span className="flex items-center gap-2 px-5 py-2.5 bg-[#C9A84C] text-[#06040F] text-sm font-bold rounded-lg group-hover:bg-[#d4b660] transition-colors flex-shrink-0">
              Challenge a Decision
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </motion.div>

      {/* Bottom row: Leaderboard + Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <LeaderboardPreview />
        <AlertsPreview />
      </motion.div>

      {/* Founder Feed teaser */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <Link href="/dashboard/market">
          <div className="group bg-[#0F0A1F] border border-[#1A1040] hover:border-[#7C3AED]/40 rounded-xl p-5 cursor-pointer transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A84C]/10 group-hover:border-[#C9A84C]/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-[#8B7CF8] group-hover:text-[#C9A84C] transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Founder Feed</p>
              <p className="text-xs text-[#8B7CF8]/80">Articles, insights and opportunities for builders like you.</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#C9A84C] font-semibold">
              <Star className="w-3.5 h-3.5" />
              <span>Read now</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
