import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";

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

  const prompt = `You are writing a manifesto that will make some people deeply uncomfortable. That is the point. A manifesto that no one disagrees with is a press release. A real manifesto declares a specific enemy — a broken system, a wrong assumption, a bad norm that everyone has accepted — and explains why this company exists to end it.

Generic mission statements are useless. "We empower people" means nothing. "We believe the healthcare system is designed for payers, not patients, and we are building for patients" means something. The difference is specificity about what's wrong and courage to say who you're not for.

Here are the founder's answers to 6 deep questions:

${qa}

Create the company manifesto and brand foundations. Return ONLY a JSON object:
{
  "manifesto": "500-800 words of opinionated, flowing prose. Not a list. Declare the broken thing. Name the enemy (a system, an assumption, a norm). Explain why this company exists now and not five years ago. Make it clear what this company will never do even if it costs money. The right person reading this should feel seen. The wrong person should feel excluded. That tension is the sign it's working.",
  "coreValues": [
    {"name": "Behavioral value name — a verb or action", "explanation": "2-3 sentences describing what this looks like on a Tuesday, not on a poster. 'We ship on Thursdays, not when it's perfect' not 'We value excellence.' What does someone do differently because of this value?"},
    {"name": "Behavioral value name", "explanation": "2-3 sentences of real behavior"},
    {"name": "Behavioral value name", "explanation": "2-3 sentences of real behavior"},
    {"name": "Behavioral value name", "explanation": "2-3 sentences of real behavior"},
    {"name": "Behavioral value name", "explanation": "2-3 sentences of real behavior"}
  ],
  "missionStatement": "One sentence. Must describe who you are NOT for as clearly as who you are for. Not a category — a specific trade-off.",
  "visionStatement": "One sentence. The specific change in the world if this company fully succeeds — not 'a better world' but what specifically is different.",
  "culturePrinciples": ["behavioral principle — what someone actually does", "behavioral principle", "behavioral principle", "behavioral principle", "behavioral principle"]
}

Use their actual answers. The specificity in their words is the raw material. Do not sand it into generic startup language.${langInstruction}`;

  try {
    const result = await generateJSON<ManifestoResult>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("manifesto error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
