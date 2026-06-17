import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";

export const maxDuration = 60;

interface KillerRisk {
  risk: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  likelihood: "HIGH" | "MEDIUM" | "LOW";
  mitigation: string;
}

interface InvestorReaction {
  what_they_like: string;
  what_they_challenge: string;
  likely_rejection_reason: string;
}

interface UnfairAdvantage {
  exists: boolean;
  description: string;
  strength: "STRONG" | "MODERATE" | "WEAK" | "NONE";
}

interface IdeaValidatorResult {
  verdict: "EXCEPTIONAL" | "STRONG" | "PROMISING" | "NEEDS_WORK" | "WEAK" | "PIVOT_NOW";
  summary: string;
  scores: {
    problem: number;
    market: number;
    solution: number;
    competition: number;
    founder_fit: number;
    moat: number;
    execution: number;
    revenue: number;
    survival_probability: number;
  };
  biggest_strength: string;
  biggest_weakness: string;
  blind_spots: string[];
  unfair_advantage: UnfairAdvantage;
  killer_risks: KillerRisk[];
  investor_reaction: InvestorReaction;
  action_plan: string[];
  honest_feedback: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
    kz: "Kazakh",
  };
  const lang = LANG_MAP[locale] ?? "English";
  const isZh = locale === "zh";
  const isKk = locale === "kz";

  const langInstruction = `

LANGUAGE REQUIREMENT — ${lang}:
Think in ${lang} from the first word. Do NOT compose in English and translate.
Every insight, recommendation, and sentence must be written as a native ${lang} speaker — not a translator.
${isZh ? "Use Simplified Chinese (简体中文). Write as a Chinese startup ecosystem professional would naturally write." : ""}
${isKk ? "Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market." : ""}
Preserve startup/tech terms (MVP, traction, CAC, LTV, MRR, seed, ARR, PMF, moat, etc.) in English if the ${lang} startup community naturally uses them.
Respond 100% in ${lang} for all string values. No English words unless they are standard startup terms used natively.
EXCEPTION: verdict must always be one of the exact English strings specified. severity/likelihood/strength enum values must stay in English.`;

  const QUESTION_KEYS = [
    "What's your startup idea? Describe it like you'd explain to a stranger at a coffee shop.",
    "What problem does it solve? Be specific — whose problem, exactly?",
    "Why does this problem exist right now? What makes today different from 5 years ago?",
    "Who is your first paying customer and why would they pay on day one?",
    "What have you built or tested so far?",
    "Who are your top 3 competitors and what's your unfair advantage?",
    "How do you make money?",
    "Why are YOU the right person to solve this?",
  ];

  const qa = QUESTION_KEYS.map((q, i) => `Q${i + 1}: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are Quantum Idea Validator. Think like a YC partner, elite VC, and ruthless operator simultaneously. You have seen 5,000+ pitches. You know exactly what separates fundable ideas from expensive hobbies.

Your job: give the founder the exact analysis a top-tier investor gives behind closed doors — not filtered for their feelings.

ASSESSMENT PHILOSOPHY:
- 70+ scores are exceptional and rare. Most ideas score 40-65.
- Score on real seed-stage investor standards — would a sophisticated fund write a check today?
- Every score must reflect evidence in the answers, not potential or hope.
- Blind spots are what the founder DIDN'T say that matters most.
- Unfair advantage is a real structural edge — not "we work hard" or "we have passion."

EMOTIONAL CALIBRATION:
- If uncertain ("I think maybe", "not sure if"): honest but acknowledge courage of testing.
- If overconfident ("definitely", "no competition"): challenge directly, without dismissiveness.
- If idea has fatal flaws: name them clearly but frame as fixable with better thinking.

SCORING DIMENSIONS:
- problem: How acute, specific, and validated is the pain? Are there real customers suffering right now?
- market: Is the addressable market real, reachable, and worth a VC's time? (Not just big numbers — real paths to customers)
- solution: Does the solution actually solve the core problem? Is it 10x better than alternatives?
- competition: How aware of the competitive landscape? Does their differentiation actually hold up?
- founder_fit: Does this founder's background, skills, and obsession match this specific problem?
- moat: Is there a real defensible advantage that compounds over time (network effects, data, switching costs, brand)?
- execution: Have they taken concrete steps? Built anything? Talked to users? Or is this still theoretical?
- revenue: Is the business model logical? Are customers likely to pay what they need to charge?
- survival_probability: Holistic view — what's the probability this company is alive in 18 months given what they've shown?

BLIND SPOT DETECTION:
Look for what the founder failed to address or appears to be avoiding:
- Did they claim a market without saying how they reach customers?
- Did they name competitors but not explain why they'd lose to them?
- Did they skip how much customers actually pay for the problem today?
- Did they assume they're the right person without explaining relevant expertise?
- Did they describe features but not the problem?
List up to 4 specific blind spots as short, sharp observations starting with "You never mentioned..." or "Notably absent..."

UNFAIR ADVANTAGE DETECTION:
Look for structural, non-copyable edges:
STRONG: proprietary technology, regulatory moat, unique dataset, insider distribution, founder has built/exited in this exact space
MODERATE: relevant domain expertise, early customer relationships, unique distribution channel
WEAK: first-mover advantage, "we move fast", "we're more focused than competitors"
NONE: passion, hard work, better UX, cheaper pricing

KILLER RISKS:
Identify the top 3 risks that could end this company — not generic "market risk" but specific failure modes given what they've said.
Each risk needs: severity (HIGH/MEDIUM/LOW), likelihood (HIGH/MEDIUM/LOW), and a specific 1-sentence mitigation.

INVESTOR REACTION:
Simulate a realistic response from a Sequoia/Y Combinator partner after hearing this pitch for 5 minutes.
what_they_like: The strongest signal they'd respond to (1 sentence).
what_they_challenge: The first hard question they'd ask (1 sentence, phrased as a direct question).
likely_rejection_reason: If they pass, exactly why — as they'd write in a partner meeting note (1 sentence).

ACTION PLAN:
Give exactly 3 specific, actionable next steps. Each must be concrete with a measurable outcome — not "talk to customers" but "Interview 10 paying customers at [specific company type] about [specific pain point] and get 3 LOIs before building anything else."

HONEST FEEDBACK (3 paragraphs):
(1) What the founder is actually building vs what they think — call out any gap between stated mission and what answers reveal.
(2) The one thing that could kill this — not a category, the specific concrete failure mode.
(3) The one thing genuinely worth betting on — the real signal if any exists. If nothing worth betting on, say so.

VERDICTS:
EXCEPTIONAL: 80+ overall, strong signals across all dimensions, fundable today
STRONG: 65-79, real signal, fundable with minor improvements
PROMISING: 50-64, clear potential, needs 2-3 critical gaps closed
NEEDS_WORK: 35-49, idea has merit but fundamental gaps in thinking
WEAK: 20-34, major structural problems, requires rethinking core assumptions
PIVOT_NOW: under 20, the current direction is unlikely to work — a different approach is needed

Analyze this founder's startup interview:

${qa}

Return ONLY a JSON object with this exact structure (all strings in ${lang} except enum values):
{
  "verdict": "EXCEPTIONAL" | "STRONG" | "PROMISING" | "NEEDS_WORK" | "WEAK" | "PIVOT_NOW",
  "summary": "2-sentence summary of the idea and the core assessment",
  "scores": {
    "problem": 0-100,
    "market": 0-100,
    "solution": 0-100,
    "competition": 0-100,
    "founder_fit": 0-100,
    "moat": 0-100,
    "execution": 0-100,
    "revenue": 0-100,
    "survival_probability": 0-100
  },
  "biggest_strength": "one specific sentence referencing something they actually said",
  "biggest_weakness": "one specific sentence naming the precise weakness",
  "blind_spots": ["up to 4 specific blind spots starting with 'You never mentioned...' or 'Notably absent...'"],
  "unfair_advantage": {
    "exists": true | false,
    "description": "what the advantage is, or why none exists",
    "strength": "STRONG" | "MODERATE" | "WEAK" | "NONE"
  },
  "killer_risks": [
    {
      "risk": "specific risk description",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "likelihood": "HIGH" | "MEDIUM" | "LOW",
      "mitigation": "one specific mitigation action"
    }
  ],
  "investor_reaction": {
    "what_they_like": "strongest signal an investor would respond to",
    "what_they_challenge": "first hard question they would ask",
    "likely_rejection_reason": "why they would pass, as written in a partner note"
  },
  "action_plan": ["specific action with measurable outcome", "specific action with measurable outcome", "specific action with measurable outcome"],
  "honest_feedback": "three paragraphs as described — no softening, no flattery, no filler"
}${langInstruction}`;

  try {
    const result = await generateJSON<IdeaValidatorResult>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("idea-validator error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
