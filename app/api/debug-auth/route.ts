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
    return NextResponse.json({ step: valid ? "ok" : "wrong_password", hasPassword: true });
  } catch (e) {
    return NextResponse.json({ step: "db_error", error: String(e) });
  }
}
