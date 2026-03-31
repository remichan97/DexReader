/**
 * Language mapping utilities for displaying language codes as human-readable names
 */

/**
 * Map of language codes to their full names
 * Based on ISO 639-1 codes and MangaDex conventions
 */
const LANGUAGE_NAMES: Record<string, string> = {
  // Common languages
  en: 'English',
  ja: 'Japanese',
  'ja-ro': 'Japanese (Romanized)',
  ko: 'Korean',
  vi: 'Vietnamese',
  zh: 'Chinese (Simplified)',
  'zh-hk': 'Chinese (Traditional)',

  // European languages
  es: 'Spanish',
  'es-la': 'Spanish (LATAM)',
  'pt-br': 'Portuguese (Brazil)',
  pt: 'Portuguese',
  de: 'German',
  fr: 'French',
  it: 'Italian',
  ru: 'Russian',
  pl: 'Polish',
  tr: 'Turkish',
  nl: 'Dutch',
  hu: 'Hungarian',
  cs: 'Czech',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',

  // Other languages
  ar: 'Arabic',
  he: 'Hebrew',
  th: 'Thai',
  id: 'Indonesian',
  ms: 'Malay',
  tl: 'Filipino',
  hi: 'Hindi',
  bn: 'Bengali',
  uk: 'Ukrainian',
  ro: 'Romanian',
  bg: 'Bulgarian',
  el: 'Greek',
  fa: 'Persian',

  // Additional
  ca: 'Catalan',
  sr: 'Serbian',
  hr: 'Croatian',
  sk: 'Slovak',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian'
}

/**
 * Get the full language name from a language code
 * @param code - ISO 639-1 language code (e.g., 'en', 'ja', 'zh-hk')
 * @returns Full language name or the code itself if not found
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase()
}

/**
 * Get the short language code for display (2-3 letters uppercase)
 * @param code - ISO 639-1 language code
 * @returns Uppercase short code (e.g., 'EN', 'JA', 'ZH-HK')
 */
export function getLanguageCode(code: string): string {
  return code.toUpperCase()
}
