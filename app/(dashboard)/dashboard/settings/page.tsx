"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, Eye, CreditCard, AlertTriangle, Clock, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { Locale, localeLabels } from "@/lib/i18n/translations";
import { type Plan, PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/plans";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { t, locale, setLocale } = useLanguage();
  const [langSaved, setLangSaved] = useState(false);
  const { toast } = useToast();

  const tabs = [
    { id: "profile", label: t.settings.tabs.profile, icon: User },
    { id: "account", label: t.settings.tabs.account, icon: Shield },
    { id: "notifications", label: t.settings.tabs.notifications, icon: Bell },
    { id: "privacy", label: t.settings.tabs.privacy, icon: Eye },
    { id: "billing", label: t.settings.tabs.billing, icon: CreditCard },
  ];

  const notifSettingsDefault = [
    { id: "alerts", label: t.settings.notifications.alertTriggers, desc: t.settings.notifications.alertTriggersDesc, enabled: true },
    { id: "decisions", label: t.settings.notifications.decisionAnalysis, desc: t.settings.notifications.decisionAnalysisDesc, enabled: true },
    { id: "reports", label: t.settings.notifications.weeklyReports, desc: t.settings.notifications.weeklyReportsDesc, enabled: true },
    { id: "rooms", label: t.settings.notifications.privateRoomActivity, desc: t.settings.notifications.privateRoomActivityDesc, enabled: false },
    { id: "leaderboard", label: t.settings.notifications.leaderboardChanges, desc: t.settings.notifications.leaderboardChangesDesc, enabled: false },
  ];

  const [tab, setTab] = useState("profile");

  // Plan state
  const [planData, setPlanData] = useState<{
    plan: Plan;
    planSince: string;
    usage: { decisionsThisMonth: number; mentorRequestsThisMonth: number; alertsCount: number };
    limits: { decisionsPerMonth: number; mentorRequestsPerMonth: number; alerts: number };
  } | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetch("/api/user/plan")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPlanData(data); });
  }, []);

  const handleUpgradePlan = async (plan: Plan) => {
    setUpgradingPlan(plan);
    try {
      const res = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlanData((prev) => prev ? { ...prev, plan: updated.plan } : prev);
        toast("Plan updated successfully.", "success");
      } else {
        toast("Failed to update plan.", "error");
      }
    } finally {
      setUpgradingPlan(null);
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("FOUNDER");
  const [avatarImage, setAvatarImage] = useState("");
  const [notifs, setNotifs] = useState(notifSettingsDefault);
  const [publicProfile, setPublicProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [privacySaving, setPrivacySaving] = useState(false);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setCompany(data.company ?? "");
        setCountry(data.country ?? "");
        setIndustry(data.industry ?? "");
        setRole(data.role ?? "FOUNDER");
        setPublicProfile(data.publicProfile ?? false);
        setAvatarImage(data.image ?? "");
      });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, industry, country, publicProfile, role, image: avatarImage || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      await updateSession({ name });
      setSaveMsg(t.common.saved);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const savePrivacy = async () => {
    setPrivacySaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicProfile }),
    });
    setPrivacySaving(false);
    if (res.ok) {
      toast(t.settings.privacy.saveSuccess, "success");
    } else {
      toast(t.settings.privacy.saveError, "error");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        toast(t.deleteModal.successToast, "success");
        setTimeout(() => signOut({ callbackUrl: "/" }), 1500);
      } else {
        toast(t.deleteModal.errorToast, "error");
        setDeleting(false);
      }
    } catch {
      toast(t.deleteModal.errorToast, "error");
      setDeleting(false);
    }
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = Math.min(img.width, img.height);
        const scale = Math.min(300 / size, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const initials = name ? name.charAt(0).toUpperCase() : (session?.user?.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">{t.settings.title}</h1>
        <p className="text-text-secondary mt-1">{t.settings.subtitle}</p>
      </motion.div>

      <div className="mt-6 flex gap-1 flex-wrap border-b border-[#1a1a1a] pb-px">
        {tabs.map((tb) => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px",
                tab === tb.id ? "text-gold border-gold" : "text-text-secondary border-transparent hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" /> {tb.label}
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-6">
        {tab === "profile" && (
          <>
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">{t.settings.profile.title}</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gold/20 border border-gold/30 rounded-lg overflow-hidden flex items-center justify-center text-gold text-2xl font-bold flex-shrink-0">
                {avatarImage ? (
                  <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-gold hover:text-gold/80 transition-colors border border-gold/30 hover:border-gold/60 px-3 py-1.5 rounded"
                >
                  {t.settings.profile.uploadPhoto}
                </button>
                {avatarImage && (
                  <button
                    type="button"
                    onClick={() => setAvatarImage("")}
                    className="text-xs text-text-secondary hover:text-danger transition-colors"
                  >
                    {t.settings.profile.remove}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t.settings.profile.fullName} value={name} onChange={(e) => setName(e.target.value)} />
              <Input label={t.settings.profile.emailAddress} value={email} type="email" disabled className="opacity-60 cursor-not-allowed" onChange={() => {}} />
              <Input label={t.settings.profile.company} value={company} onChange={(e) => setCompany(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">{t.settings.profile.role}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                >
                  <option value="FOUNDER">{t.settings.profile.roleFounder}</option>
                  <option value="INVESTOR">{t.settings.profile.roleInvestor}</option>
                  <option value="EXECUTIVE">{t.settings.profile.roleExecutive}</option>
                </select>
              </div>
              <Input label={t.settings.profile.country} value={country} onChange={(e) => setCountry(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">{t.settings.profile.industry}</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                >
                  <option value="">{t.settings.profile.selectIndustry}</option>
                  <option value="Technology">{t.settings.profile.industryTech}</option>
                  <option value="Finance">{t.settings.profile.industryFinance}</option>
                  <option value="Healthcare">{t.settings.profile.industryHealthcare}</option>
                  <option value="Real Estate">{t.settings.profile.industryRealEstate}</option>
                  <option value="Energy">{t.settings.profile.industryEnergy}</option>
                  <option value="Other">{t.settings.profile.industryOther}</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              {saveMsg && <span className="text-sm text-success">{saveMsg}</span>}
              <Button onClick={save} loading={saving}>{t.common.save}</Button>
            </div>
          </Card>

          {/* Language selector */}
          <Card className="p-6 space-y-4 mt-4">
            <h2 className="text-base font-semibold text-white">{t.settings.language.title}</h2>
            <p className="text-sm text-[#8B7CF8]/70">{t.settings.language.subtitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {(Object.keys(localeLabels) as Locale[]).map((loc) => {
                const info = localeLabels[loc];
                return (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc);
                      setLangSaved(true);
                      setTimeout(() => setLangSaved(false), 2000);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                      locale === loc
                        ? "bg-[#C9A84C]/15 border-[#C9A84C]/60 text-[#C9A84C]"
                        : "bg-[#06040F] border-[#1A1040] text-[#8B7CF8] hover:text-white hover:border-[#2D1B69]"
                    )}
                  >
                    <span className="text-base">{info.flag}</span>
                    <span className="text-xs">{info.nativeLabel}</span>
                  </button>
                );
              })}
            </div>
            {langSaved && (
              <p className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> {t.settings.language.saved}
              </p>
            )}
          </Card>
          </>
        )}

        {tab === "account" && (
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">{t.settings.account.changePassword}</h2>
              <Input label={t.settings.account.currentPassword} type="password" placeholder="••••••••" />
              <Input label={t.settings.account.newPassword} type="password" placeholder="••••••••" />
              <Input label={t.settings.account.confirmPassword} type="password" placeholder="••••••••" />
              <div className="flex items-center gap-3">
                <Button size="sm" onClick={() => toast(t.common.comingSoon, "info")} className="gap-2">
                  {t.settings.account.updatePassword}
                </Button>
                <span className="flex items-center gap-1 text-xs text-[#555555]">
                  <Clock className="w-3 h-3" /> {t.common.comingSoon}
                </span>
              </div>
            </Card>
            <Card className="p-6 border-danger/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <h2 className="text-base font-semibold text-danger">{t.settings.account.dangerZone}</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">{t.settings.account.dangerDesc}</p>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                {t.settings.account.deleteAccount}
              </Button>
            </Card>
          </div>
        )}

        {tab === "notifications" && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-white mb-6">{t.settings.notifications.title}</h2>
            <div className="space-y-5">
              {notifs.map((n) => (
                <div key={n.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{n.label}</p>
                    <p className="text-xs text-text-secondary">{n.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(n.id)}
                    className={`relative w-10 h-5 rounded-full transition-all duration-200 ${n.enabled ? "bg-gold" : "bg-[#2a2a2a]"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${n.enabled ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "privacy" && (
          <Card className="p-6 space-y-6">
            <h2 className="text-base font-semibold text-white">{t.settings.privacy.title}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{t.settings.privacy.publicProfile}</p>
                <p className="text-xs text-text-secondary">{t.settings.privacy.publicProfileDesc}</p>
              </div>
              <button
                onClick={() => setPublicProfile(!publicProfile)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${publicProfile ? "bg-gold" : "bg-[#2a2a2a]"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${publicProfile ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <div className="pt-4 border-t border-[#1a1a1a]">
              <p className="text-sm font-medium text-white mb-2">{t.settings.privacy.dataUsage}</p>
              <p className="text-xs text-text-secondary leading-relaxed">{t.settings.privacy.dataUsageDesc}</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={savePrivacy} loading={privacySaving}>{t.common.save}</Button>
            </div>
          </Card>
        )}

        {tab === "billing" && (
          <div className="space-y-6">
            {/* Current plan + usage */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <h2 className="text-base font-semibold text-white">{t.settings.billing.planUsage}</h2>
              </div>

              {planData ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-lg font-bold ${PLAN_DISPLAY[planData.plan].color}`}>
                      {PLAN_DISPLAY[planData.plan].label}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] rounded-full">
                      {t.settings.billing.earlyAccessFree}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    {[
                      {
                        label: t.settings.billing.decisionsThisMonth,
                        used: planData.usage.decisionsThisMonth,
                        limit: planData.limits.decisionsPerMonth,
                      },
                      {
                        label: t.settings.billing.mentorRequests,
                        used: planData.usage.mentorRequestsThisMonth,
                        limit: planData.limits.mentorRequestsPerMonth,
                      },
                      {
                        label: t.settings.billing.activeAlerts,
                        used: planData.usage.alertsCount,
                        limit: planData.limits.alerts,
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4">
                        <p className="text-xs text-[#888] mb-1">{stat.label}</p>
                        <p className="text-lg font-bold text-white font-mono">
                          {stat.used}
                          <span className="text-xs text-[#555] font-sans ml-1">
                            / {stat.limit === -1 ? t.settings.billing.unlimited : stat.limit}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-3 animate-pulse">
                  <div className="h-8 bg-[#1a1a1a] rounded w-32" />
                  <div className="h-16 bg-[#1a1a1a] rounded" />
                </div>
              )}
            </Card>

            {/* Plan selection cards */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-[#555555] uppercase tracking-wider mb-2">{t.settings.billing.changePlan}</h3>
              <p className="text-xs text-[#888] mb-5">{t.settings.billing.changePlanDesc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(["FREE_TRIAL", "PRO", "MAX", "PREMIUM"] as Plan[]).map((planId) => {
                  const isCurrent = planData?.plan === planId;
                  const isMax = planId === "MAX";
                  const planFeatures = t.settings.billing.planFeatures as Record<Plan, string[]>;
                  return (
                    <div
                      key={planId}
                      className={`relative p-4 rounded-lg border ${
                        isMax ? "border-[#C9A84C]/40 bg-[#C9A84C]/5" : "border-[#1a1a1a] bg-[#0d0d0d]"
                      } ${isCurrent ? "ring-1 ring-[#C9A84C]/50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-bold ${PLAN_DISPLAY[planId].color}`}>
                          {PLAN_DISPLAY[planId].label}
                        </span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-xs text-[#C9A84C]">
                            <Check className="w-3 h-3" /> {t.settings.billing.current}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {(planFeatures[planId] ?? []).map((f) => (
                          <li key={f} className="text-xs text-[#888] flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => handleUpgradePlan(planId)}
                        disabled={isCurrent || upgradingPlan === planId}
                        className={cn(
                          "w-full py-2 text-xs font-semibold rounded transition-all",
                          isCurrent
                            ? "bg-[#C9A84C]/10 text-[#C9A84C] cursor-default border border-[#C9A84C]/20"
                            : isMax
                            ? "bg-[#C9A84C] text-[#080808] hover:bg-[#d4b660] disabled:opacity-70"
                            : "border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/8 disabled:opacity-70"
                        )}
                      >
                        {upgradingPlan === planId ? t.settings.billing.upgrading : isCurrent ? t.settings.billing.currentPlan : t.settings.billing.selectPlan}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Early access note */}
            <div className="p-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg">
              <p className="text-xs text-[#555] leading-relaxed">
                {t.settings.billing.planChangesNote}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget && !deleting) { setDeleteOpen(false); setDeleteInput(""); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-[#2a1a1a] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-[#1a1a1a] flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-danger/10 border border-danger/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-danger" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{t.deleteModal.title}</h2>
                    <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{t.deleteModal.subtitle}</p>
                  </div>
                </div>
                {!deleting && (
                  <button
                    onClick={() => { setDeleteOpen(false); setDeleteInput(""); }}
                    className="text-text-secondary hover:text-white transition-colors ml-3 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Warning */}
              <div className="px-6 py-4">
                <div className="bg-danger/5 border border-danger/15 rounded-lg p-4 mb-5">
                  <p className="text-xs font-semibold text-danger mb-2">{t.deleteModal.willLose}</p>
                  <ul className="space-y-1.5">
                    {t.deleteModal.loseItems.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-[#cc6666]">
                        <span className="w-1 h-1 rounded-full bg-danger/50 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirmation input */}
                <div className="space-y-2 mb-5">
                  <label className="text-xs font-medium text-text-secondary">{t.deleteModal.confirmLabel}</label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder={t.deleteModal.confirmPlaceholder}
                    disabled={deleting}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#2a2a2a] text-white text-sm rounded-lg focus:outline-none focus:border-danger/40 transition-all font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-[#444444] disabled:opacity-50"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setDeleteOpen(false); setDeleteInput(""); }}
                    disabled={deleting}
                    className="flex-1 h-10 px-4 text-sm font-medium text-text-secondary hover:text-white bg-[#111111] hover:bg-[#161616] border border-[#2a2a2a] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.deleteModal.cancel}
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "DELETE" || deleting}
                    className={cn(
                      "flex-1 h-10 px-4 text-sm font-medium rounded-lg transition-all",
                      deleteInput === "DELETE" && !deleting
                        ? "bg-danger text-white hover:bg-danger/90 cursor-pointer"
                        : "bg-danger/20 text-danger/40 cursor-not-allowed"
                    )}
                  >
                    {deleting ? t.deleteModal.deleting : t.deleteModal.deletePermanently}
                  </button>
                </div>
              </div>

              {/* Gold accent bottom bar */}
              <div className="h-px bg-gradient-to-r from-transparent via-danger/20 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
