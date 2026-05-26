"use client";
import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function LeaderboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Global Decision Makers</h1>
        <p className="text-text-secondary mt-1">Ranked by decision volume, accuracy, and consistency. All profiles anonymous by default.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
        <Card className="p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Your network is still forming</h2>
          <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
            Be among the first decision makers using Quantum.
            Rankings will appear as the community grows.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#333333]">
            <Users className="w-3.5 h-3.5" />
            <span>Leaderboard activates once decisions are analyzed</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
