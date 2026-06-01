import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { type Plan, PLAN_LIMITS } from "@/lib/plans";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get own mentor profile if exists
  const { data: myProfile } = await supabaseAdmin
    .from("mentor_profiles")
    .select("id")
    .eq("user_id", session.user.id)
    .single();

  let query = supabaseAdmin
    .from("mentor_requests")
    .select("*, mentor:mentor_profiles(full_name, expertise, industry)")
    .order("created_at", { ascending: false });

  if (myProfile) {
    query = query.or(`requester_id.eq.${session.user.id},mentor_id.eq.${myProfile.id}`);
  } else {
    query = query.eq("requester_id", session.user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mentor_id, decision_id, message } = await req.json();
  if (!mentor_id) return NextResponse.json({ error: "mentor_id required" }, { status: 400 });

  // Check mentor exists and is approved
  const { data: mentor } = await supabaseAdmin
    .from("mentor_profiles")
    .select("id, status")
    .eq("id", mentor_id)
    .eq("status", "approved")
    .single();

  if (!mentor) return NextResponse.json({ error: "Mentor not found or not approved" }, { status: 404 });

  // Plan-based limit check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const plan = (user?.plan ?? "FREE_TRIAL") as Plan;

  const usage = await prisma.planUsage.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  // Reset monthly counter if needed
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  let mentorRequestsThisMonth = usage.mentorRequestsThisMonth;
  if (usage.resetAt < thirtyDaysAgo) {
    await prisma.planUsage.update({
      where: { userId: session.user.id },
      data: { decisionsThisMonth: 0, mentorRequestsThisMonth: 0, resetAt: new Date() },
    });
    mentorRequestsThisMonth = 0;
  }

  const limit = PLAN_LIMITS[plan].mentorRequestsPerMonth;
  if (limit !== -1 && mentorRequestsThisMonth >= limit) {
    return NextResponse.json(
      { error: "Monthly mentor request limit reached. Upgrade for more.", code: "PLAN_LIMIT" },
      { status: 429 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("mentor_requests")
    .insert({
      mentor_id,
      requester_id: session.user.id,
      decision_id: decision_id || null,
      message: message || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment usage counter
  await prisma.planUsage.update({
    where: { userId: session.user.id },
    data: { mentorRequestsThisMonth: { increment: 1 } },
  });

  return NextResponse.json(data, { status: 201 });
}
