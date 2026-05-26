import type { Metadata } from "next";
import { Inter, Josefin_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
  variable: "--font-josefin",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-cormorant",
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
    <html lang="en" className={`${inter.variable} ${josefinSans.variable} ${cormorantGaramond.variable}`}>
      <body className="bg-[#080808] text-white antialiased font-sans">{children}</body>
    </html>
  );
}
