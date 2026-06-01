"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { type Plan, planRank } from "@/lib/plans";

export function PlanGate({
  requiredPlan,
  currentPlan,
  featureName,
  children,
}: {
  requiredPlan: Plan;
  currentPlan: Plan;
  featureName: string;
  children: React.ReactNode;
}) {
  const hasAccess = planRank(currentPlan) >= planRank(requiredPlan);
  if (hasAccess) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808]/80 rounded-lg">
        <Lock className="w-5 h-5 text-[#C9A84C] mb-2" />
        <p className="text-sm font-semibold text-white mb-1">{featureName}</p>
        <p className="text-xs text-[#888] mb-3">{requiredPlan} plan required</p>
        <Link
          href="/pricing"
          className="px-4 py-2 bg-[#C9A84C] text-[#080808] rounded text-xs font-semibold hover:bg-[#d4b660] transition-colors"
        >
          Upgrade Free During Early Access
        </Link>
      </div>
    </div>
  );
}
