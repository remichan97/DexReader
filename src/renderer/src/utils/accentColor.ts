import { useAppStore } from '@renderer/stores'

/**
 * Calculate relative luminance of a color (WCAG formula)
 * Used to determine if text should be light or dark on the color
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const rsRGB = r / 255
  const gsRGB = g / 255
  const bsRGB = b / 255

  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Applies an accent colour to the --win-accent* CSS custom properties and mirrors it
 * into appStore so the Fluent theme (built from this value in
 * src/renderer/src/theme/fluentTheme.ts) stays in sync with it.
 *
 * The single shared implementation for every accent-colour source: startup/system-sync
 * (useAccentColor.ts) and the Settings page's own colour picker
 * (useAppearanceSettingsDomain.ts) used to each keep their own near-identical copy of
 * this logic, which is exactly how the Settings-page path drifted - it never updated
 * appStore, so Fluent components stopped tracking a colour changed from Settings even
 * though they correctly tracked the system-detected one.
 */
export function applyAccentColor(color: string): void {
  const root = document.documentElement
  root.style.setProperty('--win-accent', color)

  const rgb = Number.parseInt(color.slice(1), 16)
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255

  // Darker for hover (-10%)
  const hoverR = Math.max(0, Math.floor(r * 0.9))
  const hoverG = Math.max(0, Math.floor(g * 0.9))
  const hoverB = Math.max(0, Math.floor(b * 0.9))
  const hoverColor = `#${((hoverR << 16) | (hoverG << 8) | hoverB).toString(16).padStart(6, '0')}`

  // Even darker for active (-20%)
  const activeR = Math.max(0, Math.floor(r * 0.8))
  const activeG = Math.max(0, Math.floor(g * 0.8))
  const activeB = Math.max(0, Math.floor(b * 0.8))
  const activeColor = `#${((activeR << 16) | (activeG << 8) | activeB).toString(16).padStart(6, '0')}`

  root.style.setProperty('--win-accent-hover', hoverColor)
  root.style.setProperty('--win-accent-active', activeColor)

  // Appropriate text color on top of the accent, based on its luminance: white text on
  // dark accents, black text on light ones.
  const luminance = getRelativeLuminance(r, g, b)
  const textOnAccent = luminance > 0.5 ? '#000000' : '#ffffff'
  root.style.setProperty('--win-text-on-accent', textOnAccent)

  useAppStore.getState().setAccentColor(color)
}
