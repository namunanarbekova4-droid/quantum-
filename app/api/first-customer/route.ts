import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productDescription, idealCustomer, problem, industry, locale = "en" } = await req.json();

  if (!productDescription?.trim() || !problem?.trim()) {
    return NextResponse.json({ error: "Product description and problem are required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";

  const prompt = `You are a world-class customer research expert and growth hacker who has helped hundreds of early-stage startups find their first paying customers.

Based on this startup description, identify 10 realistic ideal customer profiles who genuinely need this product RIGHT NOW — not eventually, RIGHT NOW.

STARTUP INFO:
Product: ${productDescription}
Ideal Customer: ${idealCustomer || "not specified"}
Problem Solved: ${problem}
Industry: ${industry}

Requirements:
- Each profile must feel like a real, specific person with a real painful problem
- "where_to_find" must include specific subreddits, LinkedIn search queries, Slack community names, or Twitter hashtags — NOT generic advice
- "best_approach" must be a specific opening angle, NOT generic advice
- "why_they_need" must reference the EXACT problem from the founder's description
- match_score between 72 and 96
- pain_level is either "HIGH" or "MEDIUM"
- Include exactly 5 communities and a 3-step acquisition plan

IMPORTANT: Respond entirely in ${lang}. Return ONLY valid JSON (no markdown, no code fences):

{
  "profiles": [
    {
      "name": "realistic full name",
      "title": "specific job title",
      "company_type": "specific type and size (e.g. B2B SaaS startup, 10-50 employees)",
      "location": "city, country",
      "why_they_need": "This person struggles with [exact pain point from the description] and has been looking for [specific solution type] for [timeframe]",
      "pain_level": "HIGH",
      "where_to_find": ["LinkedIn - search for '[role]' at '[company type]'", "Reddit r/[specific_subreddit]", "Slack: [community name]"],
      "best_approach": "Lead with [specific angle] — mention [specific pain point] and ask [specific question]",
      "match_score": 89
    }
  ],
  "communities": [
    {
      "platform": "Reddit",
      "name": "r/specific_subreddit",
      "members": "450K members",
      "why": "specific reason your ideal customer is active here and what they discuss"
    }
  ],
  "acquisition_plan": {
    "today": "Go to [specific platform], search for [specific query], message 5 people with: [specific opening message template]",
    "this_week": "Post in [specific community] with this angle: [specific content strategy]. Target [specific persona] with [specific hook]",
    "this_month": "Build relationships in [specific community] by [specific action]. Goal: [specific measurable outcome]"
  }
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.85, maxOutputTokens: 4096 },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const data = JSON.parse(match[0]);

    const saved = await prisma.customerSearch.create({
      data: {
        userId: session.user.id,
        productDescription,
        idealCustomer: idealCustomer || "",
        problem,
        industry,
        results: data,
      },
    });

    return NextResponse.json({ id: saved.id, ...data });
  } catch (err) {
    console.error("first-customer error:", err);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
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
