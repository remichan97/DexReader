/**
 * THROWAWAY (perf/baseline-probes branch, never merged).
 *
 * Side-effect module: must be the FIRST import of src/main/index.ts, because the settings
 * singleton (electron-store) resolves app.getPath('userData') when it is constructed, which
 * happens while the other imports are evaluated.
 *
 * With DEXREADER_DATA_DIR set, all app data is redirected under that folder:
 *   <dir>/userData   -> settings.json, logs, Electron's own files
 *   <dir>/appdata    -> dexreader.db, snapshots, cover cache, downloads (see path-validator.ts)
 */
import { app } from 'electron'
import path from 'node:path'

const dataDir = process.env.DEXREADER_DATA_DIR

if (dataDir) {
  app.setPath('userData', path.join(dataDir, 'userData'))
}
