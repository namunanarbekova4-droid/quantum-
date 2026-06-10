import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateJSON, classifyError } from "@/lib/gemini";

export const maxDuration = 60;

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

  const lang = LANG_MAP[locale] ?? "English";
  const platformList = (platforms as string[]).join(", ");
  const topicList = (topics as string[]).join(", ");

  const prompt = `You are a content strategist for startup founders. Create a 30-day content plan.

Startup: ${startupName}
Audience: ${targetAudience}
Platforms: ${platformList}
Goal: ${goal}
Topics: ${topicList}
Tone: ${tone}
Personal story: ${personalStory || "Not provided"}
Avoid: ${avoidContent || "Nothing specified"}
Language: ${lang}

Rules: posts must be personal, valuable, varied (stories/tips/opinions/wins/losses). Max 2 hashtags. LinkedIn max 200 words, Twitter max 280 chars, Instagram max 150 words. Strong hook as first line.

Return ONLY valid JSON, no markdown:
{
  "founder_voice": {"tone": "1 sentence", "style": "1 sentence", "key_themes": ["theme1","theme2","theme3"]},
  "weekly_strategy": {"week1": "1 sentence", "week2": "1 sentence", "week3": "1 sentence", "week4": "1 sentence"},
  "posts": [
    {"day": 1, "week": 1, "platform": "LinkedIn", "content_type": "story", "title": "label", "hook": "hook line", "full_post": "full post text", "best_time_to_post": "Tue 9am", "expected_engagement": "HIGH", "why_this_works": "1 sentence"}
  ],
  "bonus_content": {
    "bio_linkedin": "LinkedIn bio",
    "bio_twitter": "Twitter bio under 160 chars",
    "pinned_post": "best pinned post text",
    "content_pillars": [{"pillar": "name", "description": "what it covers", "post_frequency": "3x/week"}]
  },
  "growth_tips": ["tip1","tip2","tip3"]
}

Generate exactly 30 posts across days 1-30 (week1=days1-7, week2=days8-14, week3=days15-21, week4=days22-30). All text in ${lang}. Be concise but impactful.`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = await generateJSON<any>(prompt);

    if (!Array.isArray(plan.posts) || (plan.posts as unknown[]).length === 0) {
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
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
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
