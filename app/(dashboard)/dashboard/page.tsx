"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

const quickActions = ["Market Entry", "Hiring", "Fundraising", "Pivot", "Partnership"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: decision }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      router.push(`/dashboard/decision/${data.id}`);
    } catch {
      setLoading(false);
      toast("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Good morning, {userName}.</h1>
        <p className="text-text-secondary mt-1">Quantum is ready. Describe a decision below to begin your analysis.</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-3 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-white mb-4">New Decision</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="Describe your decision... e.g. Should I expand to the Middle East market before raising Series A?"
                  className="w-full h-32 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm rounded-lg p-4 resize-none focus:outline-none focus:border-gold/50 focus:shadow-[0_0_0_2px_rgba(201,168,76,0.08)] placeholder:text-[#444444] transition-all duration-200"
                />
                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setDecision(action + ": ")}
                      className="px-3 py-1 text-xs font-medium text-text-secondary border border-[#1a1a1a] rounded hover:border-gold/30 hover:text-gold transition-all duration-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-secondary">{decision.length} characters</p>
                  <Button type="submit" loading={loading} disabled={!decision.trim()} className="gap-2">
                    Analyze Decision
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Recent Decisions</h2>
              <Link href="/dashboard/history" className="text-xs text-text-secondary hover:text-gold transition-colors">
                View all
              </Link>
            </div>
            <Card className="p-12 text-center border-dashed border-[#1a1a1a]">
              <FileText className="w-8 h-8 text-[#333333] mx-auto mb-4" />
              <p className="text-sm font-medium text-white mb-1">No decisions yet</p>
              <p className="text-xs text-text-secondary">Your intelligence history will appear here once you submit your first decision.</p>
            </Card>
          </motion.div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Alert Feed</h2>
              <Link href="/dashboard/alerts" className="text-xs text-text-secondary hover:text-gold transition-colors">
                Manage
              </Link>
            </div>
            <Card className="p-10 text-center border-dashed border-[#1a1a1a]">
              <Bell className="w-7 h-7 text-[#333333] mx-auto mb-3" />
              <p className="text-sm font-medium text-white mb-1">No active alerts</p>
              <p className="text-xs text-text-secondary leading-relaxed">Set up intelligence alerts to monitor signals relevant to your decisions.</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Active Rooms</h2>
              <Link href="/dashboard/rooms" className="text-xs text-text-secondary hover:text-gold transition-colors">
                View all
              </Link>
            </div>
            <Card className="p-10 text-center border-dashed border-[#1a1a1a]">
              <Users className="w-7 h-7 text-[#333333] mx-auto mb-3" />
              <p className="text-sm font-medium text-white mb-1">No active rooms</p>
              <p className="text-xs text-text-secondary leading-relaxed">Your confidential collaboration spaces will appear here once rooms are created.</p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
