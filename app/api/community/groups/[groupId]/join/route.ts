import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json().catch(() => ({ action: "join" }));

  if (action === "leave") {
    await supabaseAdmin
      .from("community_members")
      .delete()
      .eq("group_id", params.groupId)
      .eq("user_id", session.user.id);

    // Decrement member count via recalculation


    return NextResponse.json({ joined: false });
  }

  const { error } = await supabaseAdmin
    .from("community_members")
    .insert({ group_id: params.groupId, user_id: session.user.id })
    .select()
    .single();

  if (error && !error.message.includes("unique")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment member count
  await supabaseAdmin
    .from("community_groups")
    .update({ member_count: 0 }) // will be recalculated via count query
    .eq("id", params.groupId);

  const { count } = await supabaseAdmin
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", params.groupId);

  await supabaseAdmin
    .from("community_groups")
    .update({ member_count: count ?? 0 })
    .eq("id", params.groupId);

  return NextResponse.json({ joined: true });
}
