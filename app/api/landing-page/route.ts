import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateJSON, classifyError } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

interface Feature {
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  role: string;
  text: string;
}

interface LandingPageResult {
  hero: {
    headlines: [string, string, string];
    subheadline: string;
    ctaOptions: [string, string, string];
    supportingLine: string;
  };
  problem: {
    sectionHeadline: string;
    statements: [string, string, string];
  };
  solution: {
    sectionHeadline: string;
    features: [Feature, Feature, Feature];
  };
  socialProof: {
    testimonials: [Testimonial, Testimonial, Testimonial];
    statsCopy: string;
  };
  cta: {
    headline: string;
    subheadline: string;
    buttonText: string;
    riskReversal: string;
  };
  seo: {
    pageTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
  };
}

const LANG_MAP: Record<string, string> = {
  en: "English",
  ru: "Russian",
  es: "Spanish",
  zh: "Chinese",
  kz: "Kazakh",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    startupName,
    tagline,
    problem,
    customer,
    differentiation,
    cta,
    tone,
    locale = "en",
  } = body;

  const langInstruction = `\n\nIMPORTANT: You must respond entirely in ${LANG_MAP[locale] ?? "English"}. Never mix languages in your response.`;

  const toneGuide: Record<string, string> = {
    Bold: "Bold and confident — make big claims, use power words, inspire action",
    Friendly: "Warm and approachable — conversational, relatable, like talking to a friend",
    Professional: "Polished and authoritative — credible, precise, business-appropriate",
    Playful: "Fun and energetic — witty, light-hearted, memorable with personality",
  };

  const prompt = `You are an expert conversion copywriter who creates high-converting landing page copy for startups.

Startup Name: ${startupName}
Tagline: ${tagline}
Problem solved: ${problem}
Ideal customer: ${customer}
Differentiation: ${differentiation}
Primary CTA: ${cta}
Tone: ${tone} — ${toneGuide[tone] ?? tone}

Generate complete landing page copy. Return ONLY a JSON object with this exact structure:
{
  "hero": {
    "headlines": ["headline option 1", "headline option 2", "headline option 3"],
    "subheadline": "one compelling subheadline that supports the headline",
    "ctaOptions": ["CTA button text 1", "CTA button text 2", "CTA button text 3"],
    "supportingLine": "small supporting text below CTA (e.g. 'No credit card required. Cancel anytime.')"
  },
  "problem": {
    "sectionHeadline": "section headline that resonates with the pain",
    "statements": ["pain point statement 1", "pain point statement 2", "pain point statement 3"]
  },
  "solution": {
    "sectionHeadline": "section headline introducing the solution",
    "features": [
      { "title": "feature 1 name", "description": "1-2 sentence benefit description" },
      { "title": "feature 2 name", "description": "1-2 sentence benefit description" },
      { "title": "feature 3 name", "description": "1-2 sentence benefit description" }
    ]
  },
  "socialProof": {
    "testimonials": [
      { "name": "First Last", "role": "Job Title at Company", "text": "Compelling testimonial that addresses the core value prop" },
      { "name": "First Last", "role": "Job Title at Company", "text": "Testimonial focusing on results or transformation" },
      { "name": "First Last", "role": "Job Title at Company", "text": "Testimonial from a skeptic who was converted" }
    ],
    "statsCopy": "Short social proof line (e.g. 'Join 2,400+ founders who already...')"
  },
  "cta": {
    "headline": "final call-to-action headline — urgency or value",
    "subheadline": "supporting text for the final CTA section",
    "buttonText": "${cta}",
    "riskReversal": "Risk reversal or guarantee statement"
  },
  "seo": {
    "pageTitle": "SEO page title under 60 characters",
    "metaDescription": "Meta description under 160 characters with main keywords",
    "ogTitle": "Open Graph title for social sharing",
    "ogDescription": "Open Graph description for social sharing"
  }
}

Headlines should be specific, benefit-driven, and match the ${tone} tone. Problem statements should make the ideal customer feel deeply understood. Features should focus on outcomes, not features. Testimonials should sound like real humans, not marketing copy.${langInstruction}`;

  try {
    const result = await generateJSON<LandingPageResult>(prompt);

    await prisma.landingPageGen.create({
      data: {
        userId: session.user.id,
        startupName,
        generatedCopy: result as object,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("landing-page error:", err);
    return NextResponse.json({ error: classifyError(err) }, { status: 500 });
  }
}
