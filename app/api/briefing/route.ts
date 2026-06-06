import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchNewsByRole } from "@/lib/apis/news";
import { generateJSON } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

interface BriefingEvent {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  recommendedAction: string;
  roleImplication: string;
}

interface Briefing {
  summary: string;
  eventCount: number;
  events: BriefingEvent[];
  generatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if we have a fresh briefing (< 24 hours old)
  const { data: existing } = await supabaseAdmin
    .from("briefings")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    const age = Date.now() - new Date(existing.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return NextResponse.json(existing.briefing);
    }
  }

  // Generate new briefing
  const role = (session as { user: { role?: string } }).user?.role ?? "FOUNDER";

  // Get user language preference
  const userProfile = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const locale = (userProfile as Record<string, unknown> & { language?: string })?.language ?? "en";
  const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  // Get recent decisions for context
  const recentDecisions = await prisma.decision.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { title: true, type: true },
  });

  // Fetch news
  const articles = await fetchNewsByRole(role);
  const articleSummaries = articles
    .slice(0, 10)
    .map((a, i) => `${i + 1}. "${a.title}" - ${a.description || ""}`)
    .join("\n");

  const decisionsContext = recentDecisions.length > 0
    ? `Recent decisions: ${recentDecisions.map((d) => `${d.title} (${d.type})`).join(", ")}`
    : "No recent decisions.";

  const prompt = `You are Quantum's intelligence analyst. Create a personalized daily briefing for this user.

User role: ${role}
${decisionsContext}

Today's top business news:
${articleSummaries}

Analyze which news items matter most for this specific user's role and context. Return JSON:
{
  "summary": "<headline summary like 'Today, 3 events may affect your decisions'>",
  "eventCount": <number of significant events>,
  "events": [
    {
      "headline": "<event headline>",
      "whatHappened": "<1 sentence what happened>",
      "whyItMatters": "<1 sentence why it matters to this user>",
      "riskLevel": "<LOW|MEDIUM|HIGH>",
      "recommendedAction": "<1 specific action to take>",
      "roleImplication": "<specific implication for ${role}>"
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Include 3-5 most relevant events. Be specific and actionable.${langInstruction}`;

  try {
    const briefing = await generateJSON<Briefing>(prompt);

    await supabaseAdmin.from("briefings").insert({
      user_id: session.user.id,
      briefing,
      role,
    });

    return NextResponse.json(briefing);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Force regenerate by deleting latest
  await supabaseAdmin
    .from("briefings")
    .delete()
    .eq("user_id", session.user.id);

  return NextResponse.json({ ok: true });
}
