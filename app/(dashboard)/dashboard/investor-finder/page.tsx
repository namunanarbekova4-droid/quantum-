"use client";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";

export default function InvestorFinderPage() {
  return (
    <div className="min-h-screen bg-[#06040F] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-[#C9A84C]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Investor Finder</h1>
        <p className="text-[#8B7CF8] mb-8 leading-relaxed">
          Find investors who fund startups like yours. Track outreach, manage warm intros, and never lose a lead.
        </p>
        <div>
          <Link href="/dashboard" className="text-sm text-[#8B7CF8] hover:text-[#C9A84C] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
