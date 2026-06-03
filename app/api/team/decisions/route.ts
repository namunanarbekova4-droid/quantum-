import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const { data } = await supabaseAdmin
    .from("team_decisions")
    .select("*, team_votes(vote, comment, user_id)")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}
