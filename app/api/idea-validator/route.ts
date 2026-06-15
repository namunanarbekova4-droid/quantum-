import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";

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
    kz: "Kazakh",
  };
  const lang = LANG_MAP[locale] ?? "English";
  const isZh = locale === "zh";
  const isKk = locale === "kz";

  const langInstruction = `

LANGUAGE REQUIREMENT — ${lang}:
Think in ${lang} from the first word. Do NOT compose in English and translate.
Every insight, recommendation, and sentence must be written as a native ${lang} speaker — not a translator.
${isZh ? 'Use Simplified Chinese (简体中文). Write as a Chinese startup ecosystem professional would naturally write.' : ''}
${isKk ? 'Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market.' : ''}
Preserve startup/tech terms (MVP, traction, CAC, LTV, MRR, seed, ARR, PMF, etc.) in English if the ${lang} startup community naturally uses them.
Respond 100% in ${lang}. No English words unless they are standard startup terms used natively.`;

  const qa = QUESTIONS.map((q, i) => `Q${i + 1}: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are a former operator who built and sold two companies, and now a seed investor who has seen 3,000+ pitches — advising ${lang}-speaking founders with full native-quality intelligence. You know the difference between a founder who has talked to customers and one who has talked to themselves. You detect pattern mismatches instantly: target market vs pricing that don't align, solutions attacking the wrong part of a problem, market size claims that collapse under a single follow-up question, team backgrounds that have nothing to do with the customer they claim to serve.

Analyze this founder's startup interview with the same rigor you'd apply before writing a check.

${qa}

Your honest_feedback must contain exactly three things in three paragraphs:
(1) What the founder is actually building versus what they think they're building — call out any gap between their stated mission and what their answers reveal. Be specific about what their words actually describe.
(2) The one thing that could kill this — not a category of risk, but the specific, concrete failure mode most likely given what they've said. Name it precisely.
(3) The one thing genuinely worth betting on — the real signal in what they've shared, if any exists. If nothing is worth betting on yet, say so.

Scoring rules: 70+ is exceptional and rare. Most ideas score 40-60. Score on real investor standards — would a sophisticated seed investor fund this today? Scores reflect evidence, not effort.

Return ONLY a JSON object with this exact structure:
{
  "verdict": "STRONG" | "PROMISING" | "NEEDS_WORK" | "PIVOT",
  "problem_score": 0-100,
  "solution_score": 0-100,
  "market_score": 0-100,
  "overall_score": 0-100,
  "biggest_strength": "one specific sentence referencing something they actually said that constitutes a real signal",
  "biggest_risk": "one specific sentence naming the precise failure mode — not a category, the actual threat",
  "three_things_to_validate": ["a specific action with a measurable outcome", "a specific action with a measurable outcome", "a specific action with a measurable outcome"],
  "honest_feedback": "three paragraphs as described above — no softening, no flattery, no filler"
}${langInstruction}`;

  try {
    const result = await generateJSON<IdeaValidatorResult>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("idea-validator error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
