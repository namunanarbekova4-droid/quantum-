"use client";
import { useEffect } from "react";
import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 text-center">
      <QuantumLogo size="md" className="mb-12" />
      <p className="font-mono text-[120px] font-bold text-[#1a1a1a] leading-none mb-6">500</p>
      <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="text-[#888888] max-w-md leading-relaxed mb-8">
        An unexpected error occurred. Our team has been notified. Please try again or return to
        your dashboard.
      </p>
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200"
        >
          Try Again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gold border border-gold rounded hover:bg-gold/8 transition-all duration-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
