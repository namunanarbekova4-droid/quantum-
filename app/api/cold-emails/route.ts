export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { classifyError } from "@/lib/gemini";

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
    const prompt = `You are rewriting a cold email. Before you write a single word, identify why the original angle likely fails — most cold emails fail because they're about the sender, not the recipient's problem, or they bury the ask, or they sound like every other email in the inbox.

Then pick one specific psychological trigger to exploit: curiosity gap (they need to know how the story ends), social proof (someone they respect already did this), FOMO (this window is closing), reciprocity (give something real before asking), or specificity shock (a number so precise it forces attention).

STARTUP:
Name: ${startupName}
What they built: ${description}
Targeting: ${targetType || "customers"}
Sender: ${yourName || "the founder"}, ${yourRole || "Founder"}
Goal: ${goal || "get a meeting"}
${special ? `Context: ${special}` : ""}
Technique: ${emailType}

RULES:
- Under 120 words. Hard limit.
- One CTA. One action. Nothing else.
- Never open with "I hope this finds you well", "Just following up", "My name is", or any variation
- The first sentence must make them want to read the second
- Subject lines must create intrigue without sounding like spam

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
      return NextResponse.json({ error: classifyError(err) }, { status: 500 });
    }
  }

  const prompt = `You are a growth hacker who understands why most cold emails fail: they're about the sender, not the recipient's problem; they bury the CTA under paragraphs of context; and they sound like every other template the recipient deleted this week.

Write 10 COMPLETELY DIFFERENT cold emails for this startup. Each email must use a psychologically distinct mechanism — not just a different opening, but a fundamentally different reason the recipient would stop, read, and respond. The best cold emails either create genuine curiosity (they have to know) or recognition of pain (that's exactly my problem). Feature lists do neither.

STARTUP INFO:
Name: ${startupName}
What they built: ${description}
Targeting: ${targetType || "potential customers"}
Sender: ${yourName || "the founder"}, ${yourRole || "Founder & CEO"}
Goal: ${goal || "get a meeting or demo call"}
${special ? `Additional context: ${special}` : ""}

STRICT RULES:
- Each email uses a psychologically distinct mechanism — not just a different angle, a different reason to act
- Every email is about the recipient's problem, not the sender's product
- Under 150 words each (strictly enforce this)
- One clear, specific CTA per email — one action, nothing else
- Subject lines must be intriguing enough to open without sounding like clickbait — they create a curiosity gap or promise something specific
- NEVER use "I hope this finds you well", "touching base", "circle back", "synergy", or similar clichés
- CTA is never buried — it is the last thing they read

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
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
