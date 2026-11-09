import { ChangelogRelease } from '@shared/contracts/changelog/changelog-release.contract'
import { ChangelogSection } from '@shared/contracts/changelog/changelog-section.contract'
import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'
import { getChangelogSource } from '../../changelog/changelog-source'

class ChangelogService {
  private readonly changeLogText: string
  // Regular expression to match the release header in the changelog text, capturing the version and optional date, including yanked
  private readonly RELEASE_HEADER_REGEX =
    /^## \[(?<version>.+?)\](?: - (?<date>\d{4}-\d{2}-\d{2}))?(?: \[YANKED\])?$/m
  // Regular expression to match the changelog section header, capturing the category, e.g., "Added", "Changed"
  private readonly SECTION_HEADER_REGEX = /^### (?<category>.+)$/m
  // Regular expression to match individual changelog items under a section
  private readonly ITEM_REGEX = /^- (.+)$/m
  // Regular expression to match possible footer, e.g: [vx.y.x]: url
  private readonly FOOTER_REGEX = /^\[(?<version>.+?)\]: (?<url>.+)$/m

  // Release separators and any HTML comments
  private readonly NOISE_REGEX = /^(?:-{3,}|<!--.*-->)\s*$/

  // A mapping from section header strings to ChangelogCategory enum values, to prevent double checking against the enum each time
  private readonly changelogCategoryMap: Map<string, ChangelogCategory> = new Map()

  constructor() {
    this.changeLogText = getChangelogSource()
    // Populate the changelogCategory map dynamically from the ChangelogCategory enum
    for (const category of Object.values(ChangelogCategory)) {
      this.changelogCategoryMap.set(category, category)
    }
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
        currentSection = undefined
        continue
      }

      // Skip lines that are not part of a release, empty lines, noise lines like comments, or footer lines
      if (
        !currentRelease ||
        !line.trim() ||
        this.FOOTER_REGEX.test(line) ||
        this.NOISE_REGEX.test(line)
      ) {
        continue
      }

      // Check if the line is a section header
      const sec = this.SECTION_HEADER_REGEX.exec(line)

      if (sec) {
        currentSection = {
          // Set the category of the section based on the matched header, converted to ChangelogCategory
          category:
            this.changelogCategoryMap.get(sec.groups?.category ?? '') ?? ChangelogCategory.Unknown,
          // If the category is Unknown, use the section title if available
          title: this.changelogCategoryMap.has(sec.groups?.category ?? '')
            ? undefined
            : sec.groups?.category,
          items: []
        }
        currentRelease.sections.push(currentSection)
        continue
      }

      // Create an implicit Changed section if a bullet point appears without a preceding section header
      if (!currentSection) {
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
