"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, HelpCircle, Star, Zap } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { EarlyAccessModal } from "@/components/ui/EarlyAccessModal";
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
    q: "Is Quantum really free right now?",
    a: "Yes. During our Early Access phase, all Quantum capabilities are free for members who join now. You get full access to every feature — no credit card, no trial limits.",
  },
  {
    q: "What is Early Access?",
    a: "Early Access is our pre-launch phase where we build Quantum alongside our earliest users. You get free access to everything, and your feedback directly shapes the product roadmap.",
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
    q: "When will paid plans launch?",
    a: "We will introduce paid plans once Quantum reaches a maturity milestone we're proud of. Early Access members will receive advance notice and locked-in founding member pricing.",
  },
  {
    q: "What is the Premium plan for?",
    a: "Premium is designed for organizations that need enterprise-grade capabilities: API access, white-label options, custom AI training, and a dedicated account manager. Contact us to learn more.",
  },
  {
    q: "Do you offer team or company plans?",
    a: "The Max plan supports unlimited private rooms for collaboration. For company-wide deployments with SSO and centralized billing, contact us about Premium.",
  },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="w-4 h-4 text-gold mx-auto" />;
  if (value === false) return <span className="text-[#2a2a2a] text-lg leading-none mx-auto block text-center">—</span>;
  return <span className="text-xs text-[#888888] text-center block">{value}</span>;
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCTA = (planId: string) => {
    if (planId === "premium") {
      window.location.href = "/premium";
    } else {
      setModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808]">
      {modalOpen && <EarlyAccessModal onClose={() => setModalOpen(false)} />}

      <nav className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <QuantumLogo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200">
              Join Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Early Access Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <div className="relative bg-[#111111] border border-gold/20 rounded-2xl p-10 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-xs font-semibold text-gold mb-6">
              <Zap className="w-3 h-3" />
              Free for a limited time
            </div>
            <h1 className="text-4xl md:text-[48px] font-bold text-white tracking-tight mb-4">
              Quantum Early Access
            </h1>
            <p className="text-xl text-[#888888] max-w-2xl mx-auto mb-3">
              All Quantum capabilities are currently free for early members.
            </p>
            <p className="text-sm text-[#555555] max-w-xl mx-auto mb-8">
              We&apos;re building the future of decision intelligence with feedback from our earliest users.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold bg-gold text-[#080808] rounded-lg hover:bg-gold-light transition-all duration-200"
            >
              <Star className="w-4 h-4" />
              Activate Free Access
            </button>
          </div>
        </motion.div>

        {/* Future Plans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555555] mb-3">Future Plans</p>
          <h2 className="text-2xl font-bold text-white">What pricing will look like after Early Access</h2>
          <p className="mt-2 text-sm text-[#888888]">All plans are currently unlocked. These prices reflect our future roadmap.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
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
              <div className="mb-2">
                {plan.price.monthly !== null ? (
                  <div>
                    <span className="font-mono text-4xl font-bold text-white">${plan.price.monthly}</span>
                    <span className="text-[#888888] text-sm ml-1">/mo</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-white">Custom</span>
                )}
              </div>
              <p className="text-xs text-gold mb-6">Free during Early Access</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-[#888888]">
                    <Check className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleCTA(plan.id)}
                className={`w-full py-2.5 text-sm font-semibold rounded transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-gold text-[#080808] hover:bg-gold-light"
                    : "bg-transparent text-gold border border-gold/30 hover:bg-gold/8"
                }`}
              >
                {plan.cta}
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
          <p className="text-[#888888] mb-6">Talk to our team about building Quantum for your organization.</p>
          <Link href="/premium">
            <button className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-gold border border-gold rounded hover:bg-gold/8 transition-all duration-200">
              Learn about Premium <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
