import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = await prisma.decision.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!decision || decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { daysAfter, result, notes } = body;

  const validResults = ["SUCCEEDED", "FAILED", "PARTIAL", "ONGOING"];
  if (!validResults.includes(result)) {
    return NextResponse.json({ error: "Invalid result value" }, { status: 400 });
  }
  if (![7, 30, 90].includes(Number(daysAfter))) {
    return NextResponse.json({ error: "daysAfter must be 7, 30, or 90" }, { status: 400 });
  }

  const outcome = await prisma.decisionOutcome.create({
    data: {
      decisionId: params.id,
      userId: session.user.id,
      daysAfter: Number(daysAfter),
      result: result as never,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(outcome);
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = await prisma.decision.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!decision || decision.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const outcomes = await prisma.decisionOutcome.findMany({
    where: { decisionId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(outcomes);
}
