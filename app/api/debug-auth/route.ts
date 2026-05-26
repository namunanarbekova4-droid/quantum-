import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ step: "user_not_found" });
    if (!user.password) return NextResponse.json({ step: "no_password" });
    const valid = await bcrypt.compare(password, user.password);
    return NextResponse.json({ step: valid ? "ok" : "wrong_password" });
  } catch (e) {
    return NextResponse.json({ step: "db_error", error: String(e) });
  }
}

// Temporary: reset password for a user
export async function PUT(req: Request) {
  const { email, newPassword } = await req.json();
  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
