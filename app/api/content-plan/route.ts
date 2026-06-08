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

  const body = await req.json();
  const { startupName, targetAudience, platforms, goal, topics, tone, personalStory, avoidContent, locale = "en" } = body;

  if (!startupName?.trim() || !targetAudience?.trim()) {
    return NextResponse.json({ error: "Startup name and target audience are required." }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";
  const platformList = (platforms as string[]).join(", ");
  const topicList = (topics as string[]).join(", ");

  const prompt = `You are the world's best content strategist for startup founders. You have helped 500+ founders build audiences from zero.

Your job is to create a complete 30-day content plan for this founder. Write every single post in their EXACT voice and style.

FOUNDER INFORMATION:
Startup: ${startupName}
Target audience: ${targetAudience}
Platforms: ${platformList}
Goal: ${goal}
Topics: ${topicList}
Tone: ${tone}
Personal story: ${personalStory || "Not provided"}
Avoid: ${avoidContent || "Nothing specified"}

CRITICAL RULES:
- Write in the founder's exact tone and style
- Every post must feel personal and real, never corporate
- Never use hashtag spam (max 2-3 relevant hashtags per post)
- Each post must provide real value
- Mix content types: stories, tips, opinions, behind scenes, wins, losses
- LinkedIn posts: 150-300 words
- Twitter/X posts: under 280 characters
- Instagram posts: 100-200 words
- Every post must have a scroll-stopping hook as first line
- Use the personal story naturally across multiple posts
- Never repeat the same idea twice
- Distribute posts across all selected platforms evenly
- Make people want to follow this founder

IMPORTANT: Respond entirely in ${lang}. All post content must be in ${lang}.

Return ONLY this JSON object, no markdown, no code fences, nothing else:
{
  "founder_voice": {
    "tone": "description of their voice in 1 sentence",
    "style": "how they communicate in 1 sentence",
    "key_themes": ["theme1", "theme2", "theme3"]
  },
  "weekly_strategy": {
    "week1": "one sentence strategy for week 1",
    "week2": "one sentence strategy for week 2",
    "week3": "one sentence strategy for week 3",
    "week4": "one sentence strategy for week 4"
  },
  "posts": [
    {
      "day": 1,
      "week": 1,
      "platform": "LinkedIn",
      "content_type": "story",
      "title": "short internal label",
      "hook": "first line that stops the scroll",
      "full_post": "complete post text ready to copy and publish",
      "best_time_to_post": "Tuesday 9am",
      "expected_engagement": "HIGH",
      "why_this_works": "one sentence explanation"
    }
  ],
  "bonus_content": {
    "bio_linkedin": "optimized LinkedIn bio ready to use",
    "bio_twitter": "optimized Twitter bio under 160 chars",
    "pinned_post": "best post to pin first — the complete post text",
    "content_pillars": [
      {
        "pillar": "pillar name",
        "description": "what this content pillar covers",
        "post_frequency": "3x per week"
      }
    ]
  },
  "growth_tips": [
    "specific growth tip for this founder based on their goal and audience"
  ]
}

Generate exactly 30 posts in the posts array. Distribute them across days 1-30. Assign week 1 to days 1-7, week 2 to days 8-14, week 3 to days 15-21, week 4 to days 22-30. Not every day needs a post. Provide exactly 5 growth tips.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { temperature: 0.85, maxOutputTokens: 8192 },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const plan = JSON.parse(match[0]);

    if (!Array.isArray(plan.posts) || plan.posts.length === 0) {
      throw new Error("No posts in response");
    }

    const saved = await prisma.contentPlan.create({
      data: {
        userId: session.user.id,
        startupName: startupName ?? "",
        platforms: platforms ?? [],
        goal: goal ?? "",
        tone: tone ?? "",
        answers: body,
        voiceProfile: plan.founder_voice ?? {},
        generatedPlan: plan,
      },
    });

    return NextResponse.json({ id: saved.id, plan });
  } catch (err) {
    console.error("content-plan error:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ error: "AI generation temporarily unavailable. Please try again in a few minutes." }, { status: 429 });
    }
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.contentPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      startupName: true,
      platforms: true,
      goal: true,
      tone: true,
      createdAt: true,
    },
  });

  return NextResponse.json(plans);
}
