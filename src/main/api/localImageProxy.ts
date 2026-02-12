import { protocol } from 'electron'
import { chapterDownloadsRepo } from '../database/repository/chapter-downloads.repo'
import path from 'node:path'
import { secureFs } from '../filesystem/secureFs'

export class LocalImageProxy {
  private readonly localUrlPattern: RegExp = /local-manga:\/\/chapter\/([^/]+)\/page\/(\d+)/

  registerProtocol(): void {
    protocol.handle('local-manga', async (request) => {
      try {
        const { chapterId, pageNum } = this.parseLocalPath(request.url)

        // Query database for the local image path based on chapterID
        const download = chapterDownloadsRepo.getDownload(chapterId)

        if (!download) {
          return new Response('No Download found for chapter ' + chapterId, { status: 404 })
        }

        // Build the full file path using the stored base path (not current settings)
        // This ensures files are found even if user changes download directory
        const pagePath = path.join(
          download.downloadsBasePath,
          download.filePath,
          'pages',
          `${String(pageNum).padStart(3, '0')}.jpg`
        )

        const buffer = (await secureFs.readFile(pagePath, 'binary')) as Buffer

        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': this.getContentType(pagePath),
            'Cache-Control': 'no-store'
          }
        })
      } catch (error) {
        console.error('[LocalImageProxy] Failed to handle request:', request.url, error)
        return new Response('Failed to load local image', { status: 500 })
      }
    })
  }

  private getContentType(filePath: string): string {
    if (filePath.endsWith('.png')) return 'image/png'
    if (filePath.endsWith('.webp')) return 'image/webp'
    return 'image/jpeg'
  }

  private parseLocalPath(url: string): { chapterId: string; pageNum: number } {
    // Parse: local-manga://chapter/{chapterId}/page/{pageNum}
    const match = new RegExp(this.localUrlPattern).exec(url)
    if (!match) {
      throw new Error('Invalid local image URL format')
    }
    return {
      chapterId: match[1],
      pageNum: Number.parseInt(match[2], 10)
    }
  }
}
