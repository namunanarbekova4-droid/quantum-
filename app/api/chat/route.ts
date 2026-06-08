import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  const search = url.searchParams.get("search");

  const [messages, onlineRaw] = await Promise.all([
    prisma.founderChat.findMany({
      where: {
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
        ...(search ? { message: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, country: true, company: true, createdAt: true, streakDays: true } },
      },
    }),
    prisma.founderChat.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
    }),
  ]);

  const rows = messages.reverse().map((m) => ({
    id: m.id,
    userId: m.userId,
    message: m.message,
    messageType: (m as Record<string, unknown>).messageType ?? "text",
    stickerId: (m as Record<string, unknown>).stickerId ?? null,
    reactions: (m as Record<string, unknown>).reactions ?? {},
    replyToId: (m as Record<string, unknown>).reply_to_id ?? null,
    isDeleted: false,
    createdAt: m.createdAt,
    user: m.user,
  }));

  return NextResponse.json({ messages: rows, onlineCount: Math.max(onlineRaw.length, 1) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, messageType = "text", stickerId = null, replyToId = null } = await req.json();

  if (!message?.trim() || message.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const chat = await prisma.founderChat.create({
    data: {
      userId: session.user.id,
      message: message.trim(),
      messageType: messageType ?? "text",
      stickerId: stickerId ?? null,
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    } as Parameters<typeof prisma.founderChat.create>[0]["data"],
    include: { user: { select: { id: true, name: true, country: true, company: true, createdAt: true, streakDays: true } } },
  });

  return NextResponse.json({
    id: chat.id,
    userId: chat.userId,
    message: chat.message,
    messageType: (chat as Record<string, unknown>).messageType ?? "text",
    stickerId: (chat as Record<string, unknown>).stickerId ?? null,
    reactions: {},
    replyToId: (chat as Record<string, unknown>).reply_to_id ?? null,
    isDeleted: false,
    createdAt: chat.createdAt,
    user: chat.user,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = session.user.id;

  // Delete message
  if (body.action === "delete") {
    const { messageId } = body;
    if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });
    const existing = await prisma.founderChat.findUnique({ where: { id: messageId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.founderChat.update({
      where: { id: messageId },
      data: { is_deleted: true } as Parameters<typeof prisma.founderChat.update>[0]["data"],
    });
    return NextResponse.json({ ok: true });
  }

  // Toggle reaction
  const { messageId, emoji } = body;
  if (!messageId || !emoji) return NextResponse.json({ error: "messageId and emoji required" }, { status: 400 });

  const existing = await prisma.founderChat.findUnique({ where: { id: messageId } });
  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const reactions = ((existing as Record<string, unknown>).reactions ?? {}) as Record<string, string[]>;
  const users: string[] = reactions[emoji] ?? [];

  if (users.includes(userId)) {
    const updated = users.filter((u) => u !== userId);
    if (updated.length === 0) delete reactions[emoji];
    else reactions[emoji] = updated;
  } else {
    reactions[emoji] = [...users, userId];
  }

  await prisma.founderChat.update({
    where: { id: messageId },
    data: { reactions } as Record<string, unknown>,
  });

  return NextResponse.json({ ok: true, reactions });
}
