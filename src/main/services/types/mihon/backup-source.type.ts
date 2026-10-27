export interface BackupSource {
  name?: string
  // int64 on the wire; protobufjs hands it back as a string to avoid precision loss
  sourceId: string
}
