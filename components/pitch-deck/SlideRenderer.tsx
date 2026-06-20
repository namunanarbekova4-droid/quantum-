import React from "react";
import type { SlideType } from "@/lib/pitch-deck/design-system";
import { CoverSlide } from "./slides/CoverSlide";
import { ProblemSlide } from "./slides/ProblemSlide";
import { SolutionSlide } from "./slides/SolutionSlide";
import { MarketSlide } from "./slides/MarketSlide";
import { ProductSlide } from "./slides/ProductSlide";
import { TractionSlide } from "./slides/TractionSlide";
import { TeamSlide } from "./slides/TeamSlide";
import { AskSlide } from "./slides/AskSlide";
import { GenericSlide } from "./slides/GenericSlide";

// Maps to the PitchSlide shape returned by the API
export interface SlideData {
  slide_number?: number;
  slide_type: string;
  title: string;
  subtitle?: string;
  main_content?: string;
  speaker_notes?: string;
  key_stat?: string | null;
  emotional_purpose?: string;
  visual_hint?: string;
  // Optional structured data
  bullets?: string[];
  body?: string;
  keystat?: string;
  team?: { name: string; role: string; bio?: string }[];
}

interface SlideRendererProps {
  slide: SlideData;
  className?: string;
  style?: React.CSSProperties;
}

const VALID_SLIDE_TYPES: SlideType[] = [
  "cover", "problem", "personal_story", "solution", "market",
  "product", "traction", "business_model", "competition", "team", "financials", "ask",
];

function toSlideType(raw: string): SlideType {
  return VALID_SLIDE_TYPES.includes(raw as SlideType) ? (raw as SlideType) : "cover";
}

export function SlideRenderer({ slide, style }: SlideRendererProps) {
  const type = toSlideType(slide.slide_type);

  // Normalize: support both structured (bullets/body) and API shape (main_content/subtitle)
  const body = slide.body ?? slide.main_content ?? slide.subtitle ?? "";
  const keystat = slide.keystat ?? (slide.key_stat != null ? String(slide.key_stat) : undefined);
  const bullets = slide.bullets;

  const commonProps = { title: slide.title, body, bullets, keystat };

  let content: React.ReactNode;
  switch (type) {
    case "cover":
      content = <CoverSlide {...commonProps} subtitle={slide.subtitle} />; break;
    case "problem":
      content = <ProblemSlide {...commonProps} />; break;
    case "personal_story":
      content = <GenericSlide slideType="personal_story" {...commonProps} />; break;
    case "solution":
      content = <SolutionSlide {...commonProps} />; break;
    case "market":
      content = <MarketSlide {...commonProps} />; break;
    case "product":
      content = <ProductSlide {...commonProps} />; break;
    case "traction":
      content = <TractionSlide {...commonProps} />; break;
    case "business_model":
      content = <GenericSlide slideType="business_model" {...commonProps} />; break;
    case "competition":
      content = <GenericSlide slideType="competition" {...commonProps} />; break;
    case "team":
      content = <TeamSlide {...commonProps} team={slide.team} />; break;
    case "financials":
      content = <GenericSlide slideType="financials" {...commonProps} />; break;
    case "ask":
      content = <AskSlide {...commonProps} />; break;
    default:
      content = <GenericSlide slideType="cover" {...commonProps} />;
  }

  if (style) {
    return (
      <div style={{ position: "relative", width: "100%", overflow: "hidden", ...style }}>
        {content}
      </div>
    );
  }
  return <>{content}</>;
}
