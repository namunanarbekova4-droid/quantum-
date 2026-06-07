import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LEADER_PHILOSOPHIES: Record<string, string> = {
  "Elon Musk": `Elon Musk's public decision-making framework (based on books, interviews, and documented principles):
- First principles thinking: break problems down to fundamental truths, not analogies
- Physics-based reasoning: what does physics allow vs. what is merely conventional?
- 10x thinking: aim for 10x improvement, not 10% incremental gains
- Move fast and accept high failure rates as the cost of innovation
- Vertical integration: own as much of the supply chain as possible
- Question requirements relentlessly: every requirement is a constraint to challenge
- Feedback loops: get rapid feedback from real-world data, not simulations
- Talent density: hire fewer, better people`,

  "Jeff Bezos": `Jeff Bezos's public decision-making framework (based on shareholder letters, interviews, books):
- Customer obsession: start with the customer and work backwards
- Day 1 mentality: act with the urgency and innovation of a startup, avoid Day 2 decay
- Long-term thinking: willing to sacrifice short-term results for long-term value
- Working backwards: write the press release first, then build the product
- Two-pizza teams: small teams make faster, better decisions
- Disagree and commit: make decisions with conviction even with incomplete data
- High-velocity decisions: most decisions are reversible, make them fast
- Regret minimization: will you regret this on your deathbed?`,

  "Steve Jobs": `Steve Jobs's public decision-making framework (based on biographies, keynotes, interviews):
- Simplicity is the ultimate sophistication: remove everything that isn't essential
- The power of no: say no to 1000 things to focus on what matters
- Taste and design: the intersection of technology and liberal arts
- Perfectionism: details matter, even the ones users never see
- Reality distortion field: challenge what's considered possible
- Intuition over market research: customers don't know what they want until they see it
- End-to-end control: own the full experience from hardware to software
- Hire A-players who hire A-players`,

  "Warren Buffett": `Warren Buffett's public decision-making framework (based on shareholder letters, interviews, books):
- Circle of competence: only invest in what you deeply understand
- Economic moat: does this business have a durable competitive advantage?
- Long-term value: buy wonderful companies at fair prices
- Margin of safety: build in a buffer against being wrong
- Concentrated bets: when you have conviction, bet big
- Temperament over IQ: emotional discipline beats intelligence in investing
- Price vs. value: focus on intrinsic value, not market price
- Fear when others are greedy, be greedy when others are fearful`,

  "Mark Zuckerberg": `Mark Zuckerberg's public decision-making framework (based on interviews, keynotes, posts):
- Move fast: speed of execution compounds over time
- Social graphs and network effects: build for scale and connectivity
- Long-term platform bets: invest heavily in platforms before they are profitable
- Connect the world: the mission justifies long-term investment horizons
- Bold, not incremental: make 10x bets on the future (metaverse, AI)
- Data-driven: measure everything, optimize relentlessly
- Acquire talent and technology: M&A as a strategic tool
- Embrace controversy if mission-aligned`,

  "Ray Dalio": `Ray Dalio's public decision-making framework (based on 'Principles', interviews, Bridgewater memos):
- Radical transparency: speak and hear truth even when uncomfortable
- Principles-based decisions: create explicit decision rules and test them
- Believability-weighted decisions: give more weight to more credible voices
- Pain + reflection = progress: mistakes are learning opportunities
- The 5-step process: goals → problems → diagnosis → design → do
- Diversification is the only free lunch: diversify uncorrelated bets
- Economic machine: understand macro cycles to make better decisions
- Ego is the enemy of good decisions: separate self-worth from outcomes`,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decisionText, leaderName } = await req.json();
  if (!decisionText || !leaderName) {
    return NextResponse.json({ error: "decisionText and leaderName required" }, { status: 400 });
  }

  const philosophy = LEADER_PHILOSOPHIES[leaderName];
  if (!philosophy) {
    return NextResponse.json({ error: "Unknown leader" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
  });

  const prompt = `You are simulating how ${leaderName} would approach a business decision, based ONLY on their publicly documented decision-making principles.

${philosophy}

Decision to analyze: "${decisionText}"

Based ONLY on ${leaderName}'s known public philosophy, frameworks, and documented principles, simulate how they would approach this decision. Be specific to their known style and beliefs.

Return ONLY raw JSON with no markdown:
{
  "problemFraming": "How ${leaderName} would reframe this problem based on their principles",
  "questions": ["First question they'd ask", "Second question", "Third question"],
  "optimizeFor": "What ${leaderName} would optimize for in this decision",
  "biggestConcern": "The primary concern ${leaderName} would raise",
  "likelyDecision": "YES or NO or CONDITIONAL — with brief reasoning",
  "recommendation": "A direct, ${leaderName}-style recommendation for this decision (quote style, first person)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 });
  }
}
