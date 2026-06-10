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

  const lang = LANG_MAP[locale] ?? "English";
  const ctx = `Startup: ${startupName}
What: ${answers[0] || "-"}
Problem: ${answers[1] || "-"}
Story: ${answers[2] || "-"}
Solution: ${answers[3] || "-"}
Customer: ${answers[4] || "-"}
Model: ${answers[5] || "-"}
Competition: ${answers[6] || "-"}
Traction: ${answers[7] || "-"}
Team: ${answers[8] || "-"}
Raise: ${answers[9] || "-"}`;

  const slidesPrompt = `Pitch deck writer. Create 12 slides for this startup. Respond in ${lang}.
${ctx}
Slide types in order: cover,problem,personal_story,solution,market,product,traction,business_model,competition,team,financials,ask.
Rules: punchy titles, founder voice, speaker_notes max 1 sentence, main_content max 2 sentences, key_stat only where it fits (else null).
Return JSON: {"slides":[{"slide_number":1,"slide_type":"cover","title":"","subtitle":"","main_content":"","speaker_notes":"","key_stat":null}]}`;

  const scriptsPrompt = `Pitch coach. Write pitch scripts for this startup. Respond in ${lang}.
${ctx}
Return JSON: {"three_minute_script":"","elevator_pitch":"","opening_hook":"","closing_statement":"","investor_questions":[{"question":"","answer":""}]}
Keep three_minute_script under 400 words. Generate 3 investor_questions.`;

  try {
    const [slidesData, scriptsData] = await Promise.all([
      generateJSON<{ slides: PitchSlide[] }>(slidesPrompt),
      generateJSON<Omit<PitchDeckResult, "slides">>(scriptsPrompt),
    ]);
    const result: PitchDeckResult = { slides: slidesData.slides, ...scriptsData };

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
