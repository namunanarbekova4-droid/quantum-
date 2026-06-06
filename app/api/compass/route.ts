import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithRetry } from "@/lib/gemini";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are Quantum Compass. Speak directly, honestly, with care. Never say "Great question". Never give bullet lists. Speak like a brutally honest mentor. Ask before you answer. Challenge when needed. Validate when deserved. Always tell truth. Max 3 paragraphs. Never generic. Always specific. Respond in the same language the user writes in.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { situation, messages } = await req.json();

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

This is follow-up question ${questionNumber} of 3. Ask ONE specific, probing question to understand their situation more deeply. No pleasantries. Go straight to the question. Make it uncomfortable if needed — the truth matters. Return ONLY the question, nothing else.`;
  } else {
    // Final response
    prompt = `${SYSTEM_PROMPT}

The founder selected this situation: "${situation}"

Full conversation:
${conversationText}

Now give your final response. Be direct, specific, and honest. No bullet points. No lists. Speak in flowing paragraphs. Max 3 paragraphs. This is the moment they need real guidance — give it to them.`;
  }

  const content = await generateWithRetry(prompt);
  const type = userMessages.length < 3 ? "question" : "response";

  return NextResponse.json({ type, content });
}
