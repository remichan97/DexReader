import { app } from 'electron'

function getPlatformLabel(): string {
  switch (process.platform) {
    case 'win32':
      return 'Windows'
    case 'darwin':
      return 'macOS'
    case 'linux':
      return 'Linux'
    default:
      return process.platform
  }
}

// Identifies DexReader honestly to MangaDex rather than spoofing a browser -
// MangaDex explicitly discourages UA spoofing since it hides automated
// traffic. Computed at call time (not a static constant) so the version
// segment can't drift from the actual running build like it previously did.
export function buildUserAgent(): string {
  return `DexReader/${app.getVersion()} (${getPlatformLabel()}; NodeJS ${process.versions.node}; +https://github.com/remichan97/DexReader)`
}
