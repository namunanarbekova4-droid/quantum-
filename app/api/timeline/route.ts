import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { generateJSON } from "@/lib/gemini";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all decisions
  const decisions = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, type: true, status: true,
      riskScore: true, recommendation: true, createdAt: true,
    },
  });

  // Get outcomes from Supabase
  const { data: outcomes } = await supabaseAdmin
    .from("decision_outcomes")
    .select("*")
    .eq("user_id", session.user.id);

  const outcomesMap = new Map((outcomes || []).map((o) => [o.decision_id, o]));

  const timeline = decisions.map((d) => ({
    ...d,
    outcome: outcomesMap.get(d.id) || null,
    pendingReview: !outcomesMap.has(d.id) && isOlderThan30Days(d.createdAt),
  }));

  return NextResponse.json(timeline);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decisionId, outcome, whatHappened, lessonLearned } = await req.json();
  if (!decisionId || !outcome) return NextResponse.json({ error: "decisionId and outcome required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("decision_outcomes")
    .upsert({
      decision_id: decisionId,
      user_id: session.user.id,
      outcome,
      what_happened: whatHappened,
      lesson_learned: lessonLearned,
      reviewed_at: new Date().toISOString(),
    }, { onConflict: "decision_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GET /api/timeline/insights
export async function PUT() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: outcomes } = await supabaseAdmin
    .from("decision_outcomes")
    .select("*")
    .eq("user_id", session.user.id);

  if (!outcomes || outcomes.length < 3) {
    return NextResponse.json({ insights: [], message: "Need at least 3 reviewed decisions for insights" });
  }

  const decisions = await prisma.decision.findMany({
    where: { userId: session.user.id, id: { in: outcomes.map((o) => o.decision_id) } },
    select: { id: true, title: true, type: true, createdAt: true },
  });

  const decisionMap = new Map(decisions.map((d) => [d.id, d]));
  const data = outcomes.map((o) => {
    const d = decisionMap.get(o.decision_id);
    return { type: d?.type, outcome: o.outcome, createdAt: d?.createdAt };
  });

  const prompt = `Analyze this user's decision history and find evidence-based patterns only.

Decision outcomes:
${JSON.stringify(data, null, 2)}

Return JSON with only statistically supported insights (minimum 2 examples needed for any pattern):
{
  "insights": [
    {
      "pattern": "<specific pattern found>",
      "evidence": "<what data supports this>",
      "confidence": "<HIGH|MEDIUM|LOW>",
      "recommendation": "<actionable advice>"
    }
  ],
  "accuracyScore": <0-100 based on correct/partial outcomes>,
  "strongestCategory": "<decision type user does best>",
  "summary": "<2 sentence evidence-based summary>"
}`;

  try {
    const result = await generateJSON<{ insights: unknown[]; accuracyScore: number; strongestCategory: string; summary: string }>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function isOlderThan30Days(date: Date): boolean {
  return Date.now() - new Date(date).getTime() > 30 * 24 * 60 * 60 * 1000;
}
