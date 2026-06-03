const BASE = "https://newsapi.org/v2/everything";
const KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || process.env.NEWS_API_KEY || "";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: { name: string };
  content?: string;
}

interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

const cache = new Map<string, { data: NewsArticle[]; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 min

export async function fetchNews(options: {
  query?: string;
  category?: string;
  pageSize?: number;
}): Promise<NewsArticle[]> {
  const { query = "business markets finance", pageSize = 10 } = options;
  const cacheKey = `${query}-${pageSize}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  if (!KEY) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      language: "en",
      sortBy: "publishedAt",
      pageSize: String(pageSize),
      apiKey: KEY,
    });

    const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const data: NewsResponse = await res.json();
    if (data.status !== "ok") throw new Error("NewsAPI error");
    const articles = data.articles.filter((a) => a.title && a.title !== "[Removed]");
    cache.set(cacheKey, { data: articles, ts: Date.now() });
    return articles;
  } catch {
    return [];
  }
}

export async function fetchNewsByRole(role: string, industry?: string): Promise<NewsArticle[]> {
  const queries: Record<string, string> = {
    FOUNDER: "startup funding venture capital entrepreneurship",
    INVESTOR: "investment portfolio market returns private equity",
    EXECUTIVE: "corporate strategy leadership mergers acquisitions",
  };
  const base = queries[role] || "business markets";
  const q = industry ? `${base} ${industry}` : base;
  return fetchNews({ query: q, pageSize: 10 });
}
