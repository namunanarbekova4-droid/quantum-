import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { secret, email, newPassword } = await req.json();

  if (secret !== "q-admin-reset-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!email || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "email and newPassword (min 8 chars) required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { email }, data: { password: hash } });

  return NextResponse.json({ ok: true, message: `Password reset for ${email}` });
}
