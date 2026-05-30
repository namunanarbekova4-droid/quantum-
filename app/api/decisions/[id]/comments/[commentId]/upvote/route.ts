import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabaseAdmin
    .from("comment_votes")
    .select("id")
    .eq("comment_id", params.commentId)
    .eq("user_id", session.user.id)
    .single();

  if (existing) {
    // Remove upvote
    await supabaseAdmin
      .from("comment_votes")
      .delete()
      .eq("comment_id", params.commentId)
      .eq("user_id", session.user.id);

    const { data: c2 } = await supabaseAdmin.from("decision_comments").select("upvotes").eq("id", params.commentId).single();
    await supabaseAdmin.from("decision_comments").update({ upvotes: Math.max(0, (c2?.upvotes || 1) - 1) }).eq("id", params.commentId);

    return NextResponse.json({ upvoted: false });
  }

  await supabaseAdmin
    .from("comment_votes")
    .insert({ comment_id: params.commentId, user_id: session.user.id });

  const { data: c } = await supabaseAdmin.from("decision_comments").select("upvotes").eq("id", params.commentId).single();
  await supabaseAdmin.from("decision_comments").update({ upvotes: (c?.upvotes || 0) + 1 }).eq("id", params.commentId);

  return NextResponse.json({ upvoted: true });
}
