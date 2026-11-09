import { ChangelogSection } from './changelog-section.contract'

export interface ChangelogRelease {
  version: string // The version of the release, e.g., "1.0.0"
  date?: string // The release date, e.g., "2024-06-15"
  isYanked?: boolean // Indicates if the release has been marked as yanked
  foldedInto?: string // For a yanked release, the version of the newer published release that carries its changes
  includes?: string[] // For a published release, the yanked versions folded into it, oldest first
  sections: ChangelogSection[] // The list of changelog sections for this release
}
