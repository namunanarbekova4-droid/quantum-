import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface DealAnalysis {
  teamScore: number;
  marketSize: string;
  businessModelStrength: number;
  riskFactors: string[];
  competitiveLandscape: string;
  financialProjectionsReview: string;
  recommendation: "INVEST" | "PASS" | "DUE_DILIGENCE";
  confidenceLevel: number;
  summary: string;
  keyStrengths: string[];
  keyWeaknesses: string[];
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deckText, companyName } = await req.json();
  if (!deckText) return NextResponse.json({ error: "Deck content required" }, { status: 400 });

  const prompt = `You are a senior venture capital analyst. Analyze this pitch deck content and return a structured investment analysis.

Company: ${companyName || "Unknown"}

Pitch Deck Content:
"""
${deckText.slice(0, 8000)}
"""

Return JSON with this exact structure:
{
  "teamScore": <0-100 integer>,
  "marketSize": "<TAM/SAM/SOM assessment>",
  "businessModelStrength": <0-100 integer>,
  "riskFactors": ["<risk1>", "<risk2>", "<risk3>"],
  "competitiveLandscape": "<competitive analysis>",
  "financialProjectionsReview": "<assessment of financial projections>",
  "recommendation": "<INVEST|PASS|DUE_DILIGENCE>",
  "confidenceLevel": <0-100 integer>,
  "summary": "<2-3 sentence executive summary>",
  "keyStrengths": ["<strength1>", "<strength2>", "<strength3>"],
  "keyWeaknesses": ["<weakness1>", "<weakness2>", "<weakness3>"]
}`;

  try {
    const analysis = await generateJSON<DealAnalysis>(prompt);

    const { data, error } = await supabaseAdmin
      .from("deal_analyses")
      .insert({
        user_id: session.user.id,
        company_name: companyName || "Unknown",
        deck_text: deckText.slice(0, 5000),
        analysis,
        recommendation: analysis.recommendation,
        confidence_level: analysis.confidenceLevel,
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
    .from("deal_analyses")
    .select("id, company_name, recommendation, confidence_level, created_at, status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}
