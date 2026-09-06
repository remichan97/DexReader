import { SnapshotTrigger } from '@shared/enums/services/snapshot-trigger.enum'

export interface SnapshotItemContract {
  fileName: string
  createdAt: Date
  sizeInBytes: number
  trigger: SnapshotTrigger
}
