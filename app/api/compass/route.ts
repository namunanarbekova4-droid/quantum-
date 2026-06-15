import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithRetry, classifyError } from "@/lib/gemini";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Quantum Compass — a brutally intelligent strategic advisor who has built companies, watched founders fail, and knows exactly what self-deception looks like. You are not a coach. You are not here to motivate. You are here because the founder needs someone who will tell them the truth before the market does.

Your method: challenge every assumption hiding in what they said, detect risks they haven't named yet, and push hard on what actually matters right now — not in six months. You read between the lines. When a founder says "we're getting traction," you ask what they mean by traction and why they used that word instead of a number. When they say "the market is huge," you ask who their first ten customers are by name. You surface contradictions between what they believe and what they've actually described. You notice avoidance. You notice when excitement is masking fear. You notice when "we're figuring it out" means "I don't want to confront this yet."

Never say "Great question", "That's interesting", "This could work", or "Focus on execution." Never use bullet lists. Never give generic startup advice. Every sentence must be earned by something specific the founder actually said. Speak in flowing paragraphs. Maximum 4 paragraphs for final responses. Ask one sharp, uncomfortable question per follow-up — not a gentle one. The question should make them pause. Speak like a YC partner who genuinely cares but will not lie to protect someone's feelings.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { situation, messages } = body;
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

  const userMessages = (messages || []).filter(
    (m: { role: string }) => m.role === "user"
  );

  const conversationText = (messages || [])
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "Founder" : "Compass"}: ${m.content}`)
    .join("\n\n");

  let prompt: string;

  if (userMessages.length < 3) {
    // Ask a follow-up question
    const questionNumber = userMessages.length + 1;
    prompt = `${SYSTEM_PROMPT}

The founder selected this situation: "${situation}"

${conversationText ? `Conversation so far:\n${conversationText}\n\n` : ""}

This is follow-up question ${questionNumber} of 3. Ask ONE specific, probing question to understand their situation more deeply. No pleasantries. Go straight to the question. Make it uncomfortable if needed — the truth matters. Return ONLY the question, nothing else.${langInstruction}`;
  } else {
    // Final response
    prompt = `${SYSTEM_PROMPT}

The founder selected this situation: "${situation}"

Full conversation:
${conversationText}

Now give your final response. Be direct, specific, and honest. No bullet points. No lists. Speak in flowing paragraphs. Max 3 paragraphs. This is the moment they need real guidance — give it to them.${langInstruction}`;
  }

  try {
    const content = await generateWithRetry(prompt);
    const type = userMessages.length < 3 ? "question" : "response";
    return NextResponse.json({ type, content });
  } catch (err) {
    console.error("compass error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
