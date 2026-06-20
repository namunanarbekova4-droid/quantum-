import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";

export const maxDuration = 30;

export interface RoastResult {
  overall_roast: string;
  slide_roasts: { slide_type: string; title: string; roast: string; severity: "💀" | "🔥" | "😬" }[];
  killer_line: string;
  redemption_arc: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slides, startupName } = await req.json() as {
    slides: { slide_type: string; title: string; main_content: string }[];
    startupName: string;
  };

  const prompt = `You are a brutally honest but constructive pitch deck critic. Roast this pitch deck for "${startupName}".

Be funny, sharp, and specific. Reference actual slide content — don't be generic. Think: YC partner who's seen 10,000 bad decks.

Slides:
${slides.map(s => `[${s.slide_type}] ${s.title}: ${s.main_content}`).join("\n")}

Return ONLY valid JSON — no markdown, no extra text:
{
  "overall_roast": "2-3 sentence brutal but fair overall verdict with dark humor",
  "slide_roasts": [
    { "slide_type": "problem", "title": "The slide title", "roast": "specific critique referencing actual content", "severity": "🔥" }
  ],
  "killer_line": "the single most savage yet accurate thing about this deck in one sentence",
  "redemption_arc": "the one genuine strength — delivered with backhanded compliment energy"
}

severity: "💀" = catastrophic issue, "🔥" = significant problem, "😬" = cringe but fixable.
Only roast slides that genuinely deserve it. Max 6 slide_roasts. Be specific, not generic.`;

  try {
    const result = await generateJSON<RoastResult>(prompt);
    return NextResponse.json(result);
  } catch (err) {
    console.error("roast error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
