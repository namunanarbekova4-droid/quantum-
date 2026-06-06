import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface IdeaValidatorResult {
  verdict: "STRONG" | "PROMISING" | "NEEDS_WORK" | "PIVOT";
  problem_score: number;
  solution_score: number;
  market_score: number;
  overall_score: number;
  biggest_strength: string;
  biggest_risk: string;
  three_things_to_validate: string[];
  honest_feedback: string;
}

const QUESTIONS = [
  "What's your startup idea? Describe it like you'd explain to a stranger at a coffee shop.",
  "What problem does it solve? Be specific — whose problem, exactly?",
  "Why does this problem exist right now? What makes today different from 5 years ago?",
  "Who is your first paying customer and why would they pay on day one?",
  "What have you built or tested so far?",
  "Who are your top 3 competitors and what's your unfair advantage?",
  "How do you make money?",
  "Why are YOU the right person to solve this?",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const qa = QUESTIONS.map((q, i) => `Q${i + 1}: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are a senior startup investor and advisor. Analyze this founder's startup interview and provide an honest, critical assessment.

${qa}

Return ONLY a JSON object with this exact structure:
{
  "verdict": "STRONG" | "PROMISING" | "NEEDS_WORK" | "PIVOT",
  "problem_score": 0-100,
  "solution_score": 0-100,
  "market_score": 0-100,
  "overall_score": 0-100,
  "biggest_strength": "one specific sentence about the strongest aspect",
  "biggest_risk": "one specific sentence about the most dangerous risk",
  "three_things_to_validate": ["specific action 1", "specific action 2", "specific action 3"],
  "honest_feedback": "3 paragraphs of direct, specific, honest feedback. No bullet points. No flattery. Treat them like a smart adult."
}

Be brutally honest. Scores should reflect reality, not encouragement.${langInstruction}`;

  const result = await generateJSON<IdeaValidatorResult>(prompt);
  return NextResponse.json(result);
}
