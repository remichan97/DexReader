import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Pako from 'pako'
import protobuf from 'protobufjs'
import { decodeBackup, MihonBackupFormatError, unwrapBackupBytes } from './mihon-backup.decoder'

const SCHEMA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../protobuf/schemas/mihon.proto'
)

// Roughly what Mihon v0.21.3 writes: the fields DexReader reads plus everything it ignores
// (preferences, source preferences, extension stores, trackers, notes, memo, next update).
// Field numbers follow Mihon's backup models.
const UPSTREAM_SCHEMA = `
syntax = "proto2";

message Backup {
  repeated BackupManga backupManga = 1;
  repeated BackupCategory backupCategories = 2;
  repeated BackupSource backupSources = 101;
  repeated BackupPreference backupPreferences = 104;
  repeated BackupSourcePreferences backupSourcePreferences = 105;
  repeated BackupExtensionStore backupExtensionStores = 106;
}
message BackupCategory {
  required string name = 1;
  optional int64 order = 2;
  optional int64 id = 3;
  optional int64 flags = 100;
}
message BackupChapter {
  required string url = 1;
  required string name = 2;
  optional string scanlator = 3;
  optional bool read = 4;
  optional bool bookmark = 5;
  optional int64 lastPageRead = 6;
  optional int64 dateFetch = 7;
  optional int64 dateUpload = 8;
  optional float chapterNumber = 9;
  optional int64 sourceOrder = 10;
  optional bytes memo = 13;
}
message BackupHistory {
  required string url = 1;
  required int64 lastRead = 2;
  optional int64 readDuration = 3;
}
message BackupManga {
  required int64 source = 1;
  required string url = 2;
  optional string title = 3;
  optional string artist = 4;
  optional string author = 5;
  optional string description = 6;
  repeated string genre = 7;
  optional int32 status = 8;
  optional string thumbnailUrl = 9;
  optional int64 dateAdded = 13;
  repeated BackupChapter chapters = 16;
  repeated int64 categories = 17;
  repeated BackupTracking tracking = 18;
  optional bool favorite = 100;
  repeated BackupHistory history = 104;
  optional string notes = 110;
  optional bool initialized = 111;
  optional bytes memo = 112;
  optional int64 nextUpdate = 113;
}
message BackupPreference {
  required string key = 1;
  required PreferenceValue value = 2;
}
message PreferenceValue {
  required string type = 1;
  required bytes truevalue = 2;
}
message BackupSourcePreferences {
  required string sourceKey = 1;
  repeated BackupPreference prefs = 2;
}
message BackupSource {
  optional string name = 1;
  required int64 sourceId = 2;
}
message BackupTracking {
  required int32 syncId = 1;
  required int64 libraryId = 2;
}
message BackupExtensionStore {
  required string indexUrl = 1;
  required string name = 2;
  optional string badgeLabel = 3;
  required string contactWebsite = 4;
  required string signingKey = 5;
  optional string contactDiscord = 6;
  optional bool isLegacy = 7;
  optional string extensionListUrl = 8;
}
`

const upstream = protobuf.parse(UPSTREAM_SCHEMA).root.lookupType('Backup')

function encodeUpstream(message: Record<string, unknown>): Uint8Array {
  return upstream.encode(upstream.create(message)).finish()
}

const ENGLISH_ID = '2499283573021220255'

const FULL_BACKUP = {
  backupManga: [
    {
      source: ENGLISH_ID,
      url: '/manga/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Berserk',
      artist: 'Miura Kentaro',
      author: 'Miura Kentaro',
      description: 'Dark fantasy',
      genre: ['Action', 'Horror'],
      status: 1,
      thumbnailUrl: 'https://uploads.mangadex.org/covers/x/y.jpg',
      dateAdded: 1700000000000,
      categories: [3],
      favorite: true,
      notes: 'ignored',
      initialized: true,
      memo: Buffer.from('{}'),
      nextUpdate: 1700000001000,
      tracking: [{ syncId: 2, libraryId: 5 }],
      chapters: [
        {
          url: '/chapter/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          name: 'Chapter 1',
          scanlator: 'Group',
          read: true,
          lastPageRead: 18,
          dateFetch: 1700000002000,
          dateUpload: 1700000003000,
          chapterNumber: 1.5,
          memo: Buffer.from('{}')
        }
      ],
      history: [{ url: '/chapter/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', lastRead: 1700000004000 }]
    }
  ],
  backupCategories: [{ name: 'Reading', order: 0, id: 3 }],
  backupSources: [{ name: 'MangaDex', sourceId: ENGLISH_ID }],
  backupPreferences: [{ key: 'pref', value: { type: 'bool', truevalue: Buffer.from([1]) } }],
  backupSourcePreferences: [{ sourceKey: 's', prefs: [] }],
  backupExtensionStores: [
    {
      indexUrl: 'https://example.org/index.min.json',
      name: 'Store',
      contactWebsite: 'https://example.org',
      signingKey: 'abc'
    }
  ]
}

