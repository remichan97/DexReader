import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'

const mocks = vi.hoisted(() => ({
  createChangelogWindow: vi.fn(),
  logError: vi.fn()
}))

vi.mock('electron', () => ({
  shell: { openExternal: vi.fn(), openPath: vi.fn() },
  dialog: { showMessageBox: vi.fn() },
  app: { getPath: vi.fn(), getVersion: vi.fn() }
}))

// Echo the key so the tests can see which string was asked for
vi.mock('../i18n/i18n.config', () => ({
  default: { t: (key: string) => key }
}))

vi.mock('../changelog-window', () => ({ createChangelogWindow: mocks.createChangelogWindow }))
vi.mock('../services/logging/main-logging.service', () => ({
  mainLog: { info: vi.fn(), warn: vi.fn(), error: mocks.logError, debug: vi.fn() }
}))

import { buildHelpMenu } from './help.menu'

const mainWindow = { webContents: { send: vi.fn() } } as unknown as BrowserWindow

function helpItems(): MenuItemConstructorOptions[] {
  return buildHelpMenu(mainWindow).submenu as MenuItemConstructorOptions[]
}

function whatsNew(): MenuItemConstructorOptions {
  const item = helpItems().find((entry) => entry.label === 'menu:help.whatsNew')
  if (!item) {
    throw new Error("The What's New item is missing")
  }
  return item
}

async function clickWhatsNew(): Promise<void> {
  whatsNew().click?.(undefined as never, undefined, undefined as never)
  // The handler starts a promise chain and returns nothing; let it settle
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createChangelogWindow.mockResolvedValue(undefined)
})

describe("Help > What's New", () => {
  it('sits directly after Documentation', () => {
    const labels = helpItems().map((item) => item.label)

    expect(labels.indexOf('menu:help.whatsNew')).toBe(labels.indexOf('menu:help.documentation') + 1)
  })

  it('has no accelerator', () => {
    expect(whatsNew().accelerator).toBeUndefined()
  })

  it('opens the changelog window', async () => {
    await clickWhatsNew()

    expect(mocks.createChangelogWindow).toHaveBeenCalledExactlyOnceWith()
  })

  it('logs instead of throwing when the window cannot be opened', async () => {
    const failure = new Error('no display')
    mocks.createChangelogWindow.mockRejectedValue(failure)

    await clickWhatsNew()

    expect(mocks.logError).toHaveBeenCalledWith("[Menu] Failed to open What's New:", failure)
  })
})
