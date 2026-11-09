import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'
import Pako from 'pako'
import protobuf from 'protobufjs'
import { IpcError } from '../../ipc/error/ipc.error'
import { Backup } from '../types/mihon/backup.type'
import { BackupCategory } from '../types/mihon/backup-category.type'
import { BackupChapter } from '../types/mihon/backup-chapter.type'
import { BackupHistory } from '../types/mihon/backup-history.type'
import { BackupManga } from '../types/mihon/backup-manga.type'
import { BackupSource } from '../types/mihon/backup-source.type'

// ESM: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_SCHEMA_PATH = path.join(__dirname, 'services', 'protobuf', 'schemas', 'mihon.proto')

const GZIP_MAGIC = [0x1f, 0x8b]
// A JSON document starts with `{`, optionally after whitespace (TachiyomiAZ's legacy .json backups)
const JSON_START = 0x7b

/**
 * Why a backup file could not be read. These codes travel to the renderer in the IPC error and
 * are mapped to translated messages there (`dialogs:mihonImport.errors.*`).
 */
export type MihonBackupErrorCode =
  | 'MIHON_BACKUP_JSON'
  | 'MIHON_BACKUP_EMPTY'
  | 'MIHON_BACKUP_FILE_MISSING'
  | 'MIHON_BACKUP_UNRECOGNISED'

/**
 * An IpcError, so the code survives serialisation to the renderer (which turns it into a
 * translated message); `details` carries the underlying cause for the log.
 */
export class MihonBackupFormatError extends IpcError {
  public constructor(code: MihonBackupErrorCode, message: string, cause?: unknown) {
    super(code, message, cause === undefined ? undefined : { cause: String(cause) })
    this.name = 'MihonBackupFormatError'
  }
}

/**
 * Work out the container of a backup file and return the raw protobuf bytes inside it.
 *
 * Mihon writes gzip-compressed protobuf, but its own reader also accepts the uncompressed
 * protobuf, so both are accepted here. JSON backups (TachiyomiAZ's legacy format) are
 * recognised only to give a precise error.
 */
export function unwrapBackupBytes(buffer: Uint8Array): Uint8Array {
  if (buffer.length === 0) {
    throw new MihonBackupFormatError('MIHON_BACKUP_EMPTY', 'The backup file is empty')
  }

  if (buffer.length >= 2 && buffer[0] === GZIP_MAGIC[0] && buffer[1] === GZIP_MAGIC[1]) {
    try {
      return Pako.ungzip(buffer)
    } catch (error) {
      throw new MihonBackupFormatError(
        'MIHON_BACKUP_UNRECOGNISED',
        'The backup file is corrupted and could not be decompressed',
        error
      )
    }
  }

  if (buffer[0] === JSON_START) {
    throw new MihonBackupFormatError(
      'MIHON_BACKUP_JSON',
      'JSON backups are not supported, only .tachibk and .proto.gz'
    )
  }

  return buffer
}

/**
 * Decode a Mihon/Tachiyomi backup into the parts DexReader uses.
 *
 * @param buffer - the file contents, gzip-compressed or not
 * @param schemaPath - the .proto to decode with; only tests pass something other than the default
 */
export async function decodeBackup(
  buffer: Uint8Array,
  schemaPath: string = DEFAULT_SCHEMA_PATH
): Promise<Backup> {
  const bytes = unwrapBackupBytes(buffer)

  let decoded: DecodedBackup
  try {
    const root = await protobuf.load(schemaPath)
    decoded = root.lookupType('Backup').decode(bytes).toJSON() as DecodedBackup
  } catch (error) {
    throw new MihonBackupFormatError(
      'MIHON_BACKUP_UNRECOGNISED',
      "The file isn't a valid Tachiyomi/Mihon backup",
      error
    )
  }

  return normaliseBackup(decoded)
}

/**
 * A 64-bit protobuf field as protobufjs's toJSON() hands it back: a string, so values beyond
 * 2^53 aren't rounded (a plain number is accepted too, in case a value comes through unwrapped).
 */
type Int64 = string | number

/*
 * The shapes below are what toJSON() really returns, which is not the Backup model: every int64
 * is an Int64 rather than a number, and empty lists are missing altogether. normaliseBackup()
 * is the one place that turns them into the model.
 */
interface DecodedChapter extends Omit<
  BackupChapter,
  'lastPageRead' | 'dateFetch' | 'dateUpload' | 'sourceOrder'
> {
  lastPageRead?: Int64
  dateFetch?: Int64
  dateUpload?: Int64
  sourceOrder?: Int64
}

interface DecodedHistory extends Omit<BackupHistory, 'lastRead' | 'readDuration'> {
  lastRead?: Int64
  readDuration?: Int64
}

interface DecodedCategory extends Omit<BackupCategory, 'order' | 'flags' | 'id'> {
  order?: Int64
  flags?: Int64
  id?: Int64
}

interface DecodedManga extends Omit<
  BackupManga,
  'chapters' | 'history' | 'categories' | 'dateAdded'
> {
  chapters?: DecodedChapter[]
  history?: DecodedHistory[]
  categories?: Int64[]
  dateAdded?: Int64
}

interface DecodedBackup {
  backupManga?: DecodedManga[]
  backupCategories?: DecodedCategory[]
  backupSources?: BackupSource[]
}

/**
 * An int64 as a number. Everything converted this way (timestamps in milliseconds, page numbers,
 * category ids) is far below 2^53, unlike the source ids, which stay strings.
 */
function toNumber(value?: Int64): number | undefined {
  if (value === undefined) return undefined

  const converted = Number(value)
  return Number.isFinite(converted) ? converted : undefined
}

function normaliseChapter(chapter: DecodedChapter): BackupChapter {
  return {
    ...chapter,
    lastPageRead: toNumber(chapter.lastPageRead),
    dateFetch: toNumber(chapter.dateFetch),
    dateUpload: toNumber(chapter.dateUpload),
    sourceOrder: toNumber(chapter.sourceOrder)
  }
}

function normaliseHistory(history: DecodedHistory): BackupHistory {
  return {
    ...history,
    lastRead: toNumber(history.lastRead) ?? 0,
    readDuration: toNumber(history.readDuration)
  }
}

function normaliseCategory(category: DecodedCategory): BackupCategory {
  return {
    ...category,
    order: toNumber(category.order),
    flags: toNumber(category.flags),
    id: toNumber(category.id)
  }
}

function normaliseManga(manga: DecodedManga): BackupManga {
  return {
    ...manga,
    dateAdded: toNumber(manga.dateAdded),
    chapters: (manga.chapters ?? []).map(normaliseChapter),
    history: (manga.history ?? []).map(normaliseHistory),
    categories: (manga.categories ?? [])
      .map(toNumber)
      .filter((id): id is number => id !== undefined)
  }
}

/**
 * Turn what protobufjs's toJSON() returns into the Backup model: int64 fields become numbers
 * (except the source ids, which can exceed 2^53 and stay strings), and the empty lists that
 * toJSON() leaves out (a backup without categories, a manga without chapters) are filled in.
 */
function normaliseBackup(decoded: DecodedBackup): Backup {
  return {
    backupManga: (decoded.backupManga ?? []).map(normaliseManga),
    backupCategories: (decoded.backupCategories ?? []).map(normaliseCategory),
    backupSources: decoded.backupSources ?? []
  }
}
