export interface DexReaderCollection {
  id: number // Collection ID (NOT auto-increment on import)
  name: string // Collection name (unique)
  description?: string // Description (can be null)
  createdAt: number // Unix timestamp (milliseconds)
  updatedAt: number // Unix timestamp (milliseconds)
}
