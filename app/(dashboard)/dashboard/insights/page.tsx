"use client";
import { motion } from "framer-motion";
import { Clock, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockInsightReports } from "@/data/mock";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const userPlan = "pro";

export default function InsightsPage() {
  const featured = mockInsightReports[0];
  const rest = mockInsightReports.slice(1);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Weekly Intelligence Reports</h1>
        <p className="text-text-secondary mt-1">Deep analysis written by Quantum&apos;s AI research engine. Published every Monday.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-6">
        <Card className="p-8 border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <Badge variant="gold" className="mb-4">Latest Report</Badge>
          <h2 className="text-xl font-bold text-white mb-3">{featured.title}</h2>
          <p className="text-text-secondary leading-relaxed mb-4">{featured.summary}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Clock className="w-3.5 h-3.5" /> {featured.readTime} read
            </div>
            <span className="text-xs text-text-secondary">{formatDate(featured.date)}</span>
            {featured.topics.map((t) => (
              <Badge key={t} variant="neutral">{t}</Badge>
            ))}
          </div>
          <Button className="mt-6">Read Full Report</Button>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {rest.map((report) => {
          const locked = report.isPremium && userPlan === "pro";
          return (
            <Card key={report.id} className={`p-6 relative overflow-hidden ${locked ? "cursor-not-allowed" : "hover:border-gold/20 hover:shadow-gold cursor-pointer"} transition-all duration-200`}>
              {locked && (
                <div className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                  <Lock className="w-6 h-6 text-gold mb-2" />
                  <p className="text-sm font-semibold text-white mb-1">Max Plan Required</p>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="mt-2">Upgrade</Button>
                  </Link>
                </div>
              )}
              <Badge variant="neutral" className="mb-3">{report.topics[0]}</Badge>
              <h3 className="text-sm font-semibold text-white leading-snug mb-3">{report.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{report.summary}</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-text-secondary">{formatDate(report.date)}</span>
                <span className="text-xs text-text-secondary flex items-center gap-1"><Clock className="w-3 h-3" /> {report.readTime}</span>
              </div>
            </Card>
          );
        })}
      </motion.div>
    </div>
  );
}
