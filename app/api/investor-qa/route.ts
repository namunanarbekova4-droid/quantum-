import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const LANG_MAP: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  zh: "Chinese",
  kz: "Kazakh",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;
    const language = LANG_MAP[body.locale as string] || "English";

    // ── generate_questions ───────────────────────────────────────────────────
    if (action === "generate_questions") {
      const { startupName, description, stage, raisingAmount } = body as {
        startupName: string;
        description: string;
        stage: string;
        raisingAmount: string;
      };

      if (!startupName || !description) {
        return NextResponse.json(
          { error: "startupName and description are required" },
          { status: 400 }
        );
      }

      const prompt = `You are a VC who did your homework before this meeting. You have read everything available about this startup and you know where the gaps are. Your questions are designed to reveal whether the founder has confronted the hard realities — or is still working from a thesis that hasn't been tested.

Generate 15 investor questions for this startup:

Startup Name: ${startupName}
Description: ${description}
Stage: ${stage}
Raising: ${raisingAmount}

Rules:
- At least 3 questions must expose specific contradictions in THIS startup — market size claimed vs. the niche they're actually targeting, B2B positioning vs. consumer-level pricing, "no competition" claims vs. obvious adjacent players, etc. Name the contradiction in the question.
- The hardest questions should sound casual but reveal everything. "What happened the last time you talked to a customer this week?" is more revealing than "Describe your customer discovery process." Conversational delivery, surgical intent.
- Include at least 2 questions about what has already failed or surprised them — not hypothetically, actually.
- Mix of: market reality, traction interpretation, team blind spots, unit economics, competitive response, timing, and the one thing that would make this not work
- Some short and blunt. Some multi-part that force prioritization.
- Respond in ${language}

Return ONLY valid JSON:
{ "questions": ["question1", "question2", ..., "question15"] }`;

      const result = await generateJSON<{ questions: string[] }>(prompt);
      return NextResponse.json({ questions: result.questions });
    }

    // ── score_answer ─────────────────────────────────────────────────────────
    if (action === "score_answer") {
      const { question, answer, startupName } = body as {
        question: string;
        answer: string;
        startupName: string;
      };

      if (!question || !answer) {
        return NextResponse.json(
          { error: "question and answer are required" },
          { status: 400 }
        );
      }

      const prompt = `You are a VC scoring a founder's answer in real time. Score harshly — an answer that sounds reasonable but contains no specific data or concrete commitment is a 40, not a 65. Founders consistently confuse sounding confident with saying something.

Startup: ${startupName}
Investor Question: ${question}
Founder's Answer: ${answer}

Scoring guide — apply this strictly:
- 80-100: Specific data, concrete numbers, direct answer, reveals genuine understanding of the problem. Investor leans forward.
- 60-79: Directionally correct but missing specifics — rounds when it should sharpen, hedges when it should commit.
- 40-59: Vague, generic, or answers an adjacent question instead of this one. Could have been said by any founder.
- 0-39: Evasive, contradicts earlier claims, exposes a critical gap, or the founder clearly hasn't thought about this yet.

Verdicts:
- STRONG (70+): Investor leans forward
- ACCEPTABLE (40-69): Investor is cautious but continues
- WEAK (<40): Investor mentally checks out

Respond in ${language}.

Return ONLY valid JSON:
{
  "score": 0,
  "verdict": "STRONG",
  "whatWorked": "Quote the specific sentence or phrase from their answer that actually worked and explain precisely why — not a category like 'they showed confidence' but the exact thing that landed",
  "whatsWrong": "Quote the specific sentence that weakened the answer and explain what it revealed or failed to address — not a category, the actual line",
  "betterVersion": "A rewritten answer that is night-and-day better — not slightly rephrased, but fundamentally restructured. Uses the same facts they gave but makes them land. Specific, direct, no hedging. This should make the founder think 'I wish I had said that.'"
}`;

      const result = await generateJSON<{
        score: number;
        verdict: "STRONG" | "ACCEPTABLE" | "WEAK";
        whatWorked: string;
        whatsWrong: string;
        betterVersion: string;
      }>(prompt);

      return NextResponse.json(result);
    }

    // ── save_session ─────────────────────────────────────────────────────────
    if (action === "save_session") {
      const {
        startupName,
        description,
        stage,
        raisingAmount,
        questionsAndAnswers,
        overallScore,
      } = body as {
        startupName: string;
        description: string;
        stage: string;
        raisingAmount: string;
        questionsAndAnswers: unknown[];
        overallScore: number;
      };

      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const qaSession = await prisma.qaSession.create({
        data: {
          userId: user.id,
          startupName,
          startupDescription: description,
          stage,
          raisingAmount,
          questionsAndAnswers: JSON.parse(JSON.stringify(questionsAndAnswers)),
          overallScore: Math.round(overallScore),
        },
      });

      return NextResponse.json({ id: qaSession.id });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[investor-qa] error:", err);
    return NextResponse.json(
      { error: classifyError(err) },
      { status: 500 }
    );
  }
}
