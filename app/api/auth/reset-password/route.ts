import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date())
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email: record.email }, data: { password: hashed } });
  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
