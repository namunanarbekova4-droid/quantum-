import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, recipientName, recipientEmail, emailNumberUsed, notes } = await req.json();
  if (!campaignId || !recipientName || !recipientEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.emailTracking.create({
    data: {
      campaignId,
      userId: session.user.id,
      recipientName,
      recipientEmail,
      emailNumberUsed: emailNumberUsed ?? 1,
      notes: notes || null,
    },
  });

  return NextResponse.json(entry);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, notes, repliedAt } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const entry = await prisma.emailTracking.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(repliedAt ? { repliedAt: new Date(repliedAt) } : {}),
    },
  });

  return NextResponse.json(entry);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

  const rows = await prisma.emailTracking.findMany({
    where: { campaignId, userId: session.user.id },
    orderBy: { sentAt: "desc" },
  });

  return NextResponse.json(rows);
}
