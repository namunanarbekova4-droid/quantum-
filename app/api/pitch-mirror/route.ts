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
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    startupName,
    audienceType,
    pitchType,
    targetDuration,
    actualDuration,
    mode,
    transcript,
    fillerWords,
    wordsPerMinute,
    locale = "en",
  } = body;

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "transcript required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const lang = LANG_MAP[locale] ?? "English";
  const isVideo = mode === "video";

  const prompt = `You are Quantum Pitch Mirror — the world's best startup pitch coach. You have coached founders who raised billions of dollars. You are brutally honest but deeply constructive. Never give generic advice. Always reference exact moments from the founder's pitch.

PITCH CONTEXT:
- Startup: ${startupName}
- Audience: ${audienceType}
- Pitch type: ${pitchType}
- Target duration: ${targetDuration} minutes
- Actual duration: ${actualDuration} seconds
- Mode: ${isVideo ? "video (analyze body language, camera presence, facial expressions)" : "audio only"}
- Words per minute: ${wordsPerMinute ?? "unknown"}
- Filler word counts: ${JSON.stringify(fillerWords ?? {})}

FULL TRANSCRIPT:
"""
${transcript}
"""

Analyze this pitch with extreme depth. Reference exact quotes. Be specific, not generic.

${isVideo ? "Since this was recorded on video, also analyze body language confidence, eye contact, camera presence, movement quality, and gesture effectiveness based on presentation cues visible in how they described their pitch." : "Audio-only mode: focus on voice confidence, energy, clarity, filler words, speaking rhythm, emotional delivery, and storytelling quality."}

IMPORTANT: Respond entirely in ${lang}. All text fields must be in ${lang}.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "overall_score": 0-100,
  "grade": "A/B/C/D/F",
  "verdict": "one powerful sentence about this pitch",
  "clarity_score": 0-100,
  "confidence_score": 0-100,
  "storytelling_score": 0-100,
  "persuasion_score": 0-100,
  "energy_score": 0-100,
  "structure_score": 0-100,
  "data_score": 0-100,
  "pacing_score": 0-100,
  "hook_score": 0-100,
  "founder_presence_score": 0-100,
  "body_language": {
    "confidence": 0-100,
    "eye_contact": 0-100,
    "movement_quality": 0-100,
    "gesture_effectiveness": 0-100,
    "nervous_signals": ["specific observed behavior"]
  },
  "investor_reaction": {
    "angel_investor": "what an angel investor would think after hearing this pitch",
    "vc_partner": "what a VC partner would think",
    "accelerator_judge": "what an accelerator judge would think",
    "customer": "what a customer would think"
  },
  "what_you_nailed": [
    {
      "quote": "exact words from the transcript",
      "why_it_worked": "specific reason this was effective"
    }
  ],
  "what_hurt_you": [
    {
      "quote": "exact weak words from the transcript",
      "why": "precise problem explanation",
      "better_version": "a stronger rewritten version"
    }
  ],
  "filler_word_report": {
    "um": 0,
    "uh": 0,
    "like": 0,
    "so": 0,
    "actually": 0
  },
  "best_moment": "description of the strongest moment",
  "worst_moment": "description of the weakest moment",
  "killer_rewrite": {
    "what_you_said": "exact weak section from transcript",
    "better_version": "powerful rewrite of that section"
  },
  "action_plan": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "investor_readiness": "NOT_READY or CLOSE or READY"
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
    const feedback = JSON.parse(match[0]);

    // Save session
    const saved = await prisma.pitchMirrorSession.create({
      data: {
        userId: session.user.id,
        startupName: startupName ?? "",
        audienceType: audienceType ?? "",
        pitchType: pitchType ?? "",
        targetDuration: Number(targetDuration) || 3,
        actualDuration: Number(actualDuration) || 0,
        mode: mode ?? "audio",
        transcript: transcript ?? "",
        overallScore: Number(feedback.overall_score) || 0,
        feedback,
      },
    });

    return NextResponse.json({ id: saved.id, feedback });
  } catch (err) {
    console.error("pitch-mirror error:", err);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.pitchMirrorSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      startupName: true,
      pitchType: true,
      overallScore: true,
      mode: true,
      actualDuration: true,
      createdAt: true,
    },
  });

  return NextResponse.json(sessions);
}
