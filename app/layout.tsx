import type { Metadata } from "next";
import { Inter, Josefin_Sans, Cormorant_Garamond, Noto_Sans_SC } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { LanguageProvider } from "@/lib/i18n";
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

const notoSansSC = Noto_Sans_SC({
  // @ts-expect-error - chinese-simplified is valid at runtime despite type mismatch
  subsets: ["chinese-simplified"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sc",
  display: "swap",
  preload: false,
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
    <html lang="en" className={`${inter.variable} ${josefinSans.variable} ${cormorantGaramond.variable} ${notoSansSC.variable}`}>
      <body className="bg-[#080808] text-white antialiased font-sans">
        <SessionProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
