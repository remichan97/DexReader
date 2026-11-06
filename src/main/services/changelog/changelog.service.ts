import { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { ChangelogSection } from '@shared/contracts/changelog/changelog-section.contract'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'
import { getChangelogSource } from '../../changelog/changelog-source'

class ChangelogService {
  private readonly changeLogText: string
  // Regular expression to match the release header in the changelog text, capturing the version and optional date, including yanked
  private readonly RELEASE_HEADER_REGEX =
    /^## \[(?<version>.+?)\](?: - (?<date>\d{4}-\d{2}-\d{2}))?(?: - \[YANKED\])?$/m
  // Regular expression to match the changelog section header, capturing the category, e.g., "Added", "Changed"
  private readonly SECTION_HEADER_REGEX = /^### (?<category>.+)$/m
  // Regular expression to match individual changelog items under a section
  private readonly ITEM_REGEX = /^- (.+)$/gm
  // Regular expression to match possible footer, e.g: [vx.y.x]: url
  private readonly FOOTER_REGEX = /^\[(?<version>.+?)\]: (?<url>.+)$/m

  constructor() {
    this.changeLogText = getChangelogSource()
  }

  public processChangelogText(): ChangelogRelease[] {
    const releases: ChangelogRelease[] = []
    let currentRelease: ChangelogRelease | undefined = undefined
    let currentSection: ChangelogSection | undefined = undefined

    // strip any BOM (Byte Order Mark) from the changelog text, but tolerate any Windows/Unix line endings
    for (const line of this.changeLogText.replace(/^\uFEFF/, '').split(/\r?\n/)) {
      // Process each line here
      const rel = this.RELEASE_HEADER_REGEX.exec(line)

      if (rel) {
        currentRelease = {
          version: rel.groups?.version ?? '',
          date: rel.groups?.date,
          isYanked: line.includes('[YANKED]'),
          sections: []
        }
        releases.push(currentRelease)
        continue
      }

      // Skip lines that are not part of a release, empty lines, or footer lines
      if (!currentRelease || !line.trim() || this.FOOTER_REGEX.test(line)) {
        continue
      }

      // Check if the line is a section header
      const sec = this.SECTION_HEADER_REGEX.exec(line)

      if (sec) {
        currentSection = {
          // Set the category of the section based on the matched header, converted to ChangelogCategory
          category: Object.values(ChangelogCategory).includes(
            sec.groups?.category as ChangelogCategory
          )
            ? (sec.groups?.category as ChangelogCategory)
            : ChangelogCategory.Unknown,
          items: []
        }
        currentRelease.sections.push(currentSection)
        continue
      }

      // Assume any bullets without heading belong to the current section as items in Change category
      if (!sec) {
        currentSection = {
          category: ChangelogCategory.Changed,
          items: []
        }
        currentRelease.sections.push(currentSection)
      }

      // Finally, process each bullet point as an item in the current section
      const itemMatch = this.ITEM_REGEX.exec(line)
      if (itemMatch && currentSection) {
        currentSection.items.push(itemMatch[1])
      } else if (currentSection?.items.length) {
        // Append the current line to the last item in the current section, preserving line breaks
        currentSection.items[currentSection.items.length - 1] += '\n' + line.trimEnd()
      }
    }

    return releases
  }
}

export const changelogService = new ChangelogService()
