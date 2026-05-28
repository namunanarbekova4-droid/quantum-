"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/lib/i18n";

export default function SignInPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(`Error: ${result.error}`);
    } else if (!result?.ok) {
      setError("Something went wrong. Please try again.");
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <QuantumLogo size="lg" href="/" />
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
          <h1 className="text-xl font-bold text-white mb-1">{t.auth.signin.title}</h1>
          <p className="text-sm text-[#888888] mb-6">{t.auth.signin.subtitle}</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded mb-4 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.signin.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <Input
              label={t.auth.signin.password}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="flex justify-end -mt-1">
              <Link href="/auth/forgot-password" className="text-xs text-[#888888] hover:text-gold transition-colors">
                {t.auth.signin.forgotPassword}
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full gap-2">
              {t.auth.signin.signIn} <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-xs text-[#444444]">{t.common.or}</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-10 flex items-center justify-center gap-3 bg-transparent border border-[#1a1a1a] rounded text-sm text-[#888888] hover:text-white hover:border-[#2a2a2a] transition-all duration-200 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? t.common.loading : t.auth.signin.continueWithGoogle}
          </button>
        </div>

        <p className="text-center text-sm text-[#888888] mt-6">
          {t.auth.signin.noAccount}{" "}
          <Link href="/auth/signup" className="text-gold hover:text-gold-light transition-colors font-medium">
            {t.auth.signin.signUp}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
