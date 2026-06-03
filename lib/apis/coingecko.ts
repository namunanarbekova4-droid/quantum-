const BASE = "https://api.coingecko.com/api/v3";

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

let cache: { data: CryptoPrice[]; ts: number } | null = null;
const CACHE_TTL = 3 * 60 * 1000; // 3 min

export async function getCryptoPrices(
  ids = ["bitcoin", "ethereum", "solana", "binancecoin", "ripple"]
): Promise<CryptoPrice[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.data;

  try {
    const params = new URLSearchParams({
      vs_currency: "usd",
      ids: ids.join(","),
      order: "market_cap_desc",
      per_page: "10",
      page: "1",
      sparkline: "false",
      price_change_percentage: "24h",
    });

    const res = await fetch(`${BASE}/coins/markets?${params}`, {
      next: { revalidate: 180 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data: CryptoPrice[] = await res.json();
    cache = { data, ts: Date.now() };
    return data;
  } catch {
    return [];
  }
}
