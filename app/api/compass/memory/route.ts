import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - fetch user's compass memory
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memory = await prisma.compassMemory.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(memory ?? null);
}

// POST - update compass memory after a session
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fears, wins, patterns, emotionalBaseline } = await req.json();

  const memory = await prisma.compassMemory.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      fears: fears ?? [],
      wins: wins ?? [],
      recurringPatterns: patterns ?? [],
      emotionalBaseline: emotionalBaseline ?? "unknown",
      sessionCount: 1,
    },
    update: {
      fears: fears ?? [],
      wins: wins ?? [],
      recurringPatterns: patterns ?? [],
      emotionalBaseline: emotionalBaseline ?? "unknown",
      sessionCount: { increment: 1 },
    },
  });
  return NextResponse.json(memory);
}
