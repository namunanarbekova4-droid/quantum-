import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 30;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberships } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role, teams(id, name, created_by)")
    .eq("user_id", session.user.id);

  return NextResponse.json(memberships || []);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create_team") {
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Team name required" }, { status: 400 });

    const { data: team, error } = await supabaseAdmin
      .from("teams")
      .insert({ name, created_by: session.user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseAdmin.from("team_members").insert({
      team_id: team.id, user_id: session.user.id, role: "owner",
    });

    return NextResponse.json(team, { status: 201 });
  }

  if (action === "invite") {
    const { teamId, email } = body;
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await supabaseAdmin.from("team_members").upsert({
      team_id: teamId, user_id: user.id, role: "member",
    }, { onConflict: "team_id,user_id" });

    return NextResponse.json({ ok: true });
  }

  if (action === "submit_decision") {
    const { teamId, title, description } = body;
    const { data, error } = await supabaseAdmin
      .from("team_decisions")
      .insert({ team_id: teamId, submitted_by: session.user.id, title, description, status: "voting" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "vote") {
    const { teamDecisionId, vote, comment } = body;
    await supabaseAdmin.from("team_votes").upsert({
      team_decision_id: teamDecisionId,
      user_id: session.user.id,
      vote,
      comment,
    }, { onConflict: "team_decision_id,user_id" });

    return NextResponse.json({ ok: true });
  }

  if (action === "analyze_consensus") {
    const { teamDecisionId, title, description } = body;
    const { data: votes } = await supabaseAdmin
      .from("team_votes")
      .select("vote, comment")
      .eq("team_decision_id", teamDecisionId);

    if (!votes || votes.length < 2) {
      return NextResponse.json({ error: "Need at least 2 votes for analysis" }, { status: 400 });
    }

    const prompt = `Analyze team voting consensus for this decision.

Decision: "${title}"
Description: ${description}

Votes and comments:
${votes.map((v, i) => `${i + 1}. Vote: ${v.vote}${v.comment ? ` - "${v.comment}"` : ""}`).join("\n")}

Return JSON:
{
  "overallSentiment": "<POSITIVE|NEUTRAL|NEGATIVE|DIVIDED>",
  "keyConcerns": ["<concern 1>", "<concern 2>"],
  "agreementPoints": ["<agreement 1>", "<agreement 2>"],
  "minorityOpinions": ["<minority view if any>"],
  "aiRecommendation": "<AI recommendation based on consensus>",
  "finalSummary": "<2-3 sentence consensus summary>"
}`;

    const consensus = await generateJSON(prompt);
    await supabaseAdmin
      .from("team_decisions")
      .update({ consensus, status: "analyzed" })
      .eq("id", teamDecisionId);

    return NextResponse.json(consensus);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
