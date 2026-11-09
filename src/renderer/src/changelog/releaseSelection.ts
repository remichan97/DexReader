import type { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'

export interface VersionListPart {
  kind: 'version' | 'text'
  value: string
}

/**
 * The DOM id of a release's tab, which its detail panel points back to with `aria-labelledby`.
 *
 * @param version A release version, without a leading "v"
 * @returns The id
 */
export function releaseTabId(version: string): string {
  return `release-tab-${version}`
}

/**
 * Pick the release to show when the window opens: the installed one if the changelog has it,
 * otherwise the newest published release, otherwise whatever comes first.
 *
 * @param releases Every release, newest first
 * @param installedVersion The version of the running app
 * @returns The version to select, or undefined when there are no releases
 */
export function pickInitialVersion(
  releases: ChangelogRelease[],
  installedVersion: string
): string | undefined {
  if (releases.some((release) => release.version === installedVersion)) {
    return installedVersion
  }
  return (releases.find((release) => !release.isYanked) ?? releases[0])?.version
}

/**
 * Format a changelog date for the display language. The date has no time zone, so it is read
 * and formatted as UTC; otherwise a viewer west of Greenwich would see the day before.
 *
 * @param date An ISO date such as `2026-04-22`
 * @param language A BCP 47 language tag
 * @returns The localised date, or the original text when it is not a valid date
 */
export function formatReleaseDate(date: string, language: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) {
    return date
  }
  return new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeZone: 'UTC' }).format(parsed)
}

/**
 * Join versions into a localised list ("v1.10.0 and v1.11.0"), keeping each version separate
 * from the connecting words so the caller can make the versions links.
 *
 * @param versions Version numbers, without a leading "v"
 * @param language A BCP 47 language tag
 * @returns The list as ordered parts, with versions given without their "v"
 */
export function formatVersionList(versions: string[], language: string): VersionListPart[] {
  const labels = versions.map((version) => `v${version}`)
  return new Intl.ListFormat(language, { style: 'long', type: 'conjunction' })
    .formatToParts(labels)
    .map((part): VersionListPart => {
      if (part.type === 'element') {
        return { kind: 'version', value: part.value.slice(1) }
      }
      return { kind: 'text', value: part.value }
    })
}
