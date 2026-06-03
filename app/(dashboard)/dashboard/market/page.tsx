"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, TrendingUp, TrendingDown, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface Article {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: { name: string };
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

function ChangeTag({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-green-400" : "text-red-400")}>
      <Icon className="w-3 h-3" />{positive ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

export default function MarketPage() {
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

  return (
    <div className="min-h-screen bg-[#080808] p-4 sm:p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#C9A84C]" />
              <h1 className="text-2xl font-bold text-white">{t.market.title}</h1>
            </div>
            <p className="text-[#888888] text-sm">{t.market.subtitle}</p>
          </div>
          <button onClick={() => { setRefreshing(true); load(); }} disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 border border-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#C9A84C]/30 rounded-lg text-xs transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> {t.market.refresh}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-white">{t.market.businessNews}</h2>
              {articles.length === 0 ? (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-8 text-center text-[#888888] text-sm">
                  {t.market.noNewsKey}
                </div>
              ) : articles.slice(0, 10).map((article, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#C9A84C]/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white leading-snug">{article.title}</p>
                      {article.description && <p className="text-xs text-[#888888] mt-1.5 leading-relaxed line-clamp-2">{article.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#555]">
                        <span>{article.source.name}</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {article.url && article.url !== "#" && (
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-[#888888] hover:text-[#C9A84C] transition-colors flex-shrink-0 mt-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white">{t.market.liveMarkets}</h2>
              {!ticker ? (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-lg p-6 text-center text-[#888888] text-sm">
                  {t.market.noMarketKey}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
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
        )}
      </motion.div>
    </div>
  );
}
