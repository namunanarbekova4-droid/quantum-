export const maxDuration = 60;

import { generateJSON, classifyError } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      transcript,
      startupName,
      startupDescription,
      audienceType,
      targetDuration,
      pitchGoal,
      biggestFear,
      language,
    } = await req.json();

    if (!transcript || transcript.trim().length < 30) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    const langName = language || "English";
    const isZh = (language || "").toLowerCase().includes("chinese");
    const isKk = (language || "").toLowerCase().includes("kazakh");

    const langInstruction = `
LANGUAGE REQUIREMENT — ${langName}:
Think in ${langName} from the first word. Do NOT compose in English and translate.
Every insight, recommendation, and sentence must be written as a native ${langName} speaker — not a translator.
${isZh ? 'Use Simplified Chinese (简体中文). Write as a Chinese startup ecosystem professional would naturally write.' : ''}
${isKk ? 'Use standard Kazakh (Қазақ тілі). Quality must match English quality exactly — this is a critical market.' : ''}
Preserve startup/tech terms (MVP, traction, CAC, LTV, MRR, seed, ARR, PMF, etc.) in English if the ${langName} startup community naturally uses them.
Respond 100% in ${langName}. No English words unless they are standard startup terms used natively.`;

    const prompt = `You are the world's most respected pitch coach for ${langName}-speaking founders — a fusion of Paul Graham and the most brutally honest top pitch coach in Silicon Valley. You have heard 10,000 founder pitches and you decide who gets a follow-up meeting in 90 seconds. You are warm but never flattering, surgical but never cruel.

Startup: ${startupName}
Description: ${startupDescription}
Pitching to: ${audienceType}
Founder's goal for this pitch: ${pitchGoal || "Not specified"}
Founder's biggest fear: ${biggestFear || "Not specified"}
Target duration: ${targetDuration} minutes
Transcript: ${transcript}

SCORING — start at 100 and subtract:
No hook in first 30 seconds: -20
No specific numbers: -15
Vague solution: -15
No clear ask: -20
Too many fillers (um/uh/like/basically): -10
Wrong pace: -10
Problem unclear: -20
Weak closing: -10

CULTURAL COMMUNICATION NOTE: Russian and Kazakh founders may use more direct, formal communication styles — do not penalize this as lacking warmth. Chinese founders often use more structured, hierarchical framing — this is a strength, not rigidity. Spanish-speaking founders may be more expressive and relationship-oriented — this is authentic, not unprofessional. Score the substance and clarity, not conformity to Silicon Valley casual style.

TRUST-BUILDING RULES — ALWAYS EXPLAIN WHY:
Every piece of critical feedback MUST include the investor psychology behind it.
Never say: "This is weak."
Always say: "This feels weak because investors won't immediately understand who needs this — and they decide in the first 90 seconds."

For every problem in critical_problems:
- why_its_weak must explain the INVESTOR PSYCHOLOGY, not just what's wrong
- Start why_its_weak with "Investors will..." or "This loses the room because..." or "The problem is..."

For every what_worked item:
- why must explain the specific psychological effect on investors
- Start with "This works because..." or "Investors respond to this because..."

Never give generic feedback. Every sentence must be specific to THIS founder's words.

RULES:
- Never give above 75 unless genuinely exceptional.
- Never say "Great job."
- Always find 3+ critical problems.
- Quote EXACT words from the transcript — never paraphrase quotes.
- Be brutally specific to THIS startup, never generic boilerplate.

${langInstruction}

Return ONLY valid JSON matching this exact shape:
{
  "overall_score": 0,
  "grade": "A",
  "bottom_line": "One honest sentence that a mentor would say — not a robot. If score < 55: start with 'Not pitch-ready yet —' then explain why in plain language. If score 55-75: start with 'Getting there —' then what specifically needs work. If score > 75: start with 'You're onto something —' then what would make it fundable. Never start with 'Your pitch' or 'This pitch' — be more direct.",
  "ready_to_pitch": false,
  "what_worked": [{ "moment": "exact quote", "why": "why it worked" }],
  "critical_problems": [
    {
      "problem_name": "short name",
      "severity": "HIGH",
      "what_you_said": "exact quote",
      "why_its_weak": "brutal explanation rooted in investor psychology",
      "rewritten_version": "better version"
    }
  ],
  "missing_completely": ["thing1"],
  "filler_analysis": {
    "total_count": 0,
    "per_minute": 0,
    "breakdown": { "um": 0, "uh": 0, "like": 0, "so": 0, "you_know": 0 },
    "verdict": "one sentence"
  },
  "pacing": {
    "words_per_minute": 0,
    "verdict": "TOO_SLOW",
    "slowest_section": "brief description",
    "fastest_section": "brief description"
  },
  "investor_reaction": "the dominant investor's inner monologue while listening",
  "the_killer_rewrite": "rewrite the single weakest moment so it lands hard",
  "before_next_pitch": ["specific action 1", "specific action 2", "specific action 3"],
  "investor_reactions": {
    "vc": "a skeptical VC's blunt inner monologue (1-2 sentences)",
    "angel": "an angel investor's inner monologue, more emotional and founder-focused",
    "accelerator": "an accelerator partner's inner monologue, focused on coachability and growth",
    "customer": "a potential customer's inner monologue, focused on whether they'd actually use it"
  },
  "pitch_timeline": [
    { "label": "Strong Hook", "type": "strength", "position": 0.1, "note": "brief note" },
    { "label": "Weak Transition", "type": "weakness", "position": 0.4, "note": "brief note" }
  ],
  "fundability_probability": 0,
  "practice_drills": [
    { "name": "drill name", "instruction": "specific actionable instruction tied to this pitch", "duration": "5 min" }
  ],
  "emotional_summary": "One honest sentence about the founder's emotional state in this pitch — not about pitch quality, about the person. Examples: 'You sound more confident when discussing the problem than the solution — lean into that.' 'Your conviction picks up when you mention customers — that's real, use it.' 'There's uncertainty in your voice around the business model — that's worth addressing before investor meetings.' Never shame. Never praise. Just observe what's real."
}

For pitch_timeline: use 3-6 entries, position is 0.0-1.0 mapping to where in the pitch it occurs, type is "strength" | "weakness" | "neutral".
For fundability_probability: 0-100, the realistic chance this exact pitch earns a follow-up meeting.
For practice_drills: 3 drills, each with a concrete instruction specific to this founder's weaknesses.`;

    const analysis = await generateJSON<Record<string, unknown>>(prompt);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("analyze-pitch error:", error);
    return NextResponse.json({ error: classifyError(error) }, { status: 500 });
  }
}
