import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface BoardReport {
  executiveSummary: string;
  financialHighlights: string[];
  strategicInitiatives: string[];
  risks: string[];
  riskMitigation: string[];
  nextQuarterOutlook: string;
  keyMetrics: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  boardRecommendations: string[];
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kpis, decisions, challenges, goals, companyName, quarter } = await req.json();
  if (!kpis && !decisions) return NextResponse.json({ error: "KPIs or decisions required" }, { status: 400 });

  const prompt = `You are a C-suite communications expert generating a professional board report.

Company: ${companyName || "Our Company"}
Quarter: ${quarter || "Current Quarter"}

KPIs: ${kpis}
Key Decisions Made: ${decisions}
Challenges: ${challenges}
Goals for Next Quarter: ${goals}

Generate a professional board-level report. Return JSON:
{
  "executiveSummary": "<3-4 sentence executive summary suitable for board presentation>",
  "financialHighlights": [
    "<highlight 1>",
    "<highlight 2>",
    "<highlight 3>"
  ],
  "strategicInitiatives": [
    "<initiative 1>",
    "<initiative 2>",
    "<initiative 3>"
  ],
  "risks": [
    "<risk 1>",
    "<risk 2>",
    "<risk 3>"
  ],
  "riskMitigation": [
    "<mitigation 1>",
    "<mitigation 2>",
    "<mitigation 3>"
  ],
  "nextQuarterOutlook": "<2-3 sentence forward-looking statement>",
  "keyMetrics": [
    { "label": "<metric name>", "value": "<value>", "trend": "<up|down|flat>" }
  ],
  "boardRecommendations": [
    "<recommendation for board action 1>",
    "<recommendation 2>"
  ]
}`;

  try {
    const report = await generateJSON<BoardReport>(prompt);

    const { data, error } = await supabaseAdmin
      .from("board_reports")
      .insert({
        user_id: session.user.id,
        company_name: companyName || "Our Company",
        quarter: quarter || "Current Quarter",
        inputs: { kpis, decisions, challenges, goals },
        report,
        status: "complete",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, report });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("board_reports")
    .select("id, company_name, quarter, created_at, status")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json(data || []);
}
