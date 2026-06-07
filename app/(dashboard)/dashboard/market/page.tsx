"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe, TrendingUp, TrendingDown, Loader2, RefreshCw,
  ArrowUpRight, TrendingUp as MarketsIcon, Cpu, BarChart2,
  Bitcoin, Building2, Rocket, Handshake, Coins, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface Article {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: { name: string };
  content?: string;
}

interface TickerData {
  crypto: { symbol: string; name: string; current_price: number; price_change_percentage_24h: number }[];
  indices: {
    sp500: { symbol: string; price: number; changePercent: number } | null;
    nasdaq: { symbol: string; price: number; changePercent: number } | null;
    gold: { symbol: string; price: number; changePercent: number } | null;
  };
  movers: {
    gainers: { ticker: string; price: string; change_percentage: string }[];
    losers: { ticker: string; price: string; change_percentage: string }[];
  };
}

interface Indicator {
  indicator: string;
  value: number | null;
  year: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: { label: string; keywords: string[]; Icon: React.ElementType }[] = [
  { label: "Funding",        keywords: ["funding","investment","series","raised","venture capital","seed round","pre-seed","angel"], Icon: Coins },
  { label: "New Tools",      keywords: ["tool","saas","launch","product hunt","beta","new feature","release"],                      Icon: Cpu },
  { label: "Founder Stories",keywords: ["founder","startup story","built","raised","journey","entrepreneur","solofounder"],        Icon: Rocket },
  { label: "Opportunities",  keywords: ["grant","accelerator","ycombinator","techstars","program","apply","open application","fellowship"], Icon: BarChart2 },
  { label: "Tips & Lessons", keywords: ["how to","tips","advice","lesson","mistake","learned","playbook"],                         Icon: Building2 },
  { label: "AI & Tech",      keywords: ["ai","artificial intelligence","openai","claude","gpt","llm","automation"],                 Icon: Cpu },
];

function detectCategory(title: string) {
  const lower = title.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return { label: "Business", Icon: Briefcase };
}

function readTime(content?: string) {
  if (!content) return "3 min read";
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── image with fallback ───────────────────────────────────────────────────────

function ArticleImage({ src, alt, height, category }: {
  src?: string; alt: string; height: number; category: ReturnType<typeof detectCategory>;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = category.Icon;

  if (!src || failed) {
    return (
      <div
        className="w-full flex-shrink-0 flex items-center justify-center relative overflow-hidden"
        style={{ height }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#161410]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #C9A84C 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative flex flex-col items-center gap-2 opacity-30">
          <Icon className="w-8 h-8 text-[#C9A84C]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-shrink-0 overflow-hidden" style={{ height }}>
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        style={{ height }}
      />
    </div>
  );
}

// ── category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ label }: { label: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide"
      style={{
        background: "rgba(201,168,76,0.18)",
        border: "1px solid #C9A84C",
        color: "#E8C97A",
        backdropFilter: "blur(8px)",
      }}
    >
      {label}
    </span>
  );
}

// ── news card ─────────────────────────────────────────────────────────────────

function NewsCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const cat = detectCategory(article.title);
  const imageHeight = featured ? 280 : 180;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-200"
      style={{ willChange: "transform" }}
      whileHover={{
        y: -4,
        borderColor: "rgba(201,168,76,0.5)",
        boxShadow: "0 0 20px rgba(201,168,76,0.12)",
      }}
    >
      {/* Image */}
      <div className="relative">
        <ArticleImage src={article.urlToImage} alt={article.title} height={imageHeight} category={cat} />
        {/* Badge over image */}
        <div className="absolute top-3 left-3">
          <CategoryBadge label={cat.label} />
        </div>
      </div>

      {/* Body */}
      <div className={cn("flex flex-col flex-1 p-6", !featured && "p-5")}>
        {/* Source + time */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[#555] font-medium">{article.source.name}</span>
          <span className="text-[#333] text-xs">•</span>
          <span className="text-xs text-[#444]">{timeAgo(article.publishedAt)}</span>
        </div>

        {/* Headline */}
        <h3 className={cn(
          "font-bold text-white leading-snug line-clamp-2 mb-2",
          featured ? "text-xl" : "text-sm",
        )}>
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-xs text-[#666] leading-relaxed line-clamp-2 flex-1 mb-4">
            {article.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#1a1a1a]">
          <span className="text-xs text-[#444]">{readTime(article.content)}</span>
          {article.url && article.url !== "#" && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-semibold text-[#C9A84C] hover:text-[#E8C97A] transition-colors"
            >
              Read Full Article
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function NewsSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg overflow-hidden animate-pulse">
      <div className={cn("w-full bg-[#1a1a1a]", featured ? "h-[280px]" : "h-[180px]")} />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-[#1a1a1a] rounded w-1/3" />
        <div className="h-4 bg-[#1a1a1a] rounded w-full" />
        <div className="h-4 bg-[#1a1a1a] rounded w-5/6" />
        <div className="h-3 bg-[#1a1a1a] rounded w-2/3" />
      </div>
    </div>
  );
}

// ── change tag (ticker sidebar) ───────────────────────────────────────────────

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-green-400" : "text-red-400")}>
      <Icon className="w-3 h-3" />{positive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function FounderFeedPage() {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [a, tickerRes, ind] = await Promise.allSettled([
      fetch("/api/news").then((r) => r.json()),
      fetch("/api/market-ticker").then((r) => r.json()),
      fetch("/api/economic-indicators").then((r) => r.json()),
    ]);
    if (a.status === "fulfilled" && Array.isArray(a.value)) setArticles(a.value);
    if (tickerRes.status === "fulfilled" && !tickerRes.value.error) setTicker(tickerRes.value);
    if (ind.status === "fulfilled" && Array.isArray(ind.value)) setIndicators(ind.value);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const [featured, ...rest] = articles.slice(0, 10);

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">Founder Feed</h1>
            </div>
            <p className="text-[#888888] text-sm">Articles, insights and opportunities for builders like you.</p>
          </div>
          <button
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 rounded-lg text-xs transition-all"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> {t.market.refresh}
          </button>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8">

          {/* News feed */}
          <div className="space-y-6">
            <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest">For Founders</h2>

            {loading ? (
              <div className="space-y-6">
                <NewsSkeleton featured />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <NewsSkeleton key={i} />)}
                </div>
              </div>
            ) : articles.length === 0 ? (
              /* empty state */
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-16 text-center space-y-3">
                <Globe className="w-10 h-10 text-[#2a2a2a] mx-auto" />
                <p className="text-white font-semibold">No market news available</p>
                <p className="text-[#555] text-sm">Business intelligence updates will appear here.</p>
                <button
                  onClick={() => { setRefreshing(true); load(); }}
                  className="mt-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] rounded-lg text-xs font-semibold hover:bg-[#C9A84C]/20 transition-all"
                >
                  Refresh Feed
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Featured */}
                {featured && <NewsCard article={featured} featured />}

                {/* Grid of remaining */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rest.map((article, i) => (
                      <motion.div key={i} transition={{ delay: i * 0.05 }}>
                        <NewsCard article={article} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: ticker + indicators */}
          <div className="space-y-5">
            <h2 className="text-xs font-semibold text-[#888888] uppercase tracking-widest">{t.market.liveMarkets}</h2>

            {!ticker ? (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 text-center text-[#888888] text-sm">
                {t.market.noMarketKey}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Indices */}
                <div className="space-y-2">
                  {[
                    ticker.indices.sp500 && { label: "S&P 500 (SPY)", ...ticker.indices.sp500 },
                    ticker.indices.nasdaq && { label: "NASDAQ (QQQ)", ...ticker.indices.nasdaq },
                    ticker.indices.gold && { label: "Gold (GLD)", ...ticker.indices.gold },
                  ].filter(Boolean).map((idx) => idx && (
                    <div key={idx.label} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 flex justify-between items-center">
                      <span className="text-xs text-[#888888]">{idx.label}</span>
                      <div className="text-right">
                        <p className="text-white font-bold text-sm">${idx.price?.toFixed(2) ?? "—"}</p>
                        {idx.changePercent !== undefined && <ChangeTag value={idx.changePercent} />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Crypto */}
                {ticker.crypto.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{t.market.crypto}</p>
                    {ticker.crypto.map((c) => (
                      <div key={c.symbol} className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 flex justify-between items-center">
                        <span className="text-xs text-[#888888] uppercase">{c.symbol} — {c.name}</span>
                        <div className="text-right">
                          <p className="text-white font-bold text-sm">${c.current_price?.toLocaleString() ?? "—"}</p>
                          <ChangeTag value={c.price_change_percentage_24h} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Top gainers */}
                {ticker.movers.gainers.length > 0 && (
                  <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">{t.market.topGainers}</p>
                    {ticker.movers.gainers.slice(0, 4).map((g) => (
                      <div key={g.ticker} className="flex justify-between text-xs">
                        <span className="text-white">{g.ticker}</span>
                        <span className="text-green-400">{g.change_percentage}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Economic indicators */}
            {indicators.length > 0 && (
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-[#888888] uppercase tracking-wider">{t.market.economicIndicators}</p>
                {indicators.map((ind, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs text-[#888888]">{ind.indicator}</span>
                    <span className="text-xs font-semibold text-white">
                      {ind.value !== null ? `${ind.value.toFixed(2)}%` : "N/A"} <span className="text-[#444]">({ind.year})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
