"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard, Plus, Clock, Globe, Bell, Trophy, BarChart2,
  Lock, Settings, ChevronRight, Zap
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Decision", href: "/dashboard", icon: Plus },
  { label: "History", href: "/dashboard/history", icon: Clock },
  { label: "Market Intelligence", href: "/dashboard/market", icon: Globe },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
  { label: "Insights", href: "/dashboard/insights", icon: BarChart2 },
  { label: "Private Rooms", href: "/dashboard/rooms", icon: Lock },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  plan?: "trial" | "pro" | "max" | "premium";
  collapsed?: boolean;
}

export function Sidebar({ plan = "pro", collapsed = false }: SidebarProps) {
  const pathname = usePathname();

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
        <div className="p-4 border-t border-[#1a1a1a] space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={plan === "premium" || plan === "max" ? "gold" : "neutral"}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
            {plan !== "premium" && (
              <Link href="/pricing" className="text-xs text-text-secondary hover:text-gold transition-colors">
                Upgrade
              </Link>
            )}
          </div>
          {(plan === "trial" || plan === "pro") && (
            <Button size="sm" variant="outline" className="w-full gap-2">
              <Zap className="w-3 h-3" />
              Upgrade to Max
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
