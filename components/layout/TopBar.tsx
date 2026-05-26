"use client";
import { useState } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  userName?: string;
  userRole?: "FOUNDER" | "INVESTOR" | "EXECUTIVE";
  notificationCount?: number;
}

export function TopBar({ userName = "Alex", userRole = "FOUNDER", notificationCount = 3 }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const roleLabels = { FOUNDER: "Founder", INVESTOR: "Investor", EXECUTIVE: "Executive" };

  const mockNotifications = [
    { id: 1, text: "Middle East VC activity alert triggered", time: "2m ago", unread: true },
    { id: 2, text: "Your decision analysis is complete", time: "1h ago", unread: true },
    { id: 3, text: "New Weekly Intelligence Report available", time: "3h ago", unread: true },
  ];

  return (
    <div className="h-16 bg-[#080808] border-b border-[#1a1a1a] flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center text-text-secondary hover:text-white hover:bg-[#111111] rounded transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-surface z-20">
                <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                  <button className="text-xs text-gold hover:text-gold-light transition-colors">Mark all read</button>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className={cn("p-4 hover:bg-[#161616] transition-colors cursor-pointer", n.unread && "border-l-2 border-l-gold")}>
                      <p className="text-sm text-white leading-snug">{n.text}</p>
                      <p className="text-xs text-text-secondary mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#111111] rounded transition-all duration-200"
          >
            <div className="w-7 h-7 bg-gold/20 border border-gold/30 rounded-full flex items-center justify-center text-gold text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{userName}</p>
              <p className="text-xs text-text-secondary leading-tight">{roleLabels[userRole]}</p>
            </div>
            <ChevronDown className="w-3 h-3 text-text-secondary" />
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-surface z-20 overflow-hidden">
                <a href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-[#161616] transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </a>
                <a href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-[#161616] transition-colors">
                  <User className="w-4 h-4" /> Profile
                </a>
                <div className="border-t border-[#1a1a1a]" />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
