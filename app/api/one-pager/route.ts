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
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const prompt = `You are a world-class startup pitch writer. Create a compelling one-pager for this startup.

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
    "headline": "compelling headline combining name and tagline",
    "problem": "2-3 sentences making the problem vivid and urgent",
    "solution": "2-3 sentences describing the solution crisply",
    "market": "2 sentences on market size and opportunity",
    "model": "1-2 sentences on how money is made",
    "traction": "2-3 sentences highlighting key proof points",
    "team": "2-3 sentences on why this team wins",
    "ask": "clear ask statement",
    "useOfFunds": "2-3 sentences on fund allocation",
    "closingStatement": "1-2 powerful closing sentences that leave investors wanting more"
  }
}${langInstruction}`;

  const result = await generateJSON<OnePagerResult>(prompt);
  return NextResponse.json(result);
}
