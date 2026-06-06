"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, ChevronDown, Brain, Compass, Mic, Lightbulb, Users, Wrench,
} from "lucide-react";

// ── Floating Particles ──────────────────────────────────────────────────────

function FloatingParticles() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#7C3AED]/40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ── Quantum Atom SVG ─────────────────────────────────────────────────────────

function QuantumAtom() {
  return (
    <motion.svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.ellipse
        cx="36" cy="36" rx="32" ry="12"
        stroke="#C9A84C" strokeWidth="1.5" fill="none"
        animate={{ filter: ["drop-shadow(0 0 4px #C9A84C)", "drop-shadow(0 0 12px #C9A84C)", "drop-shadow(0 0 4px #C9A84C)"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="36" cy="36" rx="12" ry="32"
        stroke="#C9A84C" strokeWidth="1.5" fill="none" opacity="0.7"
        animate={{ filter: ["drop-shadow(0 0 4px #C9A84C)", "drop-shadow(0 0 12px #C9A84C)", "drop-shadow(0 0 4px #C9A84C)"] }}
        transition={{ duration: 2.5, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="36" cy="36" rx="24" ry="24"
        stroke="#C9A84C" strokeWidth="1" fill="none" strokeDasharray="4 4" opacity="0.4"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="36" cy="36" r="4" fill="#C9A84C" />
    </motion.svg>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A1040]/60 bg-[#06040F]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-[#C9A84C] font-semibold tracking-[6px] text-sm">QUANTUM</span>
        <div className="hidden md:flex items-center gap-8 text-sm text-[#8B7CF8]/70">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
        </div>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#C9A84C] text-[#06040F] rounded-lg hover:bg-[#D4B85C] transition-all duration-200"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </nav>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const taglineWords = ["Your", "AI", "co-founder", "from", "day", "one"];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-[#06040F]">
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
      />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
      />

      <FloatingParticles />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Logo atom */}
        <div className="mb-8">
          <QuantumAtom />
        </div>

        {/* QUANTUM wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-4"
        >
          <span className="text-white font-extralight tracking-[16px] text-3xl md:text-4xl">QUANTUM</span>
        </motion.div>

        {/* Tagline word by word */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-wrap justify-center gap-x-2 mb-10"
        >
          {taglineWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
              className="text-[#8B7CF8] text-xl md:text-2xl font-light"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-8 py-3.5 text-base font-semibold bg-[#C9A84C] text-[#06040F] rounded-xl hover:bg-[#D4B85C] transition-all duration-200 hover:shadow-[0_0_20px_rgba(201,168,76,0.4)] w-full sm:w-auto justify-center"
          >
            Start Free — 3 Days
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-3 px-8 py-3.5 text-base font-medium text-[#A855F7] border border-[#7C3AED] rounded-xl hover:bg-[#7C3AED]/10 transition-all duration-200 w-full sm:w-auto justify-center"
          >
            See How It Works
          </a>
        </motion.div>
      </div>

      {/* Scroll arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="w-6 h-6 text-[#C9A84C] animate-bounce" />
      </motion.div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Describe your challenge",
      desc: "Input your decision, idea, or problem in plain language. No templates needed.",
    },
    {
      num: "02",
      title: "Quantum thinks with you",
      desc: "AI analysis with context, not just answers. It asks the right questions.",
    },
    {
      num: "03",
      title: "Move forward with clarity",
      desc: "Reports, scripts, validators, and tools — a complete intelligence package.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-[#06040F]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            How it <span className="text-[#C9A84C] font-semibold">works</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="text-[#C9A84C] font-mono text-6xl font-bold opacity-20 mb-4 leading-none">{step.num}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-[#8B7CF8]/70 leading-relaxed text-sm">{step.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute top-10 right-0 translate-x-1/2 text-[#1A1040]">
                  <ArrowRight className="w-5 h-5 text-[#7C3AED]/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features Grid ─────────────────────────────────────────────────────────────

function FeaturesGrid() {
  const features = [
    { icon: Brain, title: "Decision Intelligence", desc: "Frame and analyze any high-stakes business decision with structured AI support." },
    { icon: Compass, title: "Quantum Compass", desc: "Strategic direction-setting for founders who need clarity before moving fast." },
    { icon: Mic, title: "Pitch Builder", desc: "Build compelling investor pitches tailored to your stage and market." },
    { icon: Lightbulb, title: "Idea Validator", desc: "Test your idea against real market signals before you build." },
    { icon: Users, title: "Investor Match", desc: "Find aligned investors based on your traction, sector, and stage." },
    { icon: Wrench, title: "13+ Founder Tools", desc: "Grant writer, pricing intelligence, board updates, co-founder match, and more." },
  ];

  return (
    <section id="features" className="py-24 px-6 bg-[#0F0A1F]/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            Everything a <span className="text-[#C9A84C] font-semibold">co-founder</span> does
          </h2>
          <p className="mt-4 text-[#8B7CF8]/70 text-lg">Minus the equity.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="bg-[#0F0A1F] border border-[#1A1040] rounded-xl p-5 hover:border-[#7C3AED]/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C3AED]/30 to-[#A855F7]/20 border border-[#7C3AED]/30 flex items-center justify-center mb-4 group-hover:shadow-[0_0_12px_rgba(124,58,237,0.4)] transition-all">
                  <Icon className="w-5 h-5 text-[#A855F7]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[#8B7CF8]/60 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-[#06040F]">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-full text-xs text-[#C9A84C] mb-8 font-medium">
            Early Access Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Free for <span className="text-[#C9A84C] font-semibold">3 days.</span>
            <br />Then <span className="text-white font-semibold">$29/month.</span>
          </h2>
          <p className="text-[#8B7CF8]/70 text-lg mb-4">Cancel anytime.</p>
          <p className="text-[#8B7CF8]/50 text-sm mb-10">
            Currently free during early access — lock in your founding member status
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-3 px-10 py-4 text-base font-semibold bg-[#C9A84C] text-[#06040F] rounded-xl hover:bg-[#D4B85C] transition-all duration-200 hover:shadow-[0_0_24px_rgba(201,168,76,0.4)]"
          >
            Start Free — No Card Needed
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-[#1A1040] py-10 px-6 bg-[#06040F]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-[#C9A84C] font-semibold tracking-[6px] text-sm">QUANTUM</span>
        <div className="flex flex-wrap gap-6 text-xs text-[#8B7CF8]/50">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link>
        </div>
        <p className="text-xs text-[#8B7CF8]/30">© 2025 Quantum. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#06040F]">
      <Navbar />
      <Hero />
      <HowItWorks />
      <FeaturesGrid />
      <Pricing />
      <Footer />
    </div>
  );
}
