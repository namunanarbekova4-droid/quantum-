"use client";

import { Check } from "lucide-react";
import { DECK_THEMES } from "../lib/theme-system";
import type { ThemeId } from "../lib/theme-system";

interface Props {
  selected: ThemeId;
  onChange: (id: ThemeId) => void;
}

export function ThemeSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {(Object.values(DECK_THEMES) as (typeof DECK_THEMES)[ThemeId][]).map((theme) => {
        const isSelected = selected === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className="relative flex flex-col items-center gap-2 group"
            type="button"
          >
            {/* Mini 16:9 preview */}
            <div
              className="relative rounded-lg overflow-hidden transition-all"
              style={{
                width: 96,
                height: 54,
                background: theme.gradient,
                border: isSelected
                  ? "2px solid #C9A84C"
                  : "2px solid rgba(255,255,255,0.1)",
                boxShadow: isSelected ? "0 0 0 2px rgba(201,168,76,0.3)" : undefined,
              }}
            >
              {/* Sample "A" typography */}
              <div
                className="absolute inset-0 flex flex-col items-start justify-center px-2 gap-0.5"
              >
                <span
                  className="text-[10px] font-black leading-none"
                  style={{ color: theme.textPrimary === "#FFFFFF" ? "#fff" : theme.textPrimary }}
                >
                  A
                </span>
                <span
                  className="text-[6px] font-medium leading-none"
                  style={{ color: theme.accent }}
                >
                  {theme.name}
                </span>
              </div>

              {/* Checkmark overlay */}
              {isSelected && (
                <div
                  className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "#C9A84C" }}
                >
                  <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Theme name */}
            <span
              className="text-xs font-semibold transition-colors"
              style={{ color: isSelected ? "#C9A84C" : "rgba(255,255,255,0.5)" }}
            >
              {theme.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
