import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const secret = searchParams.get("s");

  if (secret !== "q-debug-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    if (!email) {
      return NextResponse.json({ db: "connected", message: "pass ?email=your@email.com" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, onboarded: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ db: "connected", userFound: false });
    }

    return NextResponse.json({
      db: "connected",
      userFound: true,
      hasPassword: !!user.password,
      passwordHashLength: user.password?.length,
      role: user.role,
      onboarded: user.onboarded,
    });
  } catch (err) {
    return NextResponse.json({ db: "error", error: String(err) }, { status: 500 });
  }
}
