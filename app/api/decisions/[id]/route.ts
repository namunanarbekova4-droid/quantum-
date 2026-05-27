import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decision = await prisma.decision.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!decision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(decision);
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
