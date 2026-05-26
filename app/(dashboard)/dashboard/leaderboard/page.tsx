"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { mockLeaderboard } from "@/data/mock";
import { cn } from "@/lib/utils";

const filters = ["Global", "By Industry", "By Country"];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState("Global");
  const top10 = mockLeaderboard.slice(0, 10);
  const me = mockLeaderboard[mockLeaderboard.length - 1];

  const rankStyle = (rank: number) => {
    if (rank === 1) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/5";
    if (rank === 2) return "text-gray-300 border-gray-300/30 bg-gray-300/5";
    if (rank === 3) return "text-amber-600 border-amber-600/30 bg-amber-600/5";
    return "text-text-secondary border-[#1a1a1a] bg-transparent";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Global Decision Makers</h1>
        <p className="text-text-secondary mt-1">Ranked by decision volume, accuracy, and consistency. All profiles anonymous by default.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mt-6">
        <Card className="p-5 border-gold/30 bg-gold/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/20 border border-gold/40 rounded-lg flex items-center justify-center">
              <span className="font-mono text-xl font-bold text-gold">#{me.rank}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Your Current Standing</p>
              <p className="text-xs text-text-secondary mt-0.5">Top {Math.round((me.rank / 24000) * 100)}% globally · {me.decisions} decisions · {me.accuracy}% accuracy</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-secondary">This week</p>
              <p className="text-sm font-medium text-success">+{me.change} ranks</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-6">
        <div className="flex gap-1 mb-6">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("px-4 py-2 text-sm font-medium rounded transition-all duration-200 border",
                filter === f ? "bg-gold/10 text-gold border-gold/30" : "text-text-secondary border-[#1a1a1a] hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["Rank", "Decision Maker", "Decisions", "Accuracy", "Streak", "Movement"].map((h) => (
                  <th key={h} className="text-left text-xs text-text-secondary font-medium px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {top10.map((entry) => (
                <tr key={entry.rank} className={cn("transition-colors", entry.handle === "You" ? "bg-gold/5" : "hover:bg-[#161616]")}>
                  <td className="px-5 py-4">
                    <div className={cn("w-8 h-8 flex items-center justify-center rounded border font-mono font-bold text-sm", rankStyle(entry.rank))}>
                      {entry.rank <= 3 ? <Trophy className="w-4 h-4" /> : entry.rank}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className={cn("text-sm font-medium", entry.handle === "You" ? "text-gold" : "text-white")}>{entry.handle}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-white">{entry.decisions}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-success">{entry.accuracy}%</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-text-secondary">{entry.streak}d</span>
                  </td>
                  <td className="px-5 py-4">
                    {entry.change > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-success"><TrendingUp className="w-3 h-3" />+{entry.change}</span>
                    ) : entry.change < 0 ? (
                      <span className="flex items-center gap-1 text-xs text-danger"><TrendingDown className="w-3 h-3" />{entry.change}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-text-secondary"><Minus className="w-3 h-3" />—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-text-secondary text-center mt-4">All profiles are anonymous by default. Enable your public profile in Settings.</p>
      </motion.div>
    </div>
  );
}
