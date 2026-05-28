import { GoogleGenerativeAI } from "@google/generative-ai";

export function detectType(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("hire") || t.includes("hiring") || t.includes("fire my") || t.includes("fire the") || t.includes("let go") || t.includes("layoff") || t.includes("cto") || t.includes("ceo") || t.includes("co-founder")) return "HIRING";
  if (t.includes("fundrais") || t.includes("series ") || t.includes("raise capital") || t.includes("raise fund") || t.includes("seed round") || t.includes("angel round")) return "FUNDRAISING";
  if (t.includes("pivot")) return "PIVOT";
  if (t.includes("partner")) return "PARTNERSHIP";
  if (t.includes("acqui") || t.includes("merger") || t.includes("buyout")) return "ACQUISITION";
  if (t.includes("restructur") || t.includes("reorgani")) return "RESTRUCTURING";
  if (t.includes("exit") || t.includes("sell the company") || t.includes("ipo")) return "EXIT";
  if (t.includes("expand") || t.includes("market entry") || t.includes("new market") || t.includes("internation") || t.includes(" uae") || t.includes("europe") || t.includes(" usa")) return "EXPANSION";
  if (t.includes("market")) return "MARKET_ENTRY";
  return "GENERAL";
}

const ROLE_CONTEXT: Record<string, string> = {
  FOUNDER: "an early-stage startup founder focused on growth, product-market fit, and capital efficiency",
  INVESTOR: "a sophisticated investor evaluating risk-adjusted returns, deal quality, and portfolio impact",
  EXECUTIVE: "a senior executive at an established company managing operational complexity and strategic risk",
};

const TYPE_GUIDANCE: Record<string, string> = {
  HIRING: "People and leadership decisions carry cultural, reputational, and operational risk. riskScore typically 15–55.",
  FUNDRAISING: "Fundraising involves dilution, timing, and market signaling risk. riskScore typically 40–70.",
  PIVOT: "Pivots are high-risk transformations requiring full resource reallocation. riskScore typically 55–80.",
  PARTNERSHIP: "Partnerships create dependency and alignment risk. riskScore typically 30–60.",
  ACQUISITION: "Acquisitions carry integration, valuation, and execution risk. riskScore typically 60–88.",
  RESTRUCTURING: "Restructuring affects culture, morale, and execution capacity. riskScore typically 55–75.",
  EXIT: "Exit decisions are largely irreversible with high strategic stakes. riskScore typically 45–78.",
  EXPANSION: "Market expansion requires capital and execution in unfamiliar conditions. riskScore typically 50–80.",
  MARKET_ENTRY: "Market entry requires validation before scaling investment. riskScore typically 45–72.",
  GENERAL: "Analyze the specific strategic risk factors present. riskScore typically 25–65.",
};

export function buildPrompt(decisionText: string, type: string, role: string): string {
  const roleCtx = ROLE_CONTEXT[role] ?? "a business decision-maker";
  const typeGuidance = TYPE_GUIDANCE[type] ?? TYPE_GUIDANCE.GENERAL;

  return `You are Quantum Intelligence — an elite strategic AI advisor to ${roleCtx}.

Decision submitted: "${decisionText}"
Category: ${type.replace(/_/g, " ")}
Risk calibration guidance: ${typeGuidance}

Your task: Produce rigorous, specific analysis of THIS decision. Every data point must reflect the actual content — never use templates or defaults.

Scoring rules:
- riskScore: Derive from this decision's actual risk factors (financial exposure, reversibility, urgency, execution difficulty, market uncertainty). NEVER output 50 as a default. Routine decisions = 10–35, moderate moves = 36–60, high-stakes = 61–80, extreme/irreversible = 81–95.
- confidence.score: Reflect how much context is available. One vague sentence → 35–55. Detailed decision → 70–90.
- recommendation: Must follow logically from the pros/cons and risk level.
- All text must be specific to THIS decision. No generic filler.

Return ONLY raw JSON. No markdown. No code fences. No preamble.

{
  "summary": "3–4 sentences: what this decision entails, the key risk or opportunity, and the strategic context",
  "recommendation": "YES or NO or CONDITIONAL",
  "riskScore": <integer 1–95, calibrated to this decision>,
  "pros": ["specific advantage", "second advantage", "third advantage", "fourth advantage"],
  "cons": ["specific risk or downside", "second risk", "third risk"],
  "keyAssumptions": ["assumption this analysis depends on", "second assumption", "third assumption"],
  "implications": ["downstream consequence if this decision proceeds", "second implication", "third implication"],
  "nextSteps": ["concrete first action", "second action", "third action"],
  "preMortem": ["specific failure mode for this decision", "second failure mode", "third failure mode", "fourth failure mode"],
  "benchmark": {
    "label": "Precise comparable category (e.g. 'B2B SaaS Series A', 'CTO replacement at growth-stage startup', 'MENA market expansion')",
    "successRate": <realistic integer from industry data for this category>,
    "insight": "One concrete data-backed sentence on how comparable decisions perform",
    "context": "What separates successful outcomes from failures in this decision category"
  },
  "confidence": {
    "score": <integer 0–100 reflecting information completeness>,
    "explanation": "Why you have this confidence level — reference what context you have and what is missing about this specific decision",
    "missingData": ["specific missing context that would change this analysis", "second missing input that would sharpen the recommendation"]
  }
}`;
}

export async function runDecisionAnalysis(
  decisionText: string,
  type: string,
  userRole: string
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.7 },
  });

  const prompt = buildPrompt(decisionText, type, userRole);
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.riskScore !== "number") throw new Error("Missing or invalid riskScore in response");
      if (!parsed.summary) throw new Error("Missing summary in response");
      return parsed;
    } catch (e) {
      lastError = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 700));
    }
  }

  throw lastError;
}
