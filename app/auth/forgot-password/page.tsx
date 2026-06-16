"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const fp = t.auth.forgotPassword;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) { setError("Something went wrong. Please try again."); return; }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><QuantumLogo size="lg" href="/" /></div>
        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-gold" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">{fp.successTitle}</h1>
              <p className="text-sm text-[#888888] mb-6">
                {fp.successDesc}
              </p>
              <Link href="/auth/signin"><Button className="w-full">{fp.backToSignIn}</Button></Link>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 bg-gold/10 border border-gold/20 rounded-lg flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-gold" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1">{fp.title}</h1>
              <p className="text-sm text-[#888888] mb-6">{fp.subtitle}</p>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded mb-4 text-sm text-danger">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label={fp.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
                <Button type="submit" loading={loading} className="w-full">{loading ? fp.sending : fp.sendLink}</Button>
              </form>
            </>
          )}
        </div>
        <Link href="/auth/signin" className="flex items-center justify-center gap-2 mt-6 text-sm text-[#888888] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />{fp.backToSignIn}
        </Link>
      </motion.div>
    </div>
  );
}
