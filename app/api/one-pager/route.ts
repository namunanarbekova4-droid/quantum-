import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface OnePagerResult {
  onePager: {
    headline: string;
    problem: string;
    solution: string;
    market: string;
    model: string;
    traction: string;
    team: string;
    ask: string;
    useOfFunds: string;
    closingStatement: string;
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    startupName,
    tagline,
    problem,
    solution,
    targetMarket,
    businessModel,
    traction,
    team,
    amountRaising,
    useOfFunds,
  } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
    kz: "Kazakh",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const prompt = `An investor one-pager has one job: get a meeting. It fails when it tries to explain everything. The investor does not need to understand the product after reading — they need to want to ask questions.

Every section must earn the investor's continued attention. If a section doesn't make them more curious or more confident, it shouldn't be there.

Startup Name: ${startupName}
Tagline: ${tagline}
Problem: ${problem}
Solution: ${solution}
Target Market: ${targetMarket}
Business Model: ${businessModel}
Traction: ${traction}
Team: ${team}
Amount Raising: ${amountRaising}
Use of Funds: ${useOfFunds}

Return ONLY a JSON object with this exact structure:
{
  "onePager": {
    "headline": "A bold claim with the proof baked in — not 'the future of X' but '[Company]: [specific claim that implies scale or defensibility]'",
    "problem": "2-3 sentences that make the reader feel the pain viscerally — not 'many businesses struggle with X' but the specific texture of the problem from the customer's perspective. A good problem section makes the investor think 'yes, I've seen this'",
    "solution": "2-3 sentences. What it does, not how it works. The mechanism only matters if it's the moat.",
    "market": "2 sentences. Lead with the specific number that is relevant (SAM, not TAM inflated to billions), then why now.",
    "model": "1-2 sentences on the exact revenue mechanism — who pays, how much, how often.",
    "traction": "Lead with the most specific, surprising number even if it's small — '40 paying users in 3 weeks' beats 'growing user base.' Real proof of demand beats projections every time.",
    "team": "2-3 sentences on the one specific thing in each founder's background that explains why they will win this, not generic credentials.",
    "ask": "Specific amount, specific use of funds in 3 buckets, specific milestone it enables — 'Raising $X to reach Y by [date]'",
    "useOfFunds": "3 specific allocations with percentages and what each one accomplishes",
    "closingStatement": "1-2 sentences that crystallize the bet: why this team, this market, this moment — not inspiration but conviction"
  }
}${langInstruction}`;

  const result = await generateJSON<OnePagerResult>(prompt);
  return NextResponse.json(result);
}