describe('decodeBackup', () => {
  it('reads the fields DexReader uses from a gzip-compressed backup', async () => {
    const backup = await decodeBackup(Pako.gzip(encodeUpstream(FULL_BACKUP)), SCHEMA_PATH)

    expect(backup.backupManga).toHaveLength(1)
    expect(backup.backupManga[0]).toMatchObject({
      source: ENGLISH_ID,
      url: '/manga/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: 'Berserk',
      artist: 'Miura Kentaro',
      author: 'Miura Kentaro',
      description: 'Dark fantasy',
      genre: ['Action', 'Horror'],
      status: 1,
      thumbnailUrl: 'https://uploads.mangadex.org/covers/x/y.jpg',
      // int64 values come back as strings (the same representation the category ids use)
      categories: ['3'],
      favorite: true
    })
    expect(backup.backupManga[0].chapters[0]).toMatchObject({
      url: '/chapter/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Chapter 1',
      scanlator: 'Group',
      read: true,
      lastPageRead: '18',
      chapterNumber: 1.5
    })
    expect(backup.backupManga[0].history[0]).toMatchObject({
      url: '/chapter/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      lastRead: '1700000004000'
    })
    expect(backup.backupCategories).toEqual([{ name: 'Reading', order: '0', id: '3' }])
    expect(backup.backupSources).toEqual([{ name: 'MangaDex', sourceId: ENGLISH_ID }])
  })

  it('ignores everything it does not know about (preferences, extension stores, trackers, memo)', async () => {
    const backup = await decodeBackup(Pako.gzip(encodeUpstream(FULL_BACKUP)), SCHEMA_PATH)

    expect(Object.keys(backup).sort()).toEqual(['backupCategories', 'backupManga', 'backupSources'])
    expect(backup.backupManga[0]).not.toHaveProperty('tracking')
    expect(backup.backupManga[0]).not.toHaveProperty('notes')
  })

  it('returns the 64-bit source id as a string, without losing precision', async () => {
    const backup = await decodeBackup(Pako.gzip(encodeUpstream(FULL_BACKUP)), SCHEMA_PATH)

    expect(typeof backup.backupManga[0].source).toBe('string')
    expect(BigInt(backup.backupManga[0].source)).toBe(2499283573021220255n)
  })

  it('accepts an uncompressed backup, as Mihon itself does', async () => {
    const backup = await decodeBackup(encodeUpstream(FULL_BACKUP), SCHEMA_PATH)

    expect(backup.backupManga).toHaveLength(1)
  })

  it('does not fail when a message upstream treats as required lacks that field', async () => {
    const lenient = protobuf.parse(UPSTREAM_SCHEMA.replaceAll('required', 'optional')).root
    const type = lenient.lookupType('Backup')
    const bytes = type
      .encode(
        type.create({
          backupManga: [{ source: ENGLISH_ID, url: '/manga/m', chapters: [{ chapterNumber: 2 }] }]
        })
      )
      .finish()

    const backup = await decodeBackup(Pako.gzip(bytes), SCHEMA_PATH)

    expect(backup.backupManga[0].chapters).toHaveLength(1)
  })

  it('fills in the lists protobufjs leaves out when they are empty', async () => {
    const bytes = encodeUpstream({ backupManga: [{ source: ENGLISH_ID, url: '/manga/m' }] })

    const backup = await decodeBackup(bytes, SCHEMA_PATH)

    expect(backup.backupCategories).toEqual([])
    expect(backup.backupSources).toEqual([])
    expect(backup.backupManga[0].chapters).toEqual([])
    expect(backup.backupManga[0].history).toEqual([])
    expect(backup.backupManga[0].categories).toEqual([])
  })

  it('decodes a backup with no library entries', async () => {
    const backup = await decodeBackup(
      encodeUpstream({ backupCategories: [{ name: 'A' }] }),
      SCHEMA_PATH
    )

    expect(backup.backupManga).toEqual([])
    expect(backup.backupCategories).toHaveLength(1)
  })

  it('rejects an empty file', async () => {
    await expect(decodeBackup(new Uint8Array(), SCHEMA_PATH)).rejects.toMatchObject({
      code: 'MIHON_BACKUP_EMPTY'
    })
  })

  it('rejects a JSON backup with a specific error', async () => {
    const json = new TextEncoder().encode('{"version": 2, "mangas": []}')

    await expect(decodeBackup(json, SCHEMA_PATH)).rejects.toMatchObject({
      name: 'MihonBackupFormatError',
      code: 'MIHON_BACKUP_JSON'
    })
  })

  it('rejects a corrupted gzip stream', async () => {
    const corrupted = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x01, 0x02, 0x03])

    await expect(decodeBackup(corrupted, SCHEMA_PATH)).rejects.toMatchObject({
      code: 'MIHON_BACKUP_UNRECOGNISED'
    })
  })

  it('rejects a truncated protobuf', async () => {
    const whole = encodeUpstream(FULL_BACKUP)

    await expect(decodeBackup(whole.slice(0, 40), SCHEMA_PATH)).rejects.toBeInstanceOf(
      MihonBackupFormatError
    )
  })

  it('rejects bytes that are not a protobuf at all', async () => {
    const garbage = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])

    await expect(decodeBackup(garbage, SCHEMA_PATH)).rejects.toMatchObject({
      code: 'MIHON_BACKUP_UNRECOGNISED'
    })
  })

  it('carries the failure code through IpcError so it reaches the renderer', async () => {
    const error = await decodeBackup(new Uint8Array(), SCHEMA_PATH).catch((e: unknown) => e)

    expect(error).toMatchObject({ code: 'MIHON_BACKUP_EMPTY', message: 'The backup file is empty' })
  })
})

describe('unwrapBackupBytes', () => {
  it('decompresses gzip', () => {
    const inner = new Uint8Array([8, 1, 2, 3])

    expect(Array.from(unwrapBackupBytes(Pako.gzip(inner)))).toEqual([8, 1, 2, 3])
  })

  it('returns anything else untouched', () => {
    const bytes = new Uint8Array([0x0a, 0x02, 0x08, 0x01])

    expect(unwrapBackupBytes(bytes)).toBe(bytes)
  })
})
