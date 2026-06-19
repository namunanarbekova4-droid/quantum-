"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, Copy, Check, RefreshCw, ArrowRight, ChevronDown,
  Layout, Sparkles, Type, MessageSquare, Target, Zap, Share2,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// ─── Types ──────────────────────────────────────────────────────────────────

type Tone = "Bold" | "Friendly" | "Professional" | "Playful";
type CTA = "Sign up" | "Join waitlist" | "Book a demo" | "Download app";

interface Feature {
  title: string;
  description: string;
}
interface Testimonial {
  name: string;
  role: string;
  text: string;
}
interface LandingPageResult {
  hero: {
    headlines: [string, string, string];
    subheadline: string;
    ctaOptions: [string, string, string];
    supportingLine: string;
  };
  problem: {
    sectionHeadline: string;
    statements: [string, string, string];
  };
  solution: {
    sectionHeadline: string;
    features: [Feature, Feature, Feature];
  };
  socialProof: {
    testimonials: [Testimonial, Testimonial, Testimonial];
    statsCopy: string;
  };
  cta: {
    headline: string;
    subheadline: string;
    buttonText: string;
    riskReversal: string;
  };
  seo: {
    pageTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
  };
}

interface FormData {
  startupName: string;
  tagline: string;
  problem: string;
  customer: string;
  differentiation: string;
  cta: CTA;
  tone: Tone;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TONES: Tone[] = ["Bold", "Friendly", "Professional", "Playful"];
const CTA_OPTIONS: CTA[] = ["Sign up", "Join waitlist", "Book a demo", "Download app"];
const GENERATING_MSGS = [
  "Writing your hero section...",
  "Crafting your features...",
  "Building social proof...",
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return { copied, copy };
}

function CopyBtn({ text, small, copyLabel = "Copy Section", copiedLabel = "Copied!" }: { text: string; small?: boolean; copyLabel?: string; copiedLabel?: string }) {
  const { copied, copy } = useCopy(text);
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 border rounded-lg transition-colors ${
        small
          ? "px-2.5 py-1 text-xs border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10"
          : "px-3 py-1.5 text-xs border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 hover:text-white"
      }`}
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

function RegenerateBtn({ onClick, loading, label = "Regenerate" }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#7C3AED]/40 text-[#7C3AED] hover:bg-[#7C3AED]/10 rounded-lg transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

function Chip({
  text,
  selected,
  onClick,
}: {
  text: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border text-sm text-left transition-colors ${
        selected
          ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
          : "border-[#1A1040] bg-[#0F0A1F] text-white/80 hover:border-[#7C3AED]/40"
      }`}
    >
      {text}
    </button>
  );
}

