export interface SnapshotSettings {
  isEnabled: boolean
  intervalInHours?: number // If isEnabled is true, this is required and must be a positive integer, up to 6 hours
  maxSnapshotsCount?: number // If isEnabled is true, this is required and must be a positive integer, up to 5
}
