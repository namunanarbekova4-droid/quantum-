export const maxDuration = 60;

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      transcript,
      startupName,
      startupDescription,
      audienceType,
      targetDuration,
      language,
    } = await req.json();

    if (!transcript || transcript.trim().length < 30) {
      return NextResponse.json({ error: "Transcript too short" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are the most brutally honest pitch coach in Silicon Valley. You have heard 10000 pitches.

Startup: ${startupName}
Description: ${startupDescription}
Pitching to: ${audienceType}
Target duration: ${targetDuration} minutes
Transcript: ${transcript}

SCORING — subtract from 100:
No hook in first 30 seconds: -20
No specific numbers: -15
Vague solution: -15
No clear ask: -20
Too many fillers (um/uh/like): -10
Wrong pace: -10
Problem unclear: -20
Weak closing: -10

Never give above 75 unless exceptional.
Never say Great job.
Always find 3+ critical problems.
Quote exact words from transcript.
Respond in ${language || "English"}.

Return ONLY valid JSON, no markdown, no code fences:
{
  "overall_score": 0,
  "grade": "A",
  "bottom_line": "one brutal honest sentence",
  "ready_to_pitch": false,
  "what_worked": [{ "moment": "exact quote", "why": "why it worked" }],
  "critical_problems": [
    {
      "problem_name": "short name",
      "severity": "HIGH",
      "what_you_said": "exact quote",
      "why_its_weak": "brutal explanation",
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
  "investor_reaction": "what investor thinks",
  "the_killer_rewrite": "rewrite weakest part",
  "before_next_pitch": ["specific action 1", "specific action 2", "specific action 3"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    const analysis = JSON.parse(match[0]);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("analyze-pitch error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "AI analysis temporarily unavailable. Please try again in a few minutes." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
