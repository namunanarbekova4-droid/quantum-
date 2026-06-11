import type { DeckTheme } from "./theme-system";

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
  three_minute_script: string;
  elevator_pitch: string;
  opening_hook: string;
  closing_statement: string;
  investor_questions: { question: string; answer: string }[];
}

function hexFromThemeBg(background: string): string {
  if (background.startsWith("#")) return background.replace("#", "");
  return "0A0A1A";
}

function hexColor(color: string): string {
  if (color.startsWith("#")) return color.replace("#", "");
  return "FFFFFF";
}

export async function generatePPTX(
  result: PitchDeckResult,
  startupName: string,
  theme: DeckTheme
): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pres = new PptxGenJS();

  pres.layout = "LAYOUT_WIDE";
  pres.title = `${startupName} Pitch Deck`;

  const bgHex = hexFromThemeBg(theme.background);
  const textPrimaryHex = hexColor(theme.textPrimary);
  const textSecondaryHex = hexColor(theme.textSecondary.startsWith("rgba") ? "#AAAAAA" : theme.textSecondary);
  const accentHex = hexColor(theme.accent);

  for (const slideData of result.slides) {
    const slide = pres.addSlide();

    // Background
    slide.background = { color: bgHex };

    // Slide type badge (bottom-left)
    slide.addText(slideData.slide_type.replace(/_/g, " ").toUpperCase(), {
      x: 0.3,
      y: 5.1,
      w: 2.5,
      h: 0.3,
      fontSize: 7,
      bold: true,
      color: accentHex,
      align: "left",
    });

    // Slide number (bottom-right)
    slide.addText(`${slideData.slide_number} / ${result.slides.length}`, {
      x: 7.2,
      y: 5.1,
      w: 2.5,
      h: 0.3,
      fontSize: 7,
      color: textSecondaryHex,
      align: "right",
    });

    let yOffset = 0.5;

    // Key stat
    if (slideData.key_stat) {
      slide.addText(slideData.key_stat, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 0.9,
        fontSize: 44,
        bold: true,
        color: accentHex,
        align: "left",
      });
      yOffset += 1.0;
    }

    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: yOffset,
      w: 9,
      h: 1.0,
      fontSize: 28,
      bold: true,
      color: textPrimaryHex,
      align: "left",
    });
    yOffset += 1.1;

    // Subtitle
    if (slideData.subtitle) {
      slide.addText(slideData.subtitle, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 0.5,
        fontSize: 14,
        italic: true,
        color: accentHex,
        align: "left",
      });
      yOffset += 0.65;
    }

    // Main content
    if (slideData.main_content) {
      slide.addText(slideData.main_content, {
        x: 0.5,
        y: yOffset,
        w: 9,
        h: 5.625 - yOffset - 0.7,
        fontSize: 11,
        color: textSecondaryHex,
        align: "left",
      });
    }

    // Speaker notes (never on the visual slide)
    if (slideData.speaker_notes) {
      slide.addNotes(slideData.speaker_notes);
    }
  }

  // Scripts slide at the end
  const scriptsSlide = pres.addSlide();
  scriptsSlide.background = { color: bgHex };
  scriptsSlide.addText("Elevator Pitch", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: textPrimaryHex,
    align: "left",
  });
  scriptsSlide.addText(result.elevator_pitch, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 4.2,
    fontSize: 11,
    color: textSecondaryHex,
    align: "left",
  });

  const fileName = `${startupName.toLowerCase().replace(/\s+/g, "-")}-pitch-deck.pptx`;
  await pres.writeFile({ fileName });
}
