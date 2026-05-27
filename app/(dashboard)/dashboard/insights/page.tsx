"use client";
import { motion } from "framer-motion";
import { BarChart2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default function InsightsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Weekly Intelligence Reports</h1>
        <p className="text-text-secondary mt-1">Deep analysis published by Quantum&apos;s AI research engine.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-12">
        <Card className="p-16 text-center">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart2 className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Intelligence reports are on the way</h2>
          <p className="text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
            Each week, Quantum&apos;s AI research engine will publish deep analysis covering market shifts, decision patterns, and macro signals relevant to founders, investors, and executives.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#555555]">
            <Clock className="w-3.5 h-3.5" />
            <span>Launching soon — you&apos;ll be notified as a founding member</span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
