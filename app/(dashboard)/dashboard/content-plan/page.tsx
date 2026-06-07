"use client";
import { motion } from "framer-motion";
import { Calendar, Zap } from "lucide-react";
import Link from "next/link";

export default function ContentPlanPage() {
  return (
    <div className="min-h-screen bg-[#06040F] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-[#C9A84C]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Content Plan</h1>
        <p className="text-[#8B7CF8] mb-8 leading-relaxed">
          Get 30 days of founder content — posts, threads, and stories — written in your authentic voice and ready to publish.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg text-[#C9A84C] text-sm font-semibold mb-8">
          <Zap className="w-4 h-4" />
          Coming Soon
        </div>
        <div>
          <Link href="/dashboard" className="text-sm text-[#8B7CF8] hover:text-[#C9A84C] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
