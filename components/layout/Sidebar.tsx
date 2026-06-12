"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/i18n/translations";
import { OrbitalIcon } from "@/components/ui/QuantumLogo";
import {
  LayoutDashboard, Mic2, Layers, Video, Target, Send, Search,
  Compass, Lightbulb, UserPlus, FileText, Newspaper, Play,
  Mail, Heart, BookOpen, DollarSign, Calendar, Calculator,
  MessageSquare, Trophy, Bell, TrendingUp, Settings,
  ChevronLeft, ChevronRight, Star, Zap,
} from "lucide-react";

type NavKey = keyof TranslationKeys["nav"];

interface SidebarProps { plan?: string; }

const NAV_GROUPS: {
  groupKey: NavKey;
  items: { labelKey: NavKey; labelEn: string; href: string; icon: React.ElementType }[];
}[] = [
  {
    groupKey: "groupMain",
    items: [{ labelKey: "dashboard", labelEn: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    groupKey: "groupPitch",
    items: [
      { labelKey: "pitchCoachLive",   labelEn: "Pitch Coach Live",   href: "/dashboard/pitch-coach-live", icon: Mic2 },
      { labelKey: "pitchDeckCreator", labelEn: "Pitch Deck Creator", href: "/dashboard/pitch-deck",       icon: Layers },
      { labelKey: "pitchMirror",      labelEn: "Pitch Mirror",       href: "/dashboard/pitch-mirror",     icon: Video },
    ],
  },
  {
    groupKey: "groupFindGrow",
    items: [
      { labelKey: "findFirstCustomer", labelEn: "Find First Customer", href: "/dashboard/first-customer",  icon: Target },
      { labelKey: "coldEmails",        labelEn: "Cold Emails",         href: "/dashboard/cold-emails",     icon: Send },
      { labelKey: "investorFinder",    labelEn: "Investor Finder",     href: "/dashboard/investor-finder", icon: Search },
      { labelKey: "investorQa",        labelEn: "Investor Q&A",        href: "/dashboard/investor-qa",     icon: MessageSquare },
    ],
  },
  {
    groupKey: "groupBuild",
    items: [
      { labelKey: "compass",        labelEn: "Quantum Compass",  href: "/dashboard/compass",        icon: Compass },
      { labelKey: "ideaValidator",  labelEn: "Idea Validator",   href: "/dashboard/idea-validator", icon: Lightbulb },
      { labelKey: "cofounderMatch", labelEn: "Co-founder Match", href: "/dashboard/cofounder",      icon: UserPlus },
    ],
  },
  {
    groupKey: "groupCreate",
    items: [
      { labelKey: "sideOnePager",      labelEn: "One Pager",      href: "/dashboard/one-pager",      icon: FileText },
      { labelKey: "landingPage",       labelEn: "Landing Page",   href: "/dashboard/landing-page",   icon: Layers },
      { labelKey: "sidePressRelease",  labelEn: "Press Release",  href: "/dashboard/press-release",  icon: Newspaper },
      { labelKey: "sideDemoScript",    labelEn: "Demo Script",    href: "/dashboard/demo-script",    icon: Play },
      { labelKey: "sideInvestorEmail", labelEn: "Investor Email", href: "/dashboard/investor-email", icon: Mail },
      { labelKey: "sideFounderStory",  labelEn: "Founder Story",  href: "/dashboard/founder-story",  icon: Heart },
      { labelKey: "sideManifesto",     labelEn: "Manifesto",      href: "/dashboard/manifesto",      icon: BookOpen },
    ],
  },
  {
    groupKey: "groupStrategy",
    items: [
      { labelKey: "pricingIntelligence", labelEn: "Pricing Intelligence", href: "/dashboard/pricing-intelligence",      icon: DollarSign },
      { labelKey: "contentPlan",         labelEn: "Content Plan",         href: "/dashboard/content-plan",              icon: Calendar },
      { labelKey: "runwayCalculator",    labelEn: "Runway Calculator",    href: "/dashboard/founder/runway-calculator", icon: Calculator },
    ],
  },
  {
    groupKey: "groupCommunity",
    items: [
      { labelKey: "foundersChat", labelEn: "Founders Chat", href: "/dashboard/chat",        icon: MessageSquare },
      { labelKey: "founderWall",  labelEn: "Founder Wall",  href: "/dashboard/leaderboard", icon: Trophy },
      { labelKey: "alerts",       labelEn: "Alerts",        href: "/dashboard/alerts",      icon: Bell },
      { labelKey: "founderFeed",  labelEn: "Founder Feed",  href: "/dashboard/market",      icon: TrendingUp },
    ],
  },
  {
    groupKey: "groupSettings",
    items: [{ labelKey: "settings", labelEn: "Settings", href: "/dashboard/settings", icon: Settings }],
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
    <motion.div
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full border-r border-[#1A1040] bg-[#0A0618] overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-[#1A1040] flex-shrink-0 h-16",
        collapsed ? "justify-center px-4" : "px-5"
      )}>
        {collapsed ? (
          <OrbitalIcon svgSize={28} strokeWidth={1.2} opacity={0.7} particleScale={1.2} />
        ) : (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <OrbitalIcon svgSize={26} strokeWidth={1.2} opacity={0.7} particleScale={1.2} />
            <motion.span
              initial={false}
              animate={{ opacity: collapsed ? 0 : 1 }}
              className="font-bold text-[#C9A84C] tracking-wide text-base truncate"
            >
              Quantum
            </motion.span>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-[52px] z-10 w-5 h-5 rounded-full",
          "bg-[#130E24] border border-[#7C3AED]/40",
          "flex items-center justify-center",
          "text-[#8B7CF8] hover:text-[#A855F7] hover:border-[#A855F7]",
          "transition-all duration-200 shadow-lg",
          collapsed ? "left-[52px]" : "left-[244px]"
        )}
        style={{ transition: "left 0.3s cubic-bezier(0.16,1,0.3,1), color 0.15s, border-color 0.15s" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />
        }
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 overflow-x-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.groupKey}>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#8B7CF8]/40 whitespace-nowrap"
                >
                  {t.nav[group.groupKey]}
                </motion.p>
              )}
            </AnimatePresence>
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
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                      active
                        ? "bg-[#7C3AED]/15 text-[#C9A84C] border border-[#7C3AED]/25 shadow-[0_0_12px_rgba(124,58,237,0.1)]"
                        : "text-[#8B7CF8]/60 hover:text-[#C9A84C]/80 hover:bg-[#7C3AED]/8 border border-transparent"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      active ? "text-[#C9A84C]" : "text-[#8B7CF8]/50 group-hover:text-[#C9A84C]/70"
                    )} />
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 truncate overflow-hidden whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
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
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-3 border-t border-[#1A1040] space-y-2 flex-shrink-0"
          >
            <div className="px-3 py-1.5 rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center gap-2">
              <Zap className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
              <span className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-wide truncate">
                {t.nav.allFeaturesFree}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#C9A84C]/5 border border-[#C9A84C]/25 rounded-lg">
              <Star className="w-3 h-3 text-[#C9A84C] flex-shrink-0" />
              <span className="text-xs font-semibold text-[#C9A84C] truncate">{t.nav.foundingMember}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {collapsed && (
        <div className="p-3 border-t border-[#1A1040] flex justify-center flex-shrink-0">
          <Star className="w-4 h-4 text-[#C9A84C]" aria-label="Founding Member" />
        </div>
      )}
    </motion.div>
  );
}
