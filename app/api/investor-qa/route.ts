import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";
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

      const prompt = `You are a seasoned venture capitalist who has sat on the other side of the table for 500+ pitch meetings. You know exactly which questions make founders panic.

Generate 15 brutally tough but fair investor questions for this startup:

Startup Name: ${startupName}
Description: ${description}
Stage: ${stage}
Raising: ${raisingAmount}

Rules:
- Questions must be specific to THIS startup, not generic
- Mix of market, traction, team, financials, competition, moat, and vision questions
- Include at least 2 "trap" questions (things that sound easy but reveal deep problems)
- Questions should feel like they come from a real VC who did their homework
- Some questions should challenge core assumptions of the business
- Vary length: some short and punchy, some multi-part
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

      const prompt = `You are a top-tier VC evaluating a founder's answer during a pitch meeting. You are brutally honest but constructive.

Startup: ${startupName}
Investor Question: ${question}
Founder's Answer: ${answer}

Evaluate this answer on a scale of 0-100. Be strict. Investors have high standards.

Scoring guide:
- 80-100: Specific data, clear narrative, addresses the question directly, shows deep understanding
- 60-79: Decent but missing key specifics or slightly off-topic
- 40-59: Vague, hand-wavy, or partially answers the question
- 0-39: Evasive, wrong, or exposes a critical gap

Verdicts:
- STRONG (70+): Investor leans forward
- ACCEPTABLE (40-69): Investor is cautious but continues
- WEAK (<40): Investor mentally checks out

Respond in ${language}.

Return ONLY valid JSON:
{
  "score": 0,
  "verdict": "STRONG",
  "whatWorked": "specific praise about what was good in their answer",
  "whatsWrong": "specific critique of what was missing or weak",
  "betterVersion": "a rewritten, stronger version of the answer using the same facts but making them land better"
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
