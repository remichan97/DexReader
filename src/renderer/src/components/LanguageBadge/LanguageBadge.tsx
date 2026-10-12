import type { JSX } from 'react'
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { Globe16Regular } from '@fluentui/react-icons'
import { getLanguageFlag } from '@renderer/utils/languageFlags'
import { getLanguageCode, getLanguageName } from '@renderer/utils/languageHelpers'

const useStyles = makeStyles({
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap'
  },
  // 3:2 flags; the faint outline keeps white-heavy flags (Japan, Israel...) from vanishing
  // into a light background
  flag: {
    display: 'block',
    width: '18px',
    height: '12px',
    flexShrink: 0,
    borderRadius: tokens.borderRadiusSmall,
    boxShadow: `0 0 0 1px ${tokens.colorNeutralStroke2}`
  },
  fallback: {
    display: 'block',
    flexShrink: 0,
    color: tokens.colorNeutralForeground3
  }
})

export interface LanguageFlagProps {
  /**
   * MangaDex language code (e.g. 'en', 'ja-ro', 'zh-hk')
   */
  readonly code: string

  readonly className?: string
}

/**
 * Decorative flag for a language, drawn from bundled SVGs (country-flag-icons) so it renders
 * the same on every OS - emoji flags don't draw on Windows. Languages without a sensible flag
 * get a neutral globe. Always `aria-hidden`: pair it with visible text (see LanguageBadge).
 */
export function LanguageFlag({ code, className }: Readonly<LanguageFlagProps>): JSX.Element {
  const styles = useStyles()
  const Flag = getLanguageFlag(code)

  return Flag ? (
    <Flag aria-hidden="true" className={mergeClasses(styles.flag, className)} />
  ) : (
    <Globe16Regular aria-hidden="true" className={mergeClasses(styles.fallback, className)} />
  )
}

export interface LanguageBadgeProps {
  /**
   * MangaDex language code (e.g. 'en', 'ja-ro', 'zh-hk')
   */
  readonly code: string

  /**
   * What to show beside the flag: the short code (compact, e.g. 'JA-RO') or the full name
   * (e.g. 'Japanese (Romanized)'). The code or name is what tells variants that share a flag
   * apart, so the flag is never shown alone.
   * @default 'code'
   */
  readonly label?: 'code' | 'name'

  readonly className?: string
}

/**
 * A language's flag and label, inline. The full name is always available as the tooltip, and
 * as the accessible name when only the code is visible.
 *
 * @example
 * ```tsx
 * <LanguageBadge code="es-la" />                 // [flag] ES-LA
 * <LanguageBadge code="pt-br" label="name" />    // [flag] Portuguese (Brazil)
 * ```
 */
export function LanguageBadge({
  code,
  label = 'code',
  className
}: Readonly<LanguageBadgeProps>): JSX.Element {
  const styles = useStyles()
  const name = getLanguageName(code)

  return (
    <span
      className={mergeClasses(styles.badge, className)}
      title={name}
      aria-label={label === 'code' ? name : undefined}
    >
      <LanguageFlag code={code} />
      <span aria-hidden={label === 'code' ? 'true' : undefined}>
        {label === 'name' ? name : getLanguageCode(code)}
      </span>
    </span>
  )
}
