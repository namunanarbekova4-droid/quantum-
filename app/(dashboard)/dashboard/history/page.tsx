"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { mockDecisions } from "@/data/mock";
import { formatDate, getRiskColor, truncate } from "@/lib/utils";
import Link from "next/link";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [recFilter, setRecFilter] = useState("ALL");

  const filtered = mockDecisions.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchRec = recFilter === "ALL" || d.recommendation === recFilter;
    return matchSearch && matchRec;
  });

  const recVariant = (rec: string) =>
    rec === "YES" ? "success" : rec === "NO" ? "danger" : "warning";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Decision History</h1>
        <p className="text-text-secondary mt-1">All your analyzed decisions in one place.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
              className="w-full h-10 pl-9 pr-4 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 placeholder:text-[#444444] transition-all duration-200"
            />
          </div>
          <select
            value={recFilter}
            onChange={(e) => setRecFilter(e.target.value)}
            className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-text-secondary text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
          >
            <option value="ALL">All Recommendations</option>
            <option value="YES">Recommended</option>
            <option value="NO">Not Recommended</option>
            <option value="CONDITIONAL">Conditional</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-16 text-center">
            <FileText className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">No decisions found</h3>
            <p className="text-sm text-text-secondary mb-6">Try adjusting your search or make your first decision.</p>
            <Link href="/dashboard">
              <Button>Make a Decision</Button>
            </Link>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    {["Decision", "Date", "Type", "Risk Score", "Recommendation", "Status", ""].map((h) => (
                      <th key={h} className="text-left text-xs text-text-secondary font-medium px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-[#161616] transition-colors cursor-pointer group">
                      <td className="px-5 py-4">
                        <p className="text-sm text-white font-medium group-hover:text-gold transition-colors">{truncate(d.title, 60)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">{formatDate(d.date)}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-text-secondary">{d.type.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-bold" style={{ color: getRiskColor(d.riskScore) }}>
                          {d.riskScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={recVariant(d.recommendation)}>{d.recommendation}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="neutral">{d.status}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/decision/${d.id}`}>
                          <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-gold transition-colors" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-[#1a1a1a] flex items-center justify-between">
              <p className="text-xs text-text-secondary">Showing {filtered.length} of {mockDecisions.length} decisions</p>
              <div className="flex gap-1">
                <button className="w-8 h-8 flex items-center justify-center text-text-secondary border border-[#1a1a1a] rounded text-sm hover:border-gold/30 hover:text-white transition-all duration-200 disabled:opacity-30" disabled>←</button>
                <button className="w-8 h-8 flex items-center justify-center bg-gold/10 text-gold border border-gold/20 rounded text-sm">1</button>
                <button className="w-8 h-8 flex items-center justify-center text-text-secondary border border-[#1a1a1a] rounded text-sm hover:border-gold/30 hover:text-white transition-all duration-200 disabled:opacity-30" disabled>→</button>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
