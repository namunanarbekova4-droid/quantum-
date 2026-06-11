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

export async function generatePPTX(
  result: PitchDeckResult,
  startupName: string,
  theme: DeckTheme
): Promise<void> {
  const res = await fetch("/api/generate-pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, startupName, theme }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "PPTX generation failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${startupName.toLowerCase().replace(/\s+/g, "-")}-pitch-deck.pptx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
