import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface SlideAnalysis {
  slideNumber: number;
  title: string;
  score: number;
  feedback: string;
  rewrite?: string;
  redFlags: string[];
}

interface PitchAnalysis {
  overallScore: number;
  slides: SlideAnalysis[];
  top3Fixes: string[];
  investorRedFlags: string[];
  summary: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deckText, companyName } = await req.json();
  if (!deckText) return NextResponse.json({ error: "Deck content required" }, { status: 400 });

  const prompt = `You are an expert pitch coach who has reviewed 1000+ pitch decks. Analyze this pitch deck from a founder's perspective.

Company: ${companyName || "Unknown"}
Content:
"""
${deckText.slice(0, 8000)}
"""

Provide slide-by-slide feedback. Identify investor red flags. Return JSON:
{
  "overallScore": <0-100>,
  "slides": [
    {
      "slideNumber": 1,
      "title": "<slide name>",
      "score": <0-100>,
      "feedback": "<specific feedback>",
      "rewrite": "<rewritten version if score < 60>",
      "redFlags": ["<flag if any>"]
    }
  ],
  "top3Fixes": ["<most critical fix 1>", "<fix 2>", "<fix 3>"],
  "investorRedFlags": ["<red flag 1>", "<red flag 2>"],
  "summary": "<overall assessment in 2-3 sentences>"
}`;

  try {
    const analysis = await generateJSON<PitchAnalysis>(prompt);

    const { data, error } = await supabaseAdmin
      .from("pitch_analyses")
      .insert({
        user_id: session.user.id,
        company_name: companyName || "Unknown",
        deck_text: deckText.slice(0, 5000),
        analysis,
        overall_score: analysis.overallScore,
        status: "complete",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("pitch_analyses")
    .select("id, company_name, overall_score, created_at, status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json(data || []);
}
