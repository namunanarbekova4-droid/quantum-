export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

const EMAIL_TYPES = [
  "The Problem-First Approach",
  "The Social Proof Angle",
  "The Bold Ask",
  "The Curiosity Hook",
  "The Mutual Connection",
  "The Data-Driven Pitch",
  "The Story Approach",
  "The Short and Direct",
  "The Follow-up Version",
  "The Last Attempt",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    startupName, description, targetType, yourName, yourRole,
    goal, special, locale = "en", regenerateOne, emailType,
  } = await req.json();

  if (!startupName?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Startup name and description are required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";

  if (regenerateOne && emailType) {
    // Single email regeneration
    const prompt = `You are the world's best cold email copywriter with a 40%+ open rate track record.

Rewrite one cold email for this startup using the "${emailType}" technique.

STARTUP:
Name: ${startupName}
What they built: ${description}
Targeting: ${targetType || "customers"}
Sender: ${yourName || "the founder"}, ${yourRole || "Founder"}
Goal: ${goal || "get a meeting"}
${special ? `Context: ${special}` : ""}

RULES:
- Use "${emailType}" as the psychological technique
- Under 150 words
- One clear CTA
- Feel personal, not templated
- NEVER say "I hope this finds you well" or similar clichés
- Strong, specific subject lines

IMPORTANT: Respond entirely in ${lang}. Return ONLY valid JSON:
{
  "number": 1,
  "type": "${emailType}",
  "subject_lines": [
    { "text": "subject line 1", "open_rate": 34, "why_it_works": "reason" },
    { "text": "subject line 2", "open_rate": 28, "why_it_works": "reason" },
    { "text": "subject line 3", "open_rate": 22, "why_it_works": "reason" }
  ],
  "body": "full email body with line breaks",
  "word_count": 95
}`;

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
      });
      const result = await model.generateContent(prompt);
      let raw = result.response.text().trim()
        .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      return NextResponse.json(JSON.parse(match[0]));
    } catch (err) {
      console.error("regenerate error:", err);
      return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
    }
  }

  const prompt = `You are the world's best cold email copywriter. You have written emails with 40%+ open rates for hundreds of startups.

Write 10 COMPLETELY DIFFERENT cold emails for this startup. Each email uses a different psychological technique and angle.

STARTUP INFO:
Name: ${startupName}
What they built: ${description}
Targeting: ${targetType || "potential customers"}
Sender: ${yourName || "the founder"}, ${yourRole || "Founder & CEO"}
Goal: ${goal || "get a meeting or demo call"}
${special ? `Additional context: ${special}` : ""}

STRICT RULES:
- Each email uses a completely different psychological angle (listed below)
- Every email feels personal and human — NOT templated
- Under 150 words each (strictly enforce this)
- One clear, specific CTA per email
- Subject lines optimized for 25%+ open rate
- NEVER use "I hope this finds you well", "touching base", "circle back", "synergy", or similar clichés
- Be bold, specific, direct
- Use the sender's name and role

Email types (in this exact order):
1. The Problem-First Approach
2. The Social Proof Angle
3. The Bold Ask
4. The Curiosity Hook
5. The Mutual Connection
6. The Data-Driven Pitch
7. The Story Approach
8. The Short and Direct
9. The Follow-up Version
10. The Last Attempt

IMPORTANT: Respond entirely in ${lang}. Return ONLY valid JSON (no markdown, no code fences):

{
  "emails": [
    {
      "number": 1,
      "type": "The Problem-First Approach",
      "subject_lines": [
        { "text": "subject line", "open_rate": 34, "why_it_works": "one sentence why this works" },
        { "text": "subject line 2", "open_rate": 29, "why_it_works": "one sentence why" },
        { "text": "subject line 3", "open_rate": 23, "why_it_works": "one sentence why" }
      ],
      "body": "full email body text\\n\\nwith proper line breaks\\n\\n[Name]",
      "word_count": 87
    }
  ],
  "strategy": {
    "best_time": "specific day and time range with timezone note",
    "sequence": "which email number to send first and why, then which to follow up with",
    "follow_up_timing": "exactly when to send the follow-up and what to change",
    "subject_style": "what subject line pattern works best for this specific industry/target"
  }
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.85, maxOutputTokens: 6000 },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const data = JSON.parse(match[0]);

    const saved = await prisma.coldEmailCampaign.create({
      data: {
        userId: session.user.id,
        startupName,
        targetType: targetType || "customers",
        goal: goal || "",
        emails: data.emails ?? [],
      },
    });

    return NextResponse.json({ id: saved.id, ...data });
  } catch (err) {
    console.error("cold-emails error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 });
  }
}
