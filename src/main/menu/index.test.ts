const mocks = vi.hoisted(() => ({
  setApplicationMenu: vi.fn(),
  buildFromTemplate: vi.fn(),
  getMainWindow: vi.fn(),
  removeChangelogWindowMenu: vi.fn(),
  order: [] as string[]
}))

vi.mock('electron', () => ({
  Menu: {
    buildFromTemplate: mocks.buildFromTemplate,
    setApplicationMenu: mocks.setApplicationMenu
  }
}))
vi.mock('./view.menu', () => ({ buildViewMenu: vi.fn(() => ({ label: 'View' })) }))
vi.mock('./file.menu', () => ({ buildFileMenu: vi.fn(() => ({ label: 'File' })) }))
vi.mock('./library.menu', () => ({ buildLibraryMenu: vi.fn(() => ({ label: 'Library' })) }))
vi.mock('./help.menu', () => ({ buildHelpMenu: vi.fn(() => ({ label: 'Help' })) }))
vi.mock('../window', () => ({ getMainWindow: mocks.getMainWindow }))
vi.mock('../changelog-window', () => ({
  removeChangelogWindowMenu: mocks.removeChangelogWindowMenu
}))

import { createMenu, updateMenuState } from './index'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.order.length = 0
  mocks.getMainWindow.mockReturnValue({})
  mocks.buildFromTemplate.mockReturnValue({ built: true })
  mocks.setApplicationMenu.mockImplementation(() => mocks.order.push('setApplicationMenu'))
  mocks.removeChangelogWindowMenu.mockImplementation(() => mocks.order.push('removeMenu'))
})

describe('createMenu', () => {
  it('throws before the main window exists', () => {
    mocks.getMainWindow.mockReturnValue(undefined)

    expect(() => createMenu({})).toThrow('Cannot create menu before the main window exists')
  })
})

describe('updateMenuState', () => {
  it('sets the rebuilt menu as the application menu', () => {
    updateMenuState({ isOffline: true })

    expect(mocks.setApplicationMenu).toHaveBeenCalledExactlyOnceWith({ built: true })
  })

  it('takes the menu off the changelog window straight after, so it never shows one', () => {
    updateMenuState({ isOffline: true })

    expect(mocks.order).toEqual(['setApplicationMenu', 'removeMenu'])
  })
})
