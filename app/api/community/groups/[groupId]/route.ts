import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { type Plan } from "@/lib/plans";

export async function GET(
  _req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: group, error } = await supabaseAdmin
    .from("community_groups")
    .select("*")
    .eq("id", params.groupId)
    .single();

  if (error || !group) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check VIP gating via plan
  if (group.is_vip) {
    const planUsage = await prisma.planUsage.findUnique({ where: { userId: session.user.id } });
    const plan = (planUsage?.plan ?? "FREE_TRIAL") as Plan;
    if (plan === "FREE_TRIAL" || plan === "PRO") {
      return NextResponse.json(
        { error: "VIP community requires Max or Premium plan", code: "PLAN_LIMIT" },
        { status: 403 }
      );
    }
  }

  const { data: membership } = await supabaseAdmin
    .from("community_members")
    .select("id")
    .eq("group_id", params.groupId)
    .eq("user_id", session.user.id)
    .single();

  return NextResponse.json({ ...group, isMember: !!membership });
}
