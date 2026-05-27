"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, FileText, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate, getRiskColor, truncate } from "@/lib/utils";
import Link from "next/link";

interface Decision {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  riskScore: number;
  recommendation: string;
  status: string;
  report?: { outcome?: string };
}

function OutcomeTag({ outcome }: { outcome?: string }) {
  if (!outcome) return <span className="text-xs text-[#333333]">—</span>;
  if (outcome === "GOOD") return <span className="inline-flex items-center gap-1 text-xs text-success"><ThumbsUp className="w-3 h-3" /> Good</span>;
  if (outcome === "BAD") return <span className="inline-flex items-center gap-1 text-xs text-danger"><ThumbsDown className="w-3 h-3" /> Bad</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-[#555555]"><HelpCircle className="w-3 h-3" /> Unknown</span>;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [recFilter, setRecFilter] = useState("ALL");
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    fetch("/api/decisions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDecisions(data); })
      .catch(() => {});
  }, []);

  const filtered = decisions.filter((d) => {
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
        {decisions.length === 0 ? (
          <Card className="p-16 text-center">
            <FileText className="w-10 h-10 text-[#333333] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">No decisions analyzed yet</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-xs mx-auto leading-relaxed">
              Your intelligence history will appear here once you submit your first decision.
            </p>
            <Link href="/dashboard">
              <Button>Make a Decision</Button>
            </Link>
          </Card>
        ) : (
          <>
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
                <FileText className="w-10 h-10 text-[#333333] mx-auto mb-4" />
                <h3 className="text-base font-semibold text-white mb-2">No decisions found</h3>
                <p className="text-sm text-text-secondary mb-6">Try adjusting your search or filter.</p>
                <Button onClick={() => { setSearch(""); setRecFilter("ALL"); }} variant="outline">
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        {["Decision", "Date", "Type", "Risk", "Recommendation", "Outcome", ""].map((h) => (
                          <th key={h} className="text-left text-xs text-text-secondary font-medium px-5 py-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                      {filtered.map((d) => (
                        <tr key={d.id} className="hover:bg-[#161616] transition-colors cursor-pointer group">
                          <td className="px-5 py-4">
                            <p className="text-sm text-white font-medium group-hover:text-gold transition-colors">{truncate(d.title, 55)}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-text-secondary whitespace-nowrap">{formatDate(d.createdAt)}</td>
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
                            <OutcomeTag outcome={d.report?.outcome} />
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
                <div className="px-5 py-4 border-t border-[#1a1a1a]">
                  <p className="text-xs text-text-secondary">Showing {filtered.length} of {decisions.length} decisions</p>
                </div>
              </Card>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
