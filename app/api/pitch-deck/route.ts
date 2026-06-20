import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decks = await prisma.pitchDeck.findMany({
    where: { userId: session.user.id },
    select: { id: true, startupName: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(decks);
}

export interface PitchSlide {
  slide_number: number;
  slide_type: string;
  title: string;
  subtitle: string;
  main_content: string;
  speaker_notes: string;
  key_stat: string | null;
  emotional_purpose: string;
  visual_hint: string;
}

export interface DeckScore {
  overall: number;
  storytelling: number;
  clarity: number;
  investor_confidence: number;
  market_conviction: number;
  memorability: number;
  verdict: string;
}

export interface RedFlag {
  severity: "HIGH" | "MEDIUM" | "LOW";
  issue: string;
  slide: string;
  fix: string;
}

export interface WowMoment {
  headline: string;
  subtext: string;
  stat: string;
}

export interface InvestorPreviewItem {
  after_slide: number;
  thought: string;
}

export interface DeckIntelligence {
  deck_score: DeckScore;
  red_flags: RedFlag[];
  wow_moment: WowMoment;
  investor_preview: InvestorPreviewItem[];
}

interface PitchDeckResult {
  slides: PitchSlide[];
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
  intelligence?: DeckIntelligence;
}

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

const STYLE_MODE_INSTRUCTIONS: Record<string, string> = {
  "investor-pitch": "Frame every slide with investor ROI in mind. Lead with traction and data. Every slide should answer 'why should I write a check?'",
  "yc-demo-day": "Structure: strong hook, crisp problem/solution, impressive traction number, clear ask. No fluff. Be brutally concise like a YC demo day presentation.",
  "apple-keynote": "Cinematic product storytelling. Build emotional tension before the reveal. One hero idea per slide. Make the product feel magical and inevitable.",
  "gen-z-viral": "Maximum boldness. Short punchy text. Shocking stats front and center. Every slide should feel like a viral tweet. Use bold claims and energy.",
  "ted-talk": "Lead with a big human insight, not a product pitch. Build a narrative arc around one transformative idea. Story-first, product second.",
  "luxury-brand": "Premium positioning only. Every word implies exclusivity and aspiration. Never lead with price. Let scarcity and desirability do the work.",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { answers, startupName, locale = "en", styleMode = "investor-pitch" } = body as {
    answers: string[];
    startupName: string;
    locale?: string;
    styleMode?: string;
  };

  if (!answers || answers.length < 10) {
    return NextResponse.json({ error: "All 10 answers required" }, { status: 400 });
  }

  const lang = LANG_MAP[locale] ?? "English";
  const isZh = locale === "zh";
  const isKk = locale === "kz";

  const langInstruction = `

LANGUAGE REQUIREMENT — ${lang}:
Think in ${lang} from the first word. Do NOT compose in English and translate.
Every insight, recommendation, and sentence must be written as a native ${lang} speaker — not a translator.
${isZh ? 'Use Simplified Chinese (简体中文). Write as a Chinese startup ecosystem professional would naturally write.' : ''}
${isKk ? 'Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market.' : ''}
Preserve startup/tech terms (MVP, traction, CAC, LTV, MRR, seed, ARR, PMF, etc.) in English if the ${lang} startup community naturally uses them.
Respond 100% in ${lang}. No English words unless they are standard startup terms used natively.`;

  const ctx = `Startup: ${startupName}
What: ${answers[0] || "-"}
Problem: ${answers[1] || "-"}
Story: ${answers[2] || "-"}
Solution: ${answers[3] || "-"}
Customer: ${answers[4] || "-"}
Model: ${answers[5] || "-"}
Competition: ${answers[6] || "-"}
Traction: ${answers[7] || "-"}
Team: ${answers[8] || "-"}
Raise: ${answers[9] || "-"}`;

  const styleModeInstruction = STYLE_MODE_INSTRUCTIONS[styleMode] ?? STYLE_MODE_INSTRUCTIONS["investor-pitch"];

  const slidesPrompt = `You are a pitch deck strategist. PRESENTATION STYLE: ${styleModeInstruction}

You understand that every slide in a great deck has one job: advance a specific investor emotion. Investors don't just evaluate decks — they feel their way through them. If the emotion is wrong at any slide, the investor is gone before the ask.

Emotion map you must follow precisely:
- cover: curiosity — make them want to know more before you say a word
- problem: urgency — they must feel the pain before they understand the solution
- personal_story: trust — this is why the founder, this is why now, this is why this company and not another
- solution: relief — the problem was worth sitting through because this is elegant
- market: excitement — the size and timing are undeniable
- product: confidence — this is real and it works
- traction: conviction — the market has already voted
- business_model: clarity — the economics make sense
- competition: differentiation — there's a specific reason this wins
- team: belief — these are the right people
- financials: credibility — the numbers are grounded
- ask: decision — make it easy to say yes

Title rules: every title must be a conviction statement, not a label. "We've already signed 40 paying users" not "Traction." "The $50B market that everyone ignores" not "Market Size." The title must work even if the investor reads nothing else.

key_stat: only include where it creates maximum impact. A weak stat is worse than no stat. If you can't find a number that creates conviction, leave it null.

Create 12 slides for this startup.${langInstruction}
${ctx}
Slide types in order: cover,problem,personal_story,solution,market,product,traction,business_model,competition,team,financials,ask.
Rules: speaker_notes max 1 sentence, main_content max 2 sentences, key_stat only where it creates impact (else null).
Return JSON: {"slides":[{"slide_number":1,"slide_type":"cover","title":"","subtitle":"","main_content":"","speaker_notes":"","key_stat":null,"emotional_purpose":"","visual_hint":""}]}`;

  const scriptsPrompt = `You are a pitch coach who knows that the difference between a funded pitch and a forgotten one is almost always the opening and the arc. Most founders open with "Hi, I'm X and we're building Y" — and lose the room in the first eight seconds.

Rules for what you must write:

opening_hook: must be a specific, surprising fact or a counterintuitive statement that creates immediate curiosity. Not "Hi, I'm the founder of..." — a statement that makes investors look up from their phones. Example: "Every year, $400 billion in invoices go unpaid in the US alone. We've collected $2M of it in the last 90 days."

elevator_pitch: exactly 2 sentences. Sentence one: who has the problem and what it costs them. Sentence two: how this solves it and what the result is. Nothing else.

three_minute_script: must follow this exact arc — (1) pain: a specific scene of someone suffering this problem right now, (2) moment of insight: when the founder realized this was solvable and how, (3) solution: what it does in plain language, (4) proof: the most credible evidence that it works, (5) ask: exactly what is needed and what it unlocks. Under 400 words. No feature lists.

investor_questions: 3 questions an investor will absolutely ask, with answers that are sharp and specific — not hedging.

${ctx}
${langInstruction}
Return JSON: {"three_minute_script":"","elevator_pitch":"","opening_hook":"","closing_statement":"","investor_questions":[{"question":"","answer":""}]}`;

  const deckIntelPrompt = `You are a VC analyst who has reviewed thousands of decks and knows exactly what makes investors say yes and no. You are not summarizing — you are diagnosing.
${ctx}

Be specific about what will make investors doubt this deck. Not categories of doubt — actual objections based on what this founder actually said. The investor_preview thoughts must be raw inner monologue, unfiltered — the real thing investors think but don't say out loud. "Wait, how big is this really if their first customer is an SMB?" not "Investor considers the market opportunity." red_flags must name the specific contradiction or gap in this deck, not a generic weakness.

Analyze this startup pitch and return JSON:
{
  "deck_score": {
    "overall": 85,
    "storytelling": 80,
    "clarity": 90,
    "investor_confidence": 75,
    "market_conviction": 85,
    "memorability": 70,
    "verdict": "One sentence verdict — specific to this startup, naming what works and what doesn't"
  },
  "red_flags": [
    {
      "severity": "HIGH",
      "issue": "Specific contradiction or gap in this deck — not a category, the actual problem",
      "slide": "the slide where it shows up",
      "fix": "Exact fix — what to say instead and why it addresses the doubt"
    }
  ],
  "wow_moment": {
    "headline": "The single most compelling thing about this startup as a conviction statement",
    "subtext": "The specific detail that makes it real, not theoretical",
    "stat": "The number that creates maximum belief — only if one exists"
  },
  "investor_preview": [
    { "after_slide": 3, "thought": "Raw unfiltered investor thought — specific to this startup's actual content" },
    { "after_slide": 6, "thought": "Raw unfiltered investor thought — what they're really wondering at this point" },
    { "after_slide": 9, "thought": "Raw unfiltered investor thought — are they in or out and why" }
  ]
}
Keep red_flags to max 4 items. investor_preview exactly 3 items (slides 3, 6, 9).
${ctx}
${langInstruction}`;

  try {
    const [slidesData, scriptsData, intelData] = await Promise.all([
      generateJSON<{ slides: PitchSlide[] }>(slidesPrompt),
      generateJSON<Omit<PitchDeckResult, "slides" | "intelligence">>(scriptsPrompt),
      generateJSON<DeckIntelligence>(deckIntelPrompt),
    ]);
    const result: PitchDeckResult = {
      slides: slidesData.slides,
      ...scriptsData,
      intelligence: intelData,
    };

    await prisma.pitchDeck.create({
      data: {
        userId: session.user.id,
        startupName: startupName || "Untitled",
        answers,
        generatedDeck: result as object,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("pitch-deck error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
