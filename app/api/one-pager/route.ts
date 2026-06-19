import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";

export const maxDuration = 60;

export type OnePagerDocument = {
  company_name: string;
  tagline: string;
  contact: { email: string; website: string };
  problem: string;
  solution: string;
  metrics: { number: string; label: string }[];
  business_model: string;
  market_size: string;
  team: { name: string; role: string; bio: string }[];
  ask_amount: string;
  ask_use: string;
};

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

function truncate(s: string, max: number): string {
  if (!s) return "";
  s = s.trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function validate(doc: OnePagerDocument): OnePagerDocument {
  // Ensure exactly 4 metrics
  while (doc.metrics.length < 4) {
    doc.metrics.push({ number: "—", label: "TBD" });
  }
  doc.metrics = doc.metrics.slice(0, 4).map((m) => ({
    number: truncate(m.number, 10),
    label: truncate(m.label, 20),
  }));
  return {
    ...doc,
    company_name: truncate(doc.company_name, 60),
    tagline: truncate(doc.tagline, 80),
    problem: truncate(doc.problem, 220),
    solution: truncate(doc.solution, 220),
    business_model: truncate(doc.business_model, 140),
    market_size: truncate(doc.market_size, 100),
    ask_amount: truncate(doc.ask_amount, 30),
    ask_use: truncate(doc.ask_use, 140),
    team: (doc.team ?? []).slice(0, 4).map((m) => ({
      name: truncate(m.name, 30),
      role: truncate(m.role, 30),
      bio: truncate(m.bio, 70),
    })),
    contact: {
      email: truncate(doc.contact?.email ?? "", 60),
      website: truncate(doc.contact?.website ?? "", 60),
    },
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { startupName, tagline, problem, solution, targetMarket,
          businessModel, traction, team, amountRaising, useOfFunds,
          email = "", website = "" } = body;
  const locale: string = body.locale ?? "en";
  const lang = LANG_MAP[locale] ?? "English";

  const prompt = `Generate content for a ONE-PAGE investor document. Every section must be extremely concise.

Rules:
- Problem: maximum 2 sentences, max 220 characters total
- Solution: maximum 2 sentences, max 220 characters total
- Business model: maximum 1 sentence, max 140 characters
- Market: one sentence with a specific market number, max 100 characters
- Each team member bio: maximum 8 words
- Ask use: maximum 1 sentence, max 140 characters
- Tagline: max 80 characters, punchy

This is NOT a pitch deck. This is NOT an essay. This is a single printed page.
Be ruthlessly concise. Remove every unnecessary word.

Startup info:
- Name: ${startupName}
- Tagline hint: ${tagline || "derive from below"}
- Problem: ${problem}
- Solution: ${solution}
- Target Market: ${targetMarket}
- Business Model: ${businessModel}
- Traction: ${traction}
- Team: ${team}
- Raising: ${amountRaising}
- Use of Funds: ${useOfFunds}
- Contact Email: ${email}
- Website: ${website}

Generate EXACTLY 4 traction/metrics from the traction info above (infer compelling numbers if not given).

Respond 100% in ${lang}. Keep financial terms (ARR, MRR, TAM, etc.) in English.

Return ONLY valid JSON, no markdown, no extra text:
{
  "company_name": "${startupName}",
  "tagline": "punchy one-liner max 80 chars",
  "contact": {
    "email": "${email || "hello@" + startupName.toLowerCase().replace(/\s+/g, "") + ".com"}",
    "website": "${website || "www." + startupName.toLowerCase().replace(/\s+/g, "") + ".com"}"
  },
  "problem": "max 220 chars, 2 sentences max",
  "solution": "max 220 chars, 2 sentences max",
  "metrics": [
    {"number": "500+", "label": "Users"},
    {"number": "13", "label": "AI Tools"},
    {"number": "$0", "label": "Burn"},
    {"number": "92%", "label": "Retention"}
  ],
  "business_model": "max 140 chars, 1 sentence",
  "market_size": "TAM: $XB market, max 100 chars",
  "team": [
    {"name": "Full Name", "role": "Role", "bio": "max 8-word bio"}
  ],
  "ask_amount": "$250K",
  "ask_use": "max 140 chars, 1 sentence"
}`;

  try {
    const raw = await generateJSON<OnePagerDocument>(prompt);
    const doc = validate(raw);
    return NextResponse.json(doc);
  } catch (err) {
    console.error("one-pager AI error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
