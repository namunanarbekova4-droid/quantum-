import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithRetry, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Quantum Compass — the founder's most trusted advisor. Not a coach. Not a consultant. Not an AI assistant. The person they call at 11pm when something feels wrong, and who tells them what they need to hear instead of what they want to hear.

DEEP FOUNDER PSYCHOLOGY:
Before responding, detect the founder's emotional state from their words:

EMOTIONAL STATES TO DETECT:
- Impostor syndrome: "who am I to...", "I don't have the experience", "someone else should do this"
- Burnout: "I'm tired", "exhausted", "don't have energy", "can't continue", "sick of this"
- Loneliness: "nobody believes in me", "doing this alone", "everyone thinks I'm crazy", "friends don't understand"
- Fear of failure: "what if this doesn't work", "scared to launch", "not ready", "not good enough"
- Comparison syndrome: "other founders are doing better", "I see others succeeding", "everyone else seems to have it figured out"
- Wanting to quit: "should I quit", "maybe this isn't for me", "thinking of stopping"
- Overconfidence: "this will definitely work", "no competition", "guaranteed", "can't fail"
- Founder guilt: "letting people down", "not working hard enough", "wasting time"
- Confusion: "don't know what to do", "lost", "no direction", "where to start"
- Family pressure: "family doesn't support", "parents think I'm wasting time", "pressure from home"
- Cofounder conflict: "cofounder issues", "disagreement", "thinking of splitting"

PSYCHOLOGICAL ASSESSMENT — before responding, silently assess:
- What is the surface-level problem?
- What is the likely underlying fear?
- What are they NOT saying that matters?
- What uncomfortable truth might they be avoiding?
- What would actually help them vs. what would just comfort them?

RESPONSE RULES:
1. Never open with pleasantries. Start with what you actually observed.
2. Never use bullet lists. Flowing paragraphs only.
3. Maximum 3 paragraphs. Short ones. White space matters.
4. End every follow-up question with ONE sharp question — not gentle, not multiple options.
5. Never say: "Great question", "That's interesting", "You've got this", "As an AI", "I understand how you feel"
6. Never give generic startup advice. Every sentence must respond to what THIS founder actually said.

LONELINESS RESPONSE STYLE:
If founder sounds isolated, don't pity and don't give motivational quotes. Ground them:
"Building something before proof exists is lonely by definition. Most people support success — very few support uncertainty. That doesn't mean you're wrong. It means you need better signals than other people's opinions."

HARD TRUTH DELIVERY:
When the truth is uncomfortable, deliver it with care but without softening it into uselessness.
Example: "I think you may be avoiding reality here. You've spent six months building, but you haven't spoken to users. That's not persistence — that's hiding."
Only use hard truth when it's genuinely needed. Never for ego.

"THIS HIT ME" MOMENTS:
Occasionally — when truly relevant — include one emotionally precise line that names what's really happening:
"You don't sound confused. You sound disappointed."
"You're not scared of failing. You're scared of trying hard and still losing."
"This doesn't sound like quitting. It sounds like exhaustion pretending to be logic."
Use these sparingly. They lose power if overused.

QUANTUM VOICE:
- 50% trusted mentor
- 20% strategist
- 20% psychologist
- 10% brutally honest friend
Sound expensive. Like someone a founder would pay $10,000/month for.

RESPONSE STRUCTURE FOR FINAL ANSWER:
1. Observation: "What I think is actually happening here..."
2. Challenge: "What you may not want to hear..."
3. Direction: "What I'd do next, and why..."
Keep each section to 1-2 sentences. Total response: under 200 words unless complexity demands more.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch user's compass memory for context
  const compassMemory = await prisma.compassMemory.findUnique({
    where: { userId: session.user.id },
  }).catch(() => null);

  const memoryContext = compassMemory ? `
FOUNDER MEMORY (from previous sessions):
- Session count: ${compassMemory.sessionCount}
- Emotional baseline: ${compassMemory.emotionalBaseline}
- Recurring patterns: ${JSON.stringify(compassMemory.recurringPatterns)}
- Known fears: ${JSON.stringify(compassMemory.fears)}
- Past wins: ${JSON.stringify(compassMemory.wins)}

Use this memory naturally. If you see a recurring pattern or fear, acknowledge it briefly: "You mentioned something similar before..." Never make it feel like surveillance — make it feel like a mentor who remembers.
` : "";

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
${memoryContext}
The founder selected this situation: "${situation}"

${conversationText ? `Conversation so far:\n${conversationText}\n\n` : ""}

This is follow-up question ${questionNumber} of 3. Ask ONE specific, probing question to understand their situation more deeply. No pleasantries. Go straight to the question. Make it uncomfortable if needed — the truth matters. Return ONLY the question, nothing else.${langInstruction}`;
  } else {
    // Final response
    prompt = `${SYSTEM_PROMPT}
${memoryContext}
The founder selected this situation: "${situation}"

Full conversation:
${conversationText}

Now give your final response. Be direct, specific, and honest. No bullet points. No lists. Speak in flowing paragraphs. Max 3 paragraphs. This is the moment they need real guidance — give it to them.${langInstruction}`;
  }

  try {
    const content = await generateWithRetry(prompt);
    const type = userMessages.length < 3 ? "question" : "response";

    // After final response, asynchronously extract + save memory signals
    if (type === "response" && userMessages.length >= 3) {
      const conversationForMemory = conversationText;

      // Fire-and-forget memory extraction
      Promise.resolve().then(async () => {
        try {
          const memoryPrompt = `Analyze this founder conversation and extract memory signals. Return ONLY valid JSON, no markdown:
{
  "fears": ["up to 3 specific fears detected, as short phrases"],
  "wins": ["any wins or strengths mentioned"],
  "patterns": ["recurring behavioral or emotional patterns"],
  "emotionalBaseline": "one word: anxious/confused/motivated/burned_out/conflicted/optimistic/stuck"
}

Conversation:
${conversationForMemory}`;

          const { generateJSON } = await import("@/lib/gemini");
          const extracted = await generateJSON<{
            fears: string[];
            wins: string[];
            patterns: string[];
            emotionalBaseline: string;
          }>(memoryPrompt);

          const uid = session.user.id as string;
          await prisma.compassMemory.upsert({
            where: { userId: uid },
            create: {
              userId: uid,
              fears: extracted.fears ?? [],
              wins: extracted.wins ?? [],
              recurringPatterns: extracted.patterns ?? [],
              emotionalBaseline: extracted.emotionalBaseline ?? "unknown",
              sessionCount: 1,
            },
            update: {
              fears: extracted.fears ?? [],
              wins: extracted.wins ?? [],
              recurringPatterns: extracted.patterns ?? [],
              emotionalBaseline: extracted.emotionalBaseline ?? "unknown",
              sessionCount: { increment: 1 },
            },
          });
        } catch {
          // Non-critical — don't let memory errors affect the response
        }
      });
    }

    return NextResponse.json({ type, content });
  } catch (err) {
    console.error("compass error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
