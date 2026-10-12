import { useAppStore } from './appStore'

const INITIAL_STATE = useAppStore.getState()

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState(INITIAL_STATE, true)
  })

  it('defaults to system theme mode with a light theme', () => {
    const state = useAppStore.getState()

    expect(state.themeMode).toBe('system')
    expect(state.theme).toBe('light')
    expect(state.systemTheme).toBe('light')
  })

  describe('setTheme', () => {
    it('sets both theme and themeMode to the given explicit theme', () => {
      useAppStore.getState().setTheme('dark')

      expect(useAppStore.getState()).toEqual(
        expect.objectContaining({ theme: 'dark', themeMode: 'dark' })
      )
    })
  })

  describe('setSystemTheme', () => {
    it('recalculates theme when themeMode is "system"', () => {
      useAppStore.getState().setSystemTheme('dark')

      expect(useAppStore.getState()).toEqual(
        expect.objectContaining({ systemTheme: 'dark', theme: 'dark' })
      )
    })

    it('updates systemTheme but does not change the active theme when themeMode is explicit', () => {
      useAppStore.getState().setTheme('light')

      useAppStore.getState().setSystemTheme('dark')

      expect(useAppStore.getState()).toEqual(
        expect.objectContaining({ systemTheme: 'dark', theme: 'light', themeMode: 'light' })
      )
    })
  })

  describe('setThemeMode', () => {
    it('recalculates theme from the current systemTheme when switching back to "system"', () => {
      useAppStore.getState().setSystemTheme('dark')
      useAppStore.getState().setTheme('light')

      useAppStore.getState().setThemeMode('system')

      expect(useAppStore.getState()).toEqual(
        expect.objectContaining({ themeMode: 'system', theme: 'dark' })
      )
    })

    it('sets theme directly when switching to an explicit mode', () => {
      useAppStore.getState().setThemeMode('dark')

      expect(useAppStore.getState()).toEqual(
        expect.objectContaining({ themeMode: 'dark', theme: 'dark' })
      )
    })
  })

  describe('setFullscreen', () => {
    it('updates isFullscreen independently of theme state', () => {
      useAppStore.getState().setFullscreen(true)

      expect(useAppStore.getState().isFullscreen).toBe(true)
    })
  })

  describe('setAccentColor', () => {
    it('updates accentColor independently of theme state', () => {
      useAppStore.getState().setAccentColor('#125dab')

      expect(useAppStore.getState().accentColor).toBe('#125dab')
    })
  })
})
