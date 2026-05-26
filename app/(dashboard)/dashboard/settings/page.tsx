"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Eye, CreditCard, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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

const invoices = [
  { date: "May 1, 2025", amount: "$49.00", status: "Paid", plan: "Pro" },
  { date: "Apr 1, 2025", amount: "$49.00", status: "Paid", plan: "Pro" },
  { date: "Mar 1, 2025", amount: "$49.00", status: "Paid", plan: "Pro" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [name, setName] = useState("Alex Chen");
  const [email, setEmail] = useState("alex@meridianai.com");
  const [company, setCompany] = useState("Meridian AI");
  const [country, setCountry] = useState("United States");
  const [notifs, setNotifs] = useState(notifSettings);
  const [publicProfile, setPublicProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  const toggleNotif = (id: string) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)));

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
              <div className="w-16 h-16 bg-gold/20 border border-gold/30 rounded-lg flex items-center justify-center text-gold text-2xl font-bold">A</div>
              <Button variant="outline" size="sm">Upload Photo</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Role</label>
                <select className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200">
                  <option>Founder</option>
                  <option>Investor</option>
                  <option>Executive</option>
                </select>
              </div>
              <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Industry</label>
                <select className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Real Estate</option>
                  <option>Energy</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
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
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Connected Accounts</h2>
              <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a1a1a] rounded flex items-center justify-center text-sm font-bold text-white">G</div>
                  <div>
                    <p className="text-sm font-medium text-white">Google</p>
                    <p className="text-xs text-text-secondary">alex@meridianai.com</p>
                  </div>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
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
          </Card>
        )}

        {tab === "billing" && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Current Plan</h2>
              <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gold">Pro Plan</p>
                  <p className="text-xs text-text-secondary mt-0.5">50 decisions/month · 3 alerts · 1 private room</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-white">$49<span className="text-sm text-text-secondary">/mo</span></p>
                  <p className="text-xs text-text-secondary">Renews Jun 1, 2025</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm">Change Plan</Button>
                <Button variant="ghost" size="sm">Cancel Subscription</Button>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Usage This Month</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-text-secondary">Decisions</span>
                    <span className="font-mono text-white">12 / 50</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full">
                    <div className="h-full bg-gold rounded-full" style={{ width: "24%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="text-text-secondary">Active Alerts</span>
                    <span className="font-mono text-white">4 / 3</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full">
                    <div className="h-full bg-danger rounded-full" style={{ width: "133%" }} />
                  </div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">Billing History</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    {["Date", "Plan", "Amount", "Status"].map((h) => (
                      <th key={h} className="text-left text-xs text-text-secondary font-medium pb-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {invoices.map((inv) => (
                    <tr key={inv.date}>
                      <td className="py-3 text-text-secondary">{inv.date}</td>
                      <td className="py-3 text-white">{inv.plan}</td>
                      <td className="py-3 font-mono text-white">{inv.amount}</td>
                      <td className="py-3"><Badge variant="success">{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
