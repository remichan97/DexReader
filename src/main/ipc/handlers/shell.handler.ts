import { wrapIpcHandler } from '../wrap-handler'
import { openExternal } from 'src/main/utils/shell.util'

export function registerShellHandlers(): void {
  /**
   * Open a URL in the default external application.
   *
   * Opens the given URL in the user's default browser or associated application.
   * Commonly used for opening web links, documentation, or external resources.
   * Does not open URLs in the app itself - always uses external applications.
   *
   * @param url - The URL to open (http://, https://, mailto:, etc.)
   * @returns Promise<void>
   *
   * @example
   * // Open a web page in default browser
   * await window.api.openExternal('https://github.com/remichan97/dexreader')
   *
   * @example
   * // Open email client
   * await window.api.openExternal('mailto:support@example.com')
   */
  wrapIpcHandler('shell:open-external', async (_event, url: unknown) => {
    if (typeof url !== 'string') {
      throw new TypeError('URL must be a string')
    }
    return await openExternal(url)
  })
}
