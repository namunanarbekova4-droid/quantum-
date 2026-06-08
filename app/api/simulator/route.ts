import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface Scenario {
  label: string;
  probability: number;
  businessImpact: string;
  risks: string[];
  preparationSteps: string[];
  financialEffect: string;
  recommendation: string;
}

interface SimulationResult {
  bestCase: Scenario;
  baseCase: Scenario;
  worstCase: Scenario;
  overallAssessment: string;
  keyDrivers: string[];
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { description, variable, variableChange, timeHorizon } = body;
  const locale: string = body.locale ?? "en";
  const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh" };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;
  if (!description) return NextResponse.json({ error: "Scenario description required" }, { status: 400 });

  const prompt = `You are a strategic scenario planning expert. Simulate three scenarios for this business situation.

Scenario: ${description}
Variable: ${variable || "market conditions"} changes by ${variableChange > 0 ? "+" : ""}${variableChange}%
Time horizon: ${timeHorizon || "1 year"}

Generate best, base, and worst case scenarios. Return JSON:
{
  "bestCase": {
    "label": "Best Case",
    "probability": <10-40>,
    "businessImpact": "<positive impact description>",
    "risks": ["<risk 1>", "<risk 2>"],
    "preparationSteps": ["<step 1>", "<step 2>", "<step 3>"],
    "financialEffect": "<estimated financial impact>",
    "recommendation": "<how to position for this scenario>"
  },
  "baseCase": {
    "label": "Base Case",
    "probability": <40-60>,
    "businessImpact": "<moderate impact description>",
    "risks": ["<risk 1>", "<risk 2>"],
    "preparationSteps": ["<step 1>", "<step 2>", "<step 3>"],
    "financialEffect": "<estimated financial impact>",
    "recommendation": "<how to manage this scenario>"
  },
  "worstCase": {
    "label": "Worst Case",
    "probability": <10-30>,
    "businessImpact": "<negative impact description>",
    "risks": ["<risk 1>", "<risk 2>", "<risk 3>"],
    "preparationSteps": ["<contingency step 1>", "<step 2>", "<step 3>"],
    "financialEffect": "<estimated financial impact>",
    "recommendation": "<risk mitigation strategy>"
  },
  "overallAssessment": "<2-3 sentence strategic assessment>",
  "keyDrivers": ["<driver 1>", "<driver 2>", "<driver 3>"]
}${langInstruction}`;

  try {
    const result = await generateJSON<SimulationResult>(prompt);

    const { data, error } = await supabaseAdmin
      .from("scenario_runs")
      .insert({
        user_id: session.user.id,
        description,
        variable,
        variable_change: variableChange,
        time_horizon: timeHorizon,
        result,
        status: "complete",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabaseAdmin
    .from("scenario_runs")
    .select("id, description, variable, time_horizon, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json(data || []);
}