function SectionCard({
  label,
  icon: Icon,
  copyText,
  onRegenerate,
  regenLoading,
  children,
}: {
  label: string;
  icon: React.ElementType;
  copyText: string;
  onRegenerate: () => void;
  regenLoading: boolean;
  children: React.ReactNode;
}) {
  const { t: tl } = useLanguage();
  const ftl = tl.features.landingPage as Record<string, string>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F0A1F] border border-[#1A1040] rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1A1040]">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#C9A84C]" />
          <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-widest">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={copyText} small copyLabel={ftl.copySection} copiedLabel={ftl.copied} />
          <RegenerateBtn onClick={onRegenerate} loading={regenLoading} label={ftl.regenerate} />
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

// ─── Aurora Background ────────────────────────────────────────────────────────

function AuroraBackground() {
  return (
    <>
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          33% { transform: translate(60px, -40px) scale(1.1); opacity: 0.6; }
          66% { transform: translate(-40px, 60px) scale(0.95); opacity: 0.35; }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          40% { transform: translate(-70px, 50px) scale(1.15); opacity: 0.5; }
          70% { transform: translate(50px, -30px) scale(0.9); opacity: 0.25; }
        }
      `}</style>
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10"
        aria-hidden
      >
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "15%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
            animation: "aurora1 14s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
            animation: "aurora2 18s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({
  onGenerate,
}: {
  onGenerate: (data: FormData) => void;
}) {
  const { t } = useLanguage();
  const ft = t.features.landingPage as Record<string, string>;
  const [form, setForm] = useState<FormData>({
    startupName: "",
    tagline: "",
    problem: "",
    customer: "",
    differentiation: "",
    cta: "Sign up",
    tone: "Bold",
  });
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function setField<K extends keyof FormData>(key: K) {
    return (v: FormData[K]) => setForm((f) => ({ ...f, [key]: v }));
  }

  function startMessages() {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i = (i + 1) % GENERATING_MSGS.length;
      setMsgIdx(i);
    }, 2200);
  }

  function stopMessages() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsgIdx(0);
    startMessages();
    try {
      await onGenerate(form);
    } finally {
      setLoading(false);
      stopMessages();
    }
  }

  const canSubmit =
    form.startupName.trim() && form.problem.trim() && form.customer.trim();

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layout className="w-7 h-7 text-[#C9A84C]" />
          <h1 className="text-3xl font-bold text-white">{ft.title}</h1>
        </div>
        <p className="text-[#8B7CF8] text-sm ml-10">
          {ft.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name + tagline */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">
            Startup name and tagline
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.startupName}
              onChange={(e) => setField("startupName")(e.target.value)}
              placeholder="e.g. Launchly"
              className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 outline-none transition-colors text-sm"
            />
            <input
              value={form.tagline}
              onChange={(e) => setField("tagline")(e.target.value)}
              placeholder="e.g. Ship faster, grow smarter"
              className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 outline-none transition-colors text-sm"
            />
          </div>
        </div>

        {/* Problem */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">
            What problem do you solve?
          </label>
          <textarea
            value={form.problem}
            onChange={(e) => setField("problem")(e.target.value)}
            rows={3}
            placeholder="e.g. Founders waste weeks writing landing page copy that doesn't convert..."
            className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 resize-none outline-none transition-colors text-sm"
          />
        </div>

        {/* Customer */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">
            Who is your ideal customer?
          </label>
          <input
            value={form.customer}
            onChange={(e) => setField("customer")(e.target.value)}
            placeholder="e.g. Early-stage SaaS founders who need to launch fast"
            className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 outline-none transition-colors text-sm"
          />
        </div>

        {/* Differentiation */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">
            What makes you different?
          </label>
          <textarea
            value={form.differentiation}
            onChange={(e) => setField("differentiation")(e.target.value)}
            rows={3}
            placeholder="e.g. Unlike generic AI writers, we understand startup positioning and conversion psychology..."
            className="w-full bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white placeholder-white/25 resize-none outline-none transition-colors text-sm"
          />
        </div>

        {/* CTA */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">
            What should visitors do first?
          </label>
          <div className="relative">
            <select
              value={form.cta}
              onChange={(e) => setField("cta")(e.target.value as CTA)}
              className="w-full appearance-none bg-[#0F0A1F] border border-[#1A1040] focus:border-[#7C3AED]/50 rounded-xl p-3.5 text-white outline-none transition-colors text-sm pr-10"
            >
              {CTA_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-[#8B7CF8] text-sm font-medium mb-2">Tone?</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setField("tone")(tone)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${
                  form.tone === tone
                    ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                    : "border-[#1A1040] bg-[#0F0A1F] text-white/60 hover:border-[#7C3AED]/40 hover:text-white"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full py-4 bg-[#C9A84C] hover:bg-[#B8973B] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-base transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={msgIdx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                >
                  {GENERATING_MSGS[msgIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {ft.generate}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>
    </motion.div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  result: initialResult,
  formData,
  onBack,
}: {
  result: LandingPageResult;
  formData: FormData;
  onBack: () => void;
}) {
  const { t: tl, locale } = useLanguage();
  const ft = tl.features.landingPage as Record<string, string>;
  const [result, setResult] = useState(initialResult);
  const [selectedHeadline, setSelectedHeadline] = useState(0);
  const [selectedCTA, setSelectedCTA] = useState(0);
  const [regenLoading, setRegenLoading] = useState<Record<string, boolean>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  async function regenerateSection(section: string) {
    setRegenLoading((p) => ({ ...p, [section]: true }));
    try {
      const res = await fetch("/api/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, locale }),
      });
      if (!res.ok) throw new Error("Failed");
      const fresh: LandingPageResult = await res.json();
      setResult((prev) => ({ ...prev, [section]: fresh[section as keyof LandingPageResult] }));
    } catch {
      // silently ignore
    } finally {
      setRegenLoading((p) => ({ ...p, [section]: false }));
    }
  }

  function buildAllText() {
    const lines: string[] = [
      "=== HERO SECTION ===",
      `Headlines:`,
      ...result.hero.headlines.map((h, i) => `  ${i + 1}. ${h}`),
      `Subheadline: ${result.hero.subheadline}`,
      `CTAs: ${result.hero.ctaOptions.join(" | ")}`,
      `Supporting line: ${result.hero.supportingLine}`,
      "",
      "=== PROBLEM SECTION ===",
      result.problem.sectionHeadline,
      ...result.problem.statements.map((s) => `• ${s}`),
      "",
      "=== SOLUTION SECTION ===",
      result.solution.sectionHeadline,
      ...result.solution.features.map((f) => `${f.title}: ${f.description}`),
      "",
      "=== SOCIAL PROOF ===",
      result.socialProof.statsCopy,
      ...result.socialProof.testimonials.map(
        (t) => `"${t.text}" — ${t.name}, ${t.role}`
      ),
      "",
      "=== CTA SECTION ===",
      result.cta.headline,
      result.cta.subheadline,
      `Button: ${result.cta.buttonText}`,
      result.cta.riskReversal,
      "",
      "=== SEO META ===",
      `Title: ${result.seo.pageTitle}`,
      `Meta: ${result.seo.metaDescription}`,
      `OG Title: ${result.seo.ogTitle}`,
      `OG Description: ${result.seo.ogDescription}`,
    ];
    return lines.join("\n");
  }

  function copyAll() {
    navigator.clipboard.writeText(buildAllText());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="w-6 h-6 text-[#C9A84C]" />
            <h1 className="text-2xl font-bold text-white">{ft.title}</h1>
          </div>
          <p className="text-[#8B7CF8] text-sm ml-9">
            {formData.startupName} — {formData.tone} tone
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm border border-[#1A1040] text-[#8B7CF8] hover:border-[#7C3AED]/40 rounded-xl transition-colors"
        >
          Edit Setup
        </button>
      </div>

      <div className="space-y-4">
        {/* 1. Hero */}
        <SectionCard
          label={ft.hero}
          icon={Layout}
          copyText={[
            "Headlines:",
            ...result.hero.headlines.map((h, i) => `${i + 1}. ${h}`),
            `\nSubheadline: ${result.hero.subheadline}`,
            `\nCTAs: ${result.hero.ctaOptions.join(" | ")}`,
            `\nSupporting line: ${result.hero.supportingLine}`,
          ].join("\n")}
          onRegenerate={() => regenerateSection("hero")}
          regenLoading={!!regenLoading["hero"]}
        >
          <div className="space-y-4">
            <div>
              <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-2">
                Headlines — pick one
              </p>
              <div className="flex flex-col gap-2">
                {result.hero.headlines.map((h, i) => (
                  <Chip
                    key={i}
                    text={h}
                    selected={selectedHeadline === i}
                    onClick={() => setSelectedHeadline(i)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-1">
                Subheadline
              </p>
              <p className="text-white/80 text-sm">{result.hero.subheadline}</p>
            </div>
            <div>
              <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-2">
                CTA Buttons — pick one
              </p>
              <div className="flex flex-wrap gap-2">
                {result.hero.ctaOptions.map((c, i) => (
                  <Chip
                    key={i}
                    text={c}
                    selected={selectedCTA === i}
                    onClick={() => setSelectedCTA(i)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider mb-1">
                Supporting Line
              </p>
              <p className="text-white/60 text-sm italic">{result.hero.supportingLine}</p>
            </div>
          </div>
        </SectionCard>

        {/* 2. Problem */}
        <SectionCard
          label={ft.problemSection}
          icon={Target}
          copyText={[
            result.problem.sectionHeadline,
            ...result.problem.statements.map((s) => `• ${s}`),
          ].join("\n")}
          onRegenerate={() => regenerateSection("problem")}
          regenLoading={!!regenLoading["problem"]}
        >
          <div className="space-y-3">
            <p className="text-white font-semibold">{result.problem.sectionHeadline}</p>
            <div className="space-y-2">
              {result.problem.statements.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 bg-[#06040F] border border-[#1A1040] rounded-xl"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-1.5 shrink-0" />
                  <p className="text-white/80 text-sm">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 3. Solution */}
        <SectionCard
          label={ft.solutionSection}
          icon={Zap}
          copyText={[
            result.solution.sectionHeadline,
            ...result.solution.features.map((f) => `${f.title}\n${f.description}`),
          ].join("\n\n")}
          onRegenerate={() => regenerateSection("solution")}
          regenLoading={!!regenLoading["solution"]}
        >
          <div className="space-y-3">
            <p className="text-white font-semibold">{result.solution.sectionHeadline}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.solution.features.map((f, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#06040F] border border-[#1A1040] rounded-xl"
                >
                  <p className="text-[#C9A84C] font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-white/60 text-xs leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 4. Social Proof */}
        <SectionCard
          label={ft.socialProof}
          icon={MessageSquare}
          copyText={[
            result.socialProof.statsCopy,
            ...result.socialProof.testimonials.map(
              (t) => `"${t.text}" — ${t.name}, ${t.role}`
            ),
          ].join("\n\n")}
          onRegenerate={() => regenerateSection("socialProof")}
          regenLoading={!!regenLoading["socialProof"]}
        >
          <div className="space-y-3">
            <div className="p-3 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl">
              <p className="text-[#8B7CF8] text-sm font-medium text-center">
                {result.socialProof.statsCopy}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {result.socialProof.testimonials.map((t, i) => (
                <div
                  key={i}
                  className="p-4 bg-[#06040F] border border-[#1A1040] rounded-xl space-y-2"
                >
                  <p className="text-white/80 text-xs leading-relaxed italic">
                    &quot;{t.text}&quot;
                  </p>
                  <div>
                    <p className="text-white text-xs font-semibold">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* 5. CTA Section */}
        <SectionCard
          label={ft.finalCta}
          icon={ArrowRight}
          copyText={[
            result.cta.headline,
            result.cta.subheadline,
            `Button: ${result.cta.buttonText}`,
            result.cta.riskReversal,
          ].join("\n")}
          onRegenerate={() => regenerateSection("cta")}
          regenLoading={!!regenLoading["cta"]}
        >
          <div className="space-y-2">
            <p className="text-white font-bold text-lg">{result.cta.headline}</p>
            <p className="text-white/70 text-sm">{result.cta.subheadline}</p>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              <span className="px-4 py-2 bg-[#C9A84C] text-white text-sm font-bold rounded-xl">
                {result.cta.buttonText}
              </span>
              <span className="text-white/40 text-xs italic">{result.cta.riskReversal}</span>
            </div>
          </div>
        </SectionCard>

        {/* 6. SEO Meta */}
        <SectionCard
          label={ft.seoMeta ?? "SEO Meta"}
          icon={Share2}
          copyText={[
            `Title: ${result.seo.pageTitle}`,
            `Meta: ${result.seo.metaDescription}`,
            `OG Title: ${result.seo.ogTitle}`,
            `OG Description: ${result.seo.ogDescription}`,
          ].join("\n")}
          onRegenerate={() => regenerateSection("seo")}
          regenLoading={!!regenLoading["seo"]}
        >
          <div className="space-y-3">
            {[
              { label: "Page Title", value: result.seo.pageTitle, note: `${result.seo.pageTitle.length}/60 chars` },
              { label: "Meta Description", value: result.seo.metaDescription, note: `${result.seo.metaDescription.length}/160 chars` },
              { label: "OG Title", value: result.seo.ogTitle },
              { label: "OG Description", value: result.seo.ogDescription },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[#8B7CF8] text-xs font-semibold uppercase tracking-wider">
                    {item.label}
                  </p>
                  {item.note && (
                    <span className="text-white/30 text-xs">{item.note}</span>
                  )}
                </div>
                <p className="text-white/80 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Copy All */}
      <div className="mt-8 flex justify-center pb-10">
        <button
          onClick={copyAll}
          className="flex items-center gap-2 px-8 py-4 bg-[#C9A84C] hover:bg-[#B8973B] rounded-xl text-white font-bold transition-colors"
        >
          {copiedAll ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
          {copiedAll ? ft.copied : ft.copyAll}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPageGeneratorPage() {
  const { t, locale } = useLanguage();
  const ft = t.features.landingPage as Record<string, string>;
  const [step, setStep] = useState<0 | 1>(0);
  const [result, setResult] = useState<LandingPageResult | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate(data: FormData) {
    setError("");
    try {
      const res = await fetch("/api/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Generation failed");
      }
      const json: LandingPageResult = await res.json();
      setResult(json);
      setFormData(data);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      throw err; // so SetupScreen resets loading
    }
  }

  return (
    <>
      <AuroraBackground />
      <div className="min-h-screen p-6 lg:p-10">
        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <SetupScreen key="setup" onGenerate={handleGenerate} />
          ) : result && formData ? (
            <ResultsScreen
              key="results"
              result={result}
              formData={formData}
              onBack={() => setStep(0)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
