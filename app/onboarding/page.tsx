"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { cn } from "@/lib/utils";

const decisionTypes = [
  "Market Entry", "Fundraising", "Hiring", "Acquisitions",
  "Partnerships", "Product Pivots", "Geographic Expansion",
  "Cost Reduction", "Exit Strategy", "Capital Allocation",
];

const industries = [
  "Technology", "Finance", "Healthcare", "Real Estate",
  "Energy", "Consumer", "Manufacturing", "Media",
];

const countries = [
  "United States", "United Kingdom", "UAE", "Singapore",
  "Germany", "India", "Canada", "Australia", "Israel", "France",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [alertIndustry, setAlertIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleDecision = (d: string) =>
    setSelectedDecisions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const next = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/dashboard");
    }
  };

  const progressPercent = Math.min(((step - 1) / 3) * 100, 100);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="flex justify-center mb-8">
          <QuantumLogo size="lg" href="/" />
        </div>

        {step < 4 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#888888]">Step {step} of 3</span>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-xs text-[#444444] hover:text-[#888888] transition-colors"
              >
                Skip setup
              </button>
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gold rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8"
            >
              <h2 className="text-xl font-bold text-white mb-1">Tell us about yourself</h2>
              <p className="text-sm text-[#888888] mb-6">This helps us personalize your intelligence experience.</p>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Meridian AI"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#888888]">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                  >
                    <option value="">Select industry...</option>
                    {industries.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#888888]">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-10 px-3 bg-[#111111] border border-[#1a1a1a] text-white text-sm rounded focus:outline-none focus:border-gold/50 transition-all duration-200"
                  >
                    <option value="">Select country...</option>
                    {countries.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                  Skip
                </Button>
                <Button onClick={next} className="gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8"
            >
              <h2 className="text-xl font-bold text-white mb-1">What decisions do you face most?</h2>
              <p className="text-sm text-[#888888] mb-6">Select all that apply. We&apos;ll prioritize these in your dashboard.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {decisionTypes.map((d) => {
                  const selected = selectedDecisions.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleDecision(d)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm rounded border transition-all duration-200",
                        selected
                          ? "bg-gold/10 border-gold/40 text-white"
                          : "bg-[#0d0d0d] border-[#1a1a1a] text-[#888888] hover:border-[#2a2a2a] hover:text-white"
                      )}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-gold" />}
                      {d}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#444444] mb-6">{selectedDecisions.length} selected</p>
              <div className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={next} className="gap-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8"
            >
              <h2 className="text-xl font-bold text-white mb-1">Set your first alert</h2>
              <p className="text-sm text-[#888888] mb-6">
                Choose an industry to monitor. Quantum will alert you when there are significant shifts.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setAlertIndustry(ind)}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 text-sm rounded border transition-all duration-200",
                      alertIndustry === ind
                        ? "bg-gold/10 border-gold/40 text-white"
                        : "bg-[#0d0d0d] border-[#1a1a1a] text-[#888888] hover:border-[#2a2a2a] hover:text-white"
                    )}
                  >
                    <span>{ind}</span>
                    {alertIndustry === ind && <Check className="w-3.5 h-3.5 text-gold" />}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={next} className="gap-2">
                  Finish Setup <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-[#111111] border border-gold/20 rounded-lg p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-8 h-8 text-gold" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">Quantum is ready</h2>
              <p className="text-[#888888] leading-relaxed mb-8">
                Your intelligence platform is configured and ready. Make your first decision and
                see the full power of Quantum.
              </p>
              <div className="flex flex-col gap-3 mb-8 text-sm text-left max-w-xs mx-auto">
                {[
                  "Full decision analysis with risk scoring",
                  "Interactive decision maps",
                  "AI conversation mode",
                  "Real-time market intelligence",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-[#888888]">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button onClick={next} loading={loading} size="lg" className="gap-2">
                Go to Dashboard <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
