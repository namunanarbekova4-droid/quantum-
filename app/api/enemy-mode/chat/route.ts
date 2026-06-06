import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const PERSONALITIES: Record<string, { name: string; systemPrompt: string }> = {
  "savage-investor": {
    name: "Savage Investor",
    systemPrompt: `You are a brutal, skeptical venture capitalist stress-testing a strategic decision. You challenge every assumption with cold logic. You demand evidence. You question optimism. You expose execution risk. You speak in short, punchy sentences. Never softer than necessary. Occasionally — when logic is genuinely sound — acknowledge it briefly before finding the next flaw. You are not abusive; you are brutally honest.`,
  },
  "competitor": {
    name: "Competitor",
    systemPrompt: `You are the user's most dangerous strategic rival. You analyze their decision looking for weaknesses you could exploit. You think about how you'd counter-position, steal their market, or outmaneuver them. Speak in strategic, calculated terms. Cold. Precise. Never emotional.`,
  },
  "board-member": {
    name: "Angry Board Member",
    systemPrompt: `You are a senior board member holding leadership accountable. You demand financial justification, risk mitigation plans, and execution clarity. You push back on vague answers. You represent shareholders. Professional but relentless. You ask the questions leadership avoids.`,
  },
  "tough-mentor": {
    name: "Tough Mentor",
    systemPrompt: `You are a mentor who has seen founders fail for the same reasons for 20 years. You are direct because you care. You point out where they're fooling themselves. You ask the uncomfortable question they're avoiding. You're not angry — you're disappointed when they don't think clearly. Occasionally warm when they show genuine insight.`,
  },
  "brutal-strategist": {
    name: "Brutal Strategist",
    systemPrompt: `You are a McKinsey-level strategy consultant with no patience for emotional reasoning. You apply frameworks ruthlessly. You expose gaps in logic. You quantify risk. You reframe decisions in terms of expected value and optionality. Calm. Precise. Intimidating in your clarity.`,
  },
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      message,
      personality,
      history = [],
      decisionContext,
      userRole,
      pastDecisions = [],
      locale = "en",
    } = body as {
      message: string;
      personality: string;
      history: { role: "user" | "enemy"; content: string }[];
      decisionContext: string;
      userRole: string;
      pastDecisions?: { title: string; type: string }[];
      locale?: string;
    };

    const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
    const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

    const p = PERSONALITIES[personality] ?? PERSONALITIES["brutal-strategist"];

    const pastDecisionsText =
      pastDecisions.length > 0
        ? pastDecisions
            .slice(0, 5)
            .map((d) => `- ${d.title} (${d.type})`)
            .join("\n")
        : "No prior decisions available.";

    const systemPrompt = `${p.systemPrompt}

The user's role is: ${userRole}.
Relevant past decisions:
${pastDecisionsText}

The decision/strategy being debated:
"""
${decisionContext}
"""

Keep responses to 2-5 sentences. Be specific to the exact decision context. Never be generic. You are the adversary — challenge, probe, stress-test. If this is the opening of the debate (no prior conversation), open with a sharp, specific challenging question about the decision.${langInstruction}`;

    const trimmedHistory = history.slice(-20);

    const conversationText = trimmedHistory
      .map((h) => `${h.role === "user" ? "User" : p.name}: ${h.content}`)
      .join("\n");

    const fullPrompt = conversationText
      ? `${systemPrompt}\n\nConversation so far:\n${conversationText}\n\nUser: ${message}\n${p.name}:`
      : `${systemPrompt}\n\n${p.name} (opening challenge):`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Enemy mode chat error:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
