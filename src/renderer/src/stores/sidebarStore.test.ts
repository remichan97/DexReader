import { useSidebarStore } from './sidebarStore'

const INITIAL_STATE = useSidebarStore.getState()

describe('sidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState(INITIAL_STATE, true)
  })

  it('defaults to full display mode', () => {
    expect(useSidebarStore.getState().displayMode).toBe('full')
  })

  describe('setDisplayMode', () => {
    it.each(['full', 'compact', 'auto-hide'] as const)('sets displayMode to %s', (mode) => {
      useSidebarStore.getState().setDisplayMode(mode)

      expect(useSidebarStore.getState().displayMode).toBe(mode)
    })
  })
})
