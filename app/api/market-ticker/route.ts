import { NextResponse } from "next/server";
import { getCryptoPrices } from "@/lib/apis/coingecko";
import { getQuote, getTopMovers } from "@/lib/apis/alpha-vantage";

export const maxDuration = 30;

export async function GET() {
  try {
    const [crypto, spQuote, nasdaqQuote, goldQuote, movers] = await Promise.allSettled([
      getCryptoPrices(["bitcoin", "ethereum"]),
      getQuote("SPY"),
      getQuote("QQQ"),
      getQuote("GLD"),
      getTopMovers(),
    ]);

    return NextResponse.json({
      crypto: crypto.status === "fulfilled" ? crypto.value : [],
      indices: {
        sp500: spQuote.status === "fulfilled" ? spQuote.value : null,
        nasdaq: nasdaqQuote.status === "fulfilled" ? nasdaqQuote.value : null,
        gold: goldQuote.status === "fulfilled" ? goldQuote.value : null,
      },
      movers: movers.status === "fulfilled" ? movers.value : { gainers: [], losers: [] },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
