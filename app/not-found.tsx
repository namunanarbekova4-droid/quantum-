import Link from "next/link";
import { QuantumLogo } from "@/components/ui/QuantumLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-6 text-center">
      <QuantumLogo size="md" className="mb-12" />
      <p className="font-mono text-[120px] font-bold text-[#1a1a1a] leading-none mb-6">404</p>
      <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-[#888888] max-w-md leading-relaxed mb-8">
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved, deleted, or you
        may have mistyped the URL.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gold text-[#080808] rounded hover:bg-gold-light transition-all duration-200"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gold border border-gold rounded hover:bg-gold/8 transition-all duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
