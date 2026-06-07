"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, Zap, Globe, Lock, BarChart2, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const premiumFeatures = [
  {
    icon: Zap,
    title: "API Access",
    desc: "Full REST API with webhooks. Integrate Quantum's decision intelligence directly into your internal tools, dashboards, and workflows.",
  },
  {
    icon: Globe,
    title: "White-Label Option",
    desc: "Deploy Quantum under your own brand. Custom domain, logo, and color scheme. Offer AI decision intelligence as your own product.",
  },
  {
    icon: BarChart2,
    title: "Custom AI Training",
    desc: "Train Quantum's models on your proprietary data — internal deals, historical decisions, sector-specific knowledge — for dramatically sharper analysis.",
  },
  {
    icon: Users,
    title: "Dedicated Account Manager",
    desc: "A senior Quantum team member dedicated to your account. Weekly check-ins, quarterly reviews, and direct escalation path.",
  },
  {
    icon: Lock,
    title: "SSO / SAML",
    desc: "Enterprise-grade authentication. Integrate with Okta, Azure AD, Google Workspace, or any SAML 2.0 provider. Full audit logs.",
  },
  {
    icon: Shield,
    title: "SLA Guarantees",
    desc: "99.9% uptime SLA with financial penalties. Priority incident response with a 1-hour response time commitment.",
  },
  {
    icon: Building2,
    title: "Custom Integrations",
    desc: "Native integrations with Salesforce, HubSpot, Slack, Microsoft Teams, and custom-built connectors for your internal systems.",
  },
  {
    icon: BarChart2,
    title: "Advanced Analytics",
    desc: "Organization-wide decision analytics. Track decision quality, patterns, and ROI across your entire team. Board-ready reporting.",
  },
];

const earlyAccessBenefits = [
  "Shape the product roadmap — your use case becomes a core feature",
  "Locked-in pricing before public launch",
  "Direct access to the founding team",
  "Priority onboarding and white-glove setup",
];

const teamSizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const useCases = ["M&A / Deal Evaluation", "Market Expansion", "Fundraising Strategy", "Portfolio Management", "Board Reporting", "Risk Management", "Other"];

export default function PremiumPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", company: "", teamSize: "", useCase: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[#080808]">
      <nav className="border-b border-[#1a1a1a] bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <QuantumLogo size="md" />
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
              All Plans
            </Link>
            <Link href="/auth/signin" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <section className="py-24 px-6 text-center border-b border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold mb-6">
              <Shield className="w-3 h-3" />
              Quantum Premium
            </div>
            <h1 className="text-4xl md:text-[56px] font-bold text-white tracking-tight leading-tight mb-6">
              Built for organizations<br />
              <span className="text-gold-gradient">that move markets</span>
            </h1>
            <p className="text-xl text-[#888888] leading-relaxed mb-10">
              Enterprise-grade decision intelligence with custom AI training, API access,
              white-label options, and a dedicated team committed to your success.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="#demo" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gold text-[#080808] rounded-lg hover:bg-gold-light transition-all duration-200 hover:shadow-gold-lg">
                Request a Demo <ArrowRight className="w-5 h-5" />
              </a>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-gold border border-gold rounded-lg hover:bg-gold/8 transition-all duration-200">
                Compare Plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6 border-b border-[#1a1a1a]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/5 border border-gold/20 rounded-full text-sm text-gold">
            <Shield className="w-3.5 h-3.5" />
            Currently accepting a limited number of founding-stage partners
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-b border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-[40px] font-bold text-white tracking-tight">Everything in Max, plus</h2>
            <p className="mt-3 text-[#888888]">Enterprise capabilities built for organizations that demand more.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {premiumFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 hover:border-gold/20 hover:shadow-gold transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-[#888888] leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white tracking-tight">Become a founding partner</h2>
            <p className="mt-3 text-[#888888]">Quantum Premium is in private access. Founding partners shape the product.</p>
          </motion.div>
          <div className="bg-[#111111] border border-gold/20 rounded-lg p-8 max-w-2xl mx-auto">
            <ul className="space-y-4">
              {earlyAccessBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-white">
                  <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#444444] mt-6 text-center">Case studies and results will be published as founding partners go live.</p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-b border-[#1a1a1a]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight mb-4">Security & Compliance</h2>
              <p className="text-[#888888] leading-relaxed mb-6">
                Quantum Premium meets the security requirements of the world&apos;s most regulated industries.
              </p>
              <ul className="space-y-3">
                {[
                  "SOC 2 Type II certified",
                  "GDPR and CCPA compliant",
                  "AES-256 encryption at rest",
                  "TLS 1.3 in transit",
                  "Annual penetration testing",
                  "EU data residency available",
                  "Custom DPA on request",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
              <Shield className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Built for founders from day one</h3>
              <p className="text-sm text-[#888888] leading-relaxed">
                We built Quantum&apos;s infrastructure for founders from the start — not
                bolted on after the fact. Every decision is processed in isolated, encrypted
                compute environments with zero cross-tenant data access.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Request a Demo</h2>
            <p className="mt-3 text-[#888888]">Our team will reach out within one business day to schedule a personalized demo.</p>
          </motion.div>
          {submitted ? (
            <div className="bg-[#111111] border border-gold/20 rounded-lg p-12 text-center">
              <Check className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Request received</h3>
              <p className="text-[#888888]">Our team will contact you within one business day.</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={formData.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Chen" />
                  <Input label="Work Email" type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="you@company.com" />
                </div>
                <Input label="Company" value={formData.company} onChange={(e) => update("company", e.target.value)} placeholder="Meridian Capital" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#888888]">Team Size</label>
                    <select value={formData.teamSize} onChange={(e) => update("teamSize", e.target.value)} className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200">
                      <option value="">Select size...</option>
                      {teamSizes.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[#888888]">Primary Use Case</label>
                    <select value={formData.useCase} onChange={(e) => update("useCase", e.target.value)} className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200">
                      <option value="">Select use case...</option>
                      {useCases.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#888888]">Anything else we should know?</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder="Tell us about your specific requirements, timeline, or questions..."
                    className="w-full h-24 px-3 py-2 bg-[#0d0d0d] border border-[#1a1a1a] text-white text-sm rounded resize-none focus:outline-none focus:border-gold/50 placeholder:text-[#444444] transition-all duration-200"
                  />
                </div>
                <Button type="submit" loading={loading} size="lg" className="w-full gap-2">
                  Request Demo <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
