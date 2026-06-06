import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, targetCustomer, competitors, costs, coreValue, stage } = body;

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
    }>(`You are a SaaS pricing strategy expert. Analyze pricing for:
Product: ${product}
Target Customer: ${targetCustomer}
Competitors & Their Pricing: ${competitors}
Main Costs: ${costs}
Core Value/Transformation: ${coreValue}
Current Stage: ${stage}

Return JSON with:
- recommendedPrice: e.g. "$49/month"
- strategyName: e.g. "Value-based Pricing" or "Usage-based" or "Freemium"
- strategyRationale: 2-sentence explanation
- tiers: array of 3 pricing tiers, each with {name, price, description, features (array of 5), cta}
- freeVsPaid: {free: [list of 4 free features], paid: [list of 4 paid features]}
- revenueProjections: array of 3 rows: 100 users, 1000 users, 10000 users — each with {users, monthly, annual}
- pricingMistakes: array of 5 specific pricing mistakes to avoid for this product
- freeTierRecommendation: 2-sentence recommendation on free tier strategy`);

    return NextResponse.json(result);
  } catch (err) {
    console.error("pricing-intelligence error:", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
