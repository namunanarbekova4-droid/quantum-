import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface CompanyHealth {
  riskStatus: "GREEN" | "YELLOW" | "RED";
  riskScore: number;
  signals: string[];
  recommendations: string[];
  summary: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("portfolio_companies")
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

  if (action === "add_company") {
    const { name, website, industry, stage } = body;
    if (!name) return NextResponse.json({ error: "Company name required" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("portfolio_companies")
      .insert({ user_id: session.user.id, name, website, industry, stage, risk_status: "GREEN" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  if (action === "analyze") {
    const { companyId, name, industry, stage, website } = body;

    const prompt = `You are a portfolio monitoring AI. Analyze the health of this portfolio company:

Company: ${name}
Industry: ${industry}
Stage: ${stage}
Website: ${website || "N/A"}

Based on typical signals for a ${stage} ${industry} company, assess risk and provide recommendations. Return JSON:
{
  "riskStatus": "<GREEN|YELLOW|RED>",
  "riskScore": <0-100>,
  "signals": [
    "<recent signal or trend 1>",
    "<signal 2>",
    "<signal 3>"
  ],
  "recommendations": [
    "<action for investor 1>",
    "<action 2>",
    "<action 3>"
  ],
  "summary": "<2-3 sentence health assessment>"
}`;

    try {
      const health = await generateJSON<CompanyHealth>(prompt);

      await supabaseAdmin
        .from("portfolio_companies")
        .update({
          risk_status: health.riskStatus,
          risk_score: health.riskScore,
          last_analysis: health,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", companyId)
        .eq("user_id", session.user.id);

      return NextResponse.json(health);
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

  await supabaseAdmin.from("portfolio_companies").delete().eq("id", id).eq("user_id", session.user.id);
  return NextResponse.json({ ok: true });
}
