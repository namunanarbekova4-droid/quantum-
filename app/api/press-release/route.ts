import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface PressReleaseResult {
  headlines: string[];
  subheadline: string;
  leadParagraph: string;
  body: string;
  polishedQuote: string;
  boilerplate: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    announcement,
    significance,
    rawQuote,
    keyFacts,
    targetMedia,
    announcementDate,
  } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const prompt = `You are a PR expert who writes press releases that actually get picked up by journalists.

Announcement: ${announcement}
Why it matters: ${significance}
Founder's raw quote: ${rawQuote}
Key facts/numbers: ${keyFacts}
Target media: ${targetMedia}
Date: ${announcementDate}

Return ONLY a JSON object:
{
  "headlines": ["headline option 1", "headline option 2", "headline option 3"],
  "subheadline": "one compelling subheadline",
  "leadParagraph": "City, Date — Strong opening paragraph with the most important information",
  "body": "3-4 paragraphs of press release body with context, details, and impact",
  "polishedQuote": "polished version of the founder's quote that sounds natural and quotable",
  "boilerplate": "About [Company]: 2-3 sentence boilerplate description"
}

Headlines should be compelling for journalists. Body should follow inverted pyramid structure. Quote should sound human, not corporate.${langInstruction}`;

  const result = await generateJSON<PressReleaseResult>(prompt);
  return NextResponse.json(result);
}
