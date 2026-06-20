"use client";
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

export interface SlideData {
  slide_type: string;
  title: string;
  body?: string;
  bullets?: string[];
  keystat?: string;
  notes?: string;
  team?: { name: string; role?: string; bio?: string }[];
}

export function SlideRenderer({ slide }: { slide: SlideData }) {
  const type = slide.slide_type as SlideType;
  const p = { title: slide.title, body: slide.body, bullets: slide.bullets, keystat: slide.keystat };
  switch (type) {
    case "cover":          return <CoverSlide title={slide.title} subtitle={slide.body} keystat={slide.keystat} />;
    case "problem":        return <ProblemSlide {...p} />;
    case "personal_story": return <GenericSlide slideType="personal_story" {...p} />;
    case "solution":       return <SolutionSlide {...p} />;
    case "market":         return <MarketSlide title={slide.title} body={slide.body} keystat={slide.keystat} />;
    case "product":        return <ProductSlide {...p} />;
    case "traction":       return <TractionSlide {...p} />;
    case "business_model": return <GenericSlide slideType="business_model" {...p} />;
    case "competition":    return <GenericSlide slideType="competition" {...p} />;
    case "team":           return <TeamSlide title={slide.title} team={slide.team} body={slide.body} bullets={slide.bullets} />;
    case "financials":     return <GenericSlide slideType="financials" {...p} />;
    case "ask":            return <AskSlide {...p} />;
    default: {
      const safeType: SlideType = ["cover","problem","personal_story","solution","market","product","traction","business_model","competition","team","financials","ask"].includes(type) ? type as SlideType : "cover";
      return <GenericSlide slideType={safeType} {...p} />;
    }
  }
}
