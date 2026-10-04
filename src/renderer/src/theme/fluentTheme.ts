import { createDarkTheme, createLightTheme, type Theme } from '@fluentui/react-components'
import { generateBrandRamp } from './brandRamp'

export interface DexReaderThemes {
  light: Theme
  dark: Theme
}

// Neutral backgrounds/foregrounds are pinned to DexReader's existing Windows 11 token
// palette (docs/design/windows11-design-tokens.md, src/renderer/src/assets/tokens.css)
// so non-brand surfaces don't shift. Hex values here are NOT accent-dependent.
const NEUTRAL_OVERRIDES_LIGHT = {
  colorNeutralForeground1: '#000000',
  colorNeutralForeground2: '#605e5c',
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: '#f3f3f3',
  colorNeutralBackground3: '#fafafa',
  colorNeutralStroke1: '#e1dfdd',
  colorNeutralStroke2: '#d2d0ce'
} as const

const NEUTRAL_OVERRIDES_DARK = {
  colorNeutralForeground1: '#ffffff',
  colorNeutralForeground2: '#e1dfdd',
  colorNeutralBackground1: '#2c2c2c',
  colorNeutralBackground2: '#202020',
  colorNeutralBackground3: '#333333',
  colorNeutralStroke1: '#3d3d3d',
  colorNeutralStroke2: '#4d4d4d'
} as const

/**
 * Builds light/dark Fluent themes from the given accent colour (the same value
 * src/renderer/src/hooks/useAccentColor.ts applies to --win-accent). Regenerating the
 * full 16-stop brand ramp - rather than overriding a handful of individual brand tokens
 * by hand - keeps every brand-dependent token consistent: colorBrandBackground, the
 * separate colorCompoundBrandBackground/Stroke/Foreground family Checkbox/Radio/Switch/
 * ProgressBar actually read from, hover/pressed variants, etc. See
 * claude-plans/fluent2-ui-migration-plan.md, Phase 0 and Tier 1.
 */
export function createDexReaderThemes(accentColor: string): DexReaderThemes {
  const brandRamp = generateBrandRamp(accentColor)

  return {
    light: { ...createLightTheme(brandRamp), ...NEUTRAL_OVERRIDES_LIGHT },
    dark: { ...createDarkTheme(brandRamp), ...NEUTRAL_OVERRIDES_DARK }
  }
}
