import { createDarkTheme, createLightTheme, type Theme } from '@fluentui/react-components'
import { generateBrandRamp } from './brandRamp'

// --win-accent (light theme) - docs/design/windows11-design-tokens.md
const brandRamp = generateBrandRamp('#0078d4')

const baseLightTheme = createLightTheme(brandRamp)
const baseDarkTheme = createDarkTheme(brandRamp)

/**
 * Fluent themes pinned to DexReader's existing Windows 11 token palette so
 * components migrated to Fluent match the untouched hand-rolled ones during
 * the incremental swap - see claude-plans/fluent2-ui-migration-plan.md, Phase 0.
 * Hex values below are taken directly from docs/design/windows11-design-tokens.md
 * and src/renderer/src/assets/tokens.css.
 */
export const dexReaderLightTheme: Theme = {
  ...baseLightTheme,
  colorBrandBackground: '#0078d4',
  colorBrandBackgroundHover: '#106ebe',
  colorBrandBackgroundPressed: '#005a9e',
  colorNeutralForeground1: '#000000',
  colorNeutralForeground2: '#605e5c',
  colorNeutralBackground1: '#ffffff',
  colorNeutralBackground2: '#f3f3f3',
  colorNeutralBackground3: '#fafafa',
  colorNeutralStroke1: '#e1dfdd',
  colorNeutralStroke2: '#d2d0ce'
}

export const dexReaderDarkTheme: Theme = {
  ...baseDarkTheme,
  colorBrandBackground: '#60cdff',
  colorBrandBackgroundHover: '#7ed6ff',
  colorBrandBackgroundPressed: '#9ce0ff',
  colorBrandForeground1: '#000000',
  colorNeutralForeground1: '#ffffff',
  colorNeutralForeground2: '#e1dfdd',
  colorNeutralBackground1: '#2c2c2c',
  colorNeutralBackground2: '#202020',
  colorNeutralBackground3: '#333333',
  colorNeutralStroke1: '#3d3d3d',
  colorNeutralStroke2: '#4d4d4d'
}
