/**
 * Local calendar-day helpers for the History view.
 *
 * Mirrors the local-day convention used on the main-process side
 * (src/main/utils/timestamps.util.ts's dateToLocalDateString): a bucket key is
 * always the OS-local calendar day, formatted `YYYY-MM-DD`, never a UTC day.
 */

export function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Parses a `YYYY-MM-DD` string back into a local-midnight Date.
 *
 * Deliberately avoids `new Date(dateString)` - a date-only ISO string is parsed
 * as UTC midnight per spec, which shifts the displayed day backwards by one in
 * any negative UTC-offset timezone once formatted back through local time.
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
