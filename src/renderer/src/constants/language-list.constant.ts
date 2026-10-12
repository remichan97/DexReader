/**
 * Common Languages for MangaDex Filtering
 *
 * List of commonly used languages on MangaDex for manga translations.
 * Source: MangaDex API common language codes
 * Last Updated: 13 December 2025
 */

export const LanguageList = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ja-ro', name: 'Japanese (Romaji)' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-hk', name: 'Chinese (Traditional)' },
  { code: 'es', name: 'Spanish' },
  { code: 'es-la', name: 'Spanish (Latin America)' },
  { code: 'pt-br', name: 'Portuguese (Brazil)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'da', name: 'Danish' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fa', name: 'Persian' },
  { code: 'bn', name: 'Bengali' }
] as const

export type LanguageCode = (typeof LanguageList)[number]['code']

/**
 * Get full language name from language code
 * @param code - Language code (e.g., 'en', 'ja')
 * @returns Full language name (e.g., 'English', 'Japanese') or the code if not found
 */
export function getLanguageName(code: string): string {
  const language = LanguageList.find((lang) => lang.code === code)
  return language?.name || code.toUpperCase()
}
