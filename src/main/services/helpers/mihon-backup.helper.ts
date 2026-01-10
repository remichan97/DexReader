import { collectionRepo } from '../../database/repository/collection.repo'
import { BackupCategory } from '../types/mihon/backup-category.type'

export function mapCategoriesToCollections(categories: BackupCategory[]): Map<number, number> {
  const categoryMap = new Map<number, number>()
  const existing = collectionRepo.getAllCollections()
  let fallbackKey = -1
  for (const category of categories) {
    const match = existing.find((col) => col.name === category.name)

    if (match) {
      categoryMap.set(category.id ?? fallbackKey--, match.id)
    } else {
      const created = collectionRepo.createCollection({
        name: category.name,
        description: 'Import from Tachiyomi/Mihon backup'
      })
      categoryMap.set(category.id ?? fallbackKey--, created)
    }
  }

  return categoryMap
}
