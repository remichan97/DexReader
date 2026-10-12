import type { BrandVariants } from '@fluentui/react-components'

interface Hsl {
  h: number
  s: number
  l: number
}

function hexToHsl(hex: string): Hsl {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l }
  }

  const delta = max - min
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let h: number
  if (max === r) {
    h = ((g - b) / delta + (g < b ? 6 : 0)) * 60
  } else if (max === g) {
    h = ((b - r) / delta + 2) * 60
  } else {
    h = ((r - g) / delta + 4) * 60
  }

  return { h, s, l }
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let adjusted = t
  if (adjusted < 0) adjusted += 1
  if (adjusted > 1) adjusted -= 1
  if (adjusted < 1 / 6) return p + (q - p) * 6 * adjusted
  if (adjusted < 1 / 2) return q
  if (adjusted < 2 / 3) return p + (q - p) * (2 / 3 - adjusted) * 6
  return p
}

function hslToHex({ h, s, l }: Hsl): string {
  const toHex = (value: number): string =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')

  if (s === 0) {
    const channel = toHex(l)
    return `#${channel}${channel}${channel}`
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hueNormalized = h / 360

  const r = hueToRgbChannel(p, q, hueNormalized + 1 / 3)
  const g = hueToRgbChannel(p, q, hueNormalized)
  const b = hueToRgbChannel(p, q, hueNormalized - 1 / 3)

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const SHADES: ReadonlyArray<keyof BrandVariants> = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160
]

// Fluent's BrandVariants convention: shade 10 is darkest, shade 160 is lightest, and
// shade 80 is the one createLightTheme/createDarkTheme treat as "the brand colour"
// itself (colorBrandBackground/colorCompoundBrandBackground both resolve to brand[80]
// in the light theme - see @fluentui/tokens/lib/alias/lightColor.js). Deltas below are
// relative to shade 80 so the *exact* input colour is preserved there, with the other
// shades stepping evenly lighter/darker from it - rather than every shade (including 80)
// being forced to an absolute lightness that ignores the input's own lightness, which
// washed out visibly different accent colours into a similar-looking shade 80.
const LIGHTNESS_DELTA_BY_SHADE: Record<keyof BrandVariants, number> = {
  10: -0.42,
  20: -0.36,
  30: -0.3,
  40: -0.24,
  50: -0.18,
  60: -0.12,
  70: -0.06,
  80: 0,
  90: 0.06,
  100: 0.12,
  110: 0.18,
  120: 0.24,
  130: 0.3,
  140: 0.36,
  150: 0.42,
  160: 0.46
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Derives a 16-stop Fluent BrandVariants ramp from a single brand colour by stepping
 * that colour's hue/saturation/lightness through an even relative scale, anchored so
 * shade 80 is the exact input colour. Good enough for Phase 0/Tier 1 theming parity;
 * exact per-component contrast gets tuned as each primitive is migrated (see
 * claude-plans/fluent2-ui-migration-plan.md).
 */
export function generateBrandRamp(baseHex: string): BrandVariants {
  const { h, s, l } = hexToHsl(baseHex)
  const entries = SHADES.map(
    (shade) => [shade, hslToHex({ h, s, l: clamp01(l + LIGHTNESS_DELTA_BY_SHADE[shade]) })] as const
  )
  // Cast is exhaustive by construction: SHADES enumerates every key of BrandVariants.
  return Object.fromEntries(entries) as BrandVariants
}
