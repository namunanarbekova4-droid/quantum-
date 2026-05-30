import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") || "top";

  const orderCol = sort === "recent" ? "created_at" : "upvotes";

  const { data: comments, error } = await supabaseAdmin
    .from("decision_comments")
    .select("*")
    .eq("decision_id", params.id)
    .order(orderCol, { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check which ones current user upvoted
  const commentIds = (comments || []).map((c: { id: string }) => c.id);
  const { data: userVotes } = commentIds.length > 0 ? await supabaseAdmin
    .from("comment_votes")
    .select("comment_id")
    .eq("user_id", session.user.id)
    .in("comment_id", commentIds) : { data: [] };

  const userVotedIds = new Set((userVotes || []).map((v: { comment_id: string }) => v.comment_id));

  const result = (comments || []).map((c: Record<string, unknown>) => ({
    ...c,
    userUpvoted: userVotedIds.has(c.id as string),
    displayName: c.is_anonymous ? "Anonymous" : c.user_id === session.user.id ? "You" : "Member",
  }));

  return NextResponse.json(result);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, is_anonymous = true } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("decision_comments")
    .insert({
      decision_id: params.id,
      user_id: session.user.id,
      content: content.trim(),
      is_anonymous,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
