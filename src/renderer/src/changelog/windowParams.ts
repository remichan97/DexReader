import { DisplayLanguage } from '@shared/enums/settings/display-languages.enum'

export interface ChangelogWindowParams {
  language: DisplayLanguage
  theme: 'light' | 'dark'
}

const DEFAULT_LANGUAGE = DisplayLanguage.EnglishUK
const SUPPORTED_LANGUAGES: readonly string[] = Object.values(DisplayLanguage)

/**
 * Read what main passed on the page URL (`?lng=` and `?theme=`). The window cannot ask for
 * settings itself, so main resolves them before loading the page; anything missing or not
 * recognised falls back to British English and the light theme rather than failing to open.
 *
 * @param search The page's query string, such as `location.search`
 * @returns The display language and the effective theme
 */
export function readWindowParams(search: string): ChangelogWindowParams {
  const params = new URLSearchParams(search)
  const language = params.get('lng') ?? ''
  const theme = params.get('theme')

  return {
    language: SUPPORTED_LANGUAGES.includes(language)
      ? (language as DisplayLanguage)
      : DEFAULT_LANGUAGE,
    theme: theme === 'dark' ? 'dark' : 'light'
  }
}
