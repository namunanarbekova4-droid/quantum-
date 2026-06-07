import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [messages, onlineRaw] = await Promise.all([
    prisma.founderChat.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        user: { select: { id: true, name: true, country: true } },
      },
    }),
    prisma.founderChat.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
    }),
  ]);

  return NextResponse.json({
    messages: messages.reverse(),
    onlineCount: Math.max(onlineRaw.length, 1),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim() || message.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const chat = await prisma.founderChat.create({
    data: { userId: session.user.id, message: message.trim() },
    include: { user: { select: { id: true, name: true, country: true } } },
  });

  return NextResponse.json(chat);
}
