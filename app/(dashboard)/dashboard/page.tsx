"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Users, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { mockDecisions, mockAlerts, mockRooms } from "@/data/mock";
import { formatDate, truncate } from "@/lib/utils";
import Link from "next/link";

const quickActions = ["Market Entry", "Hiring", "Fundraising", "Pivot", "Partnership"];

export default function DashboardPage() {
  const router = useRouter();
  const [decision, setDecision] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim()) return;
    setLoading(true);
    setTimeout(() => router.push("/dashboard/decision/dec_001"), 1500);
  };

  const recentDecisions = mockDecisions.slice(0, 3);
  const recentAlerts = mockAlerts.slice(0, 3);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Good morning, Alex.</h1>
        <p className="text-text-secondary mt-1">You have 3 new market alerts. Your last decision was 3 days ago.</p>
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
              <Link href="/dashboard/history" className="text-xs text-text-secondary hover:text-gold transition-colors flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentDecisions.map((d) => (
                <Link key={d.id} href={`/dashboard/decision/${d.id}`}>
                  <Card hover className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <RiskGauge score={d.riskScore} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-snug">{truncate(d.title, 80)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant={d.recommendation === "YES" ? "success" : d.recommendation === "NO" ? "danger" : "warning"}>
                            {d.recommendation}
                          </Badge>
                          <span className="text-xs text-text-secondary">{formatDate(d.date)}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-secondary flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
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
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <Card key={alert.id} className="p-4 border-l-2 border-l-gold/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{alert.topic}</p>
                      <p className="text-xs text-text-secondary mt-1">{alert.keywords.slice(0, 2).join(", ")}</p>
                    </div>
                    <Badge variant="gold">{alert.frequency.toLowerCase()}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-semibold text-white">Global Rank</h3>
              </div>
              <div className="text-center py-2">
                <p className="font-mono text-4xl font-bold text-gold">#247</p>
                <p className="text-xs text-text-secondary mt-1">out of 24,000+ decision makers</p>
              </div>
              <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-xs">
                <span className="text-text-secondary">Accuracy Score</span>
                <span className="font-mono text-success">75%</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-text-secondary">Decision Streak</span>
                <span className="font-mono text-white">3 days</span>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Active Rooms</h2>
              <Link href="/dashboard/rooms" className="text-xs text-text-secondary hover:text-gold transition-colors">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {mockRooms.slice(0, 2).map((room) => (
                <Link key={room.id} href={`/dashboard/rooms/${room.id}`}>
                  <Card hover className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold/10 border border-gold/20 rounded flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{room.name}</p>
                        <p className="text-xs text-text-secondary">{room.participants.length} participants</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
