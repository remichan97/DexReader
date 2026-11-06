import { changelogService } from '../../services/changelog/changelog.service'
import { wrapIpcHandler } from '../wrap-handler'

export function registerChangelogHandler(): void {
  wrapIpcHandler('changelog:get', async () => {
    return changelogService.processChangelogText()
  })
}
