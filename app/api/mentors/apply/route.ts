import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { full_name, expertise, years_experience, linkedin_url, industry, biography, why_mentor } = await req.json();

  if (!full_name || !expertise || !biography) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  // Check if already applied
  const { data: existing } = await supabaseAdmin
    .from("mentor_profiles")
    .select("id, status")
    .eq("user_id", session.user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: `Application already exists with status: ${existing.status}` }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("mentor_profiles")
    .insert({
      user_id: session.user.id,
      full_name,
      expertise,
      years_experience: years_experience || null,
      linkedin_url: linkedin_url || null,
      industry: industry || null,
      biography,
      why_mentor: why_mentor || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
