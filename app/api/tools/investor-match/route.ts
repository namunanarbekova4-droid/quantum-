import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 30;

interface InvestorMatch {
  name: string;
  type: string;
  focus: string;
  checkSize: string;
  stage: string;
  geography: string;
  matchScore: number;
  whyMatched: string;
  investmentFit: string;
  notablePortfolio: string;
}

interface MatchResult {
  matches: InvestorMatch[];
  summary: string;
  approach: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { industry, stage, raiseAmount, geography, summary, role } = await req.json();

  const isInvestor = role === "INVESTOR";
  const prompt = isInvestor
    ? `You are a matchmaking AI for investors. An investor has the following thesis:
Industry focus: ${industry}
Check size: ${raiseAmount}
Stage preference: ${stage}
Geography: ${geography}
Thesis: ${summary}

Generate 10 ideal founder profiles they should meet. Return JSON:
{
  "matches": [
    {
      "name": "<Founder Name>",
      "type": "Founder",
      "focus": "<their industry/product>",
      "checkSize": "<their raise amount>",
      "stage": "<their stage>",
      "geography": "<location>",
      "matchScore": <70-99>,
      "whyMatched": "<specific reason>",
      "investmentFit": "<fit explanation>",
      "notablePortfolio": "<achievements>"
    }
  ],
  "summary": "<2 sentence overview>",
  "approach": "<how to reach out>"
}`
    : `You are a fundraising advisor. A founder is looking for investors:
Industry: ${industry}
Stage: ${stage}
Raise amount: $${raiseAmount}
Geography: ${geography}
Startup summary: ${summary}

Identify 20 specific, real investor archetypes (VCs, angels, family offices) that would be ideal matches. Return JSON:
{
  "matches": [
    {
      "name": "<Investor/Fund Name>",
      "type": "<VC|Angel|Family Office|Corporate VC>",
      "focus": "<their investment focus>",
      "checkSize": "<typical check size>",
      "stage": "<stages they invest in>",
      "geography": "<location/focus region>",
      "matchScore": <70-99>,
      "whyMatched": "<specific reason this investor fits>",
      "investmentFit": "<what excites them about your deal>",
      "notablePortfolio": "<notable investments>"
    }
  ],
  "summary": "<2 sentence fundraising assessment>",
  "approach": "<recommended outreach strategy>"
}`;

  try {
    const result = await generateJSON<MatchResult>(prompt);

    await supabaseAdmin.from("investor_matches").insert({
      user_id: session.user.id,
      role: role || "FOUNDER",
      industry,
      stage,
      raise_amount: raiseAmount,
      geography,
      summary_text: summary,
      matches: result.matches,
      status: "complete",
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
