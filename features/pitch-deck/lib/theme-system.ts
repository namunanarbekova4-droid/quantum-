export type ThemeId = "dark-premium" | "light-professional" | "bold-blue";

export interface DeckTheme {
  id: ThemeId;
  name: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  secondary: string;
  border: string;
  gradient: string;
}

export const DECK_THEMES: Record<ThemeId, DeckTheme> = {
  "dark-premium": {
    id: "dark-premium",
    name: "Dark Premium",
    background: "#0A0A1A",
    surface: "rgba(255,255,255,0.05)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.7)",
    accent: "#C9A84C",
    secondary: "#7C3AED",
    border: "rgba(255,255,255,0.1)",
    gradient: "linear-gradient(135deg, #0A0A1A, #13132A)",
  },
  "light-professional": {
    id: "light-professional",
    name: "Light Professional",
    background: "#FFFFFF",
    surface: "#F8F7FF",
    textPrimary: "#0A0A1A",
    textSecondary: "#555555",
    accent: "#7C3AED",
    secondary: "#C9A84C",
    border: "#E8E8E8",
    gradient: "linear-gradient(135deg, #FFFFFF, #F8F7FF)",
  },
  "bold-blue": {
    id: "bold-blue",
    name: "Bold Blue",
    background: "#0F172A",
    surface: "rgba(255,255,255,0.05)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.7)",
    accent: "#3B82F6",
    secondary: "#06B6D4",
    border: "rgba(255,255,255,0.1)",
    gradient: "linear-gradient(135deg, #0F172A, #111C3D)",
  },
};
