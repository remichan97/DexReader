import { ChangelogCategory } from '@shared/enums/changelog/changelog-category.enum'

export interface ChangelogSection {
  category: ChangelogCategory // The category of the changelog section, e.g., "Added", "Changed"
  items: string[] // The list of items under this changelog section, in raw markdown format
}
