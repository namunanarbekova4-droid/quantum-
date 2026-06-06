import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      month, year, mrr, users, growth,
      wins, challenges, decisions, needs, goals,
      founderName, companyName,
    } = body;
    const locale: string = body.locale ?? "en";
    const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
    const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

    const update = await generateJSON<{
      subjectLine: string;
      metricsTable: { label: string; value: string; change?: string }[];
      winsSection: string;
      challengesSection: string;
      decisionsSection: string;
      asksSection: string;
      nextMonthFocus: string;
      closingLine: string;
    }>(`Write a professional investor board update email for ${companyName || "our startup"}.

Month/Year: ${month} ${year}
Founder: ${founderName || "Founder"}
MRR: $${mrr || 0}
Total Users: ${users || 0}
Growth MoM: ${growth || 0}%
This Month's Wins: ${wins}
Challenges: ${challenges}
Decisions Made: ${decisions}
What We Need From Investors: ${needs}
Next Month Goals: ${goals}

Return JSON with:
- subjectLine: compelling email subject line
- metricsTable: array of {label, value, change} for key metrics
- winsSection: professional prose for wins (2-3 paragraphs)
- challengesSection: honest but solution-oriented prose for challenges
- decisionsSection: clear prose about decisions made
- asksSection: clear, specific asks from investors
- nextMonthFocus: prose for next month objectives
- closingLine: warm professional closing sentence${langInstruction}`);

    return NextResponse.json(update);
  } catch (err) {
    console.error("board-update error:", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
