"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const roles = [
    { id: "FOUNDER", label: t.auth.signup.founder, desc: t.auth.signup.founderDesc },
  ];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!role) return "Please select your role to continue.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setLoading(false); return; }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created. Please sign in.");
        setLoading(false);
        router.push("/auth/signin");
        return;
      }
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <QuantumLogo size="lg" href="/" />
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8">
          <h1 className="text-xl font-bold text-white mb-1">Join Quantum — Your AI co-founder from day one</h1>
          <p className="text-sm text-[#888888] mb-6">{t.auth.signup.subtitle}</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded mb-4 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t.auth.signup.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Chen"
              autoComplete="name"
            />
            <Input
              label={t.auth.signup.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <Input
              label={t.auth.signup.password}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.signup.passwordHint}
              autoComplete="new-password"
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div>
              <label className="text-sm font-medium text-[#888888] mb-2 block">You're building something. Let's start.</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 border rounded-lg transition-all duration-200 text-center",
                      role === r.id
                        ? "bg-gold/10 border-gold/50 text-white"
                        : "bg-[#0d0d0d] border-[#1a1a1a] text-[#888888] hover:border-[#2a2a2a] hover:text-white"
                    )}
                  >
                    {role === r.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-[#080808]" />
                      </div>
                    )}
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs mt-0.5 opacity-70 leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} disabled={!role} className="w-full gap-2 mt-2">
              {t.auth.signup.createAccount} <ArrowRight className="w-4 h-4" />
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
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? t.common.loading : t.auth.signup.continueWithGoogle}
          </button>

          <p className="text-xs text-[#444444] text-center mt-4">
            {t.auth.signup.terms}{" "}
            <a href="#" className="text-[#888888] hover:text-gold transition-colors">{t.auth.signup.termsLink}</a>
            {" "}{t.auth.signup.and}{" "}
            <a href="#" className="text-[#888888] hover:text-gold transition-colors">{t.auth.signup.privacyLink}</a>.
          </p>
        </div>

        <p className="text-center text-sm text-[#888888] mt-6">
          {t.auth.signup.alreadyHaveAccount}{" "}
          <Link href="/auth/signin" className="text-gold hover:text-gold-light transition-colors font-medium">
            {t.auth.signup.signIn}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
