"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Real Estate", "Energy", "Other"];

export default function MentorApplyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    expertise: "",
    years_experience: "",
    linkedin_url: "",
    industry: "",
    biography: "",
    why_mentor: "",
  });

  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.expertise || !form.biography) {
      toast("Please fill in all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/mentors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        toast(err.error || "Failed to submit application", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 mx-auto">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-white">Application Submitted</h2>
          <p className="text-text-secondary mt-2 max-w-sm">Thank you for applying to be a mentor. Our team will review your application and get back to you.</p>
          <Button className="mt-6" onClick={() => router.push("/dashboard/mentors")}>Back to Mentors</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Become a Mentor</h1>
        <p className="text-text-secondary mt-1">Share your expertise and help others make better decisions.</p>
      </motion.div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name <span className="text-danger">*</span></label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Years of Experience</label>
              <Input type="number" value={form.years_experience} onChange={(e) => set("years_experience", e.target.value)} placeholder="e.g. 10" min="0" max="60" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Area of Expertise <span className="text-danger">*</span></label>
            <Input value={form.expertise} onChange={(e) => set("expertise", e.target.value)} placeholder="e.g. B2B SaaS, Venture Capital, M&A" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Industry</label>
              <select
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                className="w-full bg-[#111111] border border-[#1a1a1a] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn URL</label>
              <Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Biography <span className="text-danger">*</span></label>
            <textarea
              value={form.biography}
              onChange={(e) => set("biography", e.target.value)}
              placeholder="Describe your background, achievements, and what makes you qualified to mentor others..."
              rows={4}
              required
              className="w-full bg-[#111111] border border-[#1a1a1a] rounded text-sm text-white placeholder-text-secondary px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Why do you want to mentor?</label>
            <textarea
              value={form.why_mentor}
              onChange={(e) => set("why_mentor", e.target.value)}
              placeholder="What motivates you to share your knowledge and help others..."
              rows={3}
              className="w-full bg-[#111111] border border-[#1a1a1a] rounded text-sm text-white placeholder-text-secondary px-3 py-2.5 focus:outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
