"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";
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
      if (result?.ok && !result?.error) {
        window.location.href = "/onboarding";
        return;
      }
      // Retry once after brief delay (DB write may not be committed yet)
      await new Promise((r) => setTimeout(r, 600));
      const retry = await signIn("credentials", { email, password, redirect: false });
      if (retry?.ok && !retry?.error) {
        window.location.href = "/onboarding";
        return;
      }
      setError("Account created. Please sign in.");
      setLoading(false);
      router.push("/auth/signin");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#06040F" }}>
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo above card */}
        <div className="flex flex-col items-center mb-8">
          <QuantumLogo size="lg" href="/" showTagline={false} />
          <p className="text-[#8B7CF8] text-xs tracking-[2px] uppercase mt-3">For founders before the world believes</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: "#0F0A1F", border: "1px solid #1A1040", boxShadow: "0 0 40px rgba(124,58,237,0.1)" }}>
          <h1 className="text-xl font-bold text-white mb-1">Join Quantum</h1>
          <p className="text-sm mb-6" style={{ color: "#8B7CF8" }}>{t.auth.signup.subtitle}</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-danger/10 border border-danger/20 rounded-lg mb-4 text-sm text-danger">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: t.auth.signup.name, value: name, onChange: setName, type: "text", placeholder: "Alex Chen", autoComplete: "name" },
              { label: t.auth.signup.email, value: email, onChange: setEmail, type: "email", placeholder: "you@company.com", autoComplete: "email" },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8B7CF8" }}>{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  className="w-full h-10 px-3 rounded-lg text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background: "#06040F", border: "1px solid #1A1040" }}
                  onFocus={(e) => { e.currentTarget.style.border = "1px solid #7C3AED"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1px solid #1A1040"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8B7CF8" }}>{t.auth.signup.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.signup.passwordHint}
                  autoComplete="new-password"
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

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#8B7CF8" }}>You're building something. Let's start.</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 text-center",
                      role === r.id
                        ? "text-white"
                        : "text-[#8B7CF8] hover:text-white"
                    )}
                    style={{
                      border: role === r.id ? "1px solid rgba(201,168,76,0.5)" : "1px solid #1A1040",
                      background: role === r.id ? "rgba(201,168,76,0.08)" : "#06040F",
                    }}
                  >
                    {role === r.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
                        <Check className="w-2.5 h-2.5" style={{ color: "#06040F" }} />
                      </div>
                    )}
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs mt-0.5 opacity-70 leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !role}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 mt-2"
              style={{ background: "#C9A84C", color: "#06040F" }}
            >
              {loading ? "Creating account..." : <>{t.auth.signup.createAccount} <ArrowRight className="w-4 h-4" /></>}
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
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? t.common.loading : t.auth.signup.continueWithGoogle}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "#3D2A6B" }}>
            {t.auth.signup.terms}{" "}
            <a href="#" className="hover:text-[#C9A84C] transition-colors" style={{ color: "#8B7CF8" }}>{t.auth.signup.termsLink}</a>
            {" "}{t.auth.signup.and}{" "}
            <a href="#" className="hover:text-[#C9A84C] transition-colors" style={{ color: "#8B7CF8" }}>{t.auth.signup.privacyLink}</a>.
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#8B7CF8" }}>
          {t.auth.signup.alreadyHaveAccount}{" "}
          <Link href="/auth/signin" className="font-medium transition-colors hover:text-[#C9A84C]" style={{ color: "#A855F7" }}>
            {t.auth.signup.signIn}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
