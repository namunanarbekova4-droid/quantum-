import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithRetry } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    productDescription,
    demoLength,
    mainFeatures,
    targetAudience,
    wowMoment,
    commonObjections,
  } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const totalSeconds =
    demoLength === "3min" ? 180 : demoLength === "5min" ? 300 : 600;

  const prompt = `You are a world-class product demo coach. Write a complete, detailed demo script.

Product: ${productDescription}
Demo Length: ${demoLength} (${totalSeconds} seconds total)
Main Features: ${mainFeatures}
Target Audience: ${targetAudience}
The "Wow Moment": ${wowMoment}
Common Objections: ${commonObjections}

Write a professional demo script with:
- Scene-by-scene breakdown with exact timing like [00:00 - 00:30]
- Exact words to say in "quotes"
- Click/action instructions in [CLICK: description] format
- Smooth transitions between scenes
- The wow moment at the perfect time
- An objection handlers section at the end

Format the script clearly. Use --- to separate scenes. Be specific about every click, word, and transition. This should be performable without any preparation.${langInstruction}`;

  const script = await generateWithRetry(prompt);
  return NextResponse.json({ script });
}
