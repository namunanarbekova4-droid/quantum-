"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface DecisionReport {
  summary?: string;
  pros?: string[];
  cons?: string[];
  keyAssumptions?: string[];
  confidenceLevel?: number;
  actionSteps?: string[];
}
import { ArrowLeft, Share2, BookmarkPlus, CheckCircle, XCircle, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { mockDecisions } from "@/data/mock";
import { formatDateTime, truncate } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const marketChartData = [
  { month: "Nov 24", value: 62 }, { month: "Dec 24", value: 68 }, { month: "Jan 25", value: 74 },
  { month: "Feb 25", value: 79 }, { month: "Mar 25", value: 85 }, { month: "Apr 25", value: 88 },
  { month: "May 25", value: 94 },
];

const competitorData = [
  { name: "Palantir Technologies", share: "18%", growth: "+12%", stage: "Public" },
  { name: "Tableau / Salesforce", share: "14%", growth: "+8%", stage: "Public" },
  { name: "Domo", share: "6%", growth: "+5%", stage: "Public" },
  { name: "Regional Incumbents", share: "31%", growth: "+3%", stage: "Private" },
  { name: "Emerging Players", share: "31%", growth: "+22%", stage: "Various" },
];

const tabs = ["Report", "Decision Map", "AI Conversation", "Market Data"];

const initialMessages = [
  { id: 1, role: "ai", content: "I've analyzed your decision. Before I finalize the intelligence package, I have a few questions that will sharpen the analysis. First: what is your current runway in months, and have you already had preliminary conversations with investors?" },
  { id: 2, role: "ai", content: "Second: regarding the Middle East expansion specifically — do you have existing relationships or warm introductions in the region, or would this be a cold market entry?" },
  { id: 3, role: "ai", content: "Third: what is the primary motivation for the timing — is there a specific competitive threat, a partnership opportunity, or is this driven by investor expectation ahead of the raise?" },
];

export default function DecisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Report");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const decision = mockDecisions.find((d) => d.id === id) ?? mockDecisions[0];

  const sendMessage = () => {
    if (!message.trim()) return;
    const userMsg = { id: messages.length + 1, role: "user" as const, content: message };
    const aiResponse = {
      id: messages.length + 2,
      role: "ai" as const,
      content: "Thank you for that context. Based on your 14-month runway and the lack of existing regional relationships, I would significantly weight the analysis toward a phased approach: establish a partnership first before committing to a full market entry. This reduces capital outlay and validates demand before the Series A process begins.",
    };
    setMessages((prev) => [...prev, userMsg, aiResponse]);
    setMessage("");
  };

  const recommendationConfig = {
    YES: { label: "Recommended", variant: "success" as const, icon: CheckCircle, color: "#22C55E" },
    NO: { label: "Not Recommended", variant: "danger" as const, icon: XCircle, color: "#EF4444" },
    CONDITIONAL: { label: "Conditional", variant: "warning" as const, icon: AlertTriangle, color: "#F59E0B" },
  };

  const rec = recommendationConfig[decision.recommendation as keyof typeof recommendationConfig] ?? recommendationConfig.CONDITIONAL;
  const RecIcon = rec.icon;

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="border-b border-[#1a1a1a] px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" /> Share
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <BookmarkPlus className="w-4 h-4" /> Save
        </Button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-4 mb-2">
            <Badge variant="neutral">{decision.type.replace(/_/g, " ")}</Badge>
            <span className="text-xs text-text-secondary pt-0.5">{formatDateTime(decision.date)}</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">{decision.title}</h1>
        </motion.div>

        <div className="mt-6 flex gap-1 border-b border-[#1a1a1a]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-gold border-gold"
                  : "text-text-secondary border-transparent hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === "Report" && decision.report && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 col-span-1">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Risk Assessment</p>
                  <div className="flex flex-col items-center">
                    <RiskGauge score={decision.riskScore} size="lg" />
                    <p className="text-xs text-text-secondary text-center mt-3">Based on {(decision.report as DecisionReport).keyAssumptions?.length ?? 3} key assumptions</p>
                  </div>
                </Card>
                <Card className="p-6 col-span-2">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-3">Recommendation</p>
                  <div className="flex items-center gap-3 mb-4">
                    <RecIcon className="w-6 h-6" style={{ color: rec.color }} />
                    <span className="text-2xl font-bold" style={{ color: rec.color }}>{rec.label}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{(decision.report as DecisionReport).summary}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Confidence Level:</span>
                    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${(decision.report as DecisionReport).confidenceLevel ?? 75}%` }} />
                    </div>
                    <span className="font-mono text-xs text-gold">{(decision.report as DecisionReport).confidenceLevel ?? 75}%</span>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Pros</p>
                  <ul className="space-y-3">
                    {((decision.report as DecisionReport).pros ?? []).map((pro: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-6">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Cons</p>
                  <ul className="space-y-3">
                    {((decision.report as DecisionReport).cons ?? []).map((con: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white">
                        <XCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{con}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card className="p-6">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Action Steps</p>
                <ol className="space-y-3">
                  {((decision.report as DecisionReport).actionSteps ?? []).map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-white">
                      <span className="font-mono text-gold font-bold flex-shrink-0 w-5">{i + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-6">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Key Assumptions</p>
                <ul className="space-y-2">
                  {((decision.report as DecisionReport).keyAssumptions ?? []).map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                      <span className="text-gold flex-shrink-0">—</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          )}

          {activeTab === "Decision Map" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="p-8">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-6">Decision Tree</p>
                <div className="relative">
                  <div className="flex flex-col items-center">
                    <div className="px-6 py-3 bg-gold/10 border border-gold/30 rounded-lg text-sm font-semibold text-gold text-center max-w-xs">
                      {truncate(decision.title, 60)}
                    </div>
                    <div className="w-px h-8 bg-[#1a1a1a]" />
                    <div className="flex gap-16">
                      {[
                        { label: "Proceed", probability: "62%", color: "#22C55E", outcomes: ["Market validation", "Revenue growth", "Competitive edge"] },
                        { label: "Wait 6 months", probability: "28%", color: "#F59E0B", outcomes: ["Better timing", "More capital", "Lower risk"] },
                        { label: "Decline", probability: "10%", color: "#EF4444", outcomes: ["Preserve runway", "Focus internally", "Revisit later"] },
                      ].map((path, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-px h-8 bg-[#1a1a1a]" />
                          <div className="px-4 py-2.5 border rounded-lg text-sm font-medium text-center" style={{ borderColor: path.color + "40", color: path.color, background: path.color + "10" }}>
                            {path.label}
                            <div className="font-mono text-xs mt-1 opacity-70">{path.probability}</div>
                          </div>
                          <div className="w-px h-6 bg-[#1a1a1a]" />
                          <div className="space-y-1">
                            {path.outcomes.map((o, j) => (
                              <div key={j} className="px-3 py-1.5 bg-[#161616] border border-[#1a1a1a] rounded text-xs text-text-secondary text-center max-w-[140px]">{o}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "AI Conversation" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="flex flex-col h-[600px]">
                <div className="p-4 border-b border-[#1a1a1a]">
                  <p className="text-sm font-medium text-white">AI Analysis Conversation</p>
                  <p className="text-xs text-text-secondary mt-0.5">Quantum has analyzed your decision and has follow-up questions</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "ai" && (
                        <div className="w-6 h-6 bg-gold rounded flex items-center justify-center text-[#080808] text-xs font-bold flex-shrink-0 mr-3 mt-0.5">Q</div>
                      )}
                      <div className={`max-w-[75%] px-4 py-3 rounded-lg text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gold/10 border border-gold/30 text-white"
                          : "bg-[#161616] border border-[#1a1a1a] text-text-secondary"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-[#1a1a1a] flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Answer Quantum's questions or ask your own..."
                    className="flex-1 h-10 px-3 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 placeholder:text-[#444444] transition-all duration-200"
                  />
                  <Button size="sm" onClick={sendMessage} disabled={!message.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "Market Data" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Addressable Market", value: "$4.2B", change: "+18.4% YoY" },
                  { label: "Market CAGR (5yr)", value: "22.7%", change: "+2.1% vs prior" },
                  { label: "Identified Competitors", value: "47", change: "12 direct" },
                ].map((m) => (
                  <Card key={m.label} className="p-5">
                    <p className="text-xs text-text-secondary">{m.label}</p>
                    <p className="font-mono text-2xl font-bold text-white mt-2">{m.value}</p>
                    <p className="text-xs text-success mt-1">{m.change}</p>
                  </Card>
                ))}
              </div>

              <Card className="p-6">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-6">Industry Growth Index (6 months)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={marketChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="month" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: "6px", color: "#fff" }} />
                    <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <p className="text-xs text-text-secondary uppercase tracking-wider mb-4">Competitive Landscape</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      {["Company", "Market Share", "Growth", "Stage"].map((h) => (
                        <th key={h} className="text-left text-xs text-text-secondary font-medium pb-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {competitorData.map((c) => (
                      <tr key={c.name} className="hover:bg-[#161616] transition-colors">
                        <td className="py-3 text-white font-medium">{c.name}</td>
                        <td className="py-3 font-mono text-text-secondary">{c.share}</td>
                        <td className="py-3 text-success font-mono">{c.growth}</td>
                        <td className="py-3"><Badge variant="neutral">{c.stage}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <div className="text-xs text-text-secondary pt-2">
                Data sources: Bloomberg, PitchBook, CB Insights, World Bank, Reuters. Last updated: {new Date().toLocaleDateString()}.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
