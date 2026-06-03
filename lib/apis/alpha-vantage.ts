const BASE = "https://www.alphavantage.co/query";
const KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Cache: symbol -> { data, ts }
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function fetchAV(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({ ...params, apikey: KEY }).toString();
  const cacheKey = qs;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const res = await fetch(`${BASE}?${qs}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`AlphaVantage ${res.status}`);
  const data = await res.json();
  if (data["Note"] || data["Information"]) throw new Error("Rate limit reached");
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

export async function getQuote(symbol: string): Promise<QuoteData> {
  const data = await fetchAV({ function: "GLOBAL_QUOTE", symbol }) as Record<string, Record<string, string>>;
  const q = data["Global Quote"] ?? {};
  return {
    symbol,
    price: parseFloat(q["05. price"] || "0"),
    change: parseFloat(q["09. change"] || "0"),
    changePercent: parseFloat((q["10. change percent"] || "0%").replace("%", "")),
    high: parseFloat(q["03. high"] || "0"),
    low: parseFloat(q["04. low"] || "0"),
    volume: parseInt(q["06. volume"] || "0"),
  };
}

export interface TopMover {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
}

export async function getTopMovers(): Promise<{ gainers: TopMover[]; losers: TopMover[] }> {
  try {
    const data = await fetchAV({ function: "TOP_GAINERS_LOSERS" }) as Record<string, TopMover[]>;
    return {
      gainers: (data["top_gainers"] || []).slice(0, 5),
      losers: (data["top_losers"] || []).slice(0, 5),
    };
  } catch {
    return { gainers: [], losers: [] };
  }
}
