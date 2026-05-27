import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

function detectType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hire") || t.includes("hiring")) return "HIRING";
  if (t.includes("fundrais") || t.includes("series ") || t.includes("raise capital") || t.includes("raise fund")) return "FUNDRAISING";
  if (t.includes("pivot")) return "PIVOT";
  if (t.includes("partner")) return "PARTNERSHIP";
  if (t.includes("acqui")) return "ACQUISITION";
  if (t.includes("restructur")) return "RESTRUCTURING";
  if (t.includes("exit") || t.includes("sell the company") || t.includes("ipo")) return "EXIT";
  if (t.includes("expand") || t.includes("market entry") || t.includes("new market")) return "EXPANSION";
  if (t.includes("market")) return "MARKET_ENTRY";
  return "GENERAL";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const decisionText: string = (body.description || body.title || "").trim();
  if (!decisionText) return NextResponse.json({ error: "Decision text required" }, { status: 400 });

  const title = decisionText.length > 120 ? decisionText.slice(0, 120) + "…" : decisionText;
  const type = detectType(decisionText);

  const decision = await prisma.decision.create({
    data: { userId: session.user.id, title, description: decisionText, type: type as never, status: "ANALYZING" },
  });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are Quantum, an elite AI decision intelligence platform used by founders, investors, and executives.

Analyze this business decision and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Decision: "${decisionText}"

Return exactly this JSON:
{
  "summary": "2-3 sentence executive summary of the decision and context",
  "recommendation": "YES or NO or CONDITIONAL",
  "riskScore": <integer 0-100>,
  "pros": ["pro 1", "pro 2", "pro 3", "pro 4"],
  "cons": ["con 1", "con 2", "con 3"],
  "keyAssumptions": ["assumption 1", "assumption 2", "assumption 3"],
  "implications": ["implication 1", "implication 2", "implication 3"],
  "nextSteps": ["concrete action 1", "concrete action 2", "concrete action 3"],
  "preMortem": ["specific failure scenario 1", "specific failure scenario 2", "specific failure scenario 3", "specific failure scenario 4"],
  "benchmark": {
    "label": "Short label for similar decision category (e.g. 'SaaS market expansions', 'early-stage fundraising rounds')",
    "successRate": <integer 0-100, realistic estimate>,
    "insight": "One concrete sentence about how similar decisions historically performed",
    "context": "Brief note on what drives success or failure in this category"
  },
  "confidence": {
    "score": <integer 0-100>,
    "explanation": "Why the analysis is or isn't highly confident — reference specific factors in the decision",
    "missingData": ["specific data point that would sharpen this analysis", "another input that would reduce uncertainty"]
  }
}`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const report = JSON.parse(rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());

    await prisma.decision.update({
      where: { id: decision.id },
      data: { status: "COMPLETE", riskScore: report.riskScore ?? 50, recommendation: report.recommendation ?? "CONDITIONAL", report },
    });
  } catch {
    await prisma.decision.update({
      where: { id: decision.id },
      data: { status: "COMPLETE", riskScore: 50, recommendation: "CONDITIONAL", report: { summary: "Analysis encountered an error. Please try again.", pros: [], cons: [], keyAssumptions: [], implications: [], nextSteps: [] } },
    });
  }

  return NextResponse.json({ id: decision.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decisions = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, status: true, riskScore: true, recommendation: true, createdAt: true, report: true },
  });

  return NextResponse.json(decisions);
}
