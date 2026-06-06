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
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const prompt = `You are an expert at writing cold investor outreach emails that actually get responses. Write 3 versions of an investor email.

Investor: ${investorName} at ${fundName}
Why this investor: ${whyThisInvestor}
Startup: ${startup}
Traction: ${traction}
Raising: ${amountRaising}

Return ONLY a JSON object:
{
  "emails": {
    "direct": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "Direct, no-fluff email. Gets to the point immediately. 150-200 words."
    },
    "warm": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "Warmer tone that builds connection first. References why this specific investor. 180-220 words."
    },
    "dataDriven": {
      "subjects": ["subject line 1", "subject line 2", "subject line 3"],
      "body": "Lead with numbers and traction. Makes the opportunity undeniable. 150-200 words."
    }
  }
}

Each email should feel authentic, specific to this investor, and avoid all clichés. Sign off with just [Your Name].${langInstruction}`;

  const result = await generateJSON<InvestorEmailResult>(prompt);
  return NextResponse.json(result);
}
