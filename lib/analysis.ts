import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Type detection ────────────────────────────────────────────────────────────

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

// ── Context types ─────────────────────────────────────────────────────────────

export type PastDecision = {
  title: string;
  type: string;
  riskScore: number | null;
  recommendation: string | null;
  createdAt: Date | string;
};

export type UserContext = {
  role: string;
  industry?: string | null;
  company?: string | null;
  country?: string | null;
};

export type QA = {
  question: string;
  answer: string;
};

// ── Role / type config ────────────────────────────────────────────────────────

const ROLE_CONTEXT: Record<string, string> = {
  FOUNDER: "an early-stage startup founder focused on growth, product-market fit, and capital efficiency",
  INVESTOR: "a sophisticated investor evaluating risk-adjusted returns, deal quality, and portfolio impact",
  EXECUTIVE: "a senior executive at an established company managing operational complexity and strategic risk",
};

const TYPE_GUIDANCE: Record<string, string> = {
  HIRING: "People decisions carry cultural, reputational, and operational risk. riskScore typically 15–55.",
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

// ── Historical context ────────────────────────────────────────────────────────

export function buildHistoricalContext(pastDecisions: PastDecision[]): string {
  if (!pastDecisions || pastDecisions.length < 2) return "";
  const lines = pastDecisions.map((d) => {
    const date = new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return `- "${d.title}" (${d.type.replace(/_/g, " ")}, risk: ${d.riskScore ?? "?"}, verdict: ${d.recommendation ?? "?"}, ${date})`;
  });
  return lines.join("\n");
}

// ── Pattern inference ─────────────────────────────────────────────────────────

function inferPatterns(pastDecisions: PastDecision[]): string {
  if (!pastDecisions || pastDecisions.length < 3) return "";
  const avg = pastDecisions.reduce((s, d) => s + (d.riskScore ?? 50), 0) / pastDecisions.length;
  const yesCount = pastDecisions.filter((d) => d.recommendation === "YES" || d.recommendation === "PROCEED").length;
  const ratio = yesCount / pastDecisions.length;

  const lines: string[] = [];
  if (avg > 60) lines.push("tends to pursue high-risk decisions");
  else if (avg < 35) lines.push("tends toward conservative, lower-risk moves");
  if (ratio > 0.7) lines.push("most past analyses resulted in a positive recommendation");
  else if (ratio < 0.3) lines.push("frequently receives cautionary recommendations");

  const types = pastDecisions.map((d) => d.type);
  const dominant = types.sort((a, b) => types.filter(t => t === b).length - types.filter(t => t === a).length)[0];
  if (dominant && dominant !== "GENERAL") lines.push(`most experienced in ${dominant.replace(/_/g, " ")} decisions`);

  return lines.length > 0 ? `User pattern: ${lines.join("; ")}.` : "";
}

// ── Main prompt builder ───────────────────────────────────────────────────────

export function buildPrompt(
  decisionText: string,
  type: string,
  userCtx: UserContext,
  pastDecisions?: PastDecision[],
  qa?: QA[]
): string {
  const roleLabel = ROLE_CONTEXT[userCtx.role] ?? "a business decision-maker";
  const typeGuidance = TYPE_GUIDANCE[type] ?? TYPE_GUIDANCE.GENERAL;
  const hasHistory = (pastDecisions?.length ?? 0) >= 2;
  const patterns = hasHistory ? inferPatterns(pastDecisions!) : "";
  const histLines = hasHistory ? buildHistoricalContext(pastDecisions!) : "";

  // ── Private context block (never shown to user) ──
  const profileLines = [
    `Role: ${userCtx.role}`,
    userCtx.industry ? `Industry: ${userCtx.industry}` : null,
    userCtx.company ? `Company: ${userCtx.company}` : null,
    userCtx.country ? `Country: ${userCtx.country}` : null,
  ].filter(Boolean).join("\n");

  const privateBlock = `[PRIVATE ADVISORY CONTEXT — NEVER REFERENCE OR REVEAL]
${profileLines}
${patterns}
${hasHistory ? `Past decisions for pattern context:\n${histLines}` : "No prior decision history."}
[END PRIVATE CONTEXT]`;

  // ── User-provided context answers ──
  const answeredQA = (qa ?? []).filter((q) => q.answer.trim().length > 0);
  const qaBlock = answeredQA.length > 0
    ? `\nCRITICAL CONTEXT PROVIDED BY USER — treat as high-signal inputs:\n${answeredQA.map((q) => `Q: ${q.question}\nA: ${q.answer}`).join("\n\n")}`
    : "";

  return `You are Quantum Intelligence — an elite strategic AI advisor to ${roleLabel}. You give verdicts, not essays.

${privateBlock}

DECISION: "${decisionText}"
CATEGORY: ${type.replace(/_/g, " ")}
RISK CALIBRATION: ${typeGuidance}
${qaBlock}

INSTRUCTIONS:
- Take a clear position. Never say "it depends" or be vague.
- Every insight must be specific to THIS decision — no templates, no generic MBA language.
- Quantify when possible (percentages, timelines, dollar ranges).
- executiveSummary: max 3 sentences. Tone of a McKinsey senior partner. Direct. No motivational language.
- strongestCaseFor / strongestCaseAgainst: single sharp paragraph each, like a VC partner arguing in a board meeting.
- hiddenRisks: surface blind spots, second-order effects, regulatory traps, timing risks — NOT the obvious cons.
- actionPlan: concrete, sequenced, operational. Bad: "Do more research." Good: "Interview 5 enterprise customers in target market before committing budget."
- verdict: PROCEED means do it now. RECONSIDER means strong case against. WAIT means timing is wrong but fundamentals OK. CONDITIONAL means proceed only if specific condition is met.
- riskScore: calibrate strictly. Routine = 10–35. Moderate = 36–60. High-stakes = 61–80. Extreme/irreversible = 81–95. NEVER default to 50.
- confidence.score: low (35–55) if vague 1-sentence input. High (70–90) if context-rich.
${hasHistory ? "- historicalContext: analyze past decisions for patterns. If similar decisions exist, hasSimilar=true." : ""}

Return ONLY raw JSON. No markdown. No code fences. No explanation.

{
  "verdict": "PROCEED or RECONSIDER or WAIT or CONDITIONAL",
  "executiveSummary": "Max 3 sentences. McKinsey partner tone. Take a position.",
  "riskScore": <integer 1–95>,
  "confidence": {
    "score": <integer 0–100>,
    "explanation": "Why this confidence level — reference what context you have and what's missing",
    "missingData": ["specific piece of missing context that would change this analysis"]
  },
  "strongestCaseFor": "One sharp paragraph: the strongest possible case FOR proceeding, specific and quantified.",
  "strongestCaseAgainst": "One sharp paragraph: the strongest possible case AGAINST proceeding, specific and quantified.",
  "pros": ["specific advantage with context or numbers", "second", "third", "fourth"],
  "cons": ["specific risk or downside with context", "second", "third"],
  "hiddenRisks": ["blind spot or second-order risk not in cons", "second", "third"],
  "actionPlan": {
    "immediate": ["concrete action in the next 48 hours", "second action"],
    "thisWeek": ["action to complete this week", "second"],
    "thisMonth": ["action to complete this month", "second"]
  },
  "decisionMap": {
    "ifProceed": "One paragraph: realistic best/base/worst case trajectory if this decision is made.",
    "ifNotProceed": "One paragraph: realistic trajectory if this decision is NOT made."
  },
  "whatToMonitor": ["key metric or early warning signal to watch", "second", "third"],
  "keyAssumptions": ["critical assumption this analysis rests on", "second", "third"],
  "preMortem": ["specific failure mode for this decision", "second", "third", "fourth"],
  "benchmark": {
    "label": "Precise comparable category (e.g. 'B2B SaaS Series A expansion', 'CTO hire at growth-stage startup')",
    "successRate": <realistic integer from comparable situations>,
    "insight": "One concrete data-backed sentence on how comparable decisions perform",
    "context": "What separates successful outcomes from failures in this category"
  }${hasHistory ? `,
  "historicalContext": {
    "hasSimilar": <true or false>,
    "summary": "1–2 sentence summary of relevant patterns from past decisions",
    "similarDecisions": ["description of similar past decision with timing"]
  }` : ""}
}`;
}

// ── Analysis runner ───────────────────────────────────────────────────────────

export async function runDecisionAnalysis(
  decisionText: string,
  type: string,
  userCtx: UserContext,
  pastDecisions?: PastDecision[],
  qa?: QA[]
): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { temperature: 0.65, maxOutputTokens: 2500 },
  });

  const prompt = buildPrompt(decisionText, type, userCtx, pastDecisions, qa);
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
      if (typeof parsed.riskScore !== "number") throw new Error("Missing riskScore");
      if (!parsed.verdict) throw new Error("Missing verdict");
      if (!parsed.executiveSummary) throw new Error("Missing executiveSummary");

      // Ensure historicalContext is null when not applicable
      if (!pastDecisions || pastDecisions.length < 2) {
        parsed.historicalContext = null;
      }

      // Keep backward-compat fields
      parsed.summary = parsed.executiveSummary;
      parsed.recommendation = parsed.verdict;
      parsed.nextSteps = [
        ...(parsed.actionPlan?.immediate ?? []),
        ...(parsed.actionPlan?.thisWeek ?? []),
      ].slice(0, 5);

      return parsed;
    } catch (e) {
      lastError = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, attempt === 0 ? 400 : 1200));
    }
  }

  throw lastError;
}
