"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, HelpCircle } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { pricingPlans } from "@/data/mock";

const featureMatrix = [
  { feature: "Decisions per month", trial: "5", pro: "50", max: "Unlimited", premium: "Unlimited" },
  { feature: "Full intelligence reports", trial: false, pro: true, max: true, premium: true },
  { feature: "Decision maps", trial: false, pro: true, max: true, premium: true },
  { feature: "AI conversation mode", trial: false, pro: true, max: true, premium: true },
  { feature: "Market data access", trial: "Limited", pro: "Full", max: "Full", premium: "Custom" },
  { feature: "Active alerts", trial: "0", pro: "3", max: "Unlimited", premium: "Unlimited" },
  { feature: "Private rooms", trial: "0", pro: "1", max: "Unlimited", premium: "Unlimited" },
  { feature: "Weekly intelligence reports", trial: false, pro: false, max: true, premium: true },
  { feature: "Decision history export", trial: false, pro: false, max: true, premium: true },
  { feature: "API access", trial: false, pro: false, max: false, premium: true },
  { feature: "White-label option", trial: false, pro: false, max: false, premium: true },
  { feature: "Custom AI training", trial: false, pro: false, max: false, premium: true },
  { feature: "Dedicated account manager", trial: false, pro: false, max: false, premium: true },
  { feature: "SSO / SAML", trial: false, pro: false, max: false, premium: true },
  { feature: "SLA guarantee", trial: false, pro: false, max: false, premium: true },
];

const faqs = [
  {
    q: "How does the free trial work?",
    a: "You get full access to Quantum's analysis features for 3 days — no credit card required. After the trial, you can choose a paid plan or your account reverts to view-only mode.",
  },
  {
    q: "Can I change my plan at any time?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "What counts as a 'decision'?",
    a: "Each time you submit a new decision for analysis counts as one decision. Viewing, sharing, or continuing a conversation on an existing decision does not count toward your limit.",
  },
  {
    q: "Is my decision data private?",
    a: "Absolutely. All decision data is encrypted at rest and in transit. We never share, sell, or use your decision content to train models without explicit consent.",
  },
  {
    q: "What is the Premium plan for?",
    a: "Premium is designed for organizations that need enterprise-grade capabilities: API access for custom integrations, white-label options, custom AI training on proprietary data, and a dedicated account manager.",
  },
  {
    q: "Do you offer team or company plans?",
    a: "The Max plan supports unlimited private rooms for collaboration. For company-wide deployments with SSO, audit logs, and centralized billing, contact us about Premium.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex), ACH transfers, and wire transfers for annual Premium contracts.",
  },
  {
    q: "Is there a money-back guarantee?",
    a: "Yes. If you're not satisfied within the first 14 days of a paid plan, contact us and we'll issue a full refund — no questions asked.",
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-gold mx-auto" />;
  if (value === false) return <span className="text-[#2a2a2a] text-lg leading-none mx-auto block text-center">—</span>;
  return <span className="text-xs text-[#888888] text-center block">{value}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#080808]">
      <nav className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <QuantumLogo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-[48px] font-bold text-white tracking-tight">Pricing built for scale</h1>
          <p className="mt-4 text-[#888888] text-lg">Start free. No credit card required. Upgrade when you&apos;re ready.</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!annual ? "text-white" : "text-[#888888]"}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-all duration-200 ${annual ? "bg-gold" : "bg-[#2a2a2a]"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${annual ? "left-7" : "left-1"}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? "text-white" : "text-[#888888]"}`}>
              Annual <span className="text-gold text-xs font-semibold ml-1">Save 17%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-[#111111] rounded-lg p-6 flex flex-col ${
                plan.highlighted ? "border-2 border-gold shadow-gold" : "border border-[#1a1a1a]"
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${
                  plan.highlighted ? "bg-gold text-[#080808]" : "bg-[#1a1a1a] text-[#888888] border border-[#2a2a2a]"
                }`}>
                  {plan.badge}
                </div>
              )}
              <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-xs text-[#888888] mb-6">{plan.description}</p>
              <div className="mb-6">
                {plan.price.monthly !== null ? (
                  <div>
                    <span className="font-mono text-4xl font-bold text-white">
                      ${annual ? Math.floor((plan.price.annual ?? 0) / 12) : plan.price.monthly}
                    </span>
                    <span className="text-[#888888] text-sm ml-1">/mo</span>
                    {annual && plan.price.annual && (
                      <p className="text-xs text-gold mt-1">Billed ${plan.price.annual}/year</p>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-white">Custom</span>
                )}
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-[#888888]">
                    <Check className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.id === "premium" ? "/premium" : "/auth/signup"}>
                <button className={`w-full py-2.5 text-sm font-semibold rounded transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-gold text-[#080808] hover:bg-gold-light"
                    : "bg-transparent text-gold border border-gold/30 hover:bg-gold/8"
                }`}>
                  {plan.cta}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Full feature comparison</h2>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#1a1a1a]">
                    <th className="text-left text-xs text-[#888888] font-medium px-6 py-4 w-1/3">Feature</th>
                    {["Trial", "Pro", "Max", "Premium"].map((h) => (
                      <th key={h} className={`text-center text-xs font-medium px-4 py-4 ${h === "Max" ? "text-gold" : "text-[#888888]"}`}>
                        {h}
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

        <div className="mb-20 flex items-center justify-center gap-6 p-6 bg-[#111111] border border-[#1a1a1a] rounded-lg">
          <Shield className="w-8 h-8 text-gold flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">14-day money-back guarantee</p>
            <p className="text-xs text-[#888888] mt-0.5">Not satisfied? Get a full refund within 14 days of your first paid charge. No questions asked.</p>
          </div>
        </div>

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
                  <HelpCircle className={`w-4 h-4 flex-shrink-0 ml-3 transition-colors ${openFaq === i ? "text-gold" : "text-[#888888]"}`} />
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
          <h2 className="text-2xl font-bold text-white mb-3">Need enterprise capabilities?</h2>
          <p className="text-[#888888] mb-6">Talk to our team about a custom plan for your organization.</p>
          <Link href="/premium">
            <button className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-gold border border-gold rounded hover:bg-gold/8 transition-all duration-200">
              Talk to Sales <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
