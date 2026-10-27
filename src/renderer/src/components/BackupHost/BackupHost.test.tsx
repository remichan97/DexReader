import { render, screen } from '@testing-library/react'
import { BackupHost } from './BackupHost'

vi.mock('@renderer/services/logging.service', () => ({
  rendererLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

const secureNavigate = vi.fn()
vi.mock('@renderer/hooks/useSecureNavigation', () => ({
  useSecureNavigation: () => ({ secureNavigate })
}))

const mihonState = {
  isImporting: false,
  importResult: null as unknown,
  clearImportResult: vi.fn(),
  handleCancelImport: vi.fn()
}
vi.mock('@renderer/hooks/useMihonImportExport', () => ({
  useMihonImportExport: () => mihonState
}))

const dexReaderState = {
  exportDialogOpen: false,
  exportFilePath: null as string | null,
  isExporting: false,
  exportError: null as string | null,
  importDialogOpen: false,
  importFilePath: null as string | null,
  handleExport: vi.fn(),
  handleCloseExportDialog: vi.fn(),
  handleImportComplete: vi.fn(),
  handleCloseImportDialog: vi.fn()
}
vi.mock('@renderer/hooks/useDexReaderImportExport', () => ({
  useDexReaderImportExport: () => dexReaderState
}))

// The dialogs themselves are covered by their own components; here only what the host feeds them
vi.mock('@renderer/components/ImportProgressDialog', () => ({
  ImportProgressDialog: (props: { open: boolean }) =>
    props.open ? <div data-testid="import-progress" /> : null
}))
vi.mock('@renderer/components/ImportResultDialog', () => ({
  ImportResultDialog: (props: { onViewLibrary: () => void }) => (
    <button data-testid="import-result" onClick={props.onViewLibrary} />
  )
}))
vi.mock('@renderer/components/DexReaderExportDialog', () => ({
  DexReaderExportDialog: (props: { isOpen: boolean; savePath: string | null }) =>
    props.isOpen ? <div data-testid="export-dialog">{props.savePath}</div> : null
}))
vi.mock('@renderer/components/DexReaderImportDialog', () => ({
  DexReaderImportDialog: (props: { isOpen: boolean; filePath: string | null }) =>
    props.isOpen ? <div data-testid="import-dialog">{props.filePath}</div> : null
}))

beforeEach(() => {
  vi.clearAllMocks()
  mihonState.isImporting = false
  mihonState.importResult = null
  Object.assign(dexReaderState, {
    exportDialogOpen: false,
    exportFilePath: null,
    importDialogOpen: false,
    importFilePath: null
  })
})

describe('BackupHost', () => {
  it('renders no dialog until a backup operation starts', () => {
    render(<BackupHost />)

    expect(screen.queryByTestId('import-progress')).toBeNull()
    expect(screen.queryByTestId('import-result')).toBeNull()
    expect(screen.queryByTestId('export-dialog')).toBeNull()
    expect(screen.queryByTestId('import-dialog')).toBeNull()
  })

  it('shows the import progress while a Mihon import runs', () => {
    mihonState.isImporting = true

    render(<BackupHost />)

    expect(screen.getByTestId('import-progress')).toBeTruthy()
  })

  it('shows the DexReader export dialog for the chosen path', () => {
    dexReaderState.exportDialogOpen = true
    dexReaderState.exportFilePath = 'C:/out/library.dexreader'

    render(<BackupHost />)

    expect(screen.getByTestId('export-dialog').textContent).toBe('C:/out/library.dexreader')
  })

  it('shows the DexReader import dialog for the chosen path', () => {
    dexReaderState.importDialogOpen = true
    dexReaderState.importFilePath = 'C:/in/library.dexreader'

    render(<BackupHost />)

    expect(screen.getByTestId('import-dialog').textContent).toBe('C:/in/library.dexreader')
  })

  it('takes the user to the library from the result dialog, wherever they were', () => {
    mihonState.importResult = { importedMangaCount: 1 }

    render(<BackupHost />)
    screen.getByTestId('import-result').click()

    expect(mihonState.clearImportResult).toHaveBeenCalled()
    expect(secureNavigate).toHaveBeenCalledWith('/library')
  })
})
