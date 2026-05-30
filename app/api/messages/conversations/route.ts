import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: conversations, error } = await supabaseAdmin
    .from("direct_conversations")
    .select("*")
    .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
    .order("last_message_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = await Promise.all(
    (conversations || []).map(async (conv: Record<string, string>) => {
      const otherId = conv.participant1_id === session.user.id ? conv.participant2_id : conv.participant1_id;
      const otherUser = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, name: true, image: true } }).catch(() => null);

      const { data: lastMsg } = await supabaseAdmin
        .from("direct_messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { count: unreadCount } = await supabaseAdmin
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", session.user.id)
        .is("read_at", null);

      return {
        ...conv,
        otherUser,
        lastMessage: lastMsg || null,
        unreadCount: unreadCount || 0,
      };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === session.user.id) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

  const p1 = session.user.id < userId ? session.user.id : userId;
  const p2 = session.user.id < userId ? userId : session.user.id;

  const { data: existing } = await supabaseAdmin
    .from("direct_conversations")
    .select("*")
    .eq("participant1_id", p1)
    .eq("participant2_id", p2)
    .single();

  if (existing) return NextResponse.json(existing);

  const { data: newConv, error } = await supabaseAdmin
    .from("direct_conversations")
    .insert({ participant1_id: p1, participant2_id: p2 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newConv);
}
