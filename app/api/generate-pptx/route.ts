import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;

interface PitchSlide {
  slide_number: number;
  slide_type: string;
  title: string;
  subtitle: string;
  main_content: string;
  speaker_notes: string;
  key_stat: string | null;
}

interface PitchDeckResult {
  slides: PitchSlide[];
  elevator_pitch: string;
}

interface DeckTheme {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

function hexOnly(color: string, fallback: string): string {
  if (color && color.startsWith("#")) return color.replace("#", "");
  return fallback;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { result, startupName, theme } = (await req.json()) as {
      result: PitchDeckResult;
      startupName: string;
      theme: DeckTheme;
    };

    const bgHex = hexOnly(theme.background, "0A0A1A");
    const primaryHex = hexOnly(theme.textPrimary, "FFFFFF");
    const secondaryHex = hexOnly(theme.textSecondary, "AAAAAA");
    const accentHex = hexOnly(theme.accent, "C9A84C");

    // Dynamic import so webpack doesn't bundle it for edge runtimes
    const PptxGenJS = (await import("pptxgenjs")).default;
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_WIDE";
    pres.title = `${startupName} Pitch Deck`;

    for (const slideData of result.slides) {
      const slide = pres.addSlide();
      slide.background = { color: bgHex };

      // Slide type badge — bottom left
      slide.addText(slideData.slide_type.replace(/_/g, " ").toUpperCase(), {
        x: 0.3, y: 5.1, w: 2.5, h: 0.3,
        fontSize: 7, bold: true, color: accentHex, align: "left",
      });

      // Slide number — bottom right
      slide.addText(`${slideData.slide_number} / ${result.slides.length}`, {
        x: 7.2, y: 5.1, w: 2.5, h: 0.3,
        fontSize: 7, color: secondaryHex, align: "right",
      });

      let y = 0.5;

      if (slideData.key_stat) {
        slide.addText(slideData.key_stat, {
          x: 0.5, y, w: 9, h: 0.9,
          fontSize: 44, bold: true, color: accentHex, align: "left",
        });
        y += 1.0;
      }

      slide.addText(slideData.title, {
        x: 0.5, y, w: 9, h: 1.0,
        fontSize: 28, bold: true, color: primaryHex, align: "left",
      });
      y += 1.1;

      if (slideData.subtitle) {
        slide.addText(slideData.subtitle, {
          x: 0.5, y, w: 9, h: 0.5,
          fontSize: 14, italic: true, color: accentHex, align: "left",
        });
        y += 0.65;
      }

      if (slideData.main_content) {
        const remaining = Math.max(0.5, 5.625 - y - 0.7);
        slide.addText(slideData.main_content, {
          x: 0.5, y, w: 9, h: remaining,
          fontSize: 11, color: secondaryHex, align: "left",
        });
      }

      if (slideData.speaker_notes) {
        slide.addNotes(slideData.speaker_notes);
      }
    }

    // Elevator pitch slide at end
    const last = pres.addSlide();
    last.background = { color: bgHex };
    last.addText("Elevator Pitch", {
      x: 0.5, y: 0.4, w: 9, h: 0.6,
      fontSize: 22, bold: true, color: primaryHex, align: "left",
    });
    last.addText(result.elevator_pitch ?? "", {
      x: 0.5, y: 1.1, w: 9, h: 4.2,
      fontSize: 11, color: secondaryHex, align: "left",
    });

    // Use arraybuffer — works in both Node.js and serverless/edge
    const arrayBuffer = await pres.write({ outputType: "arraybuffer" }) as ArrayBuffer;

    const fileName = `${startupName.toLowerCase().replace(/\s+/g, "-")}-pitch-deck.pptx`;
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(arrayBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("generate-pptx error:", err);
    const message = err instanceof Error ? err.message : "PPTX generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
