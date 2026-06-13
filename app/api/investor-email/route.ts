import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface EmailVersion {
  subjects: string[];
  body: string;
}

interface InvestorEmailResult {
  emails: {
    direct: EmailVersion;
    warm: EmailVersion;
    dataDriven: EmailVersion;
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    investorName,
    fundName,
    whyThisInvestor,
    startup,
    traction,
    amountRaising,
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

  const prompt = `Most cold investor emails fail because they explain the product instead of fitting the investor's thesis. Investors are not reading to learn about startups — they're scanning for the one that matches what they've already decided they want to fund.

You are writing three versions of an outreach email for this specific investor. Each one under 150 words. One clear next action at the end of each — not two options, one.

Investor: ${investorName} at ${fundName}
Why this investor: ${whyThisInvestor}
Startup: ${startup}
Traction: ${traction}
Raising: ${amountRaising}

Rules for each version:
- "warm": Must reference something specific about this investor's known portfolio or stated thesis that proves the founder did real homework — not "I've followed your work" but "You backed [specific company] which means you understand [specific insight] — this is the same problem one layer down." Under 150 words.
- "direct": Must open with the single most impressive data point from the traction — not the company name, not the founder's background, the number. The rest of the email earns that number. Under 150 words.
- "dataDriven": First sentence must make the math undeniable — market size, current run rate, growth rate, or comparison to a known outcome. The investor should be able to see the return potential in the first two sentences. Under 150 words.

Return ONLY a JSON object:
{
  "emails": {
    "direct": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "Opens with the most impressive single data point. Rest of email justifies it. One next action. Under 150 words."
    },
    "warm": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "References specific portfolio company or thesis. Shows why this fits. One next action. Under 150 words."
    },
    "dataDriven": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "Math-first. Return potential visible in first two sentences. One next action. Under 150 words."
    }
  }
}

Sign off with just [Your Name]. No "I hope this finds you well." No "Just wanted to reach out."${langInstruction}`;

  const result = await generateJSON<InvestorEmailResult>(prompt);
  return NextResponse.json(result);
}
