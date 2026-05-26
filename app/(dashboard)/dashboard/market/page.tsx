"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { mockMarketData, mockChartData } from "@/data/mock";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

const regions = ["Global", "North America", "Europe", "Middle East", "Asia", "Africa"];

const metrics = [
  { key: "gdpGrowth", label: "GDP Growth" },
  { key: "inflation", label: "Inflation Rate" },
  { key: "vcInvestment", label: "VC Investment" },
  { key: "maActivity", label: "M&A Activity" },
  { key: "consumerConfidence", label: "Consumer Confidence" },
  { key: "techGrowth", label: "Tech Sector Growth" },
];

export default function MarketPage() {
  const [region, setRegion] = useState("Global");
  const data = mockMarketData.global;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white">Global Market Intelligence</h1>
        <p className="text-text-secondary mt-1">Real-time signals from global markets, updated continuously.</p>
      </motion.div>

      <div className="mt-6 flex gap-1 flex-wrap">
        {regions.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-all duration-200",
              region === r
                ? "bg-gold/10 text-gold border border-gold/30"
                : "text-text-secondary border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]"
            )}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const val = (data as Record<string, { value: string; change: string; trend: string }>)[m.key];
          const isUp = val?.trend === "up";
          const isDown = val?.trend === "down";
          const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
          const trendColor = isUp ? "#22C55E" : isDown ? "#EF4444" : "#888888";
          return (
            <Card key={m.key} className="p-5">
              <p className="text-xs text-text-secondary">{m.label}</p>
              <p className="font-mono text-2xl font-bold text-white mt-2">{val?.value}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <TrendIcon className="w-3.5 h-3.5" style={{ color: trendColor }} />
                <span className="text-xs font-medium" style={{ color: trendColor }}>{val?.change}</span>
              </div>
            </Card>
          );
        })}
      </motion.div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="xl:col-span-2">
          <Card className="p-6">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-6">Industry Growth Index (6 months)</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={mockChartData.industryGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: "6px", color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: "16px" }} />
                <Line type="monotone" dataKey="ai" name="AI Infrastructure" stroke="#C9A84C" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="fintech" name="Fintech" stroke="#888888" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="climate" name="Climate Tech" stroke="#22C55E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="p-6">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Trending Industries</p>
            <div className="space-y-4">
              {mockMarketData.trendingIndustries.slice(0, 6).map((ind) => (
                <div key={ind.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white font-medium">{ind.name}</span>
                    <span className="font-mono text-xs text-gold">{ind.growth}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full">
                    <div className="h-full bg-gold rounded-full transition-all duration-1000" style={{ width: `${ind.growth}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="mt-6">
        <Card className="p-6">
          <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Market Intelligence Feed</p>
          <div className="space-y-0 divide-y divide-[#1a1a1a]">
            {mockMarketData.newsItems.map((item) => (
              <div key={item.id} className="py-4 flex items-start gap-4 hover:bg-[#161616] -mx-6 px-6 transition-colors cursor-pointer">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium leading-snug">{item.headline}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-text-secondary">{item.source}</span>
                    <span className="text-xs text-text-muted">{item.date}</span>
                    <Badge variant={item.relevance === "High" ? "gold" : item.relevance === "Medium" ? "warning" : "neutral"}>
                      {item.tag}
                    </Badge>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
