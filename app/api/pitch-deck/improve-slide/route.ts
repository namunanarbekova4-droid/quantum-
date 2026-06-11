import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import type { PitchSlide } from "@/app/api/pitch-deck/route";

export const maxDuration = 30;

const LANG_MAP: Record<string, string> = {
  en: "English", ru: "Russian", es: "Spanish", zh: "Chinese", kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slideData, improvement, startupContext, locale = "en" } = body as {
    slideData: PitchSlide;
    improvement: "persuasive" | "visual" | "concise" | "investor-friendly";
    startupContext: string;
    locale?: string;
  };

  if (!slideData || !improvement) {
    return NextResponse.json({ error: "slideData and improvement are required" }, { status: 400 });
  }

  const lang = LANG_MAP[locale] ?? "English";

  const prompt = `You are a world-class pitch deck writer. Rewrite this pitch deck slide to be MORE ${improvement}.
Startup context: ${startupContext}
Current slide:
- Type: ${slideData.slide_type}
- Title: ${slideData.title}
- Subtitle: ${slideData.subtitle}
- Content: ${slideData.main_content}
- Key stat: ${slideData.key_stat ?? "none"}

Return the same JSON structure with improved content. Keep emotional_purpose and visual_hint.
Keep speaker_notes to 1 short sentence. Do not change slide_number or slide_type.
Respond in ${lang}.
Return JSON: { "slide": { "slide_number": ${slideData.slide_number}, "slide_type": "${slideData.slide_type}", "title": "", "subtitle": "", "main_content": "", "speaker_notes": "", "key_stat": null, "emotional_purpose": "", "visual_hint": "" } }`;

  try {
    const data = await generateJSON<{ slide: PitchSlide }>(prompt);
    return NextResponse.json(data);
  } catch (err) {
    console.error("improve-slide error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
