import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const secret = searchParams.get("s");

  if (secret !== "q-debug-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const geminiKey = process.env.GEMINI_API_KEY;
    let geminiStatus = "key_not_set";
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const r = await model.generateContent("Say OK");
        geminiStatus = r.response.text().trim() ? "ok" : "empty_response";
      } catch (e) {
        geminiStatus = `error: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    if (!email) {
      return NextResponse.json({ db: "connected", gemini: geminiStatus, message: "pass ?email=your@email.com" });
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
