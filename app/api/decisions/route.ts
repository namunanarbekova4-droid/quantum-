import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectType, runDecisionAnalysis } from "@/lib/analysis";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const decisionText: string = (body.description || body.title || "").trim();
  if (!decisionText) return NextResponse.json({ error: "Decision text required" }, { status: 400 });

  const title = decisionText.length > 120 ? decisionText.slice(0, 120) + "…" : decisionText;
  const type = detectType(decisionText);
  const userRole = (session as { user: { role?: string } }).user?.role ?? "FOUNDER";

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

    const report = await runDecisionAnalysis(decisionText, type, userRole, pastDecisions);

    const riskScore = Math.min(95, Math.max(1, Math.round(Number(report.riskScore))));
    const recommendation = ["YES", "NO", "CONDITIONAL"].includes(String(report.recommendation))
      ? String(report.recommendation)
      : "CONDITIONAL";

    await prisma.decision.update({
      where: { id: decision.id },
     data: { status: "COMPLETE", riskScore, recommendation: recommendation as never, report: report as never },});
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.decision.update({
      where: { id: decision.id },
      data: {
        status: "COMPLETE",
        riskScore: null,
        recommendation: null,
        report: { _failed: true, _error: msg },
      },
    });
  }

  return NextResponse.json({ id: decision.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decisions = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, status: true, riskScore: true, recommendation: true, createdAt: true, report: true },
  });

  return NextResponse.json(decisions);
}
