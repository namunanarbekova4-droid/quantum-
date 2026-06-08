"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/i18n/translations";
import {
  LayoutDashboard, Mic2, Layers, Video, Target, Send, Search,
  Compass, Lightbulb, UserPlus, FileText, Newspaper, Play,
  Mail, Heart, BookOpen, DollarSign, Calendar, Calculator,
  MessageSquare, Trophy, Bell, TrendingUp, Settings,
  ChevronLeft, ChevronRight, Star, Zap,
} from "lucide-react";

type NavKey = keyof TranslationKeys["nav"];

interface SidebarProps {
  plan?: string;
}

const NAV_GROUPS: {
  groupKey: NavKey;
  items: { labelKey: NavKey; labelEn: string; href: string; icon: React.ElementType }[];
}[] = [
  {
    groupKey: "groupMain",
    items: [
      { labelKey: "dashboard", labelEn: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    groupKey: "groupPitch",
    items: [
      { labelKey: "pitchCoachLive",  labelEn: "🎤 Pitch Coach Live",  href: "/dashboard/pitch-coach-live", icon: Mic2 },
      { labelKey: "pitchDeckCreator",labelEn: "Pitch Deck Creator",   href: "/dashboard/pitch-deck",       icon: Layers },
      { labelKey: "pitchMirror",     labelEn: "Pitch Mirror",         href: "/dashboard/pitch-mirror",     icon: Video },
    ],
  },
  {
    groupKey: "groupFindGrow",
    items: [
      { labelKey: "findFirstCustomer",labelEn: "Find First Customer", href: "/dashboard/first-customer",  icon: Target },
      { labelKey: "coldEmails",       labelEn: "Cold Emails",         href: "/dashboard/cold-emails",     icon: Send },
      { labelKey: "investorFinder",   labelEn: "Investor Finder",     href: "/dashboard/investor-finder", icon: Search },
      { labelKey: "investorQa",       labelEn: "Investor Q&A",        href: "/dashboard/investor-qa",     icon: MessageSquare },
    ],
  },
  {
    groupKey: "groupBuild",
    items: [
      { labelKey: "compass",       labelEn: "Quantum Compass",  href: "/dashboard/compass",        icon: Compass },
      { labelKey: "ideaValidator", labelEn: "Idea Validator",   href: "/dashboard/idea-validator", icon: Lightbulb },
      { labelKey: "cofounderMatch",labelEn: "Co-founder Match", href: "/dashboard/cofounder",      icon: UserPlus },
    ],
  },
  {
    groupKey: "groupCreate",
    items: [
      { labelKey: "sideOnePager",      labelEn: "One Pager",      href: "/dashboard/one-pager",     icon: FileText },
      { labelKey: "landingPage",       labelEn: "Landing Page",   href: "/dashboard/landing-page",  icon: Layers },
      { labelKey: "sidePressRelease",  labelEn: "Press Release",  href: "/dashboard/press-release", icon: Newspaper },
      { labelKey: "sideDemoScript",    labelEn: "Demo Script",    href: "/dashboard/demo-script",   icon: Play },
      { labelKey: "sideInvestorEmail", labelEn: "Investor Email", href: "/dashboard/investor-email",icon: Mail },
      { labelKey: "sideFounderStory",  labelEn: "Founder Story",  href: "/dashboard/founder-story", icon: Heart },
      { labelKey: "sideManifesto",     labelEn: "Manifesto",      href: "/dashboard/manifesto",     icon: BookOpen },
    ],
  },
  {
    groupKey: "groupStrategy",
    items: [
      { labelKey: "pricingIntelligence",labelEn: "Pricing Intelligence", href: "/dashboard/pricing-intelligence",      icon: DollarSign },
      { labelKey: "contentPlan",        labelEn: "Content Plan",         href: "/dashboard/content-plan",              icon: Calendar },
      { labelKey: "runwayCalculator",   labelEn: "Runway Calculator",    href: "/dashboard/founder/runway-calculator", icon: Calculator },
    ],
  },
  {
    groupKey: "groupCommunity",
    items: [
      { labelKey: "foundersChat",       labelEn: "Founders Chat", href: "/dashboard/chat",        icon: MessageSquare },
      { labelKey: "founderWall",        labelEn: "Founder Wall",  href: "/dashboard/leaderboard", icon: Trophy },
      { labelKey: "alerts",             labelEn: "Alerts",        href: "/dashboard/alerts",      icon: Bell },
      { labelKey: "founderFeed",        labelEn: "Founder Feed",  href: "/dashboard/market",      icon: TrendingUp },
    ],
  },
  {
    groupKey: "groupSettings",
    items: [
      { labelKey: "settings", labelEn: "Settings", href: "/dashboard/settings", icon: Settings },
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
          <div key={group.groupKey}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#8B7CF8]">
                {t.nav[group.groupKey]}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const label = t.nav[item.labelKey] ?? item.labelEn;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? label : undefined}
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
                      <span className="flex-1 truncate">{label}</span>
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
          <div className="px-3 py-1.5 rounded-md bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center gap-2">
            <Zap className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
            <span className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-wide">
              {t.nav.allFeaturesFree}
            </span>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 bg-[#C9A84C]/5 border border-[#C9A84C]/30 rounded-md"
            title="One of Quantum's earliest members."
          >
            <Star className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
            <span className="text-xs font-semibold text-[#C9A84C]">
              {t.nav.foundingMember}
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
