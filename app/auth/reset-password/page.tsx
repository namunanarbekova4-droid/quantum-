"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/lib/i18n";

function ResetForm() {
  const { t } = useLanguage();
  const rp = t.auth.resetPassword;
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { if (!token) router.push("/auth/forgot-password"); }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
    } else {
      setDone(true);
    }
  };

  if (done) return (
    <div className="w-full max-w-sm bg-[#111111] border border-[#1a1a1a] rounded-lg p-8 text-center">
      <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-6 h-6 text-gold" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">{rp.title}</h1>
      <p className="text-sm text-[#888888] mb-6">{rp.subtitle}</p>
      <Link href="/auth/signin"><Button className="w-full">{rp.backToSignIn}</Button></Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
      <div className="flex justify-center mb-8"><QuantumLogo size="lg" href="/" /></div>
      <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
        <h1 className="text-xl font-bold text-white mb-1">{rp.title}</h1>
        <p className="text-sm text-[#888888] mb-6">{rp.subtitle}</p>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded mb-4 text-sm text-danger">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={rp.newPassword} type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters"
            suffix={<button type="button" onClick={() => setShowPw(!showPw)} className="hover:text-white transition-colors">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
          <Input label={rp.confirmPassword} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
          <Button type="submit" loading={loading} className="w-full gap-2">
            {loading ? rp.resetting : rp.resetPassword} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="text-[#888888]">Loading...</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
