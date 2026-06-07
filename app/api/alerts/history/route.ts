import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.alertHistory.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (id) {
    await prisma.alertHistory.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
  }
  return NextResponse.json({ ok: true });
}
