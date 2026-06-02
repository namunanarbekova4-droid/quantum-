import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 30;

interface SecondOpinion {
  weaknesses: string[];
  hiddenRisks: string[];
  strongestCounterarguments: string[];
  alternativeApproaches: string[];
  verdict: "RECONSIDER" | "PROCEED_WITH_CAUTION" | "SOLID_DECISION";
  verdictReasoning: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { decisionId, decisionText, originalRecommendation } = await req.json();
  if (!decisionText) return NextResponse.json({ error: "Decision text required" }, { status: 400 });

  const prompt = `You are a devil's advocate AI. Your job is to challenge this decision from every angle.

Decision: "${decisionText}"
Original AI recommendation: ${originalRecommendation || "unknown"}

Be brutally honest. Find what was missed. Return JSON:
{
  "weaknesses": [
    "<critical weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "hiddenRisks": [
    "<non-obvious risk 1>",
    "<risk 2>",
    "<risk 3>"
  ],
  "strongestCounterarguments": [
    "<counterargument 1>",
    "<counterargument 2>",
    "<counterargument 3>"
  ],
  "alternativeApproaches": [
    "<alternative approach 1>",
    "<approach 2>",
    "<approach 3>"
  ],
  "verdict": "<RECONSIDER|PROCEED_WITH_CAUTION|SOLID_DECISION>",
  "verdictReasoning": "<2-3 sentence devil's advocate conclusion>"
}`;

  try {
    const opinion = await generateJSON<SecondOpinion>(prompt);

    const { data, error } = await supabaseAdmin
      .from("second_opinions")
      .insert({
        user_id: session.user.id,
        decision_id: decisionId || null,
        decision_text: decisionText,
        original_recommendation: originalRecommendation,
        opinion,
        verdict: opinion.verdict,
        status: "complete",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, opinion });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
