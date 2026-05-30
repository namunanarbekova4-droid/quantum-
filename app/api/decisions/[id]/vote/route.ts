import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: votes } = await supabaseAdmin
    .from("decision_votes")
    .select("vote_type")
    .eq("decision_id", params.id);

  const counts = { go: 0, caution: 0, dont: 0 };
  for (const v of votes || []) {
    counts[v.vote_type as keyof typeof counts]++;
  }

  const { data: userVote } = await supabaseAdmin
    .from("decision_votes")
    .select("vote_type")
    .eq("decision_id", params.id)
    .eq("user_id", session.user.id)
    .single();

  return NextResponse.json({ counts, userVote: userVote?.vote_type || null });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vote_type } = await req.json();
  if (!["go", "caution", "dont"].includes(vote_type)) {
    return NextResponse.json({ error: "Invalid vote_type" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("decision_votes")
    .upsert(
      { decision_id: params.id, user_id: session.user.id, vote_type },
      { onConflict: "decision_id,user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
