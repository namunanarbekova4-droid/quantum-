import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: groups, error } = await supabaseAdmin
    .from("community_groups")
    .select("*")
    .order("is_vip", { ascending: true })
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: memberships } = await supabaseAdmin
    .from("community_members")
    .select("group_id")
    .eq("user_id", session.user.id);

  const memberGroupIds = new Set((memberships || []).map((m: { group_id: string }) => m.group_id));

  const result = (groups || []).map((g: Record<string, unknown>) => ({
    ...g,
    isMember: memberGroupIds.has(g.id as string),
  }));

  return NextResponse.json(result);
}
