import { shell } from 'electron'

// Thin wrapper over `shell.openExternal` from Electron that only allows certain URLs schemes (e.g., http, https, mailto)
export async function openExternal(url: string): Promise<void> {
  // Security: Only allow http, https, and mailto protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:']
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }

  if (!allowedProtocols.includes(urlObj.protocol)) {
    throw new Error(`Protocol ${urlObj.protocol} is not allowed`)
  }

  await shell.openExternal(url)
}
