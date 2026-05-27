import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runDecisionAnalysis } from "@/lib/analysis";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = await prisma.decision.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(decision);
}

export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = await prisma.decision.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userRole = (session as { user: { role?: string } }).user?.role ?? "FOUNDER";

  await prisma.decision.update({
    where: { id: params.id },
    data: { status: "ANALYZING", report: null, riskScore: null, recommendation: null },
  });

  try {
    const report = await runDecisionAnalysis(decision.description, decision.type as string, userRole);
    const riskScore = Math.min(95, Math.max(1, Math.round(Number(report.riskScore))));
    const recommendation = ["YES", "NO", "CONDITIONAL"].includes(String(report.recommendation))
      ? String(report.recommendation)
      : "CONDITIONAL";

    const updated = await prisma.decision.update({
      where: { id: params.id },
      data: { status: "COMPLETE", riskScore, recommendation: recommendation as never, report },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const updated = await prisma.decision.update({
      where: { id: params.id },
      data: {
        status: "COMPLETE",
        riskScore: null,
        recommendation: null,
        report: { _failed: true, _error: msg },
      },
    });
    return NextResponse.json(updated);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { outcome } = await req.json();
  if (!["GOOD", "BAD", "UNKNOWN"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const decision = await prisma.decision.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentReport = (decision.report as Record<string, unknown>) ?? {};
  await prisma.decision.update({
    where: { id: params.id },
    data: { report: { ...currentReport, outcome } },
  });

  return NextResponse.json({ ok: true });
}
