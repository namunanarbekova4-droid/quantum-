"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Check, ChevronDown, Globe, Zap, Lock, Users,
  BarChart2, TrendingUp, Target, Shield, DollarSign, Brain,
  Building2, Briefcase,
} from "lucide-react";
import { ParticleBackground } from "@/components/landing/ParticleBackground";
import { pricingPlans } from "@/data/mock";
import { QuantumLogo } from "@/components/ui/QuantumLogo";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#080808]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <QuantumLogo size="md" />
        <div className="hidden md:flex items-center gap-8 text-sm text-[#888888]">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          <Link href="/premium" className="hover:text-white transition-colors">Enterprise</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="text-sm text-[#888888] hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200 hover:shadow-gold"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold mb-8">
          <Zap className="w-3 h-3" />
          AI-powered decision intelligence for leaders
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] tracking-tight">
          Where serious people<br />
          <span className="text-gold-gradient">make serious decisions</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-[#888888] max-w-2xl mx-auto leading-relaxed">
          Quantum gives founders, investors, and executives the intelligence to make their
          highest-stakes decisions with clarity and confidence.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold bg-gold text-[#080808] rounded-lg hover:bg-gold-light transition-all duration-200 hover:shadow-gold-lg w-full sm:w-auto justify-center"
          >
            Start Free — 3 Days
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-3 px-8 py-4 text-base font-semibold text-gold border border-gold rounded-lg hover:bg-gold/8 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            See How It Works
          </a>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#444444]">
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold" /> No credit card required</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold" /> Cancel anytime</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-gold" /> Full access for 3 days</span>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="w-5 h-5 text-[#444444] animate-bounce" />
      </motion.div>
    </section>
  );
}

function SocialProof() {
  return null;
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Describe your decision",
      desc: "Type any high-stakes business decision in plain language. No templates, no forms — just describe what you're facing.",
    },
    {
      num: "02",
      title: "Quantum analyzes everything",
      desc: "Our AI pulls real market data, identifies patterns, evaluates risk factors, and models all possible outcomes in seconds.",
    },
    {
      num: "03",
      title: "Receive full intelligence",
      desc: "Get a structured report, decision map, AI conversation mode, and live market data — a complete intelligence package.",
    },
  ];
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-[48px] font-bold text-white tracking-tight">Intelligence in three steps</h2>
          <p className="mt-4 text-[#888888] text-lg">From decision to insight in under 60 seconds.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="font-mono text-7xl font-bold text-[#1a1a1a] mb-4 leading-none">{step.num}</div>
              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-[#888888] leading-relaxed text-sm">{step.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-[#2a2a2a]">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const [activeRole, setActiveRole] = useState("Founders");
  const roles = ["Founders", "Investors", "Executives"];

  const features: Record<string, { icon: React.ElementType; title: string; desc: string }[]> = {
    Founders: [
      { icon: Globe, title: "Market Entry Analysis", desc: "Evaluate any new market with competitive landscape mapping, TAM analysis, and regulatory risk scoring." },
      { icon: Users, title: "Hiring Decision Engine", desc: "Make confident hiring decisions with compensation benchmarking, role timing analysis, and ROI modeling." },
      { icon: DollarSign, title: "Fundraising Intelligence", desc: "Optimize your fundraising strategy with investor matching, valuation benchmarking, and timing analysis." },
      { icon: Zap, title: "Pivot Analyzer", desc: "Evaluate strategic pivots with full risk assessment, resource modeling, and probability-weighted outcomes." },
    ],
    Investors: [
      { icon: Brain, title: "Deal Evaluation", desc: "Comprehensive deal analysis with comparable transactions, team assessment, and market timing signals." },
      { icon: TrendingUp, title: "Market Timing", desc: "Identify optimal entry and exit windows with macro analysis, sector momentum, and cycle positioning." },
      { icon: BarChart2, title: "Portfolio Decisions", desc: "Manage portfolio company decisions with cross-portfolio pattern recognition and follow-on modeling." },
      { icon: Shield, title: "Risk Scoring", desc: "Quantified risk assessment across 40+ dimensions including market, execution, and regulatory factors." },
    ],
    Executives: [
      { icon: Globe, title: "Expansion Strategy", desc: "Evaluate geographic and product expansion with market sizing, competitive analysis, and capital requirements." },
      { icon: Building2, title: "Acquisition Analysis", desc: "Full M&A intelligence including synergy modeling, integration risk, and post-merger performance prediction." },
      { icon: Target, title: "Restructuring Intelligence", desc: "Data-driven restructuring decisions with workforce modeling, cost analysis, and stakeholder impact assessment." },
      { icon: Briefcase, title: "Board Reporting", desc: "Generate board-ready intelligence summaries with risk registers, decision rationale, and outcome tracking." },
    ],
  };

  const currentFeatures = features[activeRole];

  return (
    <section id="features" className="py-24 px-6 bg-[#080808]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-[48px] font-bold text-white tracking-tight">Built for how you think</h2>
          <p className="mt-4 text-[#888888] text-lg">Intelligence tuned to your role, your industry, your decisions.</p>
        </motion.div>
        <div className="flex justify-center gap-2 mb-12">
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`px-6 py-2.5 text-sm font-semibold rounded transition-all duration-200 ${
                activeRole === role
                  ? "bg-gold text-[#080808]"
                  : "text-[#888888] border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a]"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {currentFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 hover:border-gold/20 hover:shadow-gold transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#888888] leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function PrivateRooms() {
  return (
    <section className="py-24 px-6 bg-[#0a0a0a] border-y border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-xs text-gold mb-6">
              <Lock className="w-3 h-3" />
              Private Rooms
            </div>
            <h2 className="text-4xl md:text-[48px] font-bold text-white tracking-tight mb-6">
              Decisions are better made together
            </h2>
            <p className="text-[#888888] text-lg leading-relaxed mb-8">
              Invite trusted colleagues into a secure, private space where you can analyze decisions
              together, share intelligence, and align on the right path forward.
            </p>
            <ul className="space-y-3">
              {[
                "End-to-end encrypted conversations",
                "Shared AI analysis visible to all members",
                "Real-time collaboration with role-based access",
                "Full audit trail and decision history",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-white">
                  <Check className="w-4 h-4 text-gold flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1a1a1a]">
              <Lock className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-white">Strategy Room</span>
              <div className="ml-auto flex -space-x-1.5">
                {["A", "B", "C"].map((initial) => (
                  <div key={initial} className="w-7 h-7 bg-gold/20 border-2 border-[#111111] rounded-full flex items-center justify-center text-xs font-bold text-gold">
                    {initial}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 text-sm">
              <div className="bg-[#0d0d0d] rounded-lg p-4 border border-[#1a1a1a]">
                <p className="text-[#888888] text-xs mb-2">Team Member · just now</p>
                <p className="text-white">I&apos;ve run the market entry analysis. Risk score looks manageable — recommend we discuss timing before committing.</p>
              </div>
              <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 ml-8">
                <p className="text-gold text-xs mb-2">You · just now</p>
                <p className="text-white">Agreed. Let&apos;s align on the key milestones before we move forward.</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-4 border border-[#1a1a1a]">
                <p className="text-gold text-xs mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-gold text-[#080808] rounded text-xs font-bold inline-flex items-center justify-center">Q</span>
                  Quantum AI · now
                </p>
                <p className="text-[#888888]">Based on your inputs, here are the 3 highest-leverage actions to reduce risk before committing...</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardPreview() {
  return null;
}

function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 px-6 border-t border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-[48px] font-bold text-white tracking-tight">Simple, transparent pricing</h2>
          <p className="mt-4 text-[#888888] text-lg">Start free. Scale as you grow.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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
      </div>
    </section>
  );
}

function Testimonials() {
  return null;
}

function CTASection() {
  return (
    <section className="py-24 px-6 border-t border-[#1a1a1a]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-4xl md:text-[48px] font-bold text-white tracking-tight mb-6">
            Your next decision is<br />
            <span className="text-gold-gradient">your most important one</span>
          </h2>
          <p className="text-[#888888] text-lg mb-10 leading-relaxed">
            Start with a free 3-day trial. No credit card required. Full access from day one.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-10 py-4 text-base font-semibold bg-gold text-[#080808] rounded-lg hover:bg-gold-light transition-all duration-200 hover:shadow-gold-lg"
          >
            Start Free — 3 Days
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const links: Record<string, string[]> = {
    Product: ["Features", "Pricing", "Changelog", "Roadmap"],
    Company: ["About", "Blog", "Careers", "Press"],
    Resources: ["Documentation", "API Reference", "Status", "Support"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"],
  };
  return (
    <footer className="border-t border-[#1a1a1a] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <QuantumLogo size="md" />
            <p className="mt-3 text-sm text-[#888888] leading-relaxed max-w-xs">
              Where serious people make serious decisions. AI-powered decision intelligence for
              founders, investors, and executives.
            </p>
          </div>
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-[#888888] hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#444444]">© 2025 Quantum. All rights reserved.</p>
          <p className="text-xs text-[#444444]">Built for the world&apos;s most important decisions.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <PrivateRooms />
      <LeaderboardPreview />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </>
  );
}
