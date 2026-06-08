import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LANG_MAP: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  zh: "Chinese",
  kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    startupName,
    startupDescription,
    audienceType,
    targetDuration,
    actualDuration,
    transcript,
    wordCount,
    fillerWordCount,
    wordsPerMinute,
    locale = "en",
  } = await req.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
  }

  const words = transcript.trim().split(/\s+/).length;
  if (words < 30) {
    return NextResponse.json({
      error: "Please speak for at least 30 seconds for accurate analysis.",
    }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";

  const prompt = `You are the most brutally honest pitch coach in Silicon Valley. You have heard 10,000 pitches. You know exactly why founders fail to raise money.

Your job is NOT to make founders feel good.
Your job is to prepare them for the harshest investor in the room.

Startup: ${startupName}
What it does: ${startupDescription}
Pitching to: ${audienceType}
Target duration: ${targetDuration} minutes
Full transcript: ${transcript}

SCORING RULES — be mathematically honest:
Start at 100. Subtract points:
- No hook in first 30 seconds: -20
- No specific numbers or data: -15
- Solution is vague: -15
- No clear ask at the end: -20
- More than 10 filler words per minute: -10
- Pace too fast or too slow: -10
- Problem not clearly explained: -20
- Weak or no closing: -10

Never give above 75 unless genuinely investor-ready. Average pitches score 45-60.

RULES:
- Never say "Great job" or "Well done"
- Always find minimum 3 critical problems
- Quote exact words from transcript
- Give rewritten version of every weak section
- Be direct like Mark Cuban on Shark Tank
- Never soften criticism

IMPORTANT: Respond entirely in ${lang}. All text fields must be in ${lang}.

Return ONLY this JSON, nothing else:
{
  "overall_score": 0,
  "grade": "A or B or C or D or F",
  "bottom_line": "one brutal honest sentence about whether this pitch is ready",
  "ready_to_pitch": false,
  "what_worked": [
    {
      "moment": "exact quote from transcript",
      "why": "specific reason it worked"
    }
  ],
  "critical_problems": [
    {
      "problem_name": "short name",
      "severity": "HIGH or MEDIUM",
      "what_you_said": "exact quote",
      "why_its_weak": "brutal explanation",
      "rewritten_version": "how it should sound"
    }
  ],
  "missing_completely": ["things never mentioned that every investor expects to hear"],
  "filler_analysis": {
    "total_count": 0,
    "per_minute": 0,
    "breakdown": {
      "um": 0,
      "uh": 0,
      "like": 0,
      "so": 0,
      "you_know": 0
    },
    "verdict": "honest one sentence assessment"
  },
  "pacing": {
    "words_per_minute": 0,
    "verdict": "TOO_SLOW or PERFECT or TOO_FAST",
    "slowest_section": "brief description",
    "fastest_section": "brief description"
  },
  "investor_reaction": "what a real investor would think and feel hearing this pitch right now",
  "the_killer_rewrite": "take the weakest 30 seconds of their pitch and rewrite it completely",
  "before_next_pitch": ["exactly 3 specific things to fix before pitching again, very specific"]
}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    });

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");
    const analysis = JSON.parse(match[0]);

    const saved = await prisma.pitchCoachLiveSession.create({
      data: {
        userId: session.user.id,
        startupName: startupName ?? "",
        startupDescription: startupDescription ?? "",
        audienceType: audienceType ?? "",
        targetDuration: Number(targetDuration) || 3,
        actualDuration: Number(actualDuration) || 0,
        transcript: transcript ?? "",
        wordCount: Number(wordCount) || words,
        fillerWordCount: Number(fillerWordCount) || 0,
        wordsPerMinute: Number(wordsPerMinute) || 0,
        overallScore: Number(analysis.overall_score) || 0,
        grade: analysis.grade ?? "",
        analysis,
      },
    });

    return NextResponse.json({ id: saved.id, analysis });
  } catch (err) {
    console.error("pitch-coach-live error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.pitchCoachLiveSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      startupName: true,
      audienceType: true,
      targetDuration: true,
      actualDuration: true,
      overallScore: true,
      grade: true,
      createdAt: true,
    },
  });

  return NextResponse.json(sessions);
}
