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
    kz: "Kazakh",
  };
  const lang = LANG_MAP[locale] ?? "English";
  const isZh = locale === "zh";
  const isKk = locale === "kz";

  const langInstruction = `

LANGUAGE REQUIREMENT — ${lang}:
Think in ${lang} from the first word. Do NOT compose in English and translate.
Every sentence must read as it would appear in a native ${lang}-language publication — not as a translation.
${isZh ? 'Use Simplified Chinese (简体中文). Write as a Chinese tech journalist or PR professional would write.' : ''}
${isKk ? 'Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market.' : ''}
Preserve proper nouns, company names, product names, and standard industry terms in their original form.
Respond 100% in ${lang}. No English words unless they are standard terms used natively in ${lang} media.`;

  const prompt = `You are a TechCrunch editor deciding in the first eight seconds whether to cover this story. You ignore press releases that bury the news, use corporate language, or explain instead of show. You've seen ten thousand of these and you know immediately when someone is writing for their investors instead of for readers.

The test for every sentence: would a journalist use this exact phrasing? If not, rewrite it.

Announcement: ${announcement}
Why it matters: ${significance}
Founder's raw quote: ${rawQuote}
Key facts/numbers: ${keyFacts}
Target media: ${targetMedia}
Date: ${announcementDate}

Return ONLY a JSON object:
{
  "headlines": ["headline 1: states the news in 8 words or fewer, creates a reason to click", "headline 2: different angle, same news-first discipline", "headline 3: most provocative version that stays accurate"],
  "subheadline": "One sentence that adds the most important detail the headline left out — not a restatement",
  "leadParagraph": "City, Date — Three sentences. Sentence one: what happened. Sentence two: why it matters and who is affected. Sentence three: the specific detail that makes this real. No corporate language. The news is in sentence one.",
  "body": "3-4 paragraphs following inverted pyramid. Each paragraph could be the last — start with the most important remaining facts, end with the least. No paragraph that only exists to make the company sound good.",
  "polishedQuote": "A quote that sounds like a specific person with a specific opinion said it, not a committee. Direct, slightly opinionated, quotable. 1-2 sentences. If the raw quote has something real in it, use it — clean the grammar but keep the voice.",
  "boilerplate": "About [Company]: 2-3 sentences. Lead with what the company actually does, not its vision."
}${langInstruction}`;

  const result = await generateJSON<PressReleaseResult>(prompt);
  return NextResponse.json(result);
}
