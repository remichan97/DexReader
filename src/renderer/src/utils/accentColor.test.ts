import { applyAccentColor } from './accentColor'
import { useAppStore } from '@renderer/stores'

function accentVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name)
}

beforeEach(() => {
  document.documentElement.style.cssText = ''
})

it('sets --win-accent and its hover/active variants', () => {
  applyAccentColor('#0078d4')

  expect(accentVar('--win-accent')).toBe('#0078d4')
  expect(accentVar('--win-accent-hover')).toBe('#006cbe')
  expect(accentVar('--win-accent-active')).toBe('#0060a9')
})

it('uses white text on a dark accent color and black text on a light one', () => {
  applyAccentColor('#000000')
  expect(accentVar('--win-text-on-accent')).toBe('#ffffff')

  applyAccentColor('#ffffff')
  expect(accentVar('--win-text-on-accent')).toBe('#000000')
})

it('mirrors the applied colour into appStore', () => {
  applyAccentColor('#125dab')

  expect(useAppStore.getState().accentColor).toBe('#125dab')
})
