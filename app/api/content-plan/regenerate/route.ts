import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    day, week, platform, contentType,
    startupName, targetAudience, tone, personalStory, goal,
    existingTitles = [],
    locale = "en",
  } = await req.json();

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";
  const avoid = existingTitles.length > 0 ? `\nAvoid repeating these already-used ideas: ${existingTitles.join(", ")}` : "";

  const prompt = `You are the world's best content strategist for startup founders.

Write ONE new social media post for this founder.

Startup: ${startupName}
Target audience: ${targetAudience}
Tone: ${tone}
Goal: ${goal}
Personal story context: ${personalStory || "Not provided"}
Platform: ${platform}
Content type: ${contentType}
Day in content plan: Day ${day} (Week ${week})${avoid}

RULES:
- Write in the founder's ${tone} tone
- First line must stop the scroll
- Platform: ${platform === "LinkedIn" ? "150-300 words" : platform === "Twitter/X" ? "under 280 characters" : "100-200 words"}
- Feel personal and real, never corporate
- Provide real value
- Max 2 relevant hashtags

Respond in ${lang}.

Return ONLY this JSON, nothing else:
{
  "day": ${day},
  "week": ${week},
  "platform": "${platform}",
  "content_type": "${contentType}",
  "title": "short internal label",
  "hook": "first line that stops scroll",
  "full_post": "complete post text ready to publish",
  "best_time_to_post": "e.g. Tuesday 9am",
  "expected_engagement": "LOW or MEDIUM or HIGH",
  "why_this_works": "one sentence explanation"
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const post = JSON.parse(match[0]);

    return NextResponse.json(post);
  } catch (err) {
    console.error("content-plan/regenerate error:", err);
    return NextResponse.json({ error: "Regeneration failed. Please try again." }, { status: 500 });
  }
}
