import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "find") {
      const { industry, country, stage, description } = body;
      const locale: string = body.locale ?? "en";
      const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
      const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;
      const grants = await generateJSON<{
        grants: {
          name: string;
          organization: string;
          amount: string;
          deadline: string;
          eligibility: string;
          description: string;
        }[];
      }>(`You are a grant research expert. Find 6 real or realistic grants for this startup:
Industry: ${industry}
Country: ${country}
Stage: ${stage}
Description: ${description}

Return a JSON object with a "grants" array of 6 grants. Each grant has:
- name: grant name
- organization: funding organization
- amount: funding amount (e.g. "Up to $50,000")
- deadline: deadline (e.g. "Rolling" or "March 31, 2025")
- eligibility: one-liner eligibility requirement
- description: 2-sentence description of the grant${langInstruction}`);
      return NextResponse.json(grants);
    }

    if (body.action === "write") {
      const { grantName, grantOrg, startupDescription, founderBackground } = body;
      const locale: string = body.locale ?? "en";
      const LANG_MAP: Record<string, string> = { en: "English", ru: "Russian", es: "Spanish", zh: "Chinese" };
      const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;
      const application = await generateJSON<{
        sections: {
          title: string;
          content: string;
        }[];
      }>(`Write a professional grant application for:
Grant: ${grantName} by ${grantOrg}
Startup: ${startupDescription}
Founder Background: ${founderBackground || "Not provided"}

Return a JSON object with a "sections" array. Include these sections:
1. Executive Summary
2. Problem Statement
3. Our Solution
4. Impact & Outcomes
5. Team & Qualifications
6. Budget Overview
7. Timeline & Milestones

Each section has:
- title: section title
- content: 2-3 paragraphs of professional, compelling grant writing content${langInstruction}`);
      return NextResponse.json(application);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("grant-writer error:", err);
    return NextResponse.json({ error: "Failed to generate" }, { status: 500 });
  }
}
