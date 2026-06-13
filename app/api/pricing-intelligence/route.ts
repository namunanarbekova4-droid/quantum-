import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, targetCustomer, competitors, costs, coreValue, stage } = body;
    const locale: string = body.locale ?? "en";
    const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh" };
    const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

    const result = await generateJSON<{
      recommendedPrice: string;
      strategyName: string;
      strategyRationale: string;
      tiers: {
        name: string;
        price: string;
        description: string;
        features: string[];
        cta: string;
      }[];
      freeVsPaid: { free: string[]; paid: string[] };
      revenueProjections: {
        users: string;
        monthly: string;
        annual: string;
      }[];
      pricingMistakes: string[];
      freeTierRecommendation: string;
    }>(`You are a SaaS pricing expert who has watched startups leave money on the table by pricing against competitors instead of against value, and watched other startups kill their growth by pricing past what the market trusts at their stage.

Analyze pricing for this specific product. Do not give generic SaaS advice — every recommendation must be justified by something specific about this product, this customer, and this value proposition.

Product: ${product}
Target Customer: ${targetCustomer}
Competitors & Their Pricing: ${competitors}
Main Costs: ${costs}
Core Value/Transformation: ${coreValue}
Current Stage: ${stage}

Return JSON with:
- recommendedPrice: the specific price point you'd bet on — e.g. "$49/month" — not a range
- strategyName: the pricing strategy that fits this product's value delivery mechanism — e.g. "Value-based Pricing" or "Usage-based" or "Freemium" — pick the one that matches how customers experience value
- strategyRationale: 2 sentences explaining why this strategy fits THIS product specifically — not why it's a good strategy generally, but why it's right given how this product creates and delivers value
- tiers: array of 3 pricing tiers, each with {name, price, description, features (array of 5), cta} — tiers should create genuine psychological tension between them, not just feature lists
- freeVsPaid: {free: [list of 4 free features], paid: [list of 4 paid features]} — the free features should create habitual use; the paid features should create the "I need this now" moment
- revenueProjections: array of 3 rows: 100 users, 1000 users, 10000 users — each with {users, monthly, annual} — based on realistic conversion assumptions for this product type
- pricingMistakes: array of 5 specific mistakes THIS product is most likely to make given its category, customer type, and value prop — not generic SaaS warnings. Each mistake should name the specific failure mode: "Pricing at $19 signals you don't believe in the value you deliver to enterprise buyers" not "Don't price too low"
- freeTierRecommendation: a direct, opinionated recommendation — either argue for a free tier with the specific hook that makes it work for this product, or argue against it with the specific reason it would hurt this product. No hedging. One clear position.${langInstruction}`);

    return NextResponse.json(result);
  } catch (err) {
    console.error("pricing-intelligence error:", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
