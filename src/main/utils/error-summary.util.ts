const MAX_HEADLINE_LENGTH = 500
const MAX_STACK_FRAMES = 5
const STACK_FRAME_REGEX = /^\s+at /

// Some libraries append whole payloads to an error message (electron-updater adds the entire
// releases feed when it cannot read it). The first line says what went wrong and the first few
// stack frames say where, so that is what gets logged; the rest only buries them.
/**
 * Shorten error text for logging: the first line, a few stack frames, and a count of the lines
 * left out.
 *
 * @param text An error message or stack, possibly spanning many lines
 * @returns The shortened text, unchanged when it already fits
 */
export function summariseErrorText(text: string): string {
  const [first, ...rest] = text.split('\n')
  const headline = first.trim()
  const shownHeadline =
    headline.length > MAX_HEADLINE_LENGTH ? `${headline.slice(0, MAX_HEADLINE_LENGTH)}…` : headline
  const frames = rest.filter((line) => STACK_FRAME_REGEX.test(line)).slice(0, MAX_STACK_FRAMES)
  const omitted = rest.length - frames.length

  return [
    shownHeadline,
    ...frames,
    ...(omitted > 0 ? [`    … ${omitted} more line${omitted === 1 ? '' : 's'} omitted`] : [])
  ].join('\n')
}

/**
 * Describe a caught value for logging, using its stack when it has one.
 *
 * @param error Whatever was thrown
 * @returns The shortened description
 */
export function summariseError(error: unknown): string {
  if (error instanceof Error) {
    return summariseErrorText(error.stack ?? error.message)
  }
  return summariseErrorText(String(error))
}
