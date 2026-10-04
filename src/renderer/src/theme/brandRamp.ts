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

// Fluent's BrandVariants convention: shade 10 is darkest, shade 160 is lightest.
// An even lightness ramp through the input colour's own hue/saturation, with the
// input itself landing closest to shade 80 (Fluent's typical "primary" stop).
const LIGHTNESS_BY_SHADE: Record<keyof BrandVariants, number> = {
  10: 0.08,
  20: 0.14,
  30: 0.2,
  40: 0.26,
  50: 0.32,
  60: 0.38,
  70: 0.44,
  80: 0.5,
  90: 0.56,
  100: 0.62,
  110: 0.68,
  120: 0.74,
  130: 0.8,
  140: 0.86,
  150: 0.92,
  160: 0.96
}

/**
 * Derives a 16-stop Fluent BrandVariants ramp from a single brand colour by
 * stepping that colour's hue/saturation through an even lightness scale.
 * Good enough for Phase 0 theming parity; exact per-component contrast gets
 * tuned as each primitive is migrated (see claude-plans/fluent2-ui-migration-plan.md).
 */
export function generateBrandRamp(baseHex: string): BrandVariants {
  const { h, s } = hexToHsl(baseHex)
  const entries = SHADES.map(
    (shade) => [shade, hslToHex({ h, s, l: LIGHTNESS_BY_SHADE[shade] })] as const
  )
  // Cast is exhaustive by construction: SHADES enumerates every key of BrandVariants.
  return Object.fromEntries(entries) as BrandVariants
}
