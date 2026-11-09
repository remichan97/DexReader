import type { ChangelogPayload } from '@shared/contracts/changelog/changelog-payload.contract'
import { createChangelogWindow } from '../../changelog-window'
import { appUpdateService } from '../../services/app-update.service'
import { changelogService } from '../../services/changelog/changelog.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerChangelogHandler(): void {
  /**
   * Get the parsed changelog together with the running app's version.
   *
   * @returns The releases, newest first, and the installed version
   */
  wrapIpcHandler('changelog:get', async (): Promise<ChangelogPayload> => {
    return {
      installedVersion: appUpdateService.getAppVersion(),
      releases: changelogService.processChangelogText()
    }
  })

  /**
   * Open the changelog window, or focus it if it is already open.
   *
   * @returns Promise<void> once the window has been created and its page requested
   */
  wrapIpcHandler('changelog:open', async () => {
    await createChangelogWindow()
  })
}
