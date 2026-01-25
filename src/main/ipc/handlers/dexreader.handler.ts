import { dexreaderExportService } from '../../services/dexreader/dexreader-export.service'
import { DexreaderExportOption } from '../../services/options/dexreader-export.option'
import { wrapIpcHandler } from '../wrapHandler'

export function registerDexReaderHandler(): void {
  wrapIpcHandler('dexreader:export-data', async (_, savePath: unknown, options: unknown) => {
    if (typeof savePath !== 'string') {
      throw new TypeError('Invalid save path')
    }

    if (savePath.endsWith('.dexreader') === false) {
      throw new TypeError('Save path must have a .dexreader extension')
    }

    if (typeof options !== 'object' || options === null) {
      throw new TypeError('Invalid export options')
    }

    const exportOptions = options as DexreaderExportOption

    return await dexreaderExportService.exportLibrary(savePath, exportOptions)
  })
}
