import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { decisionText } = body;
  const locale: string = body.locale ?? "en";
  const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh" };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;
  if (!decisionText?.trim()) return NextResponse.json({ questions: [] });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ questions: [] });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
    });

    const prompt = `You are an elite strategic advisor. A business leader submitted this decision:

"${decisionText}"

Generate 3 to 5 highly specific, decision-critical questions. Each question must materially change the analysis or risk score if answered.

RULES:
- 100% specific to this exact decision — no generic questions
- Prioritize: numbers (revenue, runway, budget), constraints, competitive position, existing relationships, team capability, timeline
- Bad example: "What are your goals?" — too generic
- Bad example: "Have you done research?" — useless
- Good example: "What is your current monthly recurring revenue and cash runway?" — specific, changes risk score
- Good example: "Do you already have paying customers in that market?" — specific, changes recommendation

Return ONLY a raw JSON array of strings. No markdown. No code fences.
["Question 1?", "Question 2?", "Question 3?"]${langInstruction}`;

    const result = await model.generateContent(prompt);
    const raw = result.response
      .text()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const questions: string[] = JSON.parse(raw);
    if (!Array.isArray(questions)) throw new Error("not array");
    return NextResponse.json({ questions: questions.slice(0, 5) });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}
