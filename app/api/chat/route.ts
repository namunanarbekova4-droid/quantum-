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
    messages: messages.reverse().map((m) => ({
      id: m.id,
      userId: m.userId,
      message: m.message,
      messageType: (m as Record<string, unknown>).messageType ?? "text",
      stickerId: (m as Record<string, unknown>).stickerId ?? null,
      reactions: (m as Record<string, unknown>).reactions ?? {},
      createdAt: m.createdAt,
      user: m.user,
    })),
    onlineCount: Math.max(onlineRaw.length, 1),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, messageType = "text", stickerId = null } = await req.json();

  if (!message?.trim() || message.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const chat = await prisma.founderChat.create({
    data: {
      userId: session.user.id,
      message: message.trim(),
      messageType: messageType ?? "text",
      stickerId: stickerId ?? null,
    },
    include: { user: { select: { id: true, name: true, country: true } } },
  });

  return NextResponse.json({
    ...chat,
    messageType: (chat as Record<string, unknown>).messageType ?? "text",
    stickerId: (chat as Record<string, unknown>).stickerId ?? null,
    reactions: (chat as Record<string, unknown>).reactions ?? {},
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, emoji } = await req.json();
  if (!messageId || !emoji) {
    return NextResponse.json({ error: "messageId and emoji required" }, { status: 400 });
  }

  const userId = session.user.id;

  const existing = await prisma.founderChat.findUnique({ where: { id: messageId } });
  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const reactions = ((existing as Record<string, unknown>).reactions ?? {}) as Record<string, string[]>;
  const users: string[] = reactions[emoji] ?? [];

  if (users.includes(userId)) {
    // Remove reaction
    const updated = users.filter((u) => u !== userId);
    if (updated.length === 0) {
      delete reactions[emoji];
    } else {
      reactions[emoji] = updated;
    }
  } else {
    // Add reaction
    reactions[emoji] = [...users, userId];
  }

  const updated = await prisma.founderChat.update({
    where: { id: messageId },
    data: { reactions } as Record<string, unknown>,
    include: { user: { select: { id: true, name: true, country: true } } },
  });

  return NextResponse.json({
    ...updated,
    messageType: (updated as Record<string, unknown>).messageType ?? "text",
    stickerId: (updated as Record<string, unknown>).stickerId ?? null,
    reactions,
  });
}
