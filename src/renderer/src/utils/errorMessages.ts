interface ErrorPattern {
  pattern: RegExp | string
  title: string
  message: string
  action?: string
}

const ERROR_CATALOG: ErrorPattern[] = [
  // Filesystem errors
  {
    pattern: /ENOENT|file not found/i,
    title: 'File not found',
    message: "Can't find that file. Maybe it was moved or deleted?",
    action: 'Double-check the location and try again.'
  },
  {
    pattern: /EACCES|EPERM|permission denied/i,
    title: "Can't access that",
    message: "Don't have permission to access this file or folder.",
    action: 'Make sure nothing else is using it and check the permissions.'
  },
  {
    pattern: /ENOSPC|no space/i,
    title: 'Running out of space',
    message: 'Not enough room on your drive.',
    action: 'Clear up some space and give it another shot.'
  },
  {
    pattern: /FS_ERROR/,
    title: 'File system hiccup',
    message: 'Something went wrong with file access.',
    action: 'Try again, or restart if it keeps happening.'
  },
  {
    pattern: /EISDIR|is a directory/i,
    title: "That's a folder",
    message: 'Expected a file but got a folder instead.',
    action: 'Select a file, not a folder.'
  },
  {
    pattern: /EEXIST|already exists/i,
    title: 'That already exists',
    message: 'A file or folder with that name already exists.',
    action: 'Pick a different name or delete the existing one.'
  },
  {
    pattern: /EMFILE|too many files/i,
    title: 'Too many files open',
    message: "Can't open any more files right now.",
    action: 'Close some files or restart the app.'
  },
  // Validation errors
  {
    pattern: /VALIDATION_ERROR|invalid/i,
    title: "That doesn't look right",
    message: "The info you entered isn't valid.",
    action: 'Check what you typed and try again.'
  },
  {
    pattern: /PATH_VALIDATION_ERROR/,
    title: 'Invalid path',
    message: "That path doesn't look right.",
    action: 'Make sure the path is valid and try again.'
  },
  // Network errors
  {
    pattern: /network|ENOTFOUND|ETIMEDOUT|fetch failed/i,
    title: 'Connection issues',
    message: "Can't reach the internet right now.",
    action: 'Check your connection and try again.'
  },
  {
    pattern: /timeout|timed out/i,
    title: 'That took too long',
    message: 'The request timed out.',
    action: 'Try again, or check your connection.'
  },
  {
    pattern: /ECONNREFUSED|connection refused/i,
    title: "Can't connect",
    message: 'The server refused the connection.',
    action: 'The service might be down. Try again later.'
  },
  // Offline mode (user-initiated)
  {
    pattern: /OFFLINE_MODE/,
    title: "You're offline",
    message: 'Offline mode is on. You can only see downloaded stuff.',
    action: 'Go online to browse and download more.'
  },
  // No internet access (system)
  {
    pattern: /NO_INTERNET/,
    title: 'No internet',
    message: "Can't connect right now, but you can still read what's downloaded.",
    action: 'Check your connection if you want to browse online.'
  },
  // IPC errors
  {
    pattern: /IPC_ERROR/,
    title: "Something didn't work",
    message: "Couldn't complete that action.",
    action: "Give it another try, or restart if it's stuck."
  },
  {
    pattern: /THEME_ERROR/,
    title: 'Theme issue',
    message: "Couldn't load or change the theme.",
    action: 'Try switching themes or restart the app.'
  },
  // Parsing errors
  {
    pattern: /parse|JSON|syntax error/i,
    title: 'Garbled data',
    message: "Got some data that doesn't make sense.",
    action: 'Try reloading or check if the file is corrupted.'
  },
  // Unknown/Generic errors
  {
    pattern: /unknown|unexpected/i,
    title: "Well, that's weird",
    message: 'Something unexpected happened.',
    action: 'Try again or restart the app if it keeps happening.'
  },
  // Generic fallback (must be last)
  {
    pattern: /.*/,
    title: 'Something went wrong',
    message: 'An error occurred.',
    action: 'Try again or restart the app.'
  }
]

interface UserFriendlyError {
  title: string
  message: string
  action?: string
  technical?: string
}

/**
 * Convert technical errors into user-friendly messages
 *
 * @param error - Error object or error message string
 * @returns User-friendly error with title, message, action, and technical details
 *
 * @example
 * const friendly = getUserFriendlyError(new Error('ENOENT: file not found'))
 * console.log(friendly.message) // "Can't find that file. Maybe it was moved or deleted?"
 */
export function getUserFriendlyError(error: Error | string): UserFriendlyError {
  const errorMessage = typeof error === 'string' ? error : error.message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorCode = (error as any).code

  // Try to match by error code first (more specific)
  if (errorCode) {
    const match = ERROR_CATALOG.find((p) =>
      typeof p.pattern === 'string' ? p.pattern === errorCode : p.pattern.test(errorCode)
    )
    if (match) {
      return { ...match, technical: errorMessage }
    }
  }

  // Then try to match by error message
  const match =
    ERROR_CATALOG.find((p) =>
      typeof p.pattern === 'string'
        ? errorMessage.includes(p.pattern)
        : p.pattern.test(errorMessage)
    ) || ERROR_CATALOG.at(-1)!

  return { ...match, technical: errorMessage }
}

export { ERROR_CATALOG }
export type { ErrorPattern, UserFriendlyError }
