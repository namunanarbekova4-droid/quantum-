"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
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
      setError(result.error === "CredentialsSignin"
        ? "Invalid email or password. Please try again."
        : `Error: ${result.error}`);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ background: "#06040F" }}>
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo above card */}
        <div className="flex flex-col items-center mb-8">
          <QuantumLogo size="lg" href="/" showTagline={false} />
          <p className="text-[#8B7CF8] text-xs tracking-[2px] uppercase mt-3">Your AI co-founder from day one</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: "#0F0A1F", border: "1px solid #1A1040", boxShadow: "0 0 40px rgba(124,58,237,0.1)" }}>
          <h1 className="text-xl font-bold text-white mb-1">{t.auth.signin.title}</h1>
          <p className="text-sm mb-6" style={{ color: "#8B7CF8" }}>{t.auth.signin.subtitle}</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded-lg mb-4 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8B7CF8" }}>{t.auth.signin.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{ background: "#06040F", border: "1px solid #1A1040" }}
                onFocus={(e) => { e.currentTarget.style.border = "1px solid #7C3AED"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                onBlur={(e) => { e.currentTarget.style.border = "1px solid #1A1040"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8B7CF8" }}>{t.auth.signin.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-10 px-3 pr-10 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background: "#06040F", border: "1px solid #1A1040" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid #7C3AED"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid #1A1040"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B7CF8] hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end -mt-1">
              <Link href="/auth/forgot-password" className="text-xs hover:text-[#C9A84C] transition-colors" style={{ color: "#8B7CF8" }}>
                {t.auth.signin.forgotPassword}
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#C9A84C", color: "#06040F" }}
            >
              {loading ? "Signing in..." : <>{t.auth.signin.signIn} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "#1A1040" }} />
            <span className="text-xs" style={{ color: "#3D2A6B" }}>{t.common.or}</span>
            <div className="flex-1 h-px" style={{ background: "#1A1040" }} />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-10 flex items-center justify-center gap-3 rounded-lg text-sm transition-all disabled:opacity-50 hover:border-[#7C3AED]/40 hover:text-white"
            style={{ background: "transparent", border: "1px solid #1A1040", color: "#8B7CF8" }}
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

        <p className="text-center text-sm mt-6" style={{ color: "#8B7CF8" }}>
          {t.auth.signin.noAccount}{" "}
          <Link href="/auth/signup" className="font-medium transition-colors hover:text-[#C9A84C]" style={{ color: "#A855F7" }}>
            {t.auth.signin.signUp}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
