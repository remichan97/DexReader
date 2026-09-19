const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/

// Assert a given id (mangaId, chapterId) is a valid UUID or not
export function isUUID(id: string): boolean {
  return uuidPattern.test(id)
}

export function isDateStamp(date: string): boolean {
  return datePattern.test(date)
}
