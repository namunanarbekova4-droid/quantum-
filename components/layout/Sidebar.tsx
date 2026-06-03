"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { useLanguage } from "@/lib/i18n";
import {
  LayoutDashboard, Clock, Globe, Bell, Trophy, BarChart2,
  Lock, Settings, ChevronRight, Star, Users, MessageSquare, GraduationCap, ShieldAlert,
  Newspaper, Beaker, UsersRound, CalendarClock
} from "lucide-react";

interface SidebarProps {
  plan?: string;
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { label: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { label: t.nav.history, href: "/dashboard/history", icon: Clock },
    { label: t.nav.marketIntelligence, href: "/dashboard/market", icon: Globe },
    { label: t.nav.alerts, href: "/dashboard/alerts", icon: Bell },
    { label: t.nav.leaderboard, href: "/dashboard/leaderboard", icon: Trophy },
    { label: t.nav.insights, href: "/dashboard/insights", icon: BarChart2 },
    { label: t.nav.privateRooms, href: "/dashboard/rooms", icon: Lock },
    { label: t.nav.community, href: "/dashboard/community", icon: Users },
    { label: t.nav.messages, href: "/dashboard/messages", icon: MessageSquare },
    { label: t.nav.mentors, href: "/dashboard/mentors", icon: GraduationCap },
    { label: t.nav.enemyMode, href: "/dashboard/enemy-mode", icon: ShieldAlert },
    { label: t.nav.briefing, href: "/dashboard/briefing", icon: Newspaper },
    { label: t.nav.simulator, href: "/dashboard/simulator", icon: Beaker },
    { label: t.nav.team, href: "/dashboard/team", icon: UsersRound },
    { label: t.nav.timeline, href: "/dashboard/timeline", icon: CalendarClock },
    { label: t.nav.settings, href: "/dashboard/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#080808] border-r border-[#1a1a1a] transition-all duration-200",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className={cn("p-5 border-b border-[#1a1a1a]", collapsed && "p-3 flex justify-center")}>
        {collapsed ? (
          <div className="w-8 h-8 bg-gold flex items-center justify-center rounded font-mono font-bold text-[#080808]">Q</div>
        ) : (
          <QuantumLogo size="md" />
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-[#888888] hover:text-white hover:bg-[#111111] border border-transparent",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-gold" : "text-[#888888] group-hover:text-white")} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && active && <ChevronRight className="w-3 h-3 text-gold" />}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-2 px-3 py-2 bg-gold/5 border border-gold/20 rounded-lg" title="One of Quantum's earliest members.">
            <Star className="w-3 h-3 text-gold flex-shrink-0" />
            <span className="text-xs font-semibold text-gold">{t.nav.foundingMember}</span>
          </div>
        </div>
      )}
    </div>
  );
}
