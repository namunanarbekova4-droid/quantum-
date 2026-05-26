import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum — Where Serious People Make Serious Decisions",
  description:
    "AI-powered decision intelligence platform for founders, investors, and executives. Get full intelligence reports, decision maps, and market data for your highest-stakes decisions.",
  keywords: "decision intelligence, AI decision making, business intelligence, founders, investors, executives",
  openGraph: {
    title: "Quantum — Where Serious People Make Serious Decisions",
    description: "AI-powered decision intelligence for your highest-stakes decisions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[#080808] text-white antialiased font-sans">{children}</body>
    </html>
  );
}
