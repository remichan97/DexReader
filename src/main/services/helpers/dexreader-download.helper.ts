import fs from 'node:fs/promises'
import path from 'node:path'
import { secureFs } from '../../filesystem/secure-fs'

export interface DownloadResult {
  size: number
  format: string
}

export async function downloadData(
  url: string,
  downloadPath: string,
  pageNumber: number
): Promise<DownloadResult> {
  // Open a write stream to the downloadPath
  // But first, ensure the directory exists
  await fs.mkdir(downloadPath, { recursive: true })

  // Now download the data
  const data = await fetch(url)

  if (!data.ok) {
    throw new Error(`Failed to download data from ${url}: ${data.statusText}`)
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  // Use zero-padded page numbers, preserve the same file format as the source URL
  const fileExtension = path.extname(url)
  const fileName = `${String(pageNumber).padStart(3, '0')}${fileExtension}`
  const pagePath = path.join(downloadPath, fileName)

  // Write buffer directly through secureFs (detects Buffer and writes without encoding)
  await secureFs.writeFile(pagePath, buffer)

  return {
    size: buffer.byteLength,
    format: fileExtension
  }
}
