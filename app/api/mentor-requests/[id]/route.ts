import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status, feedback_content } = await req.json();

  const { data: request } = await supabaseAdmin
    .from("mentor_requests")
    .select("*, mentor:mentor_profiles(user_id)")
    .eq("id", params.id)
    .single();

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isMentor = request.mentor?.user_id === session.user.id;
  const isRequester = request.requester_id === session.user.id;

  if (!isMentor && !isRequester) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (status && ["accepted", "declined"].includes(status) && isMentor) {
    await supabaseAdmin
      .from("mentor_requests")
      .update({ status })
      .eq("id", params.id);
  }

  if (feedback_content && isRequester) {
    await supabaseAdmin
      .from("mentor_feedback")
      .insert({
        request_id: params.id,
        mentor_id: request.mentor_id,
        requester_id: session.user.id,
        content: feedback_content,
      });
  }

  return NextResponse.json({ success: true });
}
