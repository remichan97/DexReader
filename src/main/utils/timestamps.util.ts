export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

export function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000)
}

// Convert a timestamps to a local date string
export function timestampToLocalDateString(timestamp: number): string {
  const date = unixTimestampToDate(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function dateToLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
