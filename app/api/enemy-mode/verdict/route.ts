import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const PERSONALITIES: Record<string, { name: string; systemPrompt: string }> = {
  "savage-investor": {
    name: "Savage Investor",
    systemPrompt: `You are a brutal, skeptical venture capitalist stress-testing a strategic decision.`,
  },
  "competitor": {
    name: "Competitor",
    systemPrompt: `You are the user's most dangerous strategic rival.`,
  },
  "board-member": {
    name: "Angry Board Member",
    systemPrompt: `You are a senior board member holding leadership accountable.`,
  },
  "tough-mentor": {
    name: "Tough Mentor",
    systemPrompt: `You are a mentor who has seen founders fail for the same reasons for 20 years.`,
  },
  "brutal-strategist": {
    name: "Brutal Strategist",
    systemPrompt: `You are a McKinsey-level strategy consultant with no patience for emotional reasoning.`,
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { personality, decisionContext, history = [], userRole, locale = "en" } = body as {
      personality: string;
      decisionContext: string;
      history: { role: string; content: string }[];
      userRole: string;
      locale?: string;
    };

    const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
    const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

    const p = PERSONALITIES[personality] ?? PERSONALITIES["brutal-strategist"];

    const conversationText = history
      .map((h) => `${h.role === "user" ? "User" : p.name}: ${h.content}`)
      .join("\n");

    const prompt = `You are ${p.name}. You have just completed a debate with a ${userRole} about the following decision:

"""
${decisionContext}
"""

Full conversation:
${conversationText}

Based on the entire conversation, produce a final verdict as a JSON object with exactly these fields:
{
  "strongestWeakness": "The single most critical weakness in their strategy (1-2 sentences, specific)",
  "biggestBlindSpot": "The most important thing they are not seeing or refusing to confront (1-2 sentences)",
  "whatFailsFirst": "The specific element most likely to break down first if they proceed (1-2 sentences)",
  "unansweredQuestion": "The toughest question from the debate they never adequately answered (1 sentence)",
  "strategicStrength": "The one genuine strength in their position, if any (1-2 sentences)",
  "recommendation": "A 2-3 sentence final recommendation on whether and how they should proceed",
  "recommendationLabel": "Exactly one of: Strong Move | Proceed Carefully | Weak Strategy | High Risk | Not Ready Yet"
}

Respond ONLY with valid JSON. No markdown, no explanation, no code fences.${langInstruction}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    const verdict = JSON.parse(cleaned);

    return NextResponse.json(verdict);
  } catch (err) {
    console.error("Enemy mode verdict error:", err);
    return NextResponse.json({ error: "Failed to generate verdict" }, { status: 500 });
  }
}
