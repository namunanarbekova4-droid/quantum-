import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface MarketEntryAnalysis {
  marketSize: string;
  growthRate: string;
  topCompetitors: string[];
  regulatoryOverview: string;
  culturalConsiderations: string;
  entryStrategies: { name: string; description: string; pros: string[]; cons: string[] }[];
  riskScore: number;
  recommendedPath: string;
  budgetEstimate: string;
  timeline: string;
  summary: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetCountry, industry, companySize, marketPosition } = await req.json();
  if (!targetCountry || !industry) {
    return NextResponse.json({ error: "Country and industry required" }, { status: 400 });
  }

  const prompt = `You are a global market entry strategist. Analyze market entry into:

Target Country: ${targetCountry}
Industry: ${industry}
Company Size: ${companySize || "SME"}
Current Market Position: ${marketPosition || "established in home market"}

Provide a comprehensive market entry analysis. Return JSON:
{
  "marketSize": "<TAM with number>",
  "growthRate": "<annual growth rate>",
  "topCompetitors": ["<competitor 1>", "<competitor 2>", "<competitor 3>"],
  "regulatoryOverview": "<key regulations and compliance requirements>",
  "culturalConsiderations": "<cultural factors affecting market entry>",
  "entryStrategies": [
    {
      "name": "<strategy name>",
      "description": "<strategy description>",
      "pros": ["<pro 1>", "<pro 2>"],
      "cons": ["<con 1>", "<con 2>"]
    }
  ],
  "riskScore": <0-100>,
  "recommendedPath": "<specific recommended entry strategy and why>",
  "budgetEstimate": "<budget range for entry>",
  "timeline": "<realistic timeline to market>",
  "summary": "<2-3 sentence executive assessment>"
}`;

  try {
    const analysis = await generateJSON<MarketEntryAnalysis>(prompt);

    const { data, error } = await supabaseAdmin
      .from("market_entry_reports")
      .insert({
        user_id: session.user.id,
        target_country: targetCountry,
        industry,
        company_size: companySize,
        market_position: marketPosition,
        analysis,
        risk_score: analysis.riskScore,
        status: "complete",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("market_entry_reports")
    .select("id, target_country, industry, risk_score, created_at, status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json(data || []);
}
