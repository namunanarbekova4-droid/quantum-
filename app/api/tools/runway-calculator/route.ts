import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 30;

interface RunwayScenario {
  label: string;
  months: number;
  endDate: string;
  burnRate: number;
  notes: string;
}

interface RunwayResult {
  baseRunwayMonths: number;
  fundraiseWindow: string;
  scenarios: {
    conservative: RunwayScenario;
    base: RunwayScenario;
    optimistic: RunwayScenario;
  };
  aiRecommendations: {
    costReduction: string[];
    hiringTiming: string;
    cashPreservation: string[];
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  summary: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cashInBank, monthlyBurnRate, monthlyRevenue, revenueGrowthRate, teamSize } = await req.json();
  if (!cashInBank || !monthlyBurnRate) {
    return NextResponse.json({ error: "Cash and burn rate required" }, { status: 400 });
  }

  const netBurn = Math.max(1, monthlyBurnRate - (monthlyRevenue || 0));
  const baseMonths = Math.floor(cashInBank / netBurn);
  const now = new Date();
  const endDate = new Date(now.setMonth(now.getMonth() + baseMonths)).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prompt = `You are a CFO advisor analyzing startup runway.

Inputs:
- Cash in bank: $${cashInBank.toLocaleString()}
- Monthly burn rate: $${monthlyBurnRate.toLocaleString()}
- Monthly revenue: $${(monthlyRevenue || 0).toLocaleString()}
- Revenue growth rate: ${revenueGrowthRate || 0}% per month
- Team size: ${teamSize || "unknown"}
- Base runway: ${baseMonths} months

Provide three scenarios and AI recommendations. Return JSON:
{
  "baseRunwayMonths": ${baseMonths},
  "fundraiseWindow": "<when to start raising (X months from now)>",
  "scenarios": {
    "conservative": {
      "label": "Conservative",
      "months": <integer>,
      "endDate": "<Month Year>",
      "burnRate": <monthly burn>,
      "notes": "<what changes>"
    },
    "base": {
      "label": "Base Case",
      "months": ${baseMonths},
      "endDate": "${endDate}",
      "burnRate": ${netBurn},
      "notes": "Current trajectory"
    },
    "optimistic": {
      "label": "Optimistic",
      "months": <integer>,
      "endDate": "<Month Year>",
      "burnRate": <monthly burn>,
      "notes": "<what changes>"
    }
  },
  "aiRecommendations": {
    "costReduction": ["<specific action 1>", "<specific action 2>", "<specific action 3>"],
    "hiringTiming": "<when to hire and what roles>",
    "cashPreservation": ["<tactic 1>", "<tactic 2>", "<tactic 3>"],
    "urgency": "<LOW|MEDIUM|HIGH|CRITICAL based on runway>"
  },
  "summary": "<2-3 sentence CFO assessment>"
}`;

  try {
    const result = await generateJSON<RunwayResult>(prompt);

    await supabaseAdmin.from("runway_calculations").insert({
      user_id: session.user.id,
      cash_in_bank: cashInBank,
      monthly_burn_rate: monthlyBurnRate,
      monthly_revenue: monthlyRevenue || 0,
      revenue_growth_rate: revenueGrowthRate || 0,
      team_size: teamSize || 0,
      base_runway_months: baseMonths,
      result,
      status: "complete",
    });

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
