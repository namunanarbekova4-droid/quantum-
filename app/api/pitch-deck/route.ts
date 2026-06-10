import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.pitchDeck.findMany({
    where: { userId: session.user.id },
    select: { id: true, startupName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(decks);
}

interface PitchSlide {
  slide_number: number;
  slide_type: string;
  title: string;
  subtitle: string;
  main_content: string;
  speaker_notes: string;
  key_stat: string | null;
}

interface PitchDeckResult {
  slides: PitchSlide[];
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
}

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers, startupName, locale = "en" } = body as {
    answers: string[];
    startupName: string;
    locale?: string;
  };

  if (!answers || answers.length < 10) {
    return NextResponse.json({ error: "All 10 answers required" }, { status: 400 });
  }

  const langInstruction = `\n\nIMPORTANT: Respond entirely in ${LANG_MAP[locale] ?? "English"}.`;

  const prompt = `You are a pitch deck writer. Create a 12-slide pitch deck for this startup.

Startup: ${startupName}
Q1 (What it is): ${answers[0] || "(no answer)"}
Q2 (Problem): ${answers[1] || "(no answer)"}
Q3 (Personal story): ${answers[2] || "(no answer)"}
Q4 (Solution): ${answers[3] || "(no answer)"}
Q5 (Customer): ${answers[4] || "(no answer)"}
Q6 (Business model): ${answers[5] || "(no answer)"}
Q7 (Competition): ${answers[6] || "(no answer)"}
Q8 (Traction): ${answers[7] || "(no answer)"}
Q9 (Team): ${answers[8] || "(no answer)"}
Q10 (Raise): ${answers[9] || "(no answer)"}

Rules: punchy slide titles (not generic labels), founder's voice, concise speaker notes (1-2 sentences each), 3-min script natural and conversational.

Return ONLY JSON:
{
  "slides": [
    {"slide_number":1,"slide_type":"cover","title":"punchy title","subtitle":"one line","main_content":"content","speaker_notes":"1-2 sentences","key_stat":null}
  ],
  "three_minute_script": "full 3-minute script",
  "elevator_pitch": "30-second pitch",
  "opening_hook": "opening line",
  "closing_statement": "closing line",
  "investor_questions": [{"question":"question","answer":"answer"}]
}

Slides in order: cover, problem, personal_story, solution, market, product, traction, business_model, competition, team, financials, ask. Generate 5 investor_questions.${langInstruction}`;

  try {
    const result = await generateJSON<PitchDeckResult>(prompt);

    await prisma.pitchDeck.create({
      data: {
        userId: session.user.id,
        startupName: startupName || "Untitled",
        answers,
        generatedDeck: result as object,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("pitch-deck error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
