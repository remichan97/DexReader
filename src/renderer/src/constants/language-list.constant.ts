/**
 * Common Languages for MangaDex Filtering
 *
 * List of commonly used languages on MangaDex for manga translations.
 * Source: MangaDex API common language codes
 * Last Updated: 13 December 2025
 */

export const LanguageList = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ja-ro', name: 'Japanese (Romaji)', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'zh-hk', name: 'Chinese (Traditional)', flag: '🇭🇰' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'es-la', name: 'Spanish (Latin America)', flag: '🇲🇽' },
  { code: 'pt-br', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'fa', name: 'Persian', flag: '🇮🇷' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' }
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
