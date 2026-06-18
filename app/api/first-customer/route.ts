export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSON, classifyError } from "@/lib/gemini";

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

interface CustomerProfile {
  name: string;
  title: string;
  company_type: string;
  location: string;
  why_they_need: string;
  pain_level: "HIGH" | "MEDIUM";
  where_to_find: string[];
  best_approach: string;
  match_score: number;
}

interface FirstCustomerResult {
  profiles: CustomerProfile[];
  communities: { platform: string; name: string; members: string; why: string }[];
  acquisition_plan: { today: string; this_week: string; this_month: string };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productDescription, idealCustomer, problem, industry, locale = "en" } = await req.json();

  if (!productDescription?.trim() || !problem?.trim()) {
    return NextResponse.json({ error: "Product description and problem are required" }, { status: 400 });
  }

  const lang = LANG_MAP[locale] ?? "English";

  const prompt = `You are a world-class customer research expert who has helped hundreds of early-stage startups find their first paying customers.

Based on this startup description, identify 6 realistic ideal customer profiles who genuinely need this product RIGHT NOW.

STARTUP INFO:
Product: ${productDescription}
Ideal Customer: ${idealCustomer || "not specified"}
Problem Solved: ${problem}
Industry: ${industry}

Requirements:
- Each profile must feel like a real, specific person with a real painful problem
- "where_to_find" must include specific subreddits, LinkedIn search queries, Slack communities, or Twitter hashtags
- "best_approach" must be a specific opening angle, NOT generic advice
- match_score between 72 and 96
- pain_level is either "HIGH" or "MEDIUM"
- Include exactly 5 communities and a 3-step acquisition plan

Respond entirely in ${lang}. Return JSON:
{
  "profiles": [
    {
      "name": "realistic full name",
      "title": "specific job title",
      "company_type": "specific type and size",
      "location": "city, country",
      "why_they_need": "specific pain point explanation",
      "pain_level": "HIGH",
      "where_to_find": ["LinkedIn search query", "Reddit r/subreddit", "Slack community"],
      "best_approach": "specific opening angle and question",
      "match_score": 89
    }
  ],
  "communities": [
    {
      "platform": "Reddit",
      "name": "r/specific_subreddit",
      "members": "450K members",
      "why": "specific reason your ideal customer is active here"
    }
  ],
  "acquisition_plan": {
    "today": "specific actionable step with platform and message template",
    "this_week": "specific community and content strategy",
    "this_month": "specific relationship-building action and measurable goal"
  }
}`;

  let data: FirstCustomerResult;
  try {
    data = await generateJSON<FirstCustomerResult>(prompt);
  } catch (err) {
    console.error("first-customer AI error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }

  // Save to DB (non-critical — don't block response if it fails)
  let savedId: string | undefined;
  try {
    const saved = await prisma.customerSearch.create({
      data: {
        userId: session.user.id,
        productDescription: productDescription.slice(0, 10000),
        idealCustomer: (idealCustomer || "").slice(0, 500),
        problem: problem.slice(0, 10000),
        industry: industry.slice(0, 100),
        results: data as object,
      },
    });
    savedId = saved.id;
  } catch (err) {
    console.error("first-customer save error (non-critical):", err);
  }

  return NextResponse.json({ id: savedId, ...data });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searches = await prisma.customerSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, industry: true, idealCustomer: true, createdAt: true },
  });

  return NextResponse.json(searches);
}
