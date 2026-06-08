import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface ManifestoResult {
  manifesto: string;
  coreValues: Array<{ name: string; explanation: string }>;
  missionStatement: string;
  visionStatement: string;
  culturePrinciples: string[];
}

const QUESTIONS = [
  "What does your company exist to do in the world? Not what it sells — what it DOES.",
  "What do you believe about your industry that most people disagree with?",
  "What kind of people do you want to work with? What makes someone fit here?",
  "What are you willing to say NO to, even if it means losing money?",
  "What does the world look like in 10 years if you succeed completely?",
  "What's the one sentence that would make the right person say 'I need to be part of this'?",
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
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const qa = QUESTIONS.map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are a master brand strategist who helps founders articulate their deepest purpose and principles.

Here are the founder's answers to 6 deep questions:

${qa}

Create a powerful company manifesto and brand foundations. Return ONLY a JSON object:
{
  "manifesto": "500-800 words of flowing, inspiring prose. Not a list. A narrative that captures WHY this company exists and what it stands for. Should give chills to the right reader.",
  "coreValues": [
    {"name": "Value Name", "explanation": "2-3 sentences on what this means in practice"},
    {"name": "Value Name", "explanation": "2-3 sentences on what this means in practice"},
    {"name": "Value Name", "explanation": "2-3 sentences on what this means in practice"},
    {"name": "Value Name", "explanation": "2-3 sentences on what this means in practice"},
    {"name": "Value Name", "explanation": "2-3 sentences on what this means in practice"}
  ],
  "missionStatement": "One sentence. What you do, for whom, and to what end.",
  "visionStatement": "One sentence. The world you're building toward.",
  "culturePrinciples": ["short principle 1", "short principle 2", "short principle 3", "short principle 4", "short principle 5"]
}

Make it specific to their answers. No generic startup platitudes. This should feel unmistakably like THEM.${langInstruction}`;

  const result = await generateJSON<ManifestoResult>(prompt);
  return NextResponse.json(result);
}
