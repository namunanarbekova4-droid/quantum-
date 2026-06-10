import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const decisions = await prisma.decision.findMany({
    where: { userId, status: "COMPLETE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, riskScore: true, recommendation: true, title: true, createdAt: true },
  });

  const outcomes = await prisma.decisionOutcome.findMany({
    where: { userId },
    select: { result: true, decisionId: true, createdAt: true },
  });

  const journalCount = await prisma.decisionJournal.count({ where: { userId } });

  // ── Score computation ────────────────────────────────────────────────────────
  const decisionVolume = Math.min(20, decisions.length * 2);
  const outcomeTracking = Math.min(15, outcomes.length * 3);

  const succeeded = outcomes.filter((o) => o.result === "SUCCEEDED").length;
  const failed = outcomes.filter((o) => o.result === "FAILED").length;
  const successTotal = succeeded + failed;
  const successRate = successTotal > 0 ? succeeded / successTotal : 0.5;
  const outcomeQuality = Math.round(successRate * 20);

  const uniqueTypes = new Set(decisions.map((d) => d.type)).size;
  const diversity = Math.min(10, uniqueTypes * 2);

  const journalEngagement = Math.min(10, journalCount * 2);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDecisions = decisions.filter((d) => new Date(d.createdAt) > thirtyDaysAgo).length;
  const consistency = Math.min(15, recentDecisions * 3);

  const overallScore = 10 + decisionVolume + outcomeTracking + outcomeQuality + diversity + journalEngagement + consistency;

  // ── Sub-scores ───────────────────────────────────────────────────────────────
  const executionScore = decisions.length > 0 ? Math.min(100, Math.round((outcomes.length / decisions.length) * 100)) : 0;

  const riskScores = decisions.map((d) => d.riskScore ?? 50).filter(Boolean);
  const riskStdev = stddev(riskScores);
  // lower stdev = more calibrated = higher score; 0 stdev = fully calibrated
  const riskIntelligence = Math.min(100, Math.max(0, Math.round(100 - riskStdev)));

  // Timing: consistency of decision frequency (decisions/week variance)
  const timingIntelligence = decisions.length >= 3 ? Math.min(100, Math.round(50 + consistency * 2)) : 20;

  // Strategic consistency: same-type decisions having same recommendation
  const typeGroups: Record<string, string[]> = {};
  for (const d of decisions) {
    if (d.recommendation) {
      if (!typeGroups[d.type]) typeGroups[d.type] = [];
      typeGroups[d.type].push(d.recommendation);
    }
  }
  let consistencyScore = 50;
  const groups = Object.values(typeGroups).filter((g) => g.length >= 2);
  if (groups.length > 0) {
    const rates = groups.map((g) => {
      const mode = g.sort((a, b) => g.filter((x) => x === b).length - g.filter((x) => x === a).length)[0];
      return g.filter((x) => x === mode).length / g.length;
    });
    consistencyScore = Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100);
  }
  const strategicConsistency = consistencyScore;

  const marketAwareness = Math.min(100, uniqueTypes * 14);

  // ── Blind Spots (Gemini, only if 3+ decisions) ────────────────────────────────
  let blindSpots: { pattern: string; severity: string; recommendation: string; supportCount: number }[] = [];

  if (decisions.length >= 3) {
    const existingSpots = await prisma.blindSpot.findMany({ where: { userId } });
    blindSpots = existingSpots.map((b) => ({
      pattern: b.pattern,
      severity: b.severity,
      recommendation: b.recommendation,
      supportCount: b.supportCount,
    }));

    // Refresh blind spots via Gemini
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { temperature: 0.5, maxOutputTokens: 800 },
        });

        const decisionSummary = decisions.slice(0, 20).map((d) => ({
          type: d.type,
          riskScore: d.riskScore,
          recommendation: d.recommendation,
          title: d.title,
        }));

        const prompt = `Analyze these decisions and identify strategic blind spots — recurring patterns of risk, timing issues, or systematic biases. Only report a pattern if supported by 3+ decisions. Be specific.

Decisions: ${JSON.stringify(decisionSummary)}

Return ONLY a JSON array (no markdown, no code fences):
[{"pattern": "short label", "severity": "low|medium|high", "supportCount": <number>, "recommendation": "specific actionable advice"}]

If no patterns found, return [].`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```\s*$/i, "")
          .trim();

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          blindSpots = parsed;
          // Upsert into DB
          for (const spot of parsed) {
            if (spot.pattern && spot.severity && spot.recommendation) {
              await prisma.blindSpot.upsert({
                where: { userId_pattern: { userId, pattern: spot.pattern } },
                create: {
                  userId,
                  pattern: spot.pattern,
                  severity: spot.severity,
                  supportCount: spot.supportCount ?? 3,
                  recommendation: spot.recommendation,
                },
                update: {
                  severity: spot.severity,
                  supportCount: spot.supportCount ?? 3,
                  recommendation: spot.recommendation,
                  lastUpdated: new Date(),
                },
              });
            }
          }
        }
      }
    } catch {
      // Gemini failed — return existing DB blind spots, already set above
    }
  }

  // ── Trend: compare recent 30 days vs prior 30 days ──────────────────────────
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const recentCount = decisions.filter((d) => new Date(d.createdAt) > thirtyDaysAgo).length;
  const priorCount = decisions.filter((d) => {
    const t = new Date(d.createdAt);
    return t > sixtyDaysAgo && t <= thirtyDaysAgo;
  }).length;
  const trend = recentCount > priorCount ? "improving" : recentCount < priorCount ? "declining" : "stable";

  return NextResponse.json({
    score: Math.min(100, overallScore),
    subScores: {
      execution: executionScore,
      riskIntelligence,
      timing: timingIntelligence,
      consistency: strategicConsistency,
      marketAwareness,
    },
    trend,
    blindSpots,
    totalDecisions: decisions.length,
    outcomesTracked: outcomes.length,
  });
}
