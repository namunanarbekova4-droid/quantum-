"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Locale, TranslationKeys, locales } from "./translations";

interface LanguageContextType {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  t: locales.en,
  setLocale: () => {},
});

const STORAGE_KEY = "quantum-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && locales[stored]) {
      setLocaleState(stored);
    } else {
      // Try to load from profile
      fetch("/api/user/profile")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.language && locales[data.language as Locale]) {
            setLocaleState(data.language as Locale);
            localStorage.setItem(STORAGE_KEY, data.language);
          }
        })
        .catch(() => {});
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Persist to profile (fire and forget)
    fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    }).catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
