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

  const prompt = `You are the most brutally honest pitch coach in Silicon Valley. You have watched 10,000 pitches. You have seen founders lose millions of dollars because nobody told them the truth. You will NOT do that to this founder.

RULES:
- NEVER say "Great job", "Well done", "Nice start", or any softening phrase
- NEVER give a score above 75 unless the pitch is genuinely investor-ready
- Start overall_score at 100, then subtract:
  • -20 if no clear problem statement
  • -15 if no traction or metrics mentioned
  • -15 if no business model or revenue logic
  • -10 if no market size or opportunity framing
  • -10 if hook (opening line) is weak or generic
  • -10 if no clear ask or call to action
  • -5 for every 3 filler words (um/uh/like/so/actually)
  • -5 if pacing is too fast or too slow
  • -5 if confidence sounds rehearsed or robotic
  • -5 if storytelling is dry or impersonal
- Assign grade: 90-100 = A, 80-89 = B, 70-79 = C, 60-69 = D, below 60 = F
- ready_to_pitch: true ONLY if overall_score >= 80

PITCH CONTEXT:
- Startup: ${startupName}
- Audience: ${audienceType}
- Pitch type: ${pitchType}
- Target duration: ${targetDuration} minutes
- Actual duration: ${actualDuration} seconds
- Mode: ${isVideo ? "video" : "audio only"}
- Words per minute: ${wordsPerMinute ?? "unknown"}
- Filler word counts: ${JSON.stringify(fillerWords ?? {})}

FULL TRANSCRIPT:
"""
${transcript}
"""

${isVideo ? "Since this was recorded on video, analyze body language, eye contact, camera presence, gesture quality, and nervous signals." : "Audio-only: analyze voice confidence, energy, delivery rhythm, emotional conviction, and filler word patterns."}

IMPORTANT: Respond entirely in ${lang}. All text fields must be in ${lang}.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "overall_score": 0-100,
  "grade": "A/B/C/D/F",
  "bottom_line": "one brutal honest sentence: what this pitch actually is right now",
  "ready_to_pitch": true or false,
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
    "angel_investor": "honest inner monologue of an angel hearing this pitch",
    "vc_partner": "honest inner monologue of a VC partner",
    "accelerator_judge": "honest inner monologue of an accelerator judge",
    "customer": "honest inner monologue of a potential customer"
  },
  "what_worked": [
    {
      "quote": "exact words from transcript that actually worked",
      "why_it_worked": "specific reason this was effective"
    }
  ],
  "critical_problems": [
    {
      "quote": "exact weak words from the transcript",
      "why": "precise explanation of what is broken and why it kills deals",
      "rewrite": "a stronger version they should say instead"
    }
  ],
  "missing_completely": ["element that is entirely absent from this pitch"],
  "filler_words": {
    "um": 0,
    "uh": 0,
    "like": 0,
    "so": 0,
    "actually": 0
  },
  "best_moment": "the single strongest moment in the pitch",
  "worst_moment": "the single most damaging moment in the pitch",
  "killer_rewrite": {
    "what_you_said": "exact weak section from transcript",
    "better_version": "powerful rewrite of that section"
  },
  "before_next_pitch": ["concrete action to take before pitching again — specific, not generic"],
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
