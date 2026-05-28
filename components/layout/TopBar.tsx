"use client";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Settings, User, Globe } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLanguage } from "@/lib/i18n";
import { Locale, localeLabels } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

interface TopBarProps {
  userName?: string;
  userRole?: "FOUNDER" | "INVESTOR" | "EXECUTIVE";
}

export function TopBar({ userName = "User", userRole = "FOUNDER" }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { t, locale, setLocale } = useLanguage();

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => { if (data.image) setProfileImage(data.image); })
      .catch(() => {});
  }, []);

  const roleLabels = {
    FOUNDER: t.settings.profile.roleFounder,
    INVESTOR: t.settings.profile.roleInvestor,
    EXECUTIVE: t.settings.profile.roleExecutive,
  };

  const closeAll = () => { setNotifOpen(false); setUserOpen(false); setLangOpen(false); };

  return (
    <div className="h-16 bg-[#080808] border-b border-[#1a1a1a] flex items-center justify-between px-6 flex-shrink-0">
      <div />

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-1.5 px-2.5 py-2 text-text-secondary hover:text-white hover:bg-[#111111] rounded transition-all duration-200 text-sm"
            title={t.topbar.language}
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">{localeLabels[locale].nativeLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeAll} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-surface z-20 overflow-hidden py-1">
                {(Object.keys(localeLabels) as Locale[]).map((loc) => {
                  const info = localeLabels[loc];
                  return (
                    <button
                      key={loc}
                      onClick={() => { setLocale(loc); setLangOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                        locale === loc
                          ? "text-gold bg-gold/5"
                          : "text-text-secondary hover:text-white hover:bg-[#161616]"
                      )}
                    >
                      <span className="text-base">{info.flag}</span>
                      <span>{info.nativeLabel}</span>
                      {locale === loc && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setLangOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center text-text-secondary hover:text-white hover:bg-[#111111] rounded transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-surface z-20">
                <div className="p-4 border-b border-[#1a1a1a]">
                  <span className="text-sm font-semibold text-white">{t.topbar.notifications}</span>
                </div>
                <div className="p-8 text-center">
                  <Bell className="w-6 h-6 text-[#333333] mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">{t.topbar.noNotifications}</p>
                  <p className="text-xs text-[#444444] mt-1">{t.topbar.activityWillAppear}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setLangOpen(false); }}
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
                  <Settings className="w-4 h-4" /> {t.topbar.settings}
                </a>
                <a href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-[#161616] transition-colors">
                  <User className="w-4 h-4" /> {t.topbar.profile}
                </a>
                <div className="border-t border-[#1a1a1a]" />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> {t.topbar.signOut}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
