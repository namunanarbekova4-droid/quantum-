import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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

  const { data: membership } = await supabaseAdmin
    .from("community_members")
    .select("id")
    .eq("group_id", params.groupId)
    .eq("user_id", session.user.id)
    .single();

  return NextResponse.json({ ...group, isMember: !!membership });
}
