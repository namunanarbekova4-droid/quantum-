const BASE = "https://api.worldbank.org/v2";

export interface Indicator {
  country: string;
  countryCode: string;
  indicator: string;
  value: number | null;
  year: number;
}

const cache = new Map<string, { data: Indicator[]; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchIndicator(
  countryCode: string,
  indicatorCode: string,
  label: string
): Promise<Indicator | null> {
  const key = `${countryCode}-${indicatorCode}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data[0] ?? null;

  try {
    const url = `${BASE}/country/${countryCode}/indicator/${indicatorCode}?format=json&mrv=1&per_page=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    const records = json[1];
    if (!Array.isArray(records) || records.length === 0) return null;
    const r = records[0];
    const result: Indicator = {
      country: r.country?.value ?? countryCode,
      countryCode,
      indicator: label,
      value: r.value,
      year: parseInt(r.date),
    };
    cache.set(key, { data: [result], ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

export async function getEconomicIndicators(countryCode = "US"): Promise<Indicator[]> {
  const indicators = [
    { code: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth Rate (%)" },
    { code: "FP.CPI.TOTL.ZG", label: "Inflation Rate (%)" },
    { code: "SL.UEM.TOTL.ZS", label: "Unemployment Rate (%)" },
    { code: "NE.EXP.GNFS.ZS", label: "Exports (% of GDP)" },
  ];

  const results = await Promise.allSettled(
    indicators.map((i) => fetchIndicator(countryCode, i.code, i.label))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Indicator> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}
