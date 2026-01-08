import { BackupCategory } from './backup-category.type'
import { BackupManga } from './backup-manga.type'
import { BackupPreference } from './backup-preferences.type'
import { BackupSource } from './backup-source.type'

export interface Backup {
  backupManga: BackupManga[]
  backupCategories: BackupCategory[]
  backupSources: BackupSource[]
  backupPreferences?: BackupPreference[]
}
