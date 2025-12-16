import path from 'node:path'
import { MangaProgress } from './entity/manga-progress.entity'
import { ProgressDatabase } from './entity/progress-database.entity'
import { getAppDataPath } from '../filesystem/pathValidator'
import { secureFs } from '../filesystem/secureFs'
import { ReadingStats } from './entity/reading-stats.entity'

export class ProgressManager {
  private readonly PROGRESS_FILE = path.join(getAppDataPath(), 'progress.json')
  private readonly BACKUP_FILE = path.join(getAppDataPath(), 'progress.backup.json')

  async loadProgress(): Promise<ProgressDatabase> {
    // Grab progress data from the progress.json saved on AppData folder
    // If not found, create a file with some default data and return an empty ProgressDatabase object
    const exists = await secureFs.isExists(this.PROGRESS_FILE)

    if (exists) {
      const data = (await secureFs.readFile(this.PROGRESS_FILE, 'utf-8')) as string
      return JSON.parse(data) as ProgressDatabase
    } else {
      const emptyDatabase: ProgressDatabase = {
        version: 1,
        lastUpdated: this.dateToUnixTimestamp(new Date()),
        manga: {}
      }
      await secureFs.writeFile(this.PROGRESS_FILE, JSON.stringify(emptyDatabase, null, 2), 'utf-8')
      return emptyDatabase
    }
  }

  async saveProgress(progressData: MangaProgress[]): Promise<void> {
    try {
      // Save the progress data to progress.json on AppData folder
      const progressDatabase = await this.readDatabaseFile()

      // Append the new progress data, updating existing entries if necessary
      for (const progress of progressData) {
        progressDatabase.manga[progress.mangaId] = progress
      }

      progressDatabase.lastUpdated = this.dateToUnixTimestamp(new Date())

      await secureFs.writeFile(
        this.PROGRESS_FILE,
        JSON.stringify(progressDatabase, null, 2),
        'utf-8'
      )
    } catch (error) {
      console.error('Error saving progress data:', error)
      // Attempt to restore from backup in case of failure
      await this.restoreFromBackup()
      throw error
    }
  }

  async getProgress(mangaId: string): Promise<MangaProgress | undefined> {
    // Return the progress data for a specific mangaId or undefined if not found
    const progressDatabase = await this.readDatabaseFile()

    return progressDatabase.manga[mangaId]
  }

  async deleteProgress(mangaId: string): Promise<void> {
    // Delete the progress data for a specific mangaId
    try {
      const progressDatabase = await this.readDatabaseFile()
      // Backup the current progress file before making changes
      await this.backupProgressFile()

      if (progressDatabase.manga[mangaId]) {
        delete progressDatabase.manga[mangaId]
        progressDatabase.lastUpdated = this.dateToUnixTimestamp(new Date())
        await secureFs.writeFile(
          this.PROGRESS_FILE,
          JSON.stringify(progressDatabase, null, 2),
          'utf-8'
        )
      }
    } catch (error) {
      console.error('Error deleting progress data:', error)
      // Attempt to restore from backup in case of failure
      await this.restoreFromBackup()
      throw error
    }
  }

  async getStatistics(): Promise<ReadingStats> {
    // Calculate and return overall reading statistics such as total pages read, total estimated minutes read, etc.

    const progressDatabase = await this.readDatabaseFile()

    // If empty database, return zeros
    if (!progressDatabase.manga) {
      return {
        totalMangaRead: 0,
        totalChaptersRead: 0,
        totalPagesRead: 0,
        totalEstimatedMinutesRead: 0
      }
    }

    let totalMangaRead = 0
    let totalChaptersRead = 0
    let totalPagesRead = 0
    let totalEstimatedMinutesRead = 0

    // Calculate statistics
    // Iterate through each manga and its chapters to accumulate stats
    for (const mangaId in progressDatabase.manga) {
      const mangaProgress = progressDatabase.manga[mangaId]
      totalMangaRead += 1
      totalChaptersRead += Object.keys(mangaProgress.chaptersRead).length
      totalPagesRead += mangaProgress.totalPagesRead
      totalEstimatedMinutesRead += mangaProgress.estimatedMinutesRead
    }

    return {
      totalMangaRead,
      totalChaptersRead,
      totalPagesRead,
      totalEstimatedMinutesRead
    }
  }

  private async backupProgressFile(): Promise<void> {
    // Create a backup of the current progress.json file, save it as progress.backup.json
    await secureFs.copyFile(this.PROGRESS_FILE, this.BACKUP_FILE)
  }

  private async restoreFromBackup(): Promise<void> {
    // Restore the progress.json file from the backup file progress.backup.json
    // In case we don't even have a backup file, attempt to create an empty progress file
    const backupExists = await secureFs.isExists(this.BACKUP_FILE)

    if (backupExists) {
      await secureFs.copyFile(this.BACKUP_FILE, this.PROGRESS_FILE)
    } else {
      const emptyDatabase: ProgressDatabase = {
        version: 1,
        lastUpdated: this.dateToUnixTimestamp(new Date()),
        manga: {}
      }
      await secureFs.writeFile(this.PROGRESS_FILE, JSON.stringify(emptyDatabase, null, 2), 'utf-8')
    }
  }

  private async readDatabaseFile(): Promise<ProgressDatabase> {
    // Reusable method to read and parse the progress.json file
    const data = (await secureFs.readFile(this.PROGRESS_FILE, 'utf-8')) as string
    return JSON.parse(data) as ProgressDatabase
  }

  private dateToUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000)
  }
}
