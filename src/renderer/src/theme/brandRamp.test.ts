import { generateBrandRamp } from './brandRamp'

describe('generateBrandRamp', () => {
  it('produces all 16 Fluent BrandVariants shades', () => {
    const ramp = generateBrandRamp('#0078d4')

    expect(Object.keys(ramp)).toHaveLength(16)
    for (const shade of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]) {
      expect(ramp[shade as keyof typeof ramp]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('orders shades from darkest (10) to lightest (160)', () => {
    const ramp = generateBrandRamp('#0078d4')
    const luminance = (hex: string): number => parseInt(hex.slice(1), 16)

    const shades = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160] as const
    for (let i = 1; i < shades.length; i++) {
      expect(luminance(ramp[shades[i]])).toBeGreaterThan(luminance(ramp[shades[i - 1]]))
    }
  })

  it('is grayscale-safe (zero saturation) without dividing by zero', () => {
    const ramp = generateBrandRamp('#808080')

    expect(ramp[80]).toMatch(/^#[0-9a-f]{6}$/)
  })
})
