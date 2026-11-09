import { ChangelogRelease } from './changelog-release.contract'

export interface ChangelogPayload {
  installedVersion: string // The version of the running app, so the window can mark it as installed
  releases: ChangelogRelease[] // Every release in file order, newest first
}
