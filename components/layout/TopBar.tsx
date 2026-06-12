"use client";
import { useState, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Settings, User, Globe } from "lucide-react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";
import { Locale, localeLabels } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

interface TopBarProps {
  userName?: string;
  userRole?: "FOUNDER" | "INVESTOR" | "EXECUTIVE";
}

const dropdownAnim = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0,   scale: 1    },
  exit:    { opacity: 0, y: -4,  scale: 0.98 },
  transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
};

export function TopBar({ userName = "User", userRole = "FOUNDER" }: TopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [langOpen,  setLangOpen]  = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { t, locale, setLocale } = useLanguage();

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => { if (data.image) setProfileImage(data.image); })
      .catch(() => {});
  }, []);

  const roleLabels = {
    FOUNDER:   t.settings.profile.roleFounder,
    INVESTOR:  t.settings.profile.roleInvestor,
    EXECUTIVE: t.settings.profile.roleExecutive,
  };

  const closeAll = () => { setNotifOpen(false); setUserOpen(false); setLangOpen(false); };

  return (
    <div className="h-16 bg-[#06040F]/95 backdrop-blur-sm border-b border-[#1A1040] flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-40">
      <div />

      <div className="flex items-center gap-1">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => { setLangOpen(!langOpen); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-2 text-[#8B7CF8] hover:text-white hover:bg-[#1A1040] rounded-lg transition-all duration-200 text-sm btn-press"
          >
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline font-medium text-xs">{localeLabels[locale].nativeLabel}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", langOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={closeAll} />
                <motion.div {...dropdownAnim} className="absolute right-0 top-full mt-1.5 w-44 bg-[#0F0A1F] border border-[#1A1040] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20 overflow-hidden py-1">
                  {(Object.keys(localeLabels) as Locale[]).map((loc) => {
                    const info = localeLabels[loc];
                    return (
                      <button
                        key={loc}
                        onClick={() => { setLocale(loc); setLangOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          locale === loc
                            ? "text-[#C9A84C] bg-[#C9A84C]/5"
                            : "text-[#8B7CF8] hover:text-white hover:bg-[#1A1040]"
                        )}
                      >
                        <span className="text-base">{info.flag}</span>
                        <span className="text-xs font-medium">{info.nativeLabel}</span>
                        {locale === loc && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); setLangOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center text-[#8B7CF8] hover:text-white hover:bg-[#1A1040] rounded-lg transition-all duration-200 btn-press"
          >
            <Bell className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div {...dropdownAnim} className="absolute right-0 top-full mt-1.5 w-80 bg-[#0F0A1F] border border-[#1A1040] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20">
                  <div className="px-4 py-3 border-b border-[#1A1040] flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{t.topbar.notifications}</span>
                    <span className="text-xs text-[#8B7CF8]/50">0 new</span>
                  </div>
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#1A1040] flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-4 h-4 text-[#8B7CF8]/30" />
                    </div>
                    <p className="text-sm text-[#8B7CF8]/60 font-medium">{t.topbar.noNotifications}</p>
                    <p className="text-xs text-[#8B7CF8]/30 mt-1">{t.topbar.activityWillAppear}</p>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); setLangOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#1A1040] rounded-lg transition-all duration-200 ml-1 btn-press"
          >
            <div className="w-7 h-7 bg-[#C9A84C]/15 border border-[#C9A84C]/30 rounded-full overflow-hidden flex items-center justify-center text-[#C9A84C] text-xs font-bold flex-shrink-0">
              {profileImage ? (
                <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">{userName}</p>
              <p className="text-xs text-[#8B7CF8]/60 leading-tight">{roleLabels[userRole]}</p>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-[#8B7CF8]/50 transition-transform duration-200", userOpen && "rotate-180")} />
          </button>
          <AnimatePresence>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                <motion.div {...dropdownAnim} className="absolute right-0 top-full mt-1.5 w-48 bg-[#0F0A1F] border border-[#1A1040] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-20 overflow-hidden py-1">
                  <a href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8B7CF8] hover:text-white hover:bg-[#1A1040] transition-colors">
                    <Settings className="w-4 h-4" /> {t.topbar.settings}
                  </a>
                  <a href="/dashboard/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#8B7CF8] hover:text-white hover:bg-[#1A1040] transition-colors">
                    <User className="w-4 h-4" /> {t.topbar.profile}
                  </a>
                  <div className="my-1 border-t border-[#1A1040]" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/8 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t.topbar.signOut}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
