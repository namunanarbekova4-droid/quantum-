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

  const body = await req.json();
  const { answers } = body;
  const locale: string = body.locale ?? "en";

  const LANG_MAP: Record<string, string> = {
    en: "English",
    ru: "Russian",
    es: "Spanish",
    zh: "Chinese",
    kz: "Kazakh",
  };
  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const qa = QUESTIONS.map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");

  const prompt = `You are extracting the real story beneath the startup narrative. Founders often tell the sanitized version — the version that sounds good, not the version that's true. Your job is to find the specific moment, the real stakes, the actual reason only THIS person would be doing this.

The best founder stories have three things: a specific moment of pain (not "I noticed a problem" but "I was sitting in a hospital waiting room at 2am trying to explain a form I didn't understand"), a decision point with real consequences (what they gave up, what they risked, what they couldn't go back from), and a reason this founder and not someone else (what in their background, their obsession, their failure made this problem theirs to solve).

Founder's story answers:

${qa}

Create 5 versions of their story. Return ONLY a JSON object:
{
  "linkedinPost": "600-900 words. Open with the most vulnerable or surprising sentence from their story — not 'I quit my job to start a company' or 'I always knew I wanted to be an entrepreneur.' Open with a specific scene, a specific feeling, a specific number. First person. No corporate language. No buzzwords. Ends with a specific question or invitation, not a generic 'follow me for more.'",
  "podcastIntro": "60-90 second spoken introduction written to be read aloud. Opens with the specific moment, not credentials. Warm, first-person, makes listeners feel like they're being told a secret.",
  "pressBio": "150-200 word third-person bio. Leads with what makes this founder unusual — not their title. The credential that matters is the one that explains why they saw this problem before anyone else.",
  "fullStory": "800-1200 words. Written like a first-person New Yorker piece about a founder — personal, specific, surprising. Has a real story arc: before (what their life was like), the crack (the moment the problem became impossible to ignore), the decision (what it actually cost them to pursue this), and now (what they're building and why it has to exist). No paragraph can be removed without losing something.",
  "twitterThread": "8-10 tweets. Hook tweet must be a counterintuitive statement or a specific detail that makes people stop mid-scroll — not a thesis statement, a provocation. Each tweet advances the story or reveals a new layer. Last tweet lands the meaning, not just the lesson. Format as '1/ ... 2/ ... 3/ ...' etc."
}

Use their actual words and specific details. If they gave you a specific number, use it. If they described a specific moment, write that moment. Do not smooth it into a generic founder story.${langInstruction}`;

  const result = await generateJSON<FounderStoryResult>(prompt);
  return NextResponse.json(result);
}
