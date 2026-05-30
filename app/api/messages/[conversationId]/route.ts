import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify participant
  const { data: conv } = await supabaseAdmin
    .from("direct_conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();

  if (!conv || (conv.participant1_id !== session.user.id && conv.participant2_id !== session.user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: messages, error } = await supabaseAdmin
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark as read
  await supabaseAdmin
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", params.conversationId)
    .neq("sender_id", session.user.id)
    .is("read_at", null);

  return NextResponse.json(messages || []);
}

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  // Verify participant
  const { data: conv } = await supabaseAdmin
    .from("direct_conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();

  if (!conv || (conv.participant1_id !== session.user.id && conv.participant2_id !== session.user.id)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("direct_messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: session.user.id,
      sender_name: session.user.name || "Anonymous",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update last_message_at
  await supabaseAdmin
    .from("direct_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", params.conversationId);

  return NextResponse.json(data);
}
