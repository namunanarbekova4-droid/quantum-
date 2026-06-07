import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [alerts, profile, pitchCount, ideaCount, compassCount] = await Promise.all([
    prisma.alert.findMany({
      where: { userId: session.user.id },
      include: { history: { orderBy: { triggeredAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { digestMode: true, alertIndustry: true },
    }),
    prisma.pitchBuild.count({ where: { userId: session.user.id } }),
    prisma.ideaValidation.count({ where: { userId: session.user.id } }),
    prisma.compassSession.count({ where: { userId: session.user.id } }),
  ]);

  const history = await prisma.alertHistory.findMany({
    where: { userId: session.user.id },
    include: { alert: { select: { topic: true, templateId: true } } },
    orderBy: { triggeredAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    alerts,
    history,
    digestMode: profile?.digestMode ?? false,
    alertIndustry: profile?.alertIndustry ?? null,
    usedPitch: pitchCount > 0,
    usedIdea: ideaCount > 0,
    usedCompass: compassCount > 0,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { topic, keywords, frequency, templateId } = await req.json();
  if (!topic?.trim()) return NextResponse.json({ error: "topic required" }, { status: 400 });

  const existing = templateId
    ? await prisma.alert.findFirst({ where: { userId: session.user.id, templateId } })
    : null;
  if (existing) return NextResponse.json({ error: "already_exists", alert: existing }, { status: 409 });

  const alert = await prisma.alert.create({
    data: {
      userId: session.user.id,
      topic: topic.trim(),
      keywords: keywords ?? [topic.trim().toLowerCase()],
      frequency: frequency ?? "DAILY",
      active: true,
      templateId: templateId ?? null,
    },
    include: { history: true },
  });

  return NextResponse.json(alert);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, active } = await req.json();
  const alert = await prisma.alert.update({
    where: { id, userId: session.user.id },
    data: { active },
    include: { history: { orderBy: { triggeredAt: "desc" }, take: 1 } },
  });
  return NextResponse.json(alert);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.alert.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
