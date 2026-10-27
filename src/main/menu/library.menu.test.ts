import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'

const showOpenDialog = vi.fn()
const showSaveDialog = vi.fn()
const showMessageBox = vi.fn()

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: (...args: unknown[]) => showOpenDialog(...args),
    showSaveDialog: (...args: unknown[]) => showSaveDialog(...args),
    showMessageBox: (...args: unknown[]) => showMessageBox(...args)
  }
}))

// Echo the key (and the interpolation) so the tests can see which string was asked for
vi.mock('../i18n/i18n.config', () => ({
  default: { t: (key: string) => key }
}))

import { buildLibraryMenu } from './library.menu'

const send = vi.fn()
const mainWindow = { webContents: { send } } as unknown as BrowserWindow

type Submenu = MenuItemConstructorOptions[]

function submenuOf(label: string): Submenu {
  const library = buildLibraryMenu(mainWindow)
  const group = (library.submenu as Submenu).find((item) => item.label === label)
  return group?.submenu as Submenu
}

async function click(label: string, parent: string): Promise<void> {
  const item = submenuOf(parent).find((entry) => entry.label === label)
  // The click handlers start a promise chain and return nothing; let it settle
  item?.click?.(undefined as never, undefined, undefined as never)
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildLibraryMenu', () => {
  it('is the Library menu with just the import and export submenus', () => {
    const library = buildLibraryMenu(mainWindow)

    expect(library.label).toBe('menu:library.label')
    expect((library.submenu as Submenu).map((item) => item.label)).toEqual([
      'menu:library.importLibrary',
      'menu:library.exportLibrary'
    ])
  })

  it('binds Ctrl+Shift+E to the DexReader backup export', () => {
    const item = submenuOf('menu:library.exportLibrary').find(
      (entry) => entry.label === 'menu:library.toDexReaderBackup'
    )

    expect(item?.accelerator).toBe('CmdOrCtrl+Shift+E')
  })
})

describe('import', () => {
  it('sends the chosen DexReader backup to the renderer', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['C:/in/library.dexreader'] })

    await click('menu:library.fromDexReaderBackup', 'menu:library.importLibrary')

    expect(send).toHaveBeenCalledWith('import-library', 'C:/in/library.dexreader')
  })

  it('sends the chosen Mihon/Tachiyomi backup to the renderer', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['C:/in/library.tachibk'] })

    await click('menu:library.fromMihonTachiyomiBackup', 'menu:library.importLibrary')

    expect(send).toHaveBeenCalledWith('import-tachiyomi', 'C:/in/library.tachibk')
  })

  it('sends nothing when the file dialog is cancelled', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    await click('menu:library.fromDexReaderBackup', 'menu:library.importLibrary')
    await click('menu:library.fromMihonTachiyomiBackup', 'menu:library.importLibrary')

    expect(send).not.toHaveBeenCalled()
  })

  it('offers the extensions the importer accepts', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    await click('menu:library.fromMihonTachiyomiBackup', 'menu:library.importLibrary')

    expect(showOpenDialog).toHaveBeenCalledWith(
      mainWindow,
      expect.objectContaining({
        filters: [expect.objectContaining({ extensions: ['proto.gz', 'tachibk'] })]
      })
    )
  })
})

describe('export', () => {
  it('sends the chosen DexReader save path to the renderer', async () => {
    showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/out/library.dexreader' })

    await click('menu:library.toDexReaderBackup', 'menu:library.exportLibrary')

    expect(send).toHaveBeenCalledWith('export-library', 'C:/out/library.dexreader')
  })

  it('sends nothing when the DexReader save dialog is cancelled', async () => {
    showSaveDialog.mockResolvedValue({ canceled: true })

    await click('menu:library.toDexReaderBackup', 'menu:library.exportLibrary')

    expect(send).not.toHaveBeenCalled()
  })

  describe('to the Mihon/Tachiyomi format', () => {
    it('warns about what is exported, and that the export is being retired', async () => {
      showMessageBox.mockResolvedValue({ response: 0 })

      await click('menu:library.toMihonTachiyomiFormat', 'menu:library.exportLibrary')

      const options = showMessageBox.mock.calls[0][1] as { detail: string; type: string }
      expect(options.type).toBe('warning')
      expect(options.detail).toBe(
        [
          'menu:library.dialogs.exportMihonTachiyomiWarning.detail',
          'menu:library.dialogs.exportMihonTachiyomiWarning.deprecation'
        ].join('\n\n')
      )
    })

    it('stops when the user cancels the warning', async () => {
      showMessageBox.mockResolvedValue({ response: 0 })

      await click('menu:library.toMihonTachiyomiFormat', 'menu:library.exportLibrary')

      expect(showSaveDialog).not.toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
    })

    it('asks where to save and sends the path once the user proceeds', async () => {
      showMessageBox.mockResolvedValue({ response: 1 })
      showSaveDialog.mockResolvedValue({ canceled: false, filePath: 'C:/out/library.tachibk' })

      await click('menu:library.toMihonTachiyomiFormat', 'menu:library.exportLibrary')

      expect(send).toHaveBeenCalledWith('export-tachiyomi', 'C:/out/library.tachibk')
    })

    it('sends nothing when the save dialog is cancelled after proceeding', async () => {
      showMessageBox.mockResolvedValue({ response: 1 })
      showSaveDialog.mockResolvedValue({ canceled: true })

      await click('menu:library.toMihonTachiyomiFormat', 'menu:library.exportLibrary')

      expect(send).not.toHaveBeenCalled()
    })
  })
})
