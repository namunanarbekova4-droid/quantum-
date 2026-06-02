"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Calculator, FileText, Users, TrendingUp, Building2, Search, Eye, ClipboardList, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Plan, planRank, EARLY_ACCESS } from "@/lib/plans";

type UserRole = "FOUNDER" | "INVESTOR" | "EXECUTIVE";

interface Tool {
  id: string;
  title: string;
  description: string;
  features: string[];
  requiredPlan: Plan;
  href: string;
  icon: React.ElementType;
}

const FOUNDER_TOOLS: Tool[] = [
  {
    id: "runway-calculator",
    title: "Runway Calculator",
    description: "Model 3 financial scenarios with AI cash preservation advice.",
    features: ["Cash runway projection", "3 scenario models", "AI cost-reduction advice", "Fundraise timing"],
    requiredPlan: "FREE_TRIAL",
    href: "/dashboard/founder/runway-calculator",
    icon: Calculator,
  },
  {
    id: "pitch-analyzer",
    title: "Pitch Analyzer",
    description: "Get slide-by-slide AI feedback on your investor deck.",
    features: ["Slide-by-slide scoring", "Investor red flags", "Rewrite suggestions", "Overall pitch score"],
    requiredPlan: "PRO",
    href: "/dashboard/founder/pitch-analyzer",
    icon: FileText,
  },
  {
    id: "investor-match",
    title: "Investor Match",
    description: "Find the 20 best-fit investors for your raise.",
    features: ["Match score %", "Why they fit", "Check size filter", "Outreach strategy"],
    requiredPlan: "PRO",
    href: "/dashboard/founder/investor-match",
    icon: Users,
  },
];

const INVESTOR_TOOLS: Tool[] = [
  {
    id: "deal-analyzer",
    title: "Deal Analyzer",
    description: "Deep AI analysis of pitch decks with invest/pass recommendation.",
    features: ["Team & market scoring", "Risk factor analysis", "INVEST/PASS/DUE DILIGENCE", "Confidence level"],
    requiredPlan: "PRO",
    href: "/dashboard/investor/deal-analyzer",
    icon: TrendingUp,
  },
  {
    id: "portfolio-health",
    title: "Portfolio Health",
    description: "Monitor your portfolio companies with AI risk assessment.",
    features: ["Risk status (GREEN/YELLOW/RED)", "AI signal detection", "Threat scoring", "Weekly monitoring"],
    requiredPlan: "MAX",
    href: "/dashboard/investor/portfolio-health",
    icon: Building2,
  },
  {
    id: "investor-match",
    title: "Investor Match",
    description: "Find founders that match your investment thesis.",
    features: ["Match score %", "Thesis alignment", "Stage & industry filter", "Outreach tips"],
    requiredPlan: "MAX",
    href: "/dashboard/investor/investor-match",
    icon: Search,
  },
];

const EXECUTIVE_TOOLS: Tool[] = [
  {
    id: "competitor-intelligence",
    title: "Competitor Intelligence",
    description: "Track up to 10 competitors with AI-powered risk monitoring.",
    features: ["Risk levels (LOW→CRITICAL)", "Strategic implications", "Product & hiring signals", "Response recommendations"],
    requiredPlan: "MAX",
    href: "/dashboard/executive/competitor-intelligence",
    icon: Eye,
  },
  {
    id: "board-report",
    title: "Board Report Generator",
    description: "Generate professional board-ready reports from your KPIs.",
    features: ["Executive summary", "Financial highlights", "Risk & mitigation", "Download as text"],
    requiredPlan: "MAX",
    href: "/dashboard/executive/board-report",
    icon: ClipboardList,
  },
  {
    id: "market-entry",
    title: "Market Entry Analyzer",
    description: "Analyze expansion into new markets with full strategic assessment.",
    features: ["Market size & growth", "Regulatory overview", "Entry strategy options", "Budget & timeline"],
    requiredPlan: "PRO",
    href: "/dashboard/executive/market-entry",
    icon: Globe,
  },
];

function getTools(role: UserRole): Tool[] {
  if (role === "INVESTOR") return INVESTOR_TOOLS;
  if (role === "EXECUTIVE") return EXECUTIVE_TOOLS;
  return FOUNDER_TOOLS;
}

const planLabel: Record<Plan, string> = {
  FREE_TRIAL: "Free",
  PRO: "Pro",
  MAX: "Max",
  PREMIUM: "Premium",
};

interface ToolCardProps {
  tool: Tool;
  userPlan: Plan;
  index: number;
}

function ToolCard({ tool, userPlan, index }: ToolCardProps) {
  const Icon = tool.icon;
  const hasAccess = EARLY_ACCESS || planRank(userPlan) >= planRank(tool.requiredPlan);
  const isLocked = !hasAccess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35 }}
      className={cn(
        "relative rounded-lg border transition-all duration-200 overflow-hidden",
        isLocked
          ? "border-[#1a1a1a] bg-[#111111] opacity-60"
          : "border-[#C9A84C]/30 bg-[#111111] hover:border-[#C9A84C]/60 hover:shadow-[0_0_20px_rgba(201,168,76,0.08)]"
      )}
    >
      {isLocked && (
        <div className="absolute inset-0 bg-[#080808]/60 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-lg">
          <div className="text-center px-4 py-3 space-y-2">
            <Lock className="w-5 h-5 text-[#C9A84C] mx-auto" />
            <p className="text-xs text-white font-medium">Available on {planLabel[tool.requiredPlan]}+</p>
            <span className="text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1 rounded-full">
              Upgrade Free During Early Access
            </span>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded border flex-shrink-0",
            tool.requiredPlan === "FREE_TRIAL" ? "text-[#888888] border-[#2a2a2a] bg-[#1a1a1a]" :
            tool.requiredPlan === "PRO" ? "text-blue-400 border-blue-400/20 bg-blue-400/5" :
            "text-[#C9A84C] border-[#C9A84C]/20 bg-[#C9A84C]/5"
          )}>
            {planLabel[tool.requiredPlan]}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-white">{tool.title}</h3>
          <p className="text-xs text-[#888888] leading-relaxed">{tool.description}</p>
        </div>

        <ul className="space-y-1.5">
          {tool.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-[#888888]">
              <span className="w-1 h-1 rounded-full bg-[#C9A84C]/60 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {!isLocked && (
          <Link
            href={tool.href}
            className="flex items-center justify-between w-full px-3 py-2 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 rounded-lg text-xs font-semibold text-[#C9A84C] transition-all group"
          >
            Open Tool
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

interface Props {
  role: UserRole;
  plan: Plan;
}

export function StrategicToolsHub({ role, plan }: Props) {
  const tools = getTools(role);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white">Your Strategic Tools</h2>
        <p className="text-xs text-[#888888] mt-0.5">AI systems designed for your role.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} userPlan={plan} index={i} />
        ))}
      </div>
    </div>
  );
}
