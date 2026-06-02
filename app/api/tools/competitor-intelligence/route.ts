import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface CompetitorAnalysis {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  threatScore: number;
  recentMoves: string[];
  hiringSignals: string[];
  fundingActivity: string;
  productLaunches: string[];
  strategicImplications: string[];
  recommendedResponse: string;
  summary: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("competitor_tracking")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "add") {
    const { name, website, industry } = body;
    if (!name) return NextResponse.json({ error: "Competitor name required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from("competitor_tracking")
      .select("id")
      .eq("user_id", session.user.id);

    if ((existing || []).length >= 10) {
      return NextResponse.json({ error: "Maximum 10 competitors allowed" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("competitor_tracking")
      .insert({ user_id: session.user.id, name, website, industry, risk_level: "LOW" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "analyze") {
    const { competitorId, name, industry, website } = body;

    const prompt = `You are a competitive intelligence analyst. Analyze this competitor:

Competitor: ${name}
Industry: ${industry}
Website: ${website || "N/A"}

Provide a detailed competitive intelligence report. Return JSON:
{
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "threatScore": <0-100>,
  "recentMoves": ["<move 1>", "<move 2>", "<move 3>"],
  "hiringSignals": ["<hiring trend 1>", "<signal 2>"],
  "fundingActivity": "<recent or likely funding status>",
  "productLaunches": ["<product/feature 1>", "<product 2>"],
  "strategicImplications": ["<implication 1>", "<implication 2>", "<implication 3>"],
  "recommendedResponse": "<strategic response recommendation>",
  "summary": "<2-3 sentence competitive assessment>"
}`;

    try {
      const analysis = await generateJSON<CompetitorAnalysis>(prompt);

      await supabaseAdmin
        .from("competitor_tracking")
        .update({
          risk_level: analysis.riskLevel,
          threat_score: analysis.threatScore,
          last_analysis: analysis,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", competitorId)
        .eq("user_id", session.user.id);

      return NextResponse.json(analysis);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await supabaseAdmin.from("competitor_tracking").delete().eq("id", id).eq("user_id", session.user.id);
  return NextResponse.json({ ok: true });
}
