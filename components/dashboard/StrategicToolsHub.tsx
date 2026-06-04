"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Calculator, FileText, Users, TrendingUp, Building2, Search, Eye, ClipboardList, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Plan, planRank, EARLY_ACCESS } from "@/lib/plans";
import { useLanguage } from "@/lib/i18n";

type UserRole = "FOUNDER" | "INVESTOR" | "EXECUTIVE";

interface Tool {
  id: string;
  titleKey: string;
  descKey: string;
  featuresKey: string;
  requiredPlan: Plan;
  href: string;
  icon: React.ElementType;
}

const FOUNDER_TOOLS: Tool[] = [
  { id: "runway-calculator", titleKey: "runwayCalculator", descKey: "runwayCalculator", featuresKey: "runwayCalculator", requiredPlan: "FREE_TRIAL", href: "/dashboard/founder/runway-calculator", icon: Calculator },
  { id: "pitch-analyzer", titleKey: "pitchAnalyzer", descKey: "pitchAnalyzer", featuresKey: "pitchAnalyzer", requiredPlan: "PRO", href: "/dashboard/founder/pitch-analyzer", icon: FileText },
  { id: "investor-match", titleKey: "investorMatch", descKey: "investorMatch", featuresKey: "investorMatch", requiredPlan: "PRO", href: "/dashboard/founder/investor-match", icon: Users },
];

const INVESTOR_TOOLS: Tool[] = [
  { id: "deal-analyzer", titleKey: "dealAnalyzer", descKey: "dealAnalyzer", featuresKey: "dealAnalyzer", requiredPlan: "PRO", href: "/dashboard/investor/deal-analyzer", icon: TrendingUp },
  { id: "portfolio-health", titleKey: "portfolioHealth", descKey: "portfolioHealth", featuresKey: "portfolioHealth", requiredPlan: "MAX", href: "/dashboard/investor/portfolio-health", icon: Building2 },
  { id: "investor-match", titleKey: "investorMatch", descKey: "investorMatch", featuresKey: "investorMatch", requiredPlan: "MAX", href: "/dashboard/investor/investor-match", icon: Search },
];

const EXECUTIVE_TOOLS: Tool[] = [
  { id: "competitor-intelligence", titleKey: "competitorIntelligence", descKey: "competitorIntelligence", featuresKey: "competitorIntelligence", requiredPlan: "MAX", href: "/dashboard/executive/competitor-intelligence", icon: Eye },
  { id: "board-report", titleKey: "boardReport", descKey: "boardReport", featuresKey: "boardReport", requiredPlan: "MAX", href: "/dashboard/executive/board-report", icon: ClipboardList },
  { id: "market-entry", titleKey: "marketEntry", descKey: "marketEntry", featuresKey: "marketEntry", requiredPlan: "PRO", href: "/dashboard/executive/market-entry", icon: Globe },
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
  role: UserRole;
}

function ToolCard({ tool, userPlan, index, role }: ToolCardProps) {
  const { t } = useLanguage();
  const Icon = tool.icon;
  const hasAccess = EARLY_ACCESS || planRank(userPlan) >= planRank(tool.requiredPlan);
  const isLocked = !hasAccess;

  const roleKey = role === "INVESTOR" ? "investor" : role === "EXECUTIVE" ? "executive" : "founder";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolT = (t.tools as any)[roleKey][tool.titleKey] as { title: string; description: string; features: string[] };

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
            <p className="text-xs text-white font-medium">{t.tools.availableOn} {planLabel[tool.requiredPlan]}+</p>
            <span className="text-xs text-[#C9A84C] border border-[#C9A84C]/30 px-3 py-1 rounded-full">
              {t.tools.upgradeEarlyAccess}
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
          <h3 className="text-sm font-bold text-white">{toolT.title}</h3>
          <p className="text-xs text-[#888888] leading-relaxed">{toolT.description}</p>
        </div>

        <ul className="space-y-1.5">
          {toolT.features.map((f) => (
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
            {t.tools.openTool}
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
  const { t } = useLanguage();
  const tools = getTools(role);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white">{t.tools.title}</h2>
        <p className="text-xs text-[#888888] mt-0.5">{t.tools.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} userPlan={plan} index={i} role={role} />
        ))}
      </div>
    </div>
  );
}
