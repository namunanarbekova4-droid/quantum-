import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Check cache — if signals exist from last 24h, return them
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cached = await prisma.marketSignal.findMany({
    where: { userId, createdAt: { gt: oneDayAgo } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (cached.length > 0) {
    return NextResponse.json(cached);
  }

  // Fetch user profile + recent decisions
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, industry: true, country: true },
  });

  const recentDecisions = await prisma.decision.findMany({
    where: { userId, status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { title: true, type: true, recommendation: true, riskScore: true },
  });

  const profile = {
    role: user?.role ?? "FOUNDER",
    industry: user?.industry ?? "Technology",
    country: user?.country ?? "Global",
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json([]);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.6, maxOutputTokens: 900 },
    });

    const decisionContext = recentDecisions.length > 0
      ? `Recent decisions: ${JSON.stringify(recentDecisions)}`
      : "No decisions yet.";

    const prompt = `Based on this user's profile and recent decisions, generate 3-5 relevant market signals they should be aware of. Be specific and actionable.

User profile: ${JSON.stringify(profile)}
${decisionContext}

Return ONLY a JSON array (no markdown, no code fences):
[
  {
    "title": "short signal title",
    "summary": "2-3 sentence explanation of why this matters to this user specifically",
    "impact": "low|medium|high",
    "category": "market|funding|regulation|competition|technology",
    "relatedDecisions": ["relevant decision type"]
  }
]`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return NextResponse.json([]);

    // Delete old signals for this user
    await prisma.marketSignal.deleteMany({ where: { userId } });

    // Store new signals
    const signals = await Promise.all(
      parsed.slice(0, 5).map((s: { title: string; summary: string; impact: string; category: string; relatedDecisions?: string[] }) =>
        prisma.marketSignal.create({
          data: {
            userId,
            title: s.title ?? "Market Signal",
            summary: s.summary ?? "",
            impact: s.impact ?? "medium",
            category: s.category ?? "market",
            relatedDecisions: s.relatedDecisions ?? [],
          },
        })
      )
    );

    return NextResponse.json(signals);
  } catch {
    return NextResponse.json([]);
  }
}
