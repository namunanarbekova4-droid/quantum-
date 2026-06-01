import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { type Plan, PLAN_LIMITS } from "@/lib/plans";

const VALID_PLANS: Plan[] = ["FREE_TRIAL", "PRO", "MAX", "PREMIUM"];

function shouldResetUsage(resetAt: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return resetAt < thirtyDaysAgo;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planSince: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let usage = await prisma.planUsage.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  // Reset monthly counters if needed
  if (shouldResetUsage(usage.resetAt)) {
    usage = await prisma.planUsage.update({
      where: { userId: session.user.id },
      data: {
        decisionsThisMonth: 0,
        mentorRequestsThisMonth: 0,
        resetAt: new Date(),
      },
    });
  }

  const plan = user.plan as Plan;
  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    plan,
    planSince: user.planSince,
    usage: {
      decisionsThisMonth: usage.decisionsThisMonth,
      mentorRequestsThisMonth: usage.mentorRequestsThisMonth,
      alertsCount: usage.alertsCount,
    },
    limits: {
      decisionsPerMonth: limits.decisionsPerMonth,
      mentorRequestsPerMonth: limits.mentorRequestsPerMonth,
      alerts: limits.alerts,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plan } = body as { plan: Plan };

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: plan as never, planSince: new Date() },
    select: { id: true, plan: true, planSince: true },
  });

  return NextResponse.json(user);
}
