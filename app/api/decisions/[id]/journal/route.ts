import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const journal = await prisma.decisionJournal.findUnique({
    where: { decisionId: params.id },
  });

  return NextResponse.json(journal ?? null);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
  const { why, biggestFear, keyAssumption, expectedOutcome, deadline } = body;

  const journal = await prisma.decisionJournal.upsert({
    where: { decisionId: params.id },
    create: {
      decisionId: params.id,
      userId: session.user.id,
      why: why ?? null,
      biggestFear: biggestFear ?? null,
      keyAssumption: keyAssumption ?? null,
      expectedOutcome: expectedOutcome ?? null,
      deadline: deadline ? new Date(deadline) : null,
    },
    update: {
      why: why ?? null,
      biggestFear: biggestFear ?? null,
      keyAssumption: keyAssumption ?? null,
      expectedOutcome: expectedOutcome ?? null,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(journal);
}
