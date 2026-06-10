import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

const LANG_MAP: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  zh: "Chinese",
  kz: "Kazakh",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.investorOutreach.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "find") {
    const {
      startupName,
      description,
      industry,
      stage,
      amount,
      geography,
      locale = "en",
    } = body;

    if (!startupName?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Startup name and description are required" },
        { status: 400 }
      );
    }

    const lang = LANG_MAP[locale] ?? "English";

    const prompt = `You are an expert venture capital analyst and investor database specialist.

Generate exactly 8 realistic investor profiles that would be a strong match for the following startup.

STARTUP PROFILE:
Name: ${startupName}
Description: ${description}
Industry: ${industry || "Technology"}
Stage: ${stage || "Seed"}
Amount Raising: ${amount || "Not specified"}
Geography Preference: ${geography || "Global"}

REQUIREMENTS:
- Generate diverse investors: angels, micro-VCs, family offices, institutional VCs
- Match their typical check sizes and portfolio to the startup's stage and geography
- Make names culturally diverse and realistic
- Ensure checkSize matches the amount raising range
- whyMatch should be 2 specific sentences explaining the fit
- matchScore between 75 and 98, higher for better fits
- linkedin format: "linkedin.com/in/firstname-lastname"
- twitter format: "@handle"
- portfolio: 3 realistic startup names they would have invested in
- Respond in ${lang}

Return a JSON object with this exact structure:
{
  "investors": [
    {
      "id": "inv_1",
      "name": "Sarah Chen",
      "title": "Partner",
      "fund": "Andreessen Horowitz",
      "location": "San Francisco, CA",
      "checkSize": "$500K-$5M",
      "industries": ["AI", "SaaS", "Enterprise"],
      "stages": ["Seed", "Series A"],
      "whyMatch": "Sarah focuses on AI-native startups disrupting traditional industries. Her portfolio includes three companies in the exact space you're targeting.",
      "matchScore": 94,
      "linkedin": "linkedin.com/in/sarah-chen",
      "twitter": "@sarahchen_vc",
      "portfolio": ["DataLayer", "Nexus AI", "FlowStack"]
    }
  ]
}`;

    try {
      const data = await generateJSON<{ investors: unknown[] }>(prompt);
      return NextResponse.json({ investors: data.investors ?? [] });
    } catch (err) {
      console.error("investor-finder find error:", err);
      return NextResponse.json(
        { error: classifyError(err) },
        { status: 500 }
      );
    }
  }

  if (action === "save") {
    const { investorName, fund, matchScore } = body;
    if (!investorName?.trim()) {
      return NextResponse.json(
        { error: "investorName is required" },
        { status: 400 }
      );
    }

    const record = await prisma.investorOutreach.create({
      data: {
        userId: session.user.id,
        investorName,
        fund: fund ?? "",
        matchScore: matchScore ?? 0,
        status: "not_contacted",
      },
    });

    return NextResponse.json({ record });
  }

  if (action === "update_status") {
    const { id, status, notes } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const record = await prisma.investorOutreach.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json({ record });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
