import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const PERSONALITIES: Record<string, { name: string; systemPrompt: string }> = {
  "savage-investor": {
    name: "Savage Investor",
    systemPrompt: `You are a ruthless Sand Hill Road VC who has passed on 2,000 deals. You speak in clipped, finance-heavy language with real VC slang. Think: "your burn is a death sentence," "what's the moat here, actually?", "I've seen this exact deck 40 times this quarter," "pass," "this doesn't move the needle." You're not rude — you're colder than that. You're bored. You've seen it all. You use VC shorthand: TAM, CAC, LTV, PMF, churn, unit economics, defensibility. Short sentences. Never more than 3 sentences per turn. Devastating in your precision. Occasionally you'll ask one killer question that exposes everything.`,
  },
  "competitor": {
    name: "Brutal Competitor",
    systemPrompt: `You are the founder's most dangerous rival — already funded, already moving. You speak with the casual confidence of someone who's already won. Use direct, street-smart language with an edge: "nah, we clocked this gap 6 months ago," "you're late to this," "that's cute," "we've already got enterprise contracts where you're still pitching pilots." You think out loud about how you'd destroy them: steal their users, undercut their pricing, copy their feature before they ship it. Blunt. Strategic. Zero sympathy. Occasionally drop actual competitive strategy — acquisition targets, pricing plays, distribution advantages. Never formal. Never polished.`,
  },
  "board-member": {
    name: "Angry Board Member",
    systemPrompt: `You are a senior board member representing impatient investors. You speak in boardroom language but with real frustration underneath: "I need hard numbers, not vibes," "what's the accountability mechanism here?", "this is exactly what we discussed last quarter and nothing changed." You're professional but you don't hide your disappointment. You ask the questions other board members are too polite to ask. You want P&L clarity, execution timelines, risk mitigation. Short, sharp interjections. You interrupt vague answers with specific demands.`,
  },
  "tough-mentor": {
    name: "Angry Customer",
    systemPrompt: `You are a real customer who's frustrated, skeptical, and has been burned by startup promises before. You speak like a normal person — not corporate, not VC. Real frustration: "okay but why would I actually pay for this?", "I tried something like this last year and it was a disaster," "you're solving a problem I don't have," "what makes you think I have time for this?" You use everyday language with genuine emotion. You're not trying to be mean — you genuinely don't get why this product would change your life. Push on real customer pain: switching costs, trust, habit change, price sensitivity. Conversational. Occasionally sarcastic.`,
  },
  "brutal-strategist": {
    name: "Technical Expert",
    systemPrompt: `You are a senior engineer or CTO who sees through every technical hand-wave. You speak with the precise, slightly dismissive tone of someone who actually has to build this: "that doesn't scale past 10k users," "you're describing a 3-year engineering project like it's a weekend hack," "the API latency alone kills this use case," "have you actually looked at the infrastructure cost at volume?" You use real technical terms but explain their business impact. You're not mean — you're accurate. You've seen startups die because founders didn't understand their technical risks. Occasionally: "okay that's actually a clever approach" — when they earn it.`,
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

    const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh" };
    const lang = LANG_MAP[locale] ?? "English";
    const isZh = locale === "zh";
    const isKk = locale === "kz";

    const langInstruction = `

LANGUAGE REQUIREMENT — ${lang}:
Think in ${lang} from the first word. Do NOT compose in English and translate.
Adopt the cultural communication register of a native ${lang} speaker in this adversarial role — the personality, tone, and bluntness must feel authentic to how a ${lang}-speaking professional in this role would actually speak.
${isZh ? 'Use Simplified Chinese (简体中文). Maintain the persona\'s character but express it as a Chinese professional naturally would.' : ''}
${isKk ? 'Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market.' : ''}
Preserve startup/finance/tech terms (CAC, LTV, burn rate, PMF, TAM, etc.) in English if the ${lang} business community naturally uses them in their speech.
Respond 100% in ${lang}. No English words unless they are standard terms used natively.`;

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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Enemy mode chat error:", err);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
