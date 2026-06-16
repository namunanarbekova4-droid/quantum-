// Centralized language system for Quantum platform

export type SupportedLanguage = 'en' | 'ru' | 'es' | 'zh' | 'kk';

export const LANGUAGE_DISPLAY_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  zh: '中文',
  kk: 'Қазақша',
};

export const GEMINI_LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Russian',
  es: 'Spanish',
  zh: 'Chinese (Simplified)',
  kk: 'Kazakh',
};

// Web Speech API locales
export const SPEECH_LOCALES: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  es: 'es-ES',
  zh: 'zh-CN',
  kk: 'kk-KZ',
};

// RTL languages
export const RTL_LANGUAGES: SupportedLanguage[] = [];

export function isRTL(lang: SupportedLanguage): boolean {
  return RTL_LANGUAGES.includes(lang);
}

// The app uses 'kz' as the Kazakh locale code in i18n; map both 'kk' and 'kz' to kk-KZ
const SPEECH_LOCALE_ALIASES: Record<string, string> = {
  kz: 'kk-KZ',
};

export function getSpeechLocale(lang: string): string {
  if (lang in SPEECH_LOCALE_ALIASES) return SPEECH_LOCALE_ALIASES[lang];
  return SPEECH_LOCALES[lang as SupportedLanguage] ?? 'en-US';
}

export function getFillerWordsForLocale(lang: string): string[] {
  // Handle kz alias
  const normalized = lang === 'kz' ? 'kk' : lang;
  return FILLER_WORDS[normalized as SupportedLanguage] ?? FILLER_WORDS.en;
}

export function getWeakWordsForLocale(lang: string): string[] {
  const normalized = lang === 'kz' ? 'kk' : lang;
  return WEAK_WORDS[normalized as SupportedLanguage] ?? WEAK_WORDS.en;
}

export function getStrongWordsForLocale(lang: string): string[] {
  const normalized = lang === 'kz' ? 'kk' : lang;
  return STRONG_WORDS[normalized as SupportedLanguage] ?? STRONG_WORDS.en;
}

export function getLanguageDisplayName(lang: SupportedLanguage): string {
  return LANGUAGE_DISPLAY_NAMES[lang] ?? 'English';
}

export function getGeminiLanguageName(lang: SupportedLanguage): string {
  return GEMINI_LANGUAGE_NAMES[lang] ?? 'English';
}

/**
 * Returns a mandatory language instruction block to inject into every Gemini prompt.
 * This must appear at the END of every prompt.
 */
export function getGeminiLanguageInstruction(lang: SupportedLanguage): string {
  const name = getGeminiLanguageName(lang);
  return `

CRITICAL LANGUAGE REQUIREMENT:
The user's selected language is: ${name}
You MUST:
- Think in ${name} from the start — do NOT translate from English
- Respond ENTIRELY in ${name} — every word, every field, every value
- Use natural, native ${name} phrasing that sounds like a native speaker wrote it
- Preserve startup/tech terms that founders naturally use (e.g. "MVP", "traction", "seed round" may stay as-is if the native startup community uses them)
- Match the cultural communication style of ${name} speakers
- Never switch to English mid-response
- Never produce awkward translated wording
If you accidentally start in English, restart in ${name}.`;
}

// Filler words by language (for transcript highlighting)
export const FILLER_WORDS: Record<SupportedLanguage, string[]> = {
  en: ['um', 'uh', 'like', 'so', 'you know', 'basically', 'kind of', 'sort of', 'right', 'actually', 'literally'],
  ru: ['эм', 'ммм', 'ну', 'типа', 'короче', 'как бы', 'вот', 'это самое', 'значит', 'понимаешь', 'блин'],
  es: ['eh', 'pues', 'bueno', 'este', 'o sea', 'mira', 'entonces', 'mmm', 'la verdad', 'en plan'],
  zh: ['那个', '嗯', '就是', '然后', '其实', '对吧', '怎么说', '那么', '这个', '所以说'],
  kk: ['мм', 'анау', 'ғой', 'сияқты', 'негізі', 'яғни', 'демек', 'бір сөзбен', 'солай'],
};

// Weak/hedging language by language (yellow highlight)
export const WEAK_WORDS: Record<SupportedLanguage, string[]> = {
  en: ['maybe', 'perhaps', 'i think', 'probably', 'hopefully', 'might', 'could be', 'sort of', 'kind of', 'i guess', 'i feel like'],
  ru: ['может быть', 'наверное', 'я думаю', 'возможно', 'скорее всего', 'как-то', 'что ли', 'вроде', 'кажется'],
  es: ['quizás', 'tal vez', 'creo que', 'probablemente', 'a lo mejor', 'supongo', 'me parece', 'como que'],
  zh: ['可能', '也许', '我觉得', '或许', '大概', '应该', '感觉', '似乎', '好像'],
  kk: ['мүмкін', 'менің ойымша', 'бәлкім', 'сірә', 'деп ойлаймын', 'шамасы'],
};

// Strong investor language by language (gold highlight)
export const STRONG_WORDS: Record<SupportedLanguage, string[]> = {
  en: ['revenue', 'growth', 'traction', 'retention', 'users', 'conversion', 'validated', 'proved', 'market', 'billion', 'million', 'mrr', 'arr', 'cac', 'ltv', 'raise', 'invest'],
  ru: ['выручка', 'рост', 'трекшн', 'retention', 'пользователи', 'конверсия', 'подтверждено', 'рынок', 'инвестиции', 'привлечь', 'ARR', 'MRR', 'прибыль', 'масштаб'],
  es: ['ingresos', 'crecimiento', 'tracción', 'usuarios', 'conversión', 'validado', 'mercado', 'inversión', 'retención', 'escalar', 'MRR', 'ARR'],
  zh: ['收入', '增长', '牵引力', '用户', '转化率', '验证', '市场', '投资', '融资', '规模', '留存', 'MRR', 'ARR'],
  kk: ['табыс', 'өсім', 'қолданушылар', 'нарық', 'инвестиция', 'валидация', 'конверсия', 'масштаб', 'MRR'],
};

export function getFillerWords(lang: SupportedLanguage): string[] {
  return FILLER_WORDS[lang] ?? FILLER_WORDS.en;
}

export function getWeakWords(lang: SupportedLanguage): string[] {
  return WEAK_WORDS[lang] ?? WEAK_WORDS.en;
}

export function getStrongWords(lang: SupportedLanguage): string[] {
  return STRONG_WORDS[lang] ?? STRONG_WORDS.en;
}
