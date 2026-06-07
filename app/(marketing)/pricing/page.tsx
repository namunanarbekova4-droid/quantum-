"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight, HelpCircle, Zap } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { type Plan, PLAN_DISPLAY } from "@/lib/plans";

const featureMatrix = [
  { feature: "Decisions per month", trial: "5", pro: "50", max: "Unlimited", premium: "Unlimited" },
  { feature: "Active alerts", trial: "0", pro: "3", max: "Unlimited", premium: "Unlimited" },
  { feature: "Private rooms", trial: "0", pro: "1", max: "Unlimited", premium: "Unlimited" },
  { feature: "Mentor requests per month", trial: "0", pro: "1", max: "Unlimited", premium: "Unlimited" },
  { feature: "VIP community access", trial: false, pro: false, max: true, premium: true },
  { feature: "Anonymous voting", trial: false, pro: false, max: true, premium: true },
  { feature: "Leaderboard", trial: false, pro: true, max: true, premium: true },
  { feature: "Enemy Mode", trial: false, pro: true, max: true, premium: true },
  { feature: "Decision history", trial: "7 days", pro: "30 days", max: "Forever", premium: "Forever" },
  { feature: "API access", trial: false, pro: false, max: false, premium: true },
  { feature: "Dedicated account manager", trial: false, pro: false, max: false, premium: true },
];

const faqs = [
  {
    q: "Is Quantum really free right now?",
    a: "Yes. During Early Access, all plans are free. No credit card required. Select any plan and lock in your access.",
  },
  {
    q: "What counts as a decision?",
    a: "Each time you submit a new decision for analysis counts as one decision. Viewing or discussing an existing decision does not count.",
  },
  {
    q: "When will paid plans launch?",
    a: "Paid plans will launch after Early Access. Members who upgrade now will lock in their tier free until a future date we announce in advance.",
  },
  {
    q: "Is my decision data private?",
    a: "All decision data is encrypted at rest and in transit. We never share or sell your decision content.",
  },
];

const PLAN_CARDS: {
  id: Plan;
  futurePrice: string | null;
  description: string;
  features: string[];
  featured: boolean;
  cta: string;
}[] = [
  {
    id: "FREE_TRIAL",
    futurePrice: null,
    description: "Try Quantum with 5 decisions per month.",
    features: ["5 decisions / month", "7-day decision history", "Basic analysis"],
    featured: false,
    cta: "Start Free",
  },
  {
    id: "PRO",
    futurePrice: "$10/month",
    description: "For active founders and executives.",
    features: ["50 decisions / month", "3 active alerts", "1 private room", "1 mentor request / month", "30-day history", "Leaderboard", "Enemy Mode"],
    featured: false,
    cta: "Upgrade Free During Early Access",
  },
  {
    id: "MAX",
    futurePrice: "$100/year",
    description: "Unlimited AI tools for bold founders building what others said was impossible.",
    features: ["Unlimited decisions", "Unlimited alerts", "Unlimited private rooms", "Unlimited mentor requests", "VIP community", "Anonymous voting", "Full history", "Enemy Mode"],
    featured: true,
    cta: "Upgrade Free During Early Access",
  },
  {
    id: "PREMIUM",
    futurePrice: "Custom",
    description: "Enterprise-grade capabilities for organizations.",
    features: ["Everything in Max", "API access", "Dedicated account manager", "Custom AI training", "SSO / SAML", "SLA guarantee"],
    featured: false,
    cta: "Upgrade Free During Early Access",
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-[#C9A84C] mx-auto" />;
  if (value === false) return <span className="text-[#2a2a2a] text-lg leading-none mx-auto block text-center">—</span>;
  return <span className="text-xs text-[#888888] text-center block">{value}</span>;
}

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [upgrading, setUpgrading] = useState<Plan | null>(null);

  const handleSelectPlan = async (planId: Plan) => {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/user/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else if (res.status === 401) {
        router.push("/auth/signup");
      }
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      <nav className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <QuantumLogo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#C9A84C] text-[#080808] rounded hover:bg-[#d4b660] transition-all duration-200">
              Join Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl md:text-[48px] font-bold text-white tracking-tight mb-3">Plans &amp; Pricing</h1>
          <p className="text-lg text-[#888888] max-w-xl mx-auto">Choose the plan that fits your ambition.</p>
        </motion.div>

        {/* Early Access Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-12">
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-xl p-4 text-center">
            <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 px-3 py-1 rounded-full mb-2">
              <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-wider">Early Access</span>
            </div>
            <p className="text-white font-semibold">All plans are FREE during launch.</p>
            <p className="text-[#888] text-sm mt-1">Upgrade now and lock in your free access forever.</p>
          </div>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {PLAN_CARDS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`relative bg-[#111111] rounded-lg p-6 flex flex-col ${
                plan.featured ? "border-2 border-[#C9A84C] shadow-[0_0_30px_rgba(201,168,76,0.12)]" : "border border-[#1a1a1a]"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full bg-[#C9A84C] text-[#080808] whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-base font-bold ${PLAN_DISPLAY[plan.id].color}`}>{PLAN_DISPLAY[plan.id].label}</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] rounded-full">FREE</span>
              </div>
              <p className="text-xs text-[#888888] mb-4">{plan.description}</p>

              <div className="mb-1">
                {plan.futurePrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-[#555] line-through font-mono">{plan.futurePrice}</span>
                    <span className="text-lg font-bold text-white">FREE</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-white">FREE</span>
                )}
              </div>
              <p className="text-xs text-[#555] mb-5">During Early Access</p>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[#888888]">
                    <Check className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={upgrading === plan.id}
                className={`w-full py-2.5 text-sm font-semibold rounded transition-all duration-200 disabled:opacity-70 ${
                  plan.featured
                    ? "bg-[#C9A84C] text-[#080808] hover:bg-[#d4b660]"
                    : "bg-transparent text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/8"
                }`}
              >
                {upgrading === plan.id ? "Loading..." : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Full feature comparison</h2>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="text-left text-xs text-[#888888] font-medium px-6 py-4 w-1/3">Feature</th>
                    {(["FREE_TRIAL", "PRO", "MAX", "PREMIUM"] as Plan[]).map((h) => (
                      <th key={h} className={`text-center text-xs font-medium px-4 py-4 ${PLAN_DISPLAY[h].color}`}>
                        {PLAN_DISPLAY[h].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1a1a]">
                  {featureMatrix.map((row) => (
                    <tr key={row.feature} className="hover:bg-[#161616] transition-colors">
                      <td className="px-6 py-3.5 text-sm text-[#888888]">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={row.trial} /></td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={row.pro} /></td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={row.max} /></td>
                      <td className="px-4 py-3.5 text-center"><CellValue value={row.premium} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#161616] transition-colors"
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <HelpCircle className={`w-4 h-4 flex-shrink-0 ml-3 transition-colors ${openFaq === i ? "text-[#C9A84C]" : "text-[#888888]"}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-[#888888] leading-relaxed border-t border-[#1a1a1a] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Need more for your team?</h2>
          <p className="text-[#888888] mb-6">Talk to our team about building Quantum for your founding team.</p>
          <Link href="/premium" className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-[#C9A84C] border border-[#C9A84C] rounded hover:bg-[#C9A84C]/8 transition-all duration-200">
            Learn about Premium <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
