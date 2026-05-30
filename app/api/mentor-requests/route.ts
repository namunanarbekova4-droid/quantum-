import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

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

  // Simple plan check: for now allow all authenticated users (no plan field in schema)
  // Check this month's requests count for a basic limit
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from("mentor_requests")
    .select("*", { count: "exact", head: true })
    .eq("requester_id", session.user.id)
    .gte("created_at", startOfMonth.toISOString());

  // Allow up to 3 requests/month (generous default)
  if ((count || 0) >= 3) {
    return NextResponse.json({ error: "Monthly mentor request limit reached. Upgrade for more." }, { status: 429 });
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
  return NextResponse.json(data, { status: 201 });
}
