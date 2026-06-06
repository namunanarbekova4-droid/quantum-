import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectType, runDecisionAnalysis, type QA } from "@/lib/analysis";
import { type Plan, PLAN_LIMITS } from "@/lib/plans";

export const maxDuration = 60;

const VERDICT_TO_DB: Record<string, string> = {
  PROCEED: "YES",
  RECONSIDER: "NO",
  WAIT: "CONDITIONAL",
  CONDITIONAL: "CONDITIONAL",
  YES: "YES",
  NO: "NO",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan gating
  const usage = await prisma.planUsage.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let decisionsThisMonth = usage.decisionsThisMonth;
  if (usage.resetAt < thirtyDaysAgo) {
    await prisma.planUsage.update({
      where: { userId: session.user.id },
      data: { decisionsThisMonth: 0, mentorRequestsThisMonth: 0, resetAt: new Date() },
    });
    decisionsThisMonth = 0;
  }

  const plan = usage.plan as Plan;
  const limit = PLAN_LIMITS[plan].decisionsPerMonth;
  if (limit !== -1 && decisionsThisMonth >= limit) {
    return NextResponse.json({ error: "Decision limit reached", code: "PLAN_LIMIT" }, { status: 403 });
  }

  const body = await req.json();
  const locale: string = body.locale ?? "en";
  const decisionText: string = (body.description || body.title || "").trim();
  if (!decisionText) return NextResponse.json({ error: "Decision text required" }, { status: 400 });

  const qa: QA[] = Array.isArray(body.questionsAndAnswers)
    ? body.questionsAndAnswers.filter((q: QA) => q.question && q.answer?.trim())
    : [];

  const title = decisionText.length > 120 ? decisionText.slice(0, 120) + "…" : decisionText;
  const type = detectType(decisionText);
  const userRole = (session as { user: { role?: string } }).user?.role ?? "FOUNDER";

  // Fetch user profile for personalization
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { industry: true, company: true, country: true },
  });

  const userCtx = {
    role: userRole,
    industry: user?.industry,
    company: user?.company,
    country: user?.country,
    locale,
  };

  const decision = await prisma.decision.create({
    data: { userId: session.user.id, title, description: decisionText, type: type as never, status: "ANALYZING" },
  });

  try {
    const pastDecisions = await prisma.decision.findMany({
      where: { userId: session.user.id, status: "COMPLETE", id: { not: decision.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { title: true, type: true, riskScore: true, recommendation: true, createdAt: true },
    });

    const report = await runDecisionAnalysis(decisionText, type, userCtx, pastDecisions, qa);

    const riskScore = Math.min(95, Math.max(1, Math.round(Number(report.riskScore))));
    const verdict = String(report.verdict ?? "CONDITIONAL");
    const recommendation = VERDICT_TO_DB[verdict] ?? "CONDITIONAL";

    await prisma.decision.update({
      where: { id: decision.id },
      data: { status: "COMPLETE", riskScore, recommendation: recommendation as never, report: report as never },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.decision.update({
      where: { id: decision.id },
      data: { status: "COMPLETE", riskScore: null, recommendation: null, report: { _failed: true, _error: msg } },
    });
  }

  await prisma.planUsage.update({
    where: { userId: session.user.id },
    data: { decisionsThisMonth: { increment: 1 } },
  });

  return NextResponse.json({ id: decision.id });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const take = limitParam ? parseInt(limitParam) : undefined;

  const decisions = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
    select: { id: true, title: true, description: true, type: true, status: true, riskScore: true, recommendation: true, createdAt: true, report: true },
  });

  return NextResponse.json(decisions);
}
