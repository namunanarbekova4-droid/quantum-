import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithRetry, classifyError } from "@/lib/gemini";

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
    kz: "Kazakh",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const totalSeconds =
    demoLength === "3min" ? 180 : demoLength === "5min" ? 300 : 600;

  const prompt = `You are directing this demo like Steve Jobs directed product reveals. You know the fundamental rule that founders always get wrong: they put the wow moment at 80% of the demo, after the audience has already mentally left. The wow moment should land at 40% — early enough that the rest of the demo is experienced through the lens of belief, not skepticism.

Every scene has exactly one job. Not two jobs, one. When a scene tries to do two things, it does neither. Transitions must feel like the product is pulling the viewer forward, not like the presenter is advancing slides.

Product: ${productDescription}
Demo Length: ${demoLength} (${totalSeconds} seconds total)
Main Features: ${mainFeatures}
Target Audience: ${targetAudience}
The "Wow Moment": ${wowMoment}
Common Objections: ${commonObjections}

Write the demo script with:
- Scene-by-scene breakdown with exact timing like [00:00 - 00:30]
- The exact opening line that creates context without explaining features — one sentence that makes the viewer feel the problem before they see the solution
- Exact words to say in "quotes" — written to be spoken, not read
- Click/action instructions in [CLICK: description] format
- [PAUSE] markers at the moment to stop and let the product breathe — let the audience absorb what they just saw before moving on
- The wow moment placed at approximately 40% of total demo time
- Transitions written as natural observations, not scripts: "And now watch what happens when..." not "Moving on to our next feature..."
- An objection handlers section at the end — for each objection, first validate the concern in one sentence before reframing. Never dismiss, never minimize.

Format with --- between scenes. Every word must be performable. This script should work on the first run without rehearsal.${langInstruction}`;

  try {
    const script = await generateWithRetry(prompt);
    return NextResponse.json({ script });
  } catch (err) {
    console.error("demo-script error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
