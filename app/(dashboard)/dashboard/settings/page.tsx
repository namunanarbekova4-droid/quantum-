"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Eye, CreditCard, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const notifSettings = [
  { id: "alerts", label: "Alert Triggers", desc: "When a monitored alert fires", enabled: true },
  { id: "decisions", label: "Decision Analysis Complete", desc: "When your analysis is ready", enabled: true },
  { id: "reports", label: "Weekly Reports", desc: "New intelligence reports published", enabled: true },
  { id: "rooms", label: "Private Room Activity", desc: "New messages in your rooms", enabled: false },
  { id: "leaderboard", label: "Leaderboard Changes", desc: "When your rank changes", enabled: false },
];

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("FOUNDER");
  const [notifs, setNotifs] = useState(notifSettings);
  const [publicProfile, setPublicProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

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
      });
  }, []);

  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, company, industry, country, publicProfile, role }),
    });
    setSaving(false);
    if (res.ok) {
      await updateSession({ name });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)));

  const initials = name ? name.charAt(0).toUpperCase() : (session?.user?.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-text-secondary mt-1">Manage your account, preferences, and billing.</p>
      </motion.div>

      <div className="mt-6 flex gap-1 flex-wrap border-b border-[#1a1a1a] pb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px",
                tab === t.id ? "text-gold border-gold" : "text-text-secondary border-transparent hover:text-white"
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-6">
        {tab === "profile" && (
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Profile Information</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center text-gold text-2xl font-bold">
                {initials}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email Address" value={email} type="email" disabled className="opacity-60 cursor-not-allowed" onChange={() => {}} />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                >
                  <option value="FOUNDER">Founder</option>
                  <option value="INVESTOR">Investor</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </div>
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                >
                  <option value="">Select industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Energy">Energy</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              {saveMsg && <span className="text-sm text-success">{saveMsg}</span>}
              <Button onClick={save} loading={saving}>Save Changes</Button>
            </div>
          </Card>
        )}

        {tab === "account" && (
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Change Password</h2>
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="••••••••" />
              <Input label="Confirm New Password" type="password" placeholder="••••••••" />
              <Button size="sm">Update Password</Button>
            </Card>
            <Card className="p-6 border-danger/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-danger" />
                <h2 className="text-base font-semibold text-danger">Danger Zone</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="danger" size="sm">Delete Account</Button>
            </Card>
          </div>
        )}

        {tab === "notifications" && (
          <Card className="p-6">
            <h2 className="text-base font-semibold text-white mb-6">Notification Preferences</h2>
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
            <h2 className="text-base font-semibold text-white">Privacy Settings</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Public Profile</p>
                <p className="text-xs text-text-secondary">Show your profile on the global leaderboard</p>
              </div>
              <button
                onClick={() => setPublicProfile(!publicProfile)}
                className={`relative w-10 h-5 rounded-full transition-all duration-200 ${publicProfile ? "bg-gold" : "bg-[#2a2a2a]"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${publicProfile ? "left-5" : "left-0.5"}`} />
              </button>
            </div>
            <div className="pt-4 border-t border-[#1a1a1a]">
              <p className="text-sm font-medium text-white mb-2">Data Usage</p>
              <p className="text-xs text-text-secondary leading-relaxed">Your decision data is used to improve analysis quality. We never share individual decision content with third parties. All data is encrypted at rest and in transit.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={save} loading={saving}>Save Changes</Button>
            </div>
          </Card>
        )}

        {tab === "billing" && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Current Plan</h2>
              <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gold">Free Trial</p>
                  <p className="text-xs text-text-secondary mt-0.5">Limited access · Upgrade to unlock all features</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-white">$0<span className="text-sm text-text-secondary">/mo</span></p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button size="sm">Upgrade Plan</Button>
              </div>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
