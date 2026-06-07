"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { useLanguage } from "@/lib/i18n";
import {
  LayoutDashboard, Plus, Clock, Compass, Lightbulb, Mic2, FileText, BookOpen,
  Heart, Mail, Play, Newspaper, Award, BarChart2, DollarSign, Users, UserPlus,
  Calculator, Globe, MessageCircle, Lock, Star, Trophy, TrendingUp, Zap, Bell,
  Settings, ChevronLeft, ChevronRight, Video,
} from "lucide-react";

interface SidebarProps {
  plan?: string;
}

const NAV_GROUPS = [
  {
    key: "MAIN",
    items: [
      { label: "Dashboard",         href: "/dashboard",                        icon: LayoutDashboard },
      { label: "New Decision",      href: "/dashboard/new",                    icon: Plus },
      { label: "History",           href: "/dashboard/history",                icon: Clock },
    ],
  },
  {
    key: "BUILD",
    items: [
      { label: "Quantum Compass",       href: "/dashboard/compass",            icon: Compass },
      { label: "Idea Validator",        href: "/dashboard/idea-validator",     icon: Lightbulb },
      { label: "Pitch Builder",         href: "/dashboard/pitch-builder",      icon: Mic2 },
      { label: "Pitch Mirror",          href: "/dashboard/pitch-mirror",       icon: Video },
      { label: "One Pager Generator",   href: "/dashboard/one-pager",          icon: FileText },
      { label: "Manifesto Builder",     href: "/dashboard/manifesto",          icon: BookOpen },
      { label: "Founder Story Builder", href: "/dashboard/founder-story",      icon: Heart },
    ],
  },
  {
    key: "WRITE",
    items: [
      { label: "Investor Email Writer", href: "/dashboard/investor-email",     icon: Mail },
      { label: "Demo Script Writer",    href: "/dashboard/demo-script",        icon: Play },
      { label: "Press Release AI",      href: "/dashboard/press-release",      icon: Newspaper },
      { label: "Grant Writer",          href: "/dashboard/grant-writer",       icon: Award },
      { label: "Board Update Writer",   href: "/dashboard/board-update",       icon: BarChart2 },
    ],
  },
  {
    key: "GROW",
    items: [
      { label: "Pricing Intelligence",  href: "/dashboard/pricing-intelligence",       icon: DollarSign },
      { label: "Investor Match",        href: "/dashboard/founder/investor-match",     icon: Users },
      { label: "Co-founder Match",      href: "/dashboard/cofounder",                  icon: UserPlus },
      { label: "Runway Calculator",     href: "/dashboard/founder/runway-calculator",  icon: Calculator },
    ],
  },
  {
    key: "COMMUNITY",
    items: [
      { label: "Community",      href: "/dashboard/community",  icon: Globe },
      { label: "Messages",       href: "/dashboard/messages",   icon: MessageCircle },
      { label: "Private Rooms",  href: "/dashboard/rooms",      icon: Lock },
      { label: "Mentors",        href: "/dashboard/mentors",    icon: Star },
      { label: "Leaderboard",    href: "/dashboard/leaderboard",icon: Trophy },
    ],
  },
  {
    key: "INTELLIGENCE",
    items: [
      { label: "Market Intelligence", href: "/dashboard/market",    icon: TrendingUp },
      { label: "Daily Briefing",      href: "/dashboard/briefing",  icon: Zap },
      { label: "Alerts",              href: "/dashboard/alerts",    icon: Bell },
    ],
  },
  {
    key: "SETTINGS",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ plan }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r transition-all duration-300 ease-in-out",
        "bg-[#0F0A1F] border-[#1A1040]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-[#1A1040] flex-shrink-0",
          collapsed ? "justify-center p-3 h-16" : "px-5 h-16"
        )}
      >
        {collapsed ? (
          <div className="w-8 h-8 bg-[#C9A84C] flex items-center justify-center rounded font-mono font-bold text-[#06040F] text-sm select-none">
            Q
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 bg-[#C9A84C] flex items-center justify-center rounded font-mono font-bold text-[#06040F] text-xs flex-shrink-0">
              Q
            </div>
            <span className="font-bold text-[#C9A84C] tracking-wide text-base truncate">
              Quantum
            </span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-[52px] z-10 w-5 h-5 rounded-full bg-[#1A1040] border border-[#7C3AED]/40",
          "flex items-center justify-center text-[#8B7CF8] hover:text-[#A855F7] hover:border-[#A855F7] transition-colors",
          collapsed ? "left-[52px]" : "left-[244px]"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {NAV_GROUPS.map((group) => (
          <div key={group.key}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#8B7CF8]">
                {group.key}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-150 group",
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      active
                        ? "bg-[#7C3AED]/20 text-[#C9A84C] border border-[#7C3AED]/30"
                        : "text-[#8B7CF8]/70 hover:text-[#A855F7] hover:bg-[#7C3AED]/10 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        active ? "text-[#C9A84C]" : "text-[#8B7CF8]/60 group-hover:text-[#A855F7]"
                      )}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!collapsed && active && (
                      <ChevronRight className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom badges */}
      {!collapsed && (
        <div className="p-3 border-t border-[#1A1040] space-y-2 flex-shrink-0">
          {/* Early Access banner */}
          <div className="px-3 py-1.5 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center gap-2">
            <Zap className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
            <span className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-wide">
              All features free
            </span>
          </div>
          {/* Founding Member badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-[#C9A84C]/5 border border-[#C9A84C]/30 rounded-md"
            title="One of Quantum's earliest members."
          >
            <Star className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#C9A84C]">
              {t.nav?.foundingMember ?? "Founding Member"}
            </span>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="p-2 border-t border-[#1A1040] flex justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-[#C9A84C]" aria-label="Founding Member" />
        </div>
      )}
    </div>
  );
}
