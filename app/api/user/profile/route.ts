import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, company: true, industry: true, country: true, onboarded: true, publicProfile: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, company, industry, country, publicProfile, role } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(company !== undefined && { company }),
      ...(industry !== undefined && { industry }),
      ...(country !== undefined && { country }),
      ...(publicProfile !== undefined && { publicProfile }),
      ...(role !== undefined && { role }),
    },
  });

  return NextResponse.json({ ok: true, name: user.name });
}
