import fs from 'node:fs/promises'
import path from 'node:path'
import { secureFs } from '../../filesystem/secureFs'

export async function downloadData(
  url: string,
  downloadPath: string,
  pageNumber: number
): Promise<number> {
  // Open a write stream to the downloadPath
  // But first, ensure the directory exists
  await fs.mkdir(downloadPath, { recursive: true })

  // Now download the data
  const data = await fetch(url)

  if (!data.ok) {
    throw new Error(`Failed to download data from ${url}: ${data.statusText}`)
  }

  const buffer = Buffer.from(await data.arrayBuffer())

  // Use zero-padded page numbers: 001.jpg, 002.jpg, etc.
  const fileName = `${String(pageNumber).padStart(3, '0')}.jpg`
  const pagePath = path.join(downloadPath, fileName)
  await secureFs.writeFile(pagePath, buffer)

  return buffer.byteLength
}
