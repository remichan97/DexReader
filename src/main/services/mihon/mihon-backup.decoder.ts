import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'
import Pako from 'pako'
import protobuf from 'protobufjs'
import { IpcError } from '../../ipc/error/ipc.error'
import { Backup } from '../types/mihon/backup.type'
import { BackupManga } from '../types/mihon/backup-manga.type'

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

  let decoded: Partial<Backup>
  try {
    const root = await protobuf.load(schemaPath)
    decoded = root.lookupType('Backup').decode(bytes).toJSON() as Partial<Backup>
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
 * protobufjs omits empty repeated fields from toJSON(), so a backup without categories (or a
 * manga without chapters) has no such property at all. Fill them in so callers can rely on the
 * Backup type.
 */
function normaliseBackup(decoded: Partial<Backup>): Backup {
  const backupManga = (decoded.backupManga ?? []).map(
    (manga): BackupManga => ({
      ...manga,
      chapters: manga.chapters ?? [],
      history: manga.history ?? [],
      categories: manga.categories ?? []
    })
  )

  return {
    backupManga,
    backupCategories: decoded.backupCategories ?? [],
    backupSources: decoded.backupSources ?? []
  }
}
