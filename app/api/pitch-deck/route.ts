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

export interface PitchSlide {
  slide_number: number;
  slide_type: string;
  title: string;
  subtitle: string;
  main_content: string;
  speaker_notes: string;
  key_stat: string | null;
  emotional_purpose: string;
  visual_hint: string;
}

export interface DeckScore {
  overall: number;
  storytelling: number;
  clarity: number;
  investor_confidence: number;
  market_conviction: number;
  memorability: number;
  verdict: string;
}

export interface RedFlag {
  severity: "HIGH" | "MEDIUM" | "LOW";
  issue: string;
  slide: string;
  fix: string;
}

export interface WowMoment {
  headline: string;
  subtext: string;
  stat: string;
}

export interface InvestorPreviewItem {
  after_slide: number;
  thought: string;
}

export interface DeckIntelligence {
  deck_score: DeckScore;
  red_flags: RedFlag[];
  wow_moment: WowMoment;
  investor_preview: InvestorPreviewItem[];
}

interface PitchDeckResult {
  slides: PitchSlide[];
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
  intelligence?: DeckIntelligence;
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

  const slidesPrompt = `You are a world-class pitch deck writer who has helped 500+ startups raise $2B+.
You understand investor psychology deeply. For each slide:
- Create emotional momentum (build desire, reduce skepticism, inspire belief)
- Use founder voice (personal, urgent, confident)
- Keep content punchy — no walls of text
- Every title must be a conviction statement, not a label
- Optimize for the first 5 seconds of each slide

Create 12 slides for this startup. Respond in ${lang}.
${ctx}
Slide types in order: cover,problem,personal_story,solution,market,product,traction,business_model,competition,team,financials,ask.
Rules: punchy titles, founder voice, speaker_notes max 1 sentence, main_content max 2 sentences, key_stat only where it fits (else null).
For each slide also include:
- emotional_purpose: what this slide makes the investor feel (e.g., "Create urgency", "Build belief", "Reduce risk")
- visual_hint: suggested visual treatment (e.g., "market circle chart", "3-step process diagram", "metric grid")
Return JSON: {"slides":[{"slide_number":1,"slide_type":"cover","title":"","subtitle":"","main_content":"","speaker_notes":"","key_stat":null,"emotional_purpose":"","visual_hint":""}]}`;

  const scriptsPrompt = `Pitch coach. Write pitch scripts for this startup. Respond in ${lang}.
${ctx}
Return JSON: {"three_minute_script":"","elevator_pitch":"","opening_hook":"","closing_statement":"","investor_questions":[{"question":"","answer":""}]}
Keep three_minute_script under 400 words. Generate 3 investor_questions.`;

  const deckIntelPrompt = `You are a top-tier VC analyst reviewing this pitch. Respond in ${lang}.
${ctx}

Analyze this startup pitch and return JSON:
{
  "deck_score": {
    "overall": 85,
    "storytelling": 80,
    "clarity": 90,
    "investor_confidence": 75,
    "market_conviction": 85,
    "memorability": 70,
    "verdict": "Strong idea with compelling traction. Needs sharper differentiation."
  },
  "red_flags": [
    {
      "severity": "HIGH",
      "issue": "No clear moat explanation",
      "slide": "competition",
      "fix": "Add 2-3 defensible advantages: IP, network effects, or proprietary data"
    }
  ],
  "wow_moment": {
    "headline": "What if hiring took 30 seconds?",
    "subtext": "Not a prediction. Our reality today.",
    "stat": "$2M saved per company annually"
  },
  "investor_preview": [
    { "after_slide": 3, "thought": "Interesting problem, but who exactly pays for this?" },
    { "after_slide": 6, "thought": "Ok, the traction is real. This team has figured something out." },
    { "after_slide": 9, "thought": "The ask feels right for this stage." }
  ]
}
Keep red_flags to max 4 items. investor_preview exactly 3 items (slides 3, 6, 9).`;

  try {
    const [slidesData, scriptsData, intelData] = await Promise.all([
      generateJSON<{ slides: PitchSlide[] }>(slidesPrompt),
      generateJSON<Omit<PitchDeckResult, "slides" | "intelligence">>(scriptsPrompt),
      generateJSON<DeckIntelligence>(deckIntelPrompt),
    ]);
    const result: PitchDeckResult = {
      slides: slidesData.slides,
      ...scriptsData,
      intelligence: intelData,
    };

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
