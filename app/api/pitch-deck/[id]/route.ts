import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deck = await prisma.pitchDeck.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deck);
}
