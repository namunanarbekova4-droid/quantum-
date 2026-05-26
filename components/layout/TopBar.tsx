"use client";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";

interface TopBarProps {
  userName?: string;
  userRole?: "FOUNDER" | "INVESTOR" | "EXECUTIVE";
}

export function TopBar({ userName = "User", userRole = "FOUNDER" }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => { if (data.image) setProfileImage(data.image); })
      .catch(() => {});
  }, []);

  const roleLabels = { FOUNDER: "Founder", INVESTOR: "Investor", EXECUTIVE: "Executive" };

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
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-surface z-20">
                <div className="p-4 border-b border-[#1a1a1a]">
                  <span className="text-sm font-semibold text-white">Notifications</span>
                </div>
                <div className="p-8 text-center">
                  <Bell className="w-6 h-6 text-[#333333] mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No notifications yet</p>
                  <p className="text-xs text-[#444444] mt-1">Activity will appear here</p>
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
            <div className="w-7 h-7 bg-gold/20 border border-gold/30 rounded-full overflow-hidden flex items-center justify-center text-gold text-xs font-bold">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
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
