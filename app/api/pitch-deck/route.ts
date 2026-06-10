import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

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

  const prompt = `You are the world's best pitch deck writer. Write a complete 12-slide pitch deck in the FOUNDER'S EXACT VOICE. Use their words and phrases. Never sound corporate or generic. Every slide title must be a punchy statement, not just a category label.

Startup Name: ${startupName}

Founder's answers:
Q1 (Startup & one-sentence description): ${answers[0] || "(no answer)"}
Q2 (Problem it solves): ${answers[1] || "(no answer)"}
Q3 (Personal discovery of problem): ${answers[2] || "(no answer)"}
Q4 (Solution & how it works): ${answers[3] || "(no answer)"}
Q5 (Exact target customer): ${answers[4] || "(no answer)"}
Q6 (Business model): ${answers[5] || "(no answer)"}
Q7 (Competitors & advantage): ${answers[6] || "(no answer)"}
Q8 (Traction so far): ${answers[7] || "(no answer)"}
Q9 (Team & why you): ${answers[8] || "(no answer)"}
Q10 (Raise amount & use): ${answers[9] || "(no answer)"}

Return ONLY this exact JSON structure:
{
  "slides": [
    {
      "slide_number": 1,
      "slide_type": "cover",
      "title": "punchy statement title",
      "subtitle": "one line subtitle",
      "main_content": "main content for this slide",
      "speaker_notes": "what to say out loud for this slide (2-3 sentences)",
      "key_stat": "bold number/stat or null"
    }
  ],
  "three_minute_script": "full 3-minute speaking script in natural founder voice",
  "elevator_pitch": "30-second elevator pitch",
  "opening_hook": "powerful opening line to grab attention",
  "closing_statement": "memorable closing statement",
  "investor_questions": [
    { "question": "tough investor question", "answer": "strong suggested answer" }
  ]
}

Generate all 12 slides in order: cover, problem, personal_story, solution, market, product, traction, business_model, competition, team, financials, ask.
Make titles punchy like "We Found the Problem No One Wanted to Solve" not just "Problem".
Generate 5 investor_questions with strong answers.${langInstruction}`;

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
