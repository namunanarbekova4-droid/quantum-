import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

interface FounderStoryResult {
  linkedinPost: string;
  podcastIntro: string;
  pressBio: string;
  fullStory: string;
  twitterThread: string;
}

const QUESTIONS = [
  "What did you do before this startup?",
  "When did you personally experience the problem you're solving?",
  "What was the exact moment you decided to build this?",
  "What have you given up to make this real?",
  "What's the biggest lesson you've learned so far?",
  "What do you want people to feel when they hear your story?",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers } = await req.json();

  const qa = QUESTIONS.map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are a master storyteller who helps founders share their journey in a way that connects and inspires.

Founder's story answers:

${qa}

Create 5 versions of their story for different platforms. Return ONLY a JSON object:
{
  "linkedinPost": "600-900 word LinkedIn post. Personal, vulnerable, inspiring. Hook in first line. No corporate language. First person. Ends with a call to connection.",
  "podcastIntro": "60-90 second spoken introduction (write it to be read aloud). Warm, narrative, makes listeners want to know more.",
  "pressBio": "150-200 word third-person bio for press and media. Establishes credibility and uniqueness. Compelling without being boastful.",
  "fullStory": "800-1200 word full narrative story. Has a beginning (before), middle (the moment), and now (what's being built). Reads like a great Medium article.",
  "twitterThread": "8-10 tweet thread. First tweet is the hook. Each tweet advances the story. Last tweet is the lesson or call to action. Format as '1/ ... 2/ ... 3/ ...' etc."
}

Use their actual words and details. Make it feel authentic, not polished to blandness.`;

  const result = await generateJSON<FounderStoryResult>(prompt);
  return NextResponse.json(result);
}
